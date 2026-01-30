Write-Host "`n⚡ CORRECTION AUTOMATIQUE DES PARAMS ASYNC..." -ForegroundColor Yellow
Write-Host "============================================================"

# BACKUP
Write-Host "`n📦 Création backup..." -ForegroundColor Cyan
git add . 2>$null
git commit -m "Backup avant correction automatique params" 2>$null

$files = Get-ChildItem -Path ".\src\app\api" -Filter "*.ts" -Recurse
$fixedCount = 0

Write-Host "`n🔧 Correction en cours...`n" -ForegroundColor Yellow

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content
    
    # Pattern 1: const XXX = params.id; → const { id: XXX } = await context.params;
    $content = $content -replace 'const\s+(\w+)\s*=\s*params\.id;', 'const { id: $1 } = await context.params;'
    
    # Pattern 2: const XXX = params.documentId; → const { documentId: XXX } = await context.params;
    $content = $content -replace 'const\s+(\w+)\s*=\s*params\.documentId;', 'const { documentId: $1 } = await context.params;'
    
    # Pattern 3: params.id (utilisé directement) → (await context.params).id
    $content = $content -replace '(?<!await context\.)params\.id(?!;)', '(await context.params).id'
    
    # Pattern 4: params.documentId (utilisé directement) → (await context.params).documentId
    $content = $content -replace '(?<!await context\.)params\.documentId', '(await context.params).documentId'
    
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
        Write-Host "`n💡 Commit:" -ForegroundColor Cyan
        Write-Host "   git add ." -ForegroundColor White
        Write-Host "   git commit -m 'Fix: params async dans tous les fichiers API'" -ForegroundColor White
        Write-Host "   git push`n" -ForegroundColor White
    } else {
        Write-Host "`n⚠️  Erreurs restantes - vérifiez ci-dessus`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n✅ Aucune correction nécessaire!`n" -ForegroundColor Green
}