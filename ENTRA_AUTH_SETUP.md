# Azure OpenAI Entra Authentication Setup

This application now uses **Entra (Azure AD) authentication** instead of API keys for Azure OpenAI access.

## Authentication Methods

The application uses `DefaultAzureCredential` from `@azure/identity`, which supports multiple authentication methods in this order:

1. **Environment Variables** (Service Principal)
2. **Managed Identity** (when deployed to Azure)
3. **Azure CLI** (for local development)
4. **Visual Studio Code**
5. **Azure PowerShell**

## Local Development Setup

### Option 1: Azure CLI (Recommended)

1. Install Azure CLI if not already installed:

   ```bash
   # Windows
   winget install Microsoft.AzureCLI

   # Or download from https://aka.ms/installazurecliwindows
   ```

2. Login to Azure:

   ```bash
   az login
   ```

3. Set your default subscription (if you have multiple):

   ```bash
   az account set --subscription "your-subscription-id"
   ```

4. Ensure your user has the appropriate role assignment on the Azure OpenAI resource:
   - **Cognitive Services OpenAI User** (recommended for read/inference)
   - **Cognitive Services OpenAI Contributor** (if you need to manage deployments)

5. Update your `.env` file:
   ```env
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   ```

### Option 2: Service Principal (CI/CD)

For automated environments or CI/CD pipelines:

1. Create a service principal:

   ```bash
   az ad sp create-for-rbac --name "copilot-decision-guidance" --role "Cognitive Services OpenAI User" --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.CognitiveServices/accounts/{openai-resource-name}
   ```

2. Set environment variables:
   ```env
   AZURE_TENANT_ID=your-tenant-id
   AZURE_CLIENT_ID=your-client-id
   AZURE_CLIENT_SECRET=your-client-secret
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   ```

## Azure Deployment Setup

When deploying to Azure (App Service, Container Apps, Functions, etc.):

1. **Enable Managed Identity** on your Azure resource

2. **Assign the appropriate role** to the managed identity:

   ```bash
   az role assignment create \
     --assignee <managed-identity-principal-id> \
     --role "Cognitive Services OpenAI User" \
     --scope /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.CognitiveServices/accounts/{openai-resource-name}
   ```

3. **Configure environment variables** in your Azure resource:

   ```env
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   ```

   Note: No credentials needed - managed identity handles authentication automatically!

## Required Azure RBAC Roles

| Role                                      | Purpose                    | Scope                   |
| ----------------------------------------- | -------------------------- | ----------------------- |
| **Cognitive Services OpenAI User**        | Inference/chat completions | Recommended for runtime |
| **Cognitive Services OpenAI Contributor** | Manage deployments         | Only if managing models |

## Troubleshooting

### "DefaultAzureCredential failed to retrieve a token"

**Solution**: Ensure you're logged in via Azure CLI:

```bash
az login
az account show  # Verify you're logged in
```

### "Unauthorized" or 403 errors

**Solution**: Check role assignments:

```bash
# List your role assignments
az role assignment list --assignee $(az account show --query user.name -o tsv) --all

# If missing, add the role
az role assignment create \
  --assignee $(az account show --query user.name -o tsv) \
  --role "Cognitive Services OpenAI User" \
  --scope /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.CognitiveServices/accounts/{openai-resource-name}
```

### Token expiration issues

DefaultAzureCredential automatically handles token refresh, but if you experience issues:

```bash
# Re-login to Azure CLI
az logout
az login
```

## Security Benefits

Using Entra authentication instead of API keys provides:

✅ **No secrets in code or config files**  
✅ **Automatic credential rotation**  
✅ **Centralized access management via Azure RBAC**  
✅ **Audit logging through Azure AD**  
✅ **Support for conditional access policies**  
✅ **Managed identity for zero-credential deployments**

## Migration from API Key

If you were previously using `AZURE_OPENAI_API_KEY`:

1. Remove the API key from your `.env` file
2. Follow the setup steps above
3. Ensure you have the correct RBAC role assigned
4. Test the application

The application will automatically detect and use Entra authentication when `AZURE_OPENAI_ENDPOINT` is configured without `AZURE_OPENAI_API_KEY`.

## Additional Resources

- [Azure Identity SDK Documentation](https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/overview)
- [DefaultAzureCredential](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)
- [Azure OpenAI RBAC](https://learn.microsoft.com/azure/ai-services/openai/how-to/role-based-access-control)
