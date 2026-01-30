Write-Host "`n⚡ CORRECTION AUTOMATIQUE DES PARAMS..." -ForegroundColor Yellow
Write-Host "============================================================"

# BACKUP
Write-Host "`n📦 Création backup..." -ForegroundColor Cyan
git add . 2>$null
git commit -m "Backup avant correction params async" 2>$null

$files = Get-ChildItem -Path ".\src\app\api" -Filter "route.ts" -Recurse
$fixedCount = 0

Write-Host "`n🔧 Correction en cours...`n" -ForegroundColor Yellow

foreach ($file in $files) {
    # Compatible PowerShell v2
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content
    
    # Pattern 1: { params }: { params: { id: string } }
    $content = $content -replace '\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}', 'context: { params: Promise<{ id: string }> }'
    
    # Pattern 2: const { id } = params;
    $content = $content -replace 'const\s*\{\s*id\s*\}\s*=\s*params;', 'const { id } = await context.params;'
    
    # Pattern 3: const { id: autreNom } = params;
    $content = $content -replace 'const\s*\{\s*id:\s*(\w+)\s*\}\s*=\s*params;', 'const { id: $1 } = await context.params;'
    
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        $fixedCount++
        $relativePath = $file.FullName.Replace($PWD.Path, "")
        Write-Host "  ✅ $relativePath" -ForegroundColor Green
    }
}

Write-Host "`n============================================================"
Write-Host "`n📊 RÉSULTAT: $fixedCount fichiers corrigés!" -ForegroundColor Cyan

if ($fixedCount -gt 0) {
    Write-Host "`n🔨 Vérification compilation..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ COMPILATION RÉUSSIE!" -ForegroundColor Green
        Write-Host "`n💡 Prochaines étapes:" -ForegroundColor Cyan
        Write-Host "   git status" -ForegroundColor White
        Write-Host "   git diff" -ForegroundColor White
        Write-Host "   git add ." -ForegroundColor White
        Write-Host "   git commit -m 'Fix: params async Next.js 15'" -ForegroundColor White
        Write-Host "   git push origin main`n" -ForegroundColor White
    } else {
        Write-Host "`n❌ Erreurs de compilation!" -ForegroundColor Red
        Write-Host "Vérifiez les messages ci-dessus`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n✅ Aucune correction nécessaire!`n" -ForegroundColor Green
}
