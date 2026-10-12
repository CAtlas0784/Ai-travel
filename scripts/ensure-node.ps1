param(
  [Parameter(Mandatory = $true)]
  [string]$InstallRoot,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"

function Get-UsableNode {
  param([string]$NodeDirectory)

  $nodeExe = Join-Path $NodeDirectory "node.exe"
  $npmCmd = Join-Path $NodeDirectory "npm.cmd"
  if (-not (Test-Path -LiteralPath $nodeExe) -or -not (Test-Path -LiteralPath $npmCmd)) {
    return $null
  }

  try {
    $nodeVersionText = [string](& $nodeExe --version 2>$null)
    $nodeExitCode = $LASTEXITCODE
    $npmVersionText = [string](& $npmCmd --version 2>$null)
    $npmExitCode = $LASTEXITCODE

    if ($nodeExitCode -ne 0 -or $npmExitCode -ne 0) { return $null }
    if ($nodeVersionText -notmatch "^v(?<major>\d+)\." -or [int]$Matches.major -ne 24) { return $null }
    if ($npmVersionText -notmatch "^(?<major>\d+)\." -or [int]$Matches.major -lt 11) { return $null }

    return [pscustomobject]@{
      Directory = $NodeDirectory
      Node = $nodeVersionText.Trim()
      Npm = $npmVersionText.Trim()
    }
  }
  catch {
    return $null
  }
}

function Save-SelectedNodePath {
  param([string]$Mode)

  $outputDirectory = Split-Path -Parent $OutputPath
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  Set-Content -LiteralPath $OutputPath -Value $Mode -Encoding ASCII
}

try {
  $InstallRoot = [System.IO.Path]::GetFullPath($InstallRoot)
  $OutputPath = [System.IO.Path]::GetFullPath($OutputPath)

  $systemNode = Get-Command "node.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($systemNode) {
    $systemNodeDirectory = Split-Path -Parent $systemNode.Source
    $systemToolchain = Get-UsableNode -NodeDirectory $systemNodeDirectory
    if ($systemToolchain) {
      Save-SelectedNodePath -Mode "SYSTEM"
      Write-Host "Found supported Node.js $($systemToolchain.Node) and npm $($systemToolchain.Npm)."
      exit 0
    }
  }

  $localToolchain = Get-UsableNode -NodeDirectory $InstallRoot
  if ($localToolchain) {
    Save-SelectedNodePath -Mode "LOCAL"
    Write-Host "Using project-local Node.js $($localToolchain.Node) and npm $($localToolchain.Npm)."
    exit 0
  }

  Write-Host "This project needs Node.js 24.x and npm 11 or newer."
  Write-Host "I can download the official portable Node.js archive (about 40 MB) into:"
  Write-Host "  $InstallRoot"
  Write-Host "It will not install system-wide or require administrator access."
  $answer = Read-Host "Download Node.js now? [Y/N]"
  if ($answer -notmatch "(?i)^y(es)?$") {
    Write-Host "Node.js 24.x and npm 11+ are required for local preview, demo, PostgreSQL, and checks."
    exit 1
  }

  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Write-Host "Looking up the latest Node.js 24 release from nodejs.org..."
  $releases = Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json" -TimeoutSec 30
  $release = $releases | Where-Object { $_.version -match "^v24\." } | Select-Object -First 1
  if (-not $release) { throw "Could not find a Node.js 24 release at nodejs.org." }

  $machineArchitecture = $env:PROCESSOR_ARCHITEW6432
  if (-not $machineArchitecture) { $machineArchitecture = $env:PROCESSOR_ARCHITECTURE }
  $architecture = switch ($machineArchitecture.ToUpperInvariant()) {
    "AMD64" { "win-x64"; break }
    "ARM64" { "win-arm64"; break }
    "X86" { "win-x86"; break }
    default { throw "Unsupported Windows architecture: $machineArchitecture. Install Node.js 24.x and npm 11+ manually from https://nodejs.org/en/download/." }
  }

  $archiveType = "$architecture-zip"
  if ($release.files -notcontains $archiveType) {
    throw "The latest Node.js 24 release does not provide a portable archive for $machineArchitecture. Install Node.js 24.x and npm 11+ from https://nodejs.org/en/download/."
  }

  $archiveName = "node-$($release.version)-$architecture.zip"
  $releaseUrl = "https://nodejs.org/dist/$($release.version)"
  $tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
  $tempDirectory = [System.IO.Path]::GetFullPath((Join-Path $tempBase ("ai-travel-node-" + [guid]::NewGuid().ToString("N"))))
  New-Item -ItemType Directory -Path $tempDirectory -Force | Out-Null

  try {
    $archivePath = Join-Path $tempDirectory $archiveName
    $checksums = Invoke-WebRequest -Uri "$releaseUrl/SHASUMS256.txt" -TimeoutSec 30 -UseBasicParsing
    $checksumLine = $checksums.Content -split "`r?`n" | Where-Object { $_ -match ("\s+\*?" + [regex]::Escape($archiveName) + "$") } | Select-Object -First 1
    if (-not $checksumLine) { throw "Could not find the archive checksum in the official SHASUMS256.txt." }
    $expectedHash = ($checksumLine.Trim() -split "\s+")[0]

    Write-Host "Downloading $archiveName from nodejs.org..."
    Invoke-WebRequest -Uri "$releaseUrl/$archiveName" -OutFile $archivePath -TimeoutSec 180 -UseBasicParsing
    $actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
    if ($actualHash -ne $expectedHash) { throw "The Node.js download checksum did not match. The archive will not be installed." }

    $extractDirectory = Join-Path $tempDirectory "extracted"
    Expand-Archive -LiteralPath $archivePath -DestinationPath $extractDirectory -Force
    $archiveDirectory = Join-Path $extractDirectory ($archiveName -replace "\.zip$", "")
    if (-not (Test-Path -LiteralPath (Join-Path $archiveDirectory "node.exe"))) {
      throw "The downloaded Node.js archive did not contain node.exe."
    }

    New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
    Copy-Item -Path (Join-Path $archiveDirectory "*") -Destination $InstallRoot -Recurse -Force
  }
  finally {
    if ($tempDirectory.StartsWith($tempBase, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $tempDirectory)) {
      Remove-Item -LiteralPath $tempDirectory -Recurse -Force
    }
  }

  $installedToolchain = Get-UsableNode -NodeDirectory $InstallRoot
  if (-not $installedToolchain) { throw "Node.js downloaded, but Node.js 24/npm 11+ verification failed." }
  Save-SelectedNodePath -Mode "LOCAL"
  Write-Host "Installed portable Node.js $($installedToolchain.Node) and npm $($installedToolchain.Npm)."
  exit 0
}
catch {
  Write-Host "Node.js requirement setup failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
