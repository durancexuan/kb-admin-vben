# 从 Windows 本机触发服务器一键部署（会提示输入 SSH 密码）
param(
  [string]$ServerHost = '192.168.13.7',
  [string]$User = '',
  [string]$RepoUrl = 'https://github.com/durancexuan/kb-admin-vben.git'
)

$ErrorActionPreference = 'Stop'

if (-not $User) {
  $User = Read-Host 'SSH 用户名（向负责人索取）'
}

$remote = "${User}@${ServerHost}"
$scriptPath = Join-Path $PSScriptRoot 'bootstrap-server.sh'

if (-not (Test-Path $scriptPath)) {
  throw "找不到 bootstrap-server.sh"
}

Write-Host "即将 SSH 到 $remote 并部署 kb-api（需输入密码）..." -ForegroundColor Cyan
Write-Host "仓库: $RepoUrl" -ForegroundColor Gray

Get-Content $scriptPath -Raw | ssh $remote "KB_REPO_URL='$RepoUrl' bash -s"

Write-Host ''
Write-Host '部署命令已执行。正在从本机探测 health...' -ForegroundColor Cyan
Start-Sleep -Seconds 5
curl.exe -s --max-time 10 "http://${ServerHost}:8080/health"
Write-Host ''
