# Implementation Guide Automated Monitoring System

## Overview

This system automatically monitors the **Microsoft Copilot Studio Implementation Guide** for updates and notifies users when new versions are available. The monitoring runs monthly via Azure Functions and displays in-app notifications when changes are detected.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Monthly Schedule                         │
│              Azure Function Timer Trigger                    │
│                  (1st of every month)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            MonitorImplementationGuide Function               │
│  1. Check GitHub API for file metadata                      │
│  2. Compare SHA with stored version                          │
│  3. Download PPTX if changed                                 │
│  4. Extract content (slides, chapters, topics)               │
│  5. Store in Azure Blob Storage                              │
│  6. Create update notification marker                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Azure Blob Storage                            │
│  • implementation-guide/                                     │
│    ├── implementation-guide-metadata.json                    │
│    ├── update-available.json (marker)                        │
│    ├── implementation-guide-{sha}.pptx                       │
│    └── notifications/                                        │
│        └── update-{date}.json                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Web Application                           │
│  • Checks /api/implementation-guide/update-check             │
│  • Displays ImplementationGuideUpdateBanner                  │
│  • Shows version, chapters, extracted content                │
│  • Links to guide and alignment plan                         │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Azure Function: MonitorImplementationGuide

**Location**: `azure-function/MonitorImplementationGuide/`

**Schedule**: Monthly on the 1st at 3:00 AM UTC (`0 0 3 1 * *`)

**Responsibilities**:
- Query GitHub API for file metadata of Implementation Guide PPTX
- Compare current SHA with previously stored SHA
- Download PPTX if SHA has changed (indicating an update)
- Extract text content from PPTX slides
- Identify chapters and key topics
- Store metadata and PPTX in Azure Blob Storage
- Create update marker for web application
- Log notification events

**GitHub Source**:
- Repository: `microsoft/CopilotStudioSamples`
- Path: `ImplementationGuide/Microsoft Copilot Studio - Implementation Guide.pptx`
- Download: `https://aka.ms/CopilotStudioImplementationGuide`

### 2. API Service: implementation-guide-monitor.ts

**Location**: `apps/api/src/services/implementation-guide-monitor.ts`

**Endpoints**:

#### `GET /api/implementation-guide/update-check`
Returns current update status.

**Response**:
```json
{
  "updateAvailable": true,
  "version": "2.2",
  "detectedAt": "2026-02-15T03:00:00Z",
  "sha": "abc123...",
  "message": "Review extracted content and update decision model",
  "extractedContent": {
    "slideCount": 150,
    "chapters": [
      "Overview",
      "Architecture",
      "Language & orchestration",
      "AI capabilities",
      "Integrations",
      "Channels, clients, and handoff",
      "Security, monitoring & governance",
      "Application lifecycle management (ALM)",
      "Analytics & KPIs",
      "Licensing and capacity",
      "Testing agents",
      "Dynamics 365 Omnichannel"
    ],
    "keyTopics": [
      "Generative Orchestration",
      "Multi-agent Patterns",
      "Component Collections",
      "Safety Boundaries",
      "..."
    ]
  }
}
```

#### `GET /api/implementation-guide/metadata`
Returns full metadata about the Implementation Guide.

#### `POST /api/implementation-guide/acknowledge-update`
Marks an update as reviewed and clears the update marker.

#### `GET /api/implementation-guide/update-history`
Returns the last 10 detected updates with timestamps.

### 3. React Component: ImplementationGuideUpdateBanner

**Location**: `apps/web/src/components/ImplementationGuideUpdateBanner.tsx`

**Features**:
- Displays prominent banner when updates are detected
- Shows version number and detection date
- Lists extracted chapters and topics
- Links to:
  - Official Implementation Guide (aka.ms)
  - Local alignment plan documentation
- "Mark as Reviewed" button to acknowledge update
- Dismiss button for temporary hiding
- Auto-checks hourly for new updates

**Appearance**:
- Blue gradient banner with left border accent
- Alert icon and expandable content
- Chapter tags and slide count
- Multiple action buttons

## Configuration

### Environment Variables

**Required for Azure Function**:
```bash
# Azure Storage (for storing metadata and PPTX files)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...

# Optional: GitHub Personal Access Token (for higher API rate limits)
GITHUB_TOKEN=ghp_...
```

**Required for Web API**:
```bash
# Same storage connection string as Function
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
```

### Azure Resources Required

1. **Azure Storage Account**
   - Container: `implementation-guide`
   - Purpose: Store PPTX files, metadata, and update markers
   - Access: Private (accessed via connection string)

2. **Azure Functions App**
   - Runtime: Node.js 20+
   - Plan: Consumption or App Service
   - Functions:
     - `MonitorImplementationGuide` (timer trigger)
     - `UpdateLicensingPDF` (existing, timer trigger)

## Data Storage

### implementation-guide-metadata.json
Stores the current state of the Implementation Guide.

```json
{
  "version": "2.2",
  "lastChecked": "2026-02-01T03:00:00Z",
  "lastModified": "2026-02-02T10:30:00Z",
  "sha": "abc123def456...",
  "size": 25600000,
  "downloadUrl": "https://github.com/microsoft/CopilotStudioSamples/...",
  "changeDetected": true,
  "extractedContent": {
    "slideCount": 150,
    "chapters": [...],
    "keyTopics": [...]
  }
}
```

### update-available.json (Marker File)
Created when an update is detected. Deleted when acknowledged.

```json
{
  "updateDetected": true,
  "version": "2.2",
  "detectedAt": "2026-02-01T03:00:00Z",
  "sha": "abc123...",
  "extractedContent": {...},
  "message": "A new version has been detected. Review and apply updates."
}
```

### notifications/update-{date}.json
Historical log of detected updates.

```json
{
  "timestamp": "2026-02-01T03:00:00Z",
  "event": "implementation-guide-updated",
  "previousVersion": "2.1",
  "newVersion": "2.2",
  "previousSha": "old123...",
  "newSha": "abc123...",
  "commitMessage": "v2.2 update",
  "commitDate": "2026-02-02T10:30:00Z",
  "extractedContent": {...},
  "actionRequired": "Review and update decision model",
  "references": [
    "https://aka.ms/CopilotStudioImplementationGuide",
    "https://github.com/microsoft/CopilotStudioSamples/...",
    "/docs/IMPLEMENTATION_GUIDE_ALIGNMENT.md"
  ]
}
```

## Workflow

### Monthly Check Cycle

1. **Day 1, 3:00 AM UTC**: Azure Function executes
2. **GitHub API Query**: Check file SHA and commit history
3. **Change Detection**: Compare new SHA with stored SHA
4. **If Changed**:
   - Download PPTX (typically 20-30 MB)
   - Extract text content from slides (ZIP + XML parsing)
   - Identify chapters (numbered headings pattern)
   - Extract key topics (capitalized multi-word phrases)
   - Store PPTX with SHA suffix
   - Update metadata.json
   - Create update-available.json marker
   - Log notification event
5. **If Unchanged**:
   - Update lastChecked timestamp only
   - No notification created

### User Notification Flow

1. **User visits any page**: Layout component renders
2. **ImplementationGuideUpdateBanner**: Mounted on every page
3. **Initial check**: Calls `/api/implementation-guide/update-check`
4. **If update available**: Banner displays with extracted content
5. **User actions**:
   - **View Guide**: Opens aka.ms link in new tab
   - **Review Alignment Plan**: Opens local documentation
   - **Mark as Reviewed**: 
     - Calls `/api/implementation-guide/acknowledge-update`
     - Deletes update-available.json marker
     - Hides banner
   - **Dismiss**: Temporarily hides banner (shows again on next page load)
6. **Hourly re-check**: Banner polls API every 60 minutes

## PPTX Content Extraction

The system extracts content from PPTX files using:

1. **AdmZip**: PPTX files are ZIP archives containing XML
2. **xml2js**: Parse PowerPoint XML structure
3. **Text Extraction**: Recursively find `<a:t>` elements (text runs)
4. **Chapter Detection**: Pattern matching for numbered headings (e.g., "1. Overview")
5. **Topic Extraction**: Identify capitalized multi-word phrases
6. **Limitations**: 
   - No image/diagram extraction
   - No speaker notes
   - May miss formatted text or embedded objects

## Integration with Content Enhancement

When an update is detected, the system provides:

- **Chapter list**: Helps identify new or renamed sections
- **Key topics**: Highlights focus areas in the update
- **Slide count**: Indicates scale of changes
- **Version number**: Tracks progression (2.0 → 2.1 → 2.2)

**Manual Process** (current):
1. Notification banner alerts users
2. Download guide from aka.ms link
3. Review alignment plan in docs/
4. Manually update:
   - decision-model.v1.json (questionnaire)
   - Readiness assessment questions
   - Documentation and guidance

**Future Automation** (planned):
- AI-powered content analysis
- Automatic question generation
- Pull request creation with suggested updates
- Semantic diff between versions

## Monitoring & Troubleshooting

### Azure Function Logs

View execution logs in Azure Portal:
- Functions App → MonitorImplementationGuide → Monitor → Invocations
- Application Insights integration for detailed telemetry

### Common Issues

**Problem**: No updates detected despite new version

**Solutions**:
- Check GitHub API rate limit (60/hour unauthenticated, 5000/hour with token)
- Verify GitHub repository and file path are correct
- Check Azure Storage connection string

---

**Problem**: PPTX extraction fails or returns empty content

**Solutions**:
- Verify PPTX file downloaded successfully (check blob storage)
- Check file size (should be 20-30 MB)
- Review function logs for XML parsing errors
- Test with manual PPTX download

---

**Problem**: Banner doesn't show in web app

**Solutions**:
- Check `/api/implementation-guide/update-check` endpoint directly
- Verify `update-available.json` exists in blob storage
- Check browser console for API errors
- Ensure AZURE_STORAGE_CONNECTION_STRING is configured in web API

---

**Problem**: Update marker persists after acknowledgment

**Solutions**:
- Verify `/api/implementation-guide/acknowledge-update` returns success
- Check blob storage permissions (needs delete access)
- Manually delete `update-available.json` via Azure Portal

## Testing

### Manual Trigger

Test the Azure Function locally:

```bash
cd azure-function
npm install
npm run build
func start

# In another terminal
curl -X POST http://localhost:7071/admin/functions/MonitorImplementationGuide
```

### API Testing

```bash
# Check for updates
curl http://localhost:3001/api/implementation-guide/update-check

# Get metadata
curl http://localhost:3001/api/implementation-guide/metadata

# Acknowledge update
curl -X POST http://localhost:3001/api/implementation-guide/acknowledge-update

# View history
curl http://localhost:3001/api/implementation-guide/update-history
```

### Simulate Update

1. Delete `implementation-guide-metadata.json` from blob storage
2. Run function manually
3. Function will treat as first check and store current version
4. Modify stored SHA in metadata.json
5. Run function again
6. Function will detect "change" and create update marker

## Dependencies

### Azure Function
```json
{
  "@azure/functions": "^4.5.0",
  "@azure/storage-blob": "^12.17.0",
  "adm-zip": "^0.5.10",
  "xml2js": "^0.6.2",
  "node-fetch": "^2.7.0"
}
```

### Web API
```json
{
  "@azure/storage-blob": "^12.17.0"
}
```

### Web App
```json
{
  "lucide-react": "^0.263.1"
}
```

## Security Considerations

- **GitHub Token**: Store in Azure Key Vault or App Configuration
- **Storage Connection String**: Use managed identity when possible
- **API Endpoints**: Currently public; consider adding authentication
- **Rate Limiting**: GitHub API allows 60 requests/hour unauthenticated
- **PPTX Storage**: Files stored privately; only accessible via connection string

## Future Enhancements

1. **AI-Powered Analysis**
   - Use Azure OpenAI to analyze changes
   - Generate suggested questionnaire updates
   - Semantic comparison with previous version

2. **Automated Content Updates**
   - Create GitHub pull requests automatically
   - Generate updated question text based on new guidance
   - Map new topics to existing question groups

3. **Advanced Notifications**
   - Email notifications to administrators
   - Microsoft Teams webhook integration
   - Slack notifications

4. **Version Comparison**
   - Side-by-side diff of versions
   - Highlight added/removed/changed sections
   - Visual changelog

5. **Scheduling Options**
   - Configurable check frequency (weekly, bi-weekly, monthly)
   - On-demand manual checks from admin panel
   - Webhook-based instant notifications from GitHub

6. **Analytics**
   - Track update frequency
   - Measure time from detection to content update
   - Monitor user engagement with update notifications

## References

- [Microsoft Copilot Studio Implementation Guide](https://aka.ms/CopilotStudioImplementationGuide)
- [GitHub Repository](https://github.com/microsoft/CopilotStudioSamples/tree/main/ImplementationGuide)
- [Implementation Guide Alignment Plan](./IMPLEMENTATION_GUIDE_ALIGNMENT.md)
- [Azure Functions Documentation](https://learn.microsoft.com/azure/azure-functions/)
- [Azure Blob Storage Documentation](https://learn.microsoft.com/azure/storage/blobs/)

---

**Last Updated**: February 19, 2026  
**System Version**: 1.0.0  
**Status**: ✅ Active
