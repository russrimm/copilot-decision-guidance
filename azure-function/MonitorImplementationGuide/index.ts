import { AzureFunction, Context } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import fetch from 'node-fetch';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import { parseString } from 'xml2js';

interface ImplementationGuideMetadata {
  version: string;
  lastChecked: Date;
  lastModified: Date;
  sha: string;
  size: number;
  downloadUrl: string;
  changeDetected: boolean;
  extractedContent?: {
    slideCount: number;
    chapters: string[];
    keyTopics: string[];
  };
}

interface GitHubFileMetadata {
  sha: string;
  size: number;
  download_url: string;
  html_url: string;
  git_url: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      date: string;
    };
    message: string;
  };
}

const timerTrigger: AzureFunction = async function (context: Context, timer: any): Promise<void> {
  const timestamp = new Date().toISOString();
  context.log(`MonitorImplementationGuide function started at ${timestamp}`);

  try {
    // Configuration
    const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const containerName = 'implementation-guide';
    const metadataFile = 'implementation-guide-metadata.json';
    const githubRepo = 'microsoft/CopilotStudioSamples';
    const githubFilePath = 'ImplementationGuide/Microsoft%20Copilot%20Studio%20-%20Implementation%20Guide.pptx';
    const githubToken = process.env.GITHUB_TOKEN; // Optional: for higher rate limits

    // Initialize Azure Blob Storage client
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    // Step 1: Retrieve stored metadata
    context.log('Retrieving stored metadata...');
    const metadataBlobClient = containerClient.getBlobClient(metadataFile);
    let previousMetadata: ImplementationGuideMetadata | null = null;

    try {
      const downloadResponse = await metadataBlobClient.download();
      const metadataContent = await streamToBuffer(downloadResponse.readableStreamBody!);
      previousMetadata = JSON.parse(metadataContent.toString());
      context.log(`Previous check: ${previousMetadata.lastChecked}, SHA: ${previousMetadata.sha}`);
    } catch (error) {
      context.log('No previous metadata found. This is the first check.');
    }

    // Step 2: Check GitHub for file metadata
    context.log('Checking GitHub for file updates...');
    const fileApiUrl = `https://api.github.com/repos/${githubRepo}/contents/${githubFilePath}`;
    const headers: Record<string, string> = {
      'User-Agent': 'Copilot-Decision-Guidance-Monitor',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    const fileResponse = await fetch(fileApiUrl, { headers });
    if (!fileResponse.ok) {
      throw new Error(`GitHub API error: ${fileResponse.status} ${fileResponse.statusText}`);
    }

    const fileMetadata = (await fileResponse.json()) as GitHubFileMetadata;
    context.log(`GitHub file SHA: ${fileMetadata.sha}, Size: ${fileMetadata.size} bytes`);

    // Step 3: Check for changes
    const changeDetected = !previousMetadata || previousMetadata.sha !== fileMetadata.sha;
    context.log(`Change detected: ${changeDetected}`);

    // Step 4: Get commit history to find last modified date
    const commitsApiUrl = `https://api.github.com/repos/${githubRepo}/commits?path=ImplementationGuide/Microsoft Copilot Studio - Implementation Guide.pptx&per_page=1`;
    const commitsResponse = await fetch(commitsApiUrl, { headers });
    const commits = (await commitsResponse.json()) as GitHubCommit[];
    const lastModified = commits.length > 0 ? new Date(commits[0].commit.author.date) : new Date();

    // Step 5: Process PPTX if changed
    let extractedContent;
    if (changeDetected) {
      context.log('✨ Update detected! Downloading and processing PPTX...');
      
      // Download PPTX
      const pptxResponse = await fetch(fileMetadata.download_url);
      if (!pptxResponse.ok) {
        throw new Error(`Failed to download PPTX: ${pptxResponse.statusText}`);
      }
      const pptxBuffer = await pptxResponse.buffer();
      context.log(`PPTX downloaded. Size: ${pptxBuffer.length} bytes`);

      // Store PPTX in blob storage
      const pptxBlobClient = containerClient.getBlockBlobClient(`implementation-guide-${fileMetadata.sha}.pptx`);
      await pptxBlobClient.uploadData(pptxBuffer, {
        blobHTTPHeaders: { blobContentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
      });
      context.log('PPTX stored in blob storage');

      // Extract content from PPTX
      extractedContent = await extractPptxContent(pptxBuffer, context);
      context.log(`Extracted: ${extractedContent.slideCount} slides, ${extractedContent.chapters.length} chapters`);

      // Send notification about update
      await sendUpdateNotification(previousMetadata, fileMetadata, extractedContent, commits[0], context);
    } else {
      context.log('No changes detected since last check.');
    }

    // Step 6: Update metadata
    const newMetadata: ImplementationGuideMetadata = {
      version: extractVersionFromCommit(commits[0]),
      lastChecked: new Date(),
      lastModified,
      sha: fileMetadata.sha,
      size: fileMetadata.size,
      downloadUrl: fileMetadata.download_url,
      changeDetected,
      extractedContent,
    };

    // Store updated metadata
    const metadataBlockBlobClient = containerClient.getBlockBlobClient(metadataFile);
    await metadataBlockBlobClient.upload(
      JSON.stringify(newMetadata, null, 2),
      Buffer.byteLength(JSON.stringify(newMetadata, null, 2)),
      { blobHTTPHeaders: { blobContentType: 'application/json' } }
    );
    context.log('Metadata updated successfully');

    // Step 7: If changed, trigger content update workflow
    if (changeDetected) {
      await triggerContentUpdateWorkflow(newMetadata, context);
    }

    context.log(`✅ MonitorImplementationGuide completed at ${new Date().toISOString()}`);
  } catch (error) {
    context.log.error('❌ Error in MonitorImplementationGuide:', error);
    throw error;
  }
};

/**
 * Extract text content from PPTX file
 */
async function extractPptxContent(
  pptxBuffer: Buffer,
  context: Context
): Promise<{ slideCount: number; chapters: string[]; keyTopics: string[] }> {
  try {
    // PPTX files are ZIP archives containing XML files
    const zip = new AdmZip(pptxBuffer);
    const zipEntries = zip.getEntries();

    let slideCount = 0;
    const chapters: string[] = [];
    const keyTopics: Set<string> = new Set();

    // Extract slide text
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')) {
        slideCount++;
        const slideXml = entry.getData().toString('utf8');

        // Parse XML to extract text
        await new Promise<void>((resolve, reject) => {
          parseString(slideXml, (err, result) => {
            if (err) {
              context.log.warn(`Failed to parse slide ${entry.entryName}:`, err);
              resolve();
              return;
            }

            // Extract text from <a:t> elements (text runs in PowerPoint XML)
            const text = extractTextFromXml(result);
            
            // Detect chapter headings (usually larger font, specific patterns)
            const chapterMatch = text.match(/^\d+\.\s+(.+)$/m);
            if (chapterMatch) {
              chapters.push(chapterMatch[1]);
            }

            // Extract key topics (simple heuristic: capitalized phrases)
            const topicMatches = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}/g);
            if (topicMatches) {
              topicMatches.forEach(topic => keyTopics.add(topic));
            }

            resolve();
          });
        });
      }
    }

    return {
      slideCount,
      chapters,
      keyTopics: Array.from(keyTopics).slice(0, 50), // Limit to top 50 topics
    };
  } catch (error) {
    context.log.error('Error extracting PPTX content:', error);
    return {
      slideCount: 0,
      chapters: [],
      keyTopics: [],
    };
  }
}

/**
 * Recursively extract text from XML object
 */
function extractTextFromXml(obj: any): string {
  let text = '';
  
  if (typeof obj === 'string') {
    return obj;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      text += extractTextFromXml(item) + ' ';
    }
  } else if (typeof obj === 'object' && obj !== null) {
    // Look for 'a:t' text elements
    if (obj['a:t']) {
      text += extractTextFromXml(obj['a:t']) + ' ';
    }
    
    // Recurse through all properties
    for (const key in obj) {
      if (key !== 'a:t') {
        text += extractTextFromXml(obj[key]) + ' ';
      }
    }
  }

  return text;
}

/**
 * Extract version from commit message (e.g., "v2.2 update" -> "2.2")
 */
function extractVersionFromCommit(commit: GitHubCommit): string {
  if (!commit) return 'unknown';
  
  const versionMatch = commit.commit.message.match(/v?(\d+\.\d+)/i);
  if (versionMatch) {
    return versionMatch[1];
  }
  
  return commit.sha.substring(0, 7);
}

/**
 * Send notification about Implementation Guide update
 */
async function sendUpdateNotification(
  previousMetadata: ImplementationGuideMetadata | null,
  newFileMetadata: GitHubFileMetadata,
  extractedContent: any,
  latestCommit: GitHubCommit,
  context: Context
): Promise<void> {
  context.log('📧 Sending update notification...');

  const notification = {
    timestamp: new Date().toISOString(),
    event: 'implementation-guide-updated',
    previousVersion: previousMetadata?.version || 'none',
    newVersion: extractVersionFromCommit(latestCommit),
    previousSha: previousMetadata?.sha || 'none',
    newSha: newFileMetadata.sha,
    commitMessage: latestCommit.commit.message,
    commitDate: latestCommit.commit.author.date,
    extractedContent,
    actionRequired: 'Review extracted content and update decision-model.v1.json and readiness assessment questions',
    references: [
      'https://aka.ms/CopilotStudioImplementationGuide',
      'https://github.com/microsoft/CopilotStudioSamples/tree/main/ImplementationGuide',
      '/docs/IMPLEMENTATION_GUIDE_ALIGNMENT.md',
    ],
  };

  // Store notification in blob storage
  const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
  const containerClient = blobServiceClient.getContainerClient('implementation-guide');
  const notificationBlobClient = containerClient.getBlockBlobClient(
    `notifications/update-${new Date().toISOString().split('T')[0]}.json`
  );
  await notificationBlobClient.upload(
    JSON.stringify(notification, null, 2),
    Buffer.byteLength(JSON.stringify(notification, null, 2)),
    { blobHTTPHeaders: { blobContentType: 'application/json' } }
  );

  context.log('✅ Notification stored successfully');

  // TODO: Send email or Teams notification
  // You could integrate with SendGrid, Microsoft Graph, or Azure Communication Services here
}

/**
 * Trigger content update workflow
 */
async function triggerContentUpdateWorkflow(
  metadata: ImplementationGuideMetadata,
  context: Context
): Promise<void> {
  context.log('🚀 Triggering content update workflow...');

  // Store a marker file that the web application can check
  const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
  const containerClient = blobServiceClient.getContainerClient('implementation-guide');
  
  const updateMarkerClient = containerClient.getBlockBlobClient('update-available.json');
  const updateMarker = {
    updateDetected: true,
    version: metadata.version,
    detectedAt: new Date().toISOString(),
    sha: metadata.sha,
    extractedContent: metadata.extractedContent,
    message: 'A new version of the Implementation Guide has been detected. Review and apply updates to decision model and readiness assessment.',
  };

  await updateMarkerClient.upload(
    JSON.stringify(updateMarker, null, 2),
    Buffer.byteLength(JSON.stringify(updateMarker, null, 2)),
    { blobHTTPHeaders: { blobContentType: 'application/json' } }
  );

  context.log('✅ Update marker created for web application');

  // TODO: Trigger GitHub Actions workflow or Azure DevOps pipeline
  // to automatically create a PR with suggested updates
}

/**
 * Helper to convert stream to buffer
 */
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

export default timerTrigger;
