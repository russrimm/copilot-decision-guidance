import { AzureFunction, Context } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import {
  SearchClient,
  SearchIndexClient,
  AzureKeyCredential as SearchKeyCredential,
} from '@azure/search-documents';
import { OpenAIClient, AzureKeyCredential as OpenAIKeyCredential } from '@azure/openai';
import fetch from 'node-fetch';
import crypto from 'crypto';

interface LicensingChunk {
  id: string;
  content: string;
  title: string;
  page: number;
  section: string;
  url: string;
  lastModified: Date;
  contentVector?: number[];
}

const timerTrigger: AzureFunction = async function (context: Context, timer: any): Promise<void> {
  const timestamp = new Date().toISOString();
  context.log(`UpdateLicensingPDF function started at ${timestamp}`);

  try {
    // Configuration
    const pdfUrl = 'https://go.microsoft.com/fwlink/?linkid=2320995';
    const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const containerName = 'licensing-docs';
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT!;
    const searchKey = process.env.AZURE_SEARCH_KEY!;
    const searchIndexName = process.env.AZURE_SEARCH_INDEX || 'licensing-docs';
    const docIntelEndpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT!;
    const docIntelKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY!;
    const openAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    const openAIKey = process.env.AZURE_OPENAI_KEY!;
    const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT!;

    // Step 1: Download PDF
    context.log('Downloading PDF from Microsoft CDN...');
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    const pdfBuffer = await response.buffer();
    const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    context.log(`PDF downloaded. Size: ${pdfBuffer.length} bytes, Hash: ${pdfHash}`);

    // Step 2: Check if PDF has changed
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const currentDate = new Date();
    const blobName = `microsoft-copilot-studio-licensing-guide-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}.pdf`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    let shouldUpdate = true;
    if (await blockBlobClient.exists()) {
      const properties = await blockBlobClient.getProperties();
      const existingHash = properties.metadata?.hash;
      if (existingHash === pdfHash) {
        context.log('PDF has not changed. Skipping update.');
        shouldUpdate = false;
      }
    }

    if (shouldUpdate) {
      // Upload new PDF
      context.log('Uploading PDF to Blob Storage...');
      await blockBlobClient.upload(pdfBuffer, pdfBuffer.length, {
        metadata: { hash: pdfHash },
      });

      // Step 3: Extract text with Document Intelligence
      context.log('Extracting text with Azure AI Document Intelligence...');
      const docClient = new DocumentAnalysisClient(
        docIntelEndpoint,
        new AzureKeyCredential(docIntelKey)
      );
      const poller = await docClient.beginAnalyzeDocument('prebuilt-layout', pdfBuffer);
      const result = await poller.pollUntilDone();

      if (!result.pages) {
        throw new Error('No pages extracted from PDF');
      }

      context.log(`Extracted ${result.pages.length} pages`);

      // Step 4: Chunk content
      const chunks: LicensingChunk[] = [];
      let chunkId = 0;

      for (const page of result.pages) {
        const pageNumber = page.pageNumber;
        let pageText = '';

        // Extract text from page
        if (result.paragraphs) {
          for (const paragraph of result.paragraphs) {
            if (paragraph.boundingRegions?.some((r) => r.pageNumber === pageNumber)) {
              pageText += paragraph.content + '\n\n';
            }
          }
        }

        // Create chunks (split by section or max 1000 chars)
        const sections = pageText.split(/\n#{1,3}\s/);
        for (const section of sections) {
          if (section.trim().length > 100) {
            const lines = section.trim().split('\n');
            const title = lines[0].substring(0, 200);
            const content = section.trim();

            chunks.push({
              id: `chunk-${chunkId++}`,
              content,
              title: title || `Page ${pageNumber}`,
              page: pageNumber,
              section: title || 'General',
              url: `microsoft-copilot-studio-licensing-guide#page=${pageNumber}`,
              lastModified: currentDate,
            });
          }
        }
      }

      context.log(`Created ${chunks.length} content chunks`);

      // Step 5: Generate embeddings
      context.log('Generating embeddings with Azure OpenAI...');
      const openAIClient = new OpenAIClient(openAIEndpoint, new OpenAIKeyCredential(openAIKey));

      for (let i = 0; i < chunks.length; i += 10) {
        const batch = chunks.slice(i, i + 10);
        const texts = batch.map((c) => c.content.substring(0, 8000)); // Token limit

        const embeddingResult = await openAIClient.getEmbeddings(embeddingDeployment, texts);

        for (let j = 0; j < batch.length; j++) {
          chunks[i + j].contentVector = embeddingResult.data[j].embedding;
        }

        context.log(`Generated embeddings for chunks ${i} to ${i + batch.length}`);
      }

      // Step 6: Update Azure AI Search index
      context.log('Updating Azure AI Search index...');
      const searchClient = new SearchClient(
        searchEndpoint,
        searchIndexName,
        new SearchKeyCredential(searchKey)
      );

      // Delete old documents
      const deleteResults = await searchClient.deleteDocuments(chunks.map((c) => ({ id: c.id })));
      context.log(`Deleted ${deleteResults.results.length} old documents`);

      // Upload new documents
      const uploadResult = await searchClient.uploadDocuments(chunks);
      context.log(`Uploaded ${uploadResult.results.length} new documents`);

      context.log(
        `✅ Successfully updated licensing documentation. Total chunks: ${chunks.length}`
      );
    } else {
      context.log('✅ No update needed - PDF unchanged');
    }
  } catch (error) {
    context.log.error(`❌ Error updating licensing PDF: ${error}`);
    throw error;
  }
};

export default timerTrigger;
