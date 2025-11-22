# Quick script to check if edge functions are deployed

Write-Host "🔍 Checking ProofPop Edge Functions Deployment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1"

$functions = @(
    @{ name = "pixel-loader"; method = "GET" },
    @{ name = "engine"; method = "GET" },
    @{ name = "verify-pixel"; method = "POST" },
    @{ name = "track-event"; method = "POST" },
    @{ name = "get-widgets"; method = "GET" }
)

foreach ($func in $functions) {
    $url = "$baseUrl/$($func.name)"
    Write-Host "Testing $($func.name)..." -NoNewline
    
    try {
        if ($func.method -eq "GET") {
            $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 5
        } else {
            $body = '{"site_id":"1808e26c-e195-4fcf-8eb1-95a4be718b39"}'
            $response = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
        }
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ OK (200)" -ForegroundColor Green
        } else {
            Write-Host " ⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode) {
            Write-Host " ❌ Error: $statusCode" -ForegroundColor Red
        } else {
            Write-Host " ❌ Not deployed or unreachable" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan

# Check if any function failed
$allGood = $true
foreach ($func in $functions) {
    try {
        $url = "$baseUrl/$($func.name)"
        if ($func.method -eq "GET") {
            $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        }
        if ($response.StatusCode -ne 200) {
            $allGood = $false
        }
    } catch {
        $allGood = $false
    }
}

if (-not $allGood) {
    Write-Host ""
    Write-Host "⚠️  Some functions are not working. Deploy them with:" -ForegroundColor Yellow
    Write-Host "   npx supabase functions deploy" -ForegroundColor White
    Write-Host ""
    Write-Host "Or deploy individually:" -ForegroundColor Yellow
    Write-Host "   npx supabase functions deploy pixel-loader" -ForegroundColor White
    Write-Host "   npx supabase functions deploy engine" -ForegroundColor White
    Write-Host "   npx supabase functions deploy verify-pixel" -ForegroundColor White
    Write-Host "   npx supabase functions deploy track-event" -ForegroundColor White
    Write-Host "   npx supabase functions deploy get-widgets" -ForegroundColor White
} else {
    Write-Host "✅ All functions are deployed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now open debug-test.html to test the pixel integration" -ForegroundColor White
}

Write-Host ""
