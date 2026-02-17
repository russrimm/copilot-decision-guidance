$paths = @(
  "$env:USERPROFILE\.vscode\extensions",
  "$env:USERPROFILE\.vscode-insiders\extensions",
  "$env:APPDATA\Code\logs",
  "$env:APPDATA\Code - Insiders\logs"
)

$patterns = 'defender','endpoint','mdatp','wdatp','defenderforendpoint'

$paths | ForEach-Object {
  if (Test-Path $_) {
    Write-Host "`n== Scanning: $_ ==" -ForegroundColor Cyan
    Get-ChildItem -Path $_ -Recurse -Force -ErrorAction SilentlyContinue |
      Where-Object { $patterns | ForEach-Object { $_ } | ForEach-Object { $_ } | Out-Null; $true } |
      Where-Object { $patterns | ForEach-Object { $_ } | ForEach-Object { $_ } | Out-Null; $true } |
      Select-Object FullName
  }
}

# Grep inside logs for DefenderForEndpointPlug-in
@("$env:APPDATA\Code\logs","$env:APPDATA\Code - Insiders\logs") | ForEach-Object {
  if (Test-Path $_) {
    Write-Host "`n== Searching log contents in: $_ ==" -ForegroundColor Cyan
    Get-ChildItem -Path $_ -Recurse -Force -ErrorAction SilentlyContinue -Filter "*.log" |
      Select-String -Pattern 'DefenderForEndpoint|defenderforendpoint|defender for endpoint' -CaseSensitive:$false |
      Select-Object Path, LineNumber, Line
  }
}