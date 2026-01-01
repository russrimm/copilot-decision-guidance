# Azure Function - Licensing PDF Updater

This Azure Function automatically downloads and indexes the Microsoft Copilot Studio Licensing Guide PDF on a monthly schedule.

## Features

- **Automatic Updates**: Runs on the 1st of each month at 2 AM UTC
- **Change Detection**: Only updates if PDF content has changed (SHA-256 hash comparison)
- **Document Intelligence**: Extracts text and structure from PDF
- **Semantic Search**: Generates vector embeddings for Azure AI Search
- **Blob Storage**: Stores PDF with versioning

## Setup

### Prerequisites

1. Azure subscription
2. Resources deployed (see [../docs/azure-ai-search-integration.md](../docs/azure-ai-search-integration.md))
3. Node.js 20 LTS

### Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `local.settings.json`:

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AZURE_STORAGE_CONNECTION_STRING": "<your-storage-connection-string>",
       "AZURE_SEARCH_ENDPOINT": "https://<your-search>.search.windows.net",
       "AZURE_SEARCH_KEY": "<your-search-key>",
       "AZURE_SEARCH_INDEX": "licensing-docs",
       "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT": "<your-doc-intel-endpoint>",
       "AZURE_DOCUMENT_INTELLIGENCE_KEY": "<your-doc-intel-key>",
       "AZURE_OPENAI_ENDPOINT": "<your-openai-endpoint>",
       "AZURE_OPENAI_KEY": "<your-openai-key>",
       "AZURE_OPENAI_EMBEDDING_DEPLOYMENT": "text-embedding-ada-002"
     }
   }
   ```

3. Build TypeScript:

   ```bash
   npm run build
   ```

4. Start function locally:

   ```bash
   npm start
   ```

5. Trigger manually:
   ```bash
   curl -X POST http://localhost:7071/admin/functions/UpdateLicensingPDF
   ```

### Deployment

Deploy to Azure:

```bash
# Build
npm run build

# Deploy
func azure functionapp publish <your-function-app-name>
```

## Function Details

### Trigger Schedule

- **Cron**: `0 0 2 1 * *` (2 AM UTC on the 1st of every month)
- **Timezone**: UTC

### Workflow

1. Download PDF from `https://go.microsoft.com/fwlink/?linkid=2320995`
2. Calculate SHA-256 hash
3. Check if hash matches existing PDF in Blob Storage
4. If changed:
   - Upload to Blob Storage with metadata
   - Extract text with Document Intelligence
   - Split into chunks (~1000 chars)
   - Generate embeddings with Azure OpenAI
   - Update Azure AI Search index
5. Log results

### Monitoring

View logs in Azure Portal:

- Function App → Functions → UpdateLicensingPDF → Monitor
- Application Insights for detailed telemetry

### Error Handling

The function will:

- Retry automatically (3 times by default)
- Log errors to Application Insights
- Send alerts (if configured)

## Cost Per Execution

| Service                          | Cost per run     |
| -------------------------------- | ---------------- |
| Function execution               | ~$0.0002         |
| Document Intelligence (20 pages) | $0.03            |
| Azure OpenAI embeddings          | ~$0.001          |
| Blob Storage (write)             | <$0.001          |
| AI Search (indexing)             | Included in tier |
| **Total**                        | **~$0.03**       |

Monthly cost: ~$0.03 (assuming 1 update/month)

## Testing

To test without waiting for schedule:

```bash
# Azure CLI
az functionapp function invoke \
  --resource-group copilot-guidance-rg \
  --name copilot-functions-001 \
  --function-name UpdateLicensingPDF

# Local (with Azure Functions Core Tools)
curl -X POST http://localhost:7071/admin/functions/UpdateLicensingPDF
```

## Troubleshooting

### PDF Download Fails

- Check if URL is accessible: `curl -I https://go.microsoft.com/fwlink/?linkid=2320995`
- Verify outbound network connectivity from Function App

### Document Intelligence Errors

- Verify endpoint and key are correct
- Check quota limits (S0 tier: 15 requests/sec)

### Embedding Generation Slow

- Increase batch size (currently 10 chunks at a time)
- Consider using PTU (Provisioned Throughput Units) for consistent performance

### Search Index Update Fails

- Verify search service is not at capacity
- Check for index schema mismatches
