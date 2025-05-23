# Fix JSX Extensions - Rename .js files containing JSX to .jsx
Write-Host "Finding .js files with JSX content..." -ForegroundColor Yellow

$jsFiles = Get-ChildItem -Path "frontend/src/components" -Recurse -Filter "*.js"
$renamedCount = 0

foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file contains JSX patterns
    if ($content -match '<[A-Z]|<\/[A-Z]|<[a-z][^>]*>|return\s*\(.*<|return\s*<') {
        $oldPath = $file.FullName
        $newPath = $file.FullName -replace '\.js$', '.jsx'
        
        Write-Host "Renaming: $($file.Name) → $($file.BaseName).jsx" -ForegroundColor Green
        Rename-Item $oldPath $newPath
        $renamedCount++
    } else {
        Write-Host "Skipping: $($file.Name) (no JSX found)" -ForegroundColor Gray
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "- Files renamed: $renamedCount" -ForegroundColor Green
Write-Host "- Total .js files checked: $($jsFiles.Count)" -ForegroundColor Yellow

# Check remaining .js files
$remainingJs = Get-ChildItem -Path "frontend/src/components" -Recurse -Filter "*.js" | Measure-Object
Write-Host "- Remaining .js files: $($remainingJs.Count)" -ForegroundColor $(if($remainingJs.Count -eq 0){"Green"}else{"Yellow"})

Write-Host "`nDone!" -ForegroundColor Green 