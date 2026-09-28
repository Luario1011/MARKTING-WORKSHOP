$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$studyRoot = Join-Path $PSScriptRoot 'copia-para-estudiar'
$files = @(
  'package.json',
  'astro.config.mjs',
  'tsconfig.json',
  'scripts/generate-datasets.mjs',
  'scripts/train_fraud_model.py',
  'src/components/IdeaPresentation.tsx',
  'src/components/FraudDashboard.tsx',
  'src/layouts/BaseLayout.astro',
  'src/lib/fraudData.ts',
  'src/pages/index.astro',
  'src/pages/fraude.astro',
  'src/styles/global.css',
  'src/data/model-run.json'
)

foreach ($relativePath in $files) {
  $source = Join-Path $projectRoot $relativePath
  $destination = Join-Path $studyRoot $relativePath
  $destinationDirectory = Split-Path -Parent $destination
  New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

Write-Host "Copia de estudio actualizada con $($files.Count) archivos."
