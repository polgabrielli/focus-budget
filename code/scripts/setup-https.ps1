<#
.SYNOPSIS
  Configura HTTPS local para Focus Budget usando mkcert.
  Genera certificados válidos para localhost y la IP de red local (LAN)
  y prepara el certificado Root CA para instalar en el iPhone.
#>

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$CertsDir = Join-Path $ProjectRoot ".certs"

if (-not (Test-Path $CertsDir)) {
    New-Item -ItemType Directory -Path $CertsDir | Out-Null
}

Write-Host ""
Write-Host "=== Focus Budget - Configuracion HTTPS Local (mkcert) ===" -ForegroundColor Cyan

# 1. Buscar mkcert en PATH o en .certs\mkcert.exe
$MkcertCmd = Get-Command mkcert -ErrorAction SilentlyContinue
if ($MkcertCmd) {
    $MkcertExe = $MkcertCmd.Source
    Write-Host "[OK] mkcert encontrado en: $MkcertExe" -ForegroundColor Green
} else {
    $LocalMkcert = Join-Path $CertsDir "mkcert.exe"
    if (-not (Test-Path $LocalMkcert)) {
        Write-Host "[..] mkcert no esta instalado. Descargando binario oficial (v1.4.4)..." -ForegroundColor Yellow
        $DownloadUrl = "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe"
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $LocalMkcert -UseBasicParsing
        Write-Host "[OK] mkcert descargado en $LocalMkcert" -ForegroundColor Green
    } else {
        Write-Host "[OK] Usando mkcert local en $LocalMkcert" -ForegroundColor Green
    }
    $MkcertExe = $LocalMkcert
}

# 2. Detectar IP LAN principal (IPv4 privada fuera de Loopback y WSL/Hyper-V switches secundarios)
$LanIps = @(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and
    $_.InterfaceAlias -notlike "*vEthernet*" -and
    $_.IPAddress -notlike "169.254.*"
} | Select-Object -ExpandProperty IPAddress)

if ($LanIps.Count -eq 0) {
    # Fallback a cualquier IPv4 no-loopback
    $LanIps = @(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"
    } | Select-Object -ExpandProperty IPAddress)
}

$PrimaryIp = if ($LanIps.Count -gt 0) { $LanIps[0] } else { "192.168.1.4" }
$Hostname = $env:COMPUTERNAME.ToLower()

Write-Host "[OK] IPs LAN detectadas: $($LanIps -join ', ')" -ForegroundColor Green

# 3. Instalar la Autoridad Certificadora (Root CA) local en Windows
Write-Host ""
Write-Host "[1/3] Instalando Root CA local en Windows (puede pedir confirmacion de seguridad)..." -ForegroundColor Cyan
& $MkcertExe -install

# 4. Generar el certificado TLS para localhost, 127.0.0.1, ::1, hostname y todas las IPs LAN
$CertFile = Join-Path $CertsDir "dev-cert.pem"
$KeyFile  = Join-Path $CertsDir "dev-key.pem"

$Hosts = @("localhost", "127.0.0.1", "::1", $Hostname, "$Hostname.local") + $LanIps

Write-Host "[2/3] Generando certificado TLS para: $($Hosts -join ', ')..." -ForegroundColor Cyan
& $MkcertExe -cert-file $CertFile -key-file $KeyFile @Hosts

# 5. Exportar rootCA.crt para el iPhone
$CaRootDir = (& $MkcertExe -CAROOT).Trim()
$RootCaPem = Join-Path $CaRootDir "rootCA.pem"
$RootCaCrt = Join-Path $CertsDir "rootCA.crt"

if (Test-Path $RootCaPem) {
    Copy-Item -Path $RootCaPem -Destination $RootCaCrt -Force
    Write-Host "[3/3] Certificado Root CA copiado en: $RootCaCrt" -ForegroundColor Green
} else {
    Write-Warning "No se encontro rootCA.pem en $CaRootDir"
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  HTTPS LOCAL LISTO" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "1. Inicia la app con: npm run dev"
Write-Host "2. En tu iPhone (conectado al mismo Wi-Fi), abri Safari y entra a:"
Write-Host "   http://${PrimaryIp}:5174" -ForegroundColor Yellow
Write-Host "   para descargar e instalar el certificado con 1 toque."
Write-Host "3. Una vez activado el certificado en iOS, entra a Focus Budget en:"
Write-Host "   https://${PrimaryIp}:5173" -ForegroundColor Cyan
Write-Host ""
