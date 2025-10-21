# PowerShell script to deploy edge functions to Supabase

Write-Host "🚀 Deploying Edge Functions to Supabase..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green

# Deploy all functions
Write-Host ""
Write-Host "📦 Deploying all edge functions..." -ForegroundColor Cyan
Write-Host ""

supabase functions deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Your edge functions are now available at:" -ForegroundColor Cyan
    Write-Host "  - https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader" -ForegroundColor White
    Write-Host "  - https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/engine" -ForegroundColor White
    Write-Host "  - https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widgets" -ForegroundColor White
    Write-Host "  - https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/verify-pixel" -ForegroundColor White
    Write-Host "  - https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Test your deployment:" -ForegroundColor Cyan
    Write-Host "  Open: test-edge-functions.html in your browser" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Not logged in: Run 'supabase login'" -ForegroundColor White
    Write-Host "  2. Project not linked: Run 'supabase link --project-ref ghiobuubmnvlaukeyuwe'" -ForegroundColor White
    Write-Host "  3. No permissions: Check you have access to the Supabase project" -ForegroundColor White
}
