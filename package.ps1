# Zips ONLY the merchant-studio app into dist\globe-ai-studio-mockup.zip for sharing.
# The NEO export JSONs in this folder are intentionally NOT included (they contain live keys).
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$src = Join-Path $root "merchant-studio"
$dist = Join-Path $root "dist"
$zip = Join-Path $dist "globe-ai-studio-mockup.zip"
$stage = Join-Path ([IO.Path]::GetTempPath()) ("gms-stage-" + [guid]::NewGuid())
$out = Join-Path $stage "globe-ai-studio-mockup"

# Copy the app, skipping hidden/dev-only files (names starting with "." or "_")
New-Item -ItemType Directory -Force $out | Out-Null
Get-ChildItem $src -Recurse -File | Where-Object { $_.FullName.Substring($src.Length) -notmatch '[\\/][._]' } | ForEach-Object {
  $dest = Join-Path $out $_.FullName.Substring($src.Length + 1)
  New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
  Copy-Item $_.FullName $dest
}

New-Item -ItemType Directory -Force $dist | Out-Null
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path $out -DestinationPath $zip
Remove-Item $stage -Recurse -Force
Write-Host "Created $zip"
