/**
 * Implementation Guide Update Service
 * 
 * Checks for updates to the Microsoft Copilot Studio Implementation Guide
 * by querying Azure Blob Storage for update markers created by the monitoring Azure Function.
 */

import { BlobServiceClient } from '@azure/storage-blob';

let hasLoggedMissingStorageConfig = false;

function getStorageConnectionString(): string | undefined {
  const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();

  if (storageConnectionString) {
    return storageConnectionString;
  }

  if (!hasLoggedMissingStorageConfig) {
    const message =
      'Implementation guide update checks are disabled: AZURE_STORAGE_CONNECTION_STRING is not configured.';
    if (process.env.NODE_ENV === 'production') {
      console.warn(message);
    } else {
      console.info(message);
    }
    hasLoggedMissingStorageConfig = true;
  }

  return undefined;
}

export interface ImplementationGuideUpdate {
  updateAvailable: boolean;
  version?: string;
  detectedAt?: string;
  sha?: string;
  message?: string;
  extractedContent?: {
    slideCount: number;
    chapters: string[];
    keyTopics: string[];
  };
}

export interface ImplementationGuideMetadata {
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

/**
 * Check if an update to the Implementation Guide is available
 */
export async function checkImplementationGuideUpdate(): Promise<ImplementationGuideUpdate> {
  try {
    const storageConnectionString = getStorageConnectionString();

    if (!storageConnectionString) {
      return {
        updateAvailable: false,
        message:
          'Update checking is disabled because AZURE_STORAGE_CONNECTION_STRING is not configured.',
      };
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const containerClient = blobServiceClient.getContainerClient('implementation-guide');

    // Check for update marker file
    const updateMarkerClient = containerClient.getBlobClient('update-available.json');
    
    const exists = await updateMarkerClient.exists();
    if (!exists) {
      return { updateAvailable: false };
    }

    // Download and parse update marker
    const downloadResponse = await updateMarkerClient.download();
    const content = await streamToBuffer(downloadResponse.readableStreamBody!);
    const updateData = JSON.parse(content.toString()) as ImplementationGuideUpdate;

    return updateData;
  } catch (error) {
    console.error('Error checking for Implementation Guide updates:', error);
    return { updateAvailable: false };
  }
}

/**
 * Get the latest Implementation Guide metadata
 */
export async function getImplementationGuideMetadata(): Promise<ImplementationGuideMetadata | null> {
  try {
    const storageConnectionString = getStorageConnectionString();

    if (!storageConnectionString) {
      return null;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const containerClient = blobServiceClient.getContainerClient('implementation-guide');

    const metadataBlobClient = containerClient.getBlobClient('implementation-guide-metadata.json');
    
    const exists = await metadataBlobClient.exists();
    if (!exists) {
      return null;
    }

    const downloadResponse = await metadataBlobClient.download();
    const content = await streamToBuffer(downloadResponse.readableStreamBody!);
    const metadata = JSON.parse(content.toString()) as ImplementationGuideMetadata;

    return metadata;
  } catch (error) {
    console.error('Error retrieving Implementation Guide metadata:', error);
    return null;
  }
}

/**
 * Acknowledge an update (clears the update marker)
 */
export async function acknowledgeImplementationGuideUpdate(): Promise<boolean> {
  try {
    const storageConnectionString = getStorageConnectionString();

    if (!storageConnectionString) {
      return false;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const containerClient = blobServiceClient.getContainerClient('implementation-guide');

    const updateMarkerClient = containerClient.getBlobClient('update-available.json');
    await updateMarkerClient.deleteIfExists();

    console.log('✅ Implementation Guide update acknowledged and marker cleared');
    return true;
  } catch (error) {
    console.error('Error acknowledging Implementation Guide update:', error);
    return false;
  }
}

/**
 * Get update history (last 10 updates)
 */
export async function getImplementationGuideUpdateHistory(): Promise<any[]> {
  try {
    const storageConnectionString = getStorageConnectionString();

    if (!storageConnectionString) {
      return [];
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const containerClient = blobServiceClient.getContainerClient('implementation-guide');

    // List notification files
    const notifications: any[] = [];
    const prefix = 'notifications/';
    
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      if (blob.name.endsWith('.json')) {
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadResponse = await blobClient.download();
        const content = await streamToBuffer(downloadResponse.readableStreamBody!);
        const notification = JSON.parse(content.toString());
        notifications.push(notification);
      }
    }

    // Sort by timestamp descending and return last 10
    return notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  } catch (error) {
    console.error('Error retrieving Implementation Guide update history:', error);
    return [];
  }
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
