$searchPath = "c:\Users\Joao Arthur\OneDrive\Documentos\Valen Barbearia\barbersuite\src"
$files = Get-ChildItem -Path $searchPath -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $modified = $false
    
    # Gold RGB -> Neon Green
    if ($content -match '212,175,55|212, 175, 55') {
        $content = $content -replace '212,175,55', '0,255,102'
        $content = $content -replace '212, 175, 55', '0, 255, 102'
        $modified = $true
    }
    
    # Blue/Navy RGB -> Neutral White/Gray for glass
    if ($content -match '160,185,255|160, 185, 255|100,140,255|100, 140, 255') {
        $content = $content -replace '160,185,255', '255,255,255'
        $content = $content -replace '160, 185, 255', '255, 255, 255'
        $content = $content -replace '100,140,255', '0,255,102'
        $content = $content -replace '100, 140, 255', '0, 255, 102'
        $modified = $true
    }
    
    # Remaining background hex codes
    if ($content -match '#06080f|#0a0e1a|#0d1220|#1e2535') {
        $content = $content -replace '#06080f', '#030303'
        $content = $content -replace '#0a0e1a', '#0a0a0a'
        $content = $content -replace '#0d1220', '#0a0a0a'
        $content = $content -replace '#1e2535', '#1a1a1a'
        $modified = $true
    }
    
    # Particle color specific prop
    if ($content -match 'color="160, 190, 255"|color="180, 210, 255"') {
        $content = $content -replace 'color="160, 190, 255"', 'color="0, 255, 102"'
        $content = $content -replace 'color="180, 210, 255"', 'color="0, 255, 102"'
        $modified = $true
    }

    if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Output "Updated RGBA/Hex: $($file.FullName)"
    }
}
