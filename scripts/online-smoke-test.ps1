$ErrorActionPreference = "Stop"

try {
  $webInput = ([string]$env:ONLINE_WEB_URL).Trim()
  $apiInput = ([string]$env:ONLINE_API_URL).Trim()
  if (-not $webInput -or -not $apiInput) {
    throw "Set both ONLINE_WEB_URL and ONLINE_API_URL before running this check."
  }
  $webUri = [Uri]$webInput
  $apiUri = [Uri]$apiInput
  if (-not $webUri.IsAbsoluteUri -or -not $apiUri.IsAbsoluteUri -or $webUri.Scheme -notin @("http", "https") -or $apiUri.Scheme -notin @("http", "https")) {
    throw "Website and API URLs must be absolute HTTP or HTTPS URLs."
  }
  $webOrigin = "{0}://{1}" -f $webUri.Scheme, $webUri.Authority
  $apiBase = $apiUri.AbsoluteUri.TrimEnd("/")

  $webResponse = Invoke-WebRequest -Uri $webUri.AbsoluteUri -TimeoutSec 20 -UseBasicParsing
  Write-Host ("Website: HTTP {0}" -f [int]$webResponse.StatusCode)

  $health = Invoke-RestMethod -Uri "$apiBase/health" -TimeoutSec 20
  if ($health.status -ne "ok" -or $health.database -ne "ok") {
    throw "API /health did not confirm both API and database readiness."
  }
  Write-Host "API and database health: ok"

  $placeResponse = Invoke-RestMethod -Uri "$apiBase/api/places/trending" -TimeoutSec 20
  $sourcedPlaces = @($placeResponse.places | Where-Object { $_.sourceUrl -and $_.verifiedAt })
  if ($sourcedPlaces.Count -eq 0) {
    throw "API returned no places with sourceUrl and verifiedAt metadata. Check that the database seed completed."
  }
  Write-Host ("Sourced places: {0} place(s) include source and verification date" -f $sourcedPlaces.Count)

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
