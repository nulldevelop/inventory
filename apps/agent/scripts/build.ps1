# Set build variables
$AppName = "inventory-agent.exe"
$MSIName = "InventoryAgent.msi"
$Version = if ($env:AGENT_VERSION) { $env:AGENT_VERSION } else { "1.0.0" }
$WixVersion = "$Version.0"  # WiX exige 4 partes: X.Y.Z.0

# 1. Compile Go binary
Write-Host "Compilando Go binary v$Version..." -ForegroundColor Cyan
$env:GOOS = "windows"
$env:GOARCH = "amd64"
go build -ldflags "-X main.Version=$Version" -o $AppName ./cmd/agent/

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. Atualiza a versão no agent.wxs
Write-Host "Updating WiX version to $WixVersion..." -ForegroundColor Cyan
$wxsPath = ".\wix\agent.wxs"
$wxsContent = Get-Content $wxsPath -Raw
$wxsContent = $wxsContent -replace 'Version="[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+"', "Version=`"$WixVersion`""
Set-Content $wxsPath $wxsContent -NoNewline

# 3. Build MSI using WiX Toolset
# This requires WiX Toolset v3 (candle.exe and light.exe)
Write-Host "Generating MSI installer..." -ForegroundColor Cyan

$WixPath = "C:\Program Files (x86)\WiX Toolset v3.14\bin"
$Candle = Join-Path $WixPath "candle.exe"
$Light = Join-Path $WixPath "light.exe"

# Candle (Compiler) — arch x64 para casar com o binário amd64 e o registro 64-bit
& $Candle -arch x64 .\wix\agent.wxs -o .\wix\agent.wixobj

if ($LASTEXITCODE -ne 0) {
    Write-Host "WiX Compile failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

# Light (Linker) — saída direto na pasta AgentInstall
$OutDir = ".\AgentInstall"
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
$MSIPath = Join-Path $OutDir $MSIName
& $Light -ext WixUIExtension .\wix\agent.wixobj -o $MSIPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "WiX Link failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Successfully generated $MSIPath" -ForegroundColor Green
