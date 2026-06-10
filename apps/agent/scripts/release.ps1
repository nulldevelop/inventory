param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ApiUrl = "https://netwatch.nullphr.com.br/api/release"
$Token = "default_token"
$DownloadUrl = "https://netwatch-agent.s3.amazonaws.com/HardwareAgent.msi"

# 1. Build
Write-Host "`n=== [1/3] Buildando v$Version ===" -ForegroundColor Cyan
$env:AGENT_VERSION = $Version
& "$PSScriptRoot\build.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build falhou. Abortando." -ForegroundColor Red
    exit 1
}

# 2. Lembrete pra subir no S3
Write-Host "`n=== [2/3] Upload no S3 ===" -ForegroundColor Yellow
Write-Host "Suba o arquivo HardwareAgent.msi no bucket S3: netwatch-agent"
Write-Host "Caminho: s3://netwatch-agent/HardwareAgent.msi"
Read-Host "`nAperte ENTER quando tiver feito o upload no S3"

# 3. Registra a release na API
Write-Host "`n=== [3/3] Registrando release v$Version na API ===" -ForegroundColor Cyan
$body = @{ version = $Version; download_url = $DownloadUrl } | ConvertTo-Json
$headers = @{ "Authorization" = "Bearer $Token"; "Content-Type" = "application/json" }

try {
    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $body
    Write-Host "`n$($response.message)" -ForegroundColor Green
} catch {
    Write-Host "`nErro ao registrar release: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Release v$Version concluida! Os agentes vao atualizar automaticamente. ===" -ForegroundColor Green
