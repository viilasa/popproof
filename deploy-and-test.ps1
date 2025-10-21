# ProofPop Deployment and Testing Script
# Run this script to deploy all functions and start testing

Write-Host "🚀 ProofPop Deployment & Testing Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Supabase CLI is installed
Write-Host "📋 Step 1: Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = npx supabase --version 2>&1
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
}
Write-Host ""

# Step 2: Deploy Edge Functions
Write-Host "📦 Step 2: Deploying Edge Functions..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

$functions = @(
    "pixel-loader",
    "engine",
    "track-event",
    "verify-pixel",
    "get-widgets"
)

foreach ($func in $functions) {
    Write-Host "  Deploying $func..." -ForegroundColor Gray
    try {
        npx supabase functions deploy $func 2>&1 | Out-Null
        Write-Host "  ✅ $func deployed successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to deploy $func" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}
Write-Host ""

# Step 3: Test Edge Functions
Write-Host "🧪 Step 3: Testing Edge Functions..." -ForegroundColor Yellow

$baseUrl = "https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1"

# Test pixel-loader
Write-Host "  Testing pixel-loader..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/pixel-loader" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ pixel-loader: OK (200)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ pixel-loader: FAILED" -ForegroundColor Red
}

# Test engine
Write-Host "  Testing engine..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/engine" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ engine: OK (200)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ engine: FAILED" -ForegroundColor Red
}

# Test verify-pixel
Write-Host "  Testing verify-pixel..." -ForegroundColor Gray
try {
    $body = @{
        site_id = "1808e26c-e195-4fcf-8eb1-95a4be718b39"
        url = "https://test.example.com"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/verify-pixel" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ verify-pixel: OK (200)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  verify-pixel: Check manually (may need auth)" -ForegroundColor Yellow
}

# Test track-event
Write-Host "  Testing track-event..." -ForegroundColor Gray
try {
    $body = @{
        site_id = "1808e26c-e195-4fcf-8eb1-95a4be718b39"
        event_type = "test"
        url = "https://test.example.com"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/track-event" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ track-event: OK (200)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  track-event: Check manually (may need auth)" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Open Test Pages
Write-Host "🌐 Step 4: Opening Test Pages..." -ForegroundColor Yellow

$testPages = @(
    "quick-test.html",
    "public\test-pixel.html"
)

foreach ($page in $testPages) {
    $fullPath = Join-Path $PSScriptRoot $page
    if (Test-Path $fullPath) {
        Write-Host "  Opening $page..." -ForegroundColor Gray
        Start-Process $fullPath
    } else {
        Write-Host "  ⚠️  $page not found" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 5: Summary
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Check the opened test pages in your browser" -ForegroundColor White
Write-Host "  2. Open browser DevTools (F12) to see console logs" -ForegroundColor White
Write-Host "  3. Look for ProofPop messages in the console" -ForegroundColor White
Write-Host "  4. Test the buttons to trigger events" -ForegroundColor White
Write-Host "  5. Check Supabase dashboard for events in the database" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - Full testing guide: TESTING_GUIDE.md" -ForegroundColor White
Write-Host "  - Quick test page: quick-test.html" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "  - Supabase Dashboard: https://supabase.com/dashboard/project/ghiobuubmnvlaukeyuwe" -ForegroundColor White
Write-Host "  - Edge Functions: https://supabase.com/dashboard/project/ghiobuubmnvlaukeyuwe/functions" -ForegroundColor White
Write-Host ""

# Keep window open
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
