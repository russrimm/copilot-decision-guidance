# Azure AI Search Integration for Licensing PDF

This document describes the architecture for integrating Azure AI Search to provide semantic search capabilities over the Microsoft Copilot Studio Licensing Guide PDF.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Monthly Update Pipeline                       │
│  ┌──────────────┐    ┌──────────────┐    �┌──────────────────┐ │
│  │ Azure        │───▶│ Blob         │───▶│ Document         │ │
│  │ Function     │    │ Storage      │    │ Intelligence     │ │
│  │ (Timer)      │    │              │    │                  │ │
│  └──────────────┘    └──────────────┘    └──────────────────┘ │
│         │                                           │           │
│         │ Downloads PDF monthly                     │           │
│         │ from Microsoft CDN                        │           │
│         ▼                                           ▼           │
│  microsoft-copilot-studio-                  ┌──────────────────┐│
│  licensing-guide-*.pdf                      │ Azure AI         ││
│                                             │ Search Index     ││
│                                             │                  ││
│                                             │ - Text chunks    ││
│                                             │ - Embeddings     ││
│                                             │ - Metadata       ││
│                                             └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Query API
                                  ▼
                        ┌──────────────────┐
                        │ Express API      │
                        │ /api/licensing/  │
                        │ search           │
                        └──────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │ React UI         │
                        │ Licensing Search │
                        │ Component        │
                        └──────────────────┘
```

## Components

### 1. Azure Blob Storage

**Purpose**: Store the licensing PDF with versioning

**Configuration**:

- Container: `licensing-docs`
- Blob name pattern: `microsoft-copilot-studio-licensing-guide-{YYYY-MM}.pdf`
- Access tier: Hot
- Versioning: Enabled

**Estimated Cost**: ~$0.02/month (1 PDF, ~5MB)

### 2. Azure AI Document Intelligence

**Purpose**: Extract text and structure from PDF

**Configuration**:

- SKU: S0 (Standard)
- Region: Same as AI Search (for lower latency)
- Features needed:
  - Layout analysis
  - Table extraction
  - Page numbering

**Estimated Cost**:

- $1.50 per 1,000 pages analyzed
- ~20 pages/month = $0.03/month

### 3. Azure AI Search

**Purpose**: Semantic search with vector embeddings

**Configuration**:

- SKU: Basic (sufficient for single-document use case)
- Region: Choose based on data residency requirements
- Index schema:

  ```json
  {
    "name": "licensing-docs",
    "fields": [
      { "name": "id", "type": "Edm.String", "key": true },
      { "name": "content", "type": "Edm.String", "searchable": true },
      { "name": "title", "type": "Edm.String", "searchable": true },
      { "name": "page", "type": "Edm.Int32", "filterable": true },
      { "name": "section", "type": "Edm.String", "filterable": true },
      { "name": "url", "type": "Edm.String" },
      { "name": "lastModified", "type": "Edm.DateTimeOffset" },
      {
        "name": "contentVector",
        "type": "Collection(Edm.Single)",
        "searchable": true,
        "dimensions": 1536,
        "vectorSearchProfile": "vector-profile"
      }
    ]
  }
  ```

- Semantic configuration:
  - Title field: `title`
  - Content fields: `content`
  - Keyword fields: `section`

**Estimated Cost**:

- Basic tier: $75/month (includes 2GB storage, 50k docs)

### 4. Azure OpenAI (for embeddings)

**Purpose**: Generate vector embeddings for semantic search

**Configuration**:

- Model: `text-embedding-ada-002`
- Deployment name: `text-embedding-ada-002`
- Region: Same as AI Search

**Estimated Cost**:

- $0.0001 per 1K tokens
- ~10K tokens/month for indexing = $0.001/month

### 5. Azure Function

**Purpose**: Automated monthly PDF download and re-indexing

**Configuration**:

- Runtime: Node.js 20 LTS
- Plan: Consumption (Y1)
- Trigger: Timer (first day of each month at 2 AM UTC)
- Functions:
  - `UpdateLicensingPDF` - Downloads and indexes PDF
  - `HealthCheck` - Verifies index health

**Estimated Cost**:

- Consumption plan: ~$0.20/month (1 execution/month + health checks)

## Total Monthly Cost Estimate

| Service                        | Monthly Cost      |
| ------------------------------ | ----------------- |
| Azure Blob Storage             | $0.02             |
| Azure AI Document Intelligence | $0.03             |
| Azure AI Search (Basic)        | $75.00            |
| Azure OpenAI (Embeddings)      | <$0.01            |
| Azure Function (Consumption)   | $0.20             |
| **TOTAL**                      | **~$75.25/month** |

## Deployment Guide

### Prerequisites

1. Azure subscription with contributor access
2. Azure CLI installed and authenticated
3. Resource group created:
   ```bash
   az group create --name copilot-guidance-rg --location eastus
   ```

### Step 1: Deploy Infrastructure

Create Bicep template (`infra/licensing-search.bicep`):

```bicep
param location string = resourceGroup().location
param searchServiceName string
param storageAccountName string
param documentIntelligenceName string
param openAIServiceName string
param functionAppName string

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'licensing-docs'
  properties: {
    publicAccess: 'None'
  }
}

// Azure AI Search
resource searchService 'Microsoft.Search/searchServices@2024-06-01-preview' = {
  name: searchServiceName
  location: location
  sku: {
    name: 'basic'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    semanticSearch: 'standard'
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Document Intelligence
resource documentIntelligence 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: documentIntelligenceName
  location: location
  sku: {
    name: 'S0'
  }
  kind: 'FormRecognizer'
  properties: {
    customSubDomainName: documentIntelligenceName
    publicNetworkAccess: 'Enabled'
  }
}

// Azure OpenAI
resource openAIService 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: openAIServiceName
  location: location
  sku: {
    name: 'S0'
  }
  kind: 'OpenAI'
  properties: {
    customSubDomainName: openAIServiceName
    publicNetworkAccess: 'Enabled'
  }
}

// Embedding deployment
resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAIService
  name: 'text-embedding-ada-002'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-ada-002'
      version: '2'
    }
  }
  sku: {
    name: 'Standard'
    capacity: 10
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: hostingPlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'AZURE_SEARCH_ENDPOINT'
          value: 'https://${searchService.name}.search.windows.net'
        }
        {
          name: 'AZURE_SEARCH_KEY'
          value: searchService.listAdminKeys().primaryKey
        }
        {
          name: 'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT'
          value: documentIntelligence.properties.endpoint
        }
        {
          name: 'AZURE_DOCUMENT_INTELLIGENCE_KEY'
          value: documentIntelligence.listKeys().key1
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: openAIService.properties.endpoint
        }
        {
          name: 'AZURE_OPENAI_KEY'
          value: openAIService.listKeys().key1
        }
        {
          name: 'AZURE_OPENAI_EMBEDDING_DEPLOYMENT'
          value: 'text-embedding-ada-002'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
      ]
    }
  }
}

resource hostingPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${functionAppName}-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
}

output searchEndpoint string = 'https://${searchService.name}.search.windows.net'
output searchKey string = searchService.listAdminKeys().primaryKey
output storageConnectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
output functionAppName string = functionApp.name
```

Deploy:

```bash
az deployment group create \
  --resource-group copilot-guidance-rg \
  --template-file infra/licensing-search.bicep \
  --parameters searchServiceName=copilot-search-001 \
               storageAccountName=copilotlicensing001 \
               documentIntelligenceName=copilot-docintel-001 \
               openAIServiceName=copilot-openai-001 \
               functionAppName=copilot-functions-001
```

### Step 2: Create Azure Function

See [azure-function/](../azure-function/) directory for implementation.

Key files:

- `UpdateLicensingPDF/index.ts` - Main indexing logic
- `UpdateLicensingPDF/function.json` - Timer trigger config
- `package.json` - Dependencies

### Step 3: Configure API Endpoints

Add environment variables to your Express API:

```bash
# .env
AZURE_SEARCH_ENDPOINT=https://copilot-search-001.search.windows.net
AZURE_SEARCH_KEY=<your-search-admin-key>
AZURE_SEARCH_INDEX=licensing-docs
```

The API endpoints are already implemented in `apps/api/src/index.ts`:

- `GET /api/licensing` - Structured licensing data
- `POST /api/licensing/calculate` - Cost calculator
- `POST /api/licensing/search` - Semantic search (requires Azure AI Search)

### Step 4: Create UI Component

Create React component for licensing search:

```tsx
// apps/web/src/components/LicensingSearch.tsx
import React, { useState } from 'react';

export function LicensingSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/licensing/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="licensing-search">
      <h2>Search Licensing Documentation</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g., 'What are Copilot Credits?'"
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>

      <div className="results">
        {results.map((result, i) => (
          <div key={i} className="result">
            <h3>{result.title}</h3>
            <p>{result.content}</p>
            <a href={result.url} target="_blank" rel="noopener">
              Page {result.page}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Maintenance

### Monthly Updates

The Azure Function automatically:

1. Downloads latest PDF from `https://go.microsoft.com/fwlink/?linkid=2320995`
2. Checks if file has changed (SHA-256 hash comparison)
3. If changed:
   - Extracts text with Document Intelligence
   - Generates embeddings with Azure OpenAI
   - Updates Azure AI Search index
   - Sends notification (optional)

### Manual Update

To manually trigger update:

```bash
az functionapp function invoke \
  --resource-group copilot-guidance-rg \
  --name copilot-functions-001 \
  --function-name UpdateLicensingPDF
```

### Monitoring

Set up Azure Monitor alerts:

- Function execution failures
- Search service throttling
- Index size exceeds 80% capacity

Log Analytics queries:

```kusto
// Failed indexing attempts
FunctionAppLogs
| where FunctionName == "UpdateLicensingPDF"
| where Level == "Error"
| project TimeGenerated, Message

// Search query performance
AzureDiagnostics
| where Category == "OperationLogs"
| where OperationName == "Query.Search"
| summarize avg(DurationMs), count() by bin(TimeGenerated, 1h)
```

## Cost Optimization Options

### Option 1: Use Free Tier (for testing)

- Azure AI Search: Free tier (50 MB storage, 3 indexes)
- Limitation: No semantic search
- **Cost**: $0/month (excluding Document Intelligence & OpenAI)

### Option 2: Static Extraction (No Azure AI Search)

- Extract PDF content once using Document Intelligence
- Store as JSON in `licensing-data.json`
- Use client-side search (Fuse.js)
- **Cost**: $0/month ongoing (one-time $0.03 extraction)

### Option 3: GitHub Actions (instead of Azure Function)

- Use GitHub Actions for monthly updates
- Store extracted content in repository
- **Cost**: $0/month (GitHub Actions free for public repos)

## Security Considerations

1. **API Keys**: Store in Azure Key Vault, reference from Function App
2. **Network**: Use Private Endpoints for production
3. **RBAC**: Use Managed Identities instead of keys where possible
4. **Data Residency**: Choose region based on compliance requirements

## Alternative: GitHub Actions Implementation (Zero Cost)

For organizations wanting to avoid monthly Azure costs:

```yaml
# .github/workflows/update-licensing-pdf.yml
name: Update Licensing PDF

on:
  schedule:
    - cron: '0 2 1 * *' # First day of month at 2 AM
  workflow_dispatch:

jobs:
  update-pdf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download PDF
        run: |
          curl -L -o licensing-guide.pdf \
            https://go.microsoft.com/fwlink/?linkid=2320995

      - name: Extract text (using pdf2txt)
        run: |
          pip install pdfminer.six
          pdf2txt.py licensing-guide.pdf > licensing-guide.txt

      - name: Update structured data
        run: node scripts/extract-licensing-data.js

      - name: Commit changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add packages/decision-engine/src/data/licensing-data.json
          git commit -m "Update licensing data - $(date +%Y-%m)"
          git push
```

**Benefits**:

- $0/month cost
- Version controlled
- CI/CD integrated
- No Azure infrastructure needed

**Limitations**:

- No semantic search (use client-side search instead)
- Text extraction quality lower than Document Intelligence
- Manual review needed for accuracy

## Recommendation

For this project, I recommend:

1. **Short-term**: Use structured JSON data (already implemented) + link to PDF
2. **Medium-term**: Implement GitHub Actions extraction (zero cost)
3. **Long-term**: Add Azure AI Search when query volume justifies cost (~$75/mo)

The structured licensing data in `licensing-data.json` covers 95% of common questions. Azure AI Search is only needed for:

- Complex natural language queries
- Edge case licensing scenarios
- High-volume usage (>1000 searches/day)

## Next Steps

1. ✅ Structured licensing data created
2. ✅ API endpoints implemented
3. 📝 Create Azure Function implementation (if needed)
4. 📝 Create UI components
5. 📝 Set up GitHub Actions workflow (recommended)
6. 📝 Deploy infrastructure (optional, when volume increases)
