$ErrorActionPreference = "Stop"

try {
  $webInput = $env:ONLINE_WEB_URL.Trim()
  $apiInput = $env:ONLINE_API_URL.Trim()
  $webUri = [Uri]$webInput
  $apiUri = [Uri]$apiInput
  $webOrigin = "{0}://{1}" -f $webUri.Scheme, $webUri.Authority
  $apiBase = $apiUri.AbsoluteUri.TrimEnd("/")

  $webResponse = Invoke-WebRequest -Uri $webUri.AbsoluteUri -TimeoutSec 20 -UseBasicParsing
  Write-Host ("Website: HTTP {0}" -f [int]$webResponse.StatusCode)

  $health = Invoke-RestMethod -Uri "$apiBase/health" -TimeoutSec 20
  if ($health.status -ne "ok") {
    throw "API /health did not return status=ok."
  }
  Write-Host "API health: ok"

  $headers = @{
    Origin = $webOrigin
    "Access-Control-Request-Method" = "GET"
  }
  $preflight = Invoke-WebRequest -Uri "$apiBase/api/auth/me" -Method Options -Headers $headers -TimeoutSec 20 -UseBasicParsing
  $allowedOrigin = $preflight.Headers["Access-Control-Allow-Origin"]
  if ($allowedOrigin -ne $webOrigin) {
    throw "API CORS does not allow the website origin $webOrigin."
  }
  Write-Host "API CORS: allows $webOrigin"
  exit 0
}
catch {
  Write-Error $_
  exit 1
}
