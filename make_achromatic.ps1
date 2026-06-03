$searchPath = "c:\Users\Joao Arthur\OneDrive\Documentos\Valen Barbearia\barbersuite\src"
$files = Get-ChildItem -Path $searchPath -Recurse -Include *.tsx,*.ts,*.css

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content
    
    # Hex
    $content = $content -replace '#00ff66', '#ffffff'
    $content = $content -replace '#00cc52', '#d1d5db'
    $content = $content -replace '#25ff7c', '#e5e7eb'
    
    # RGB/RGBA with and without spaces
    $content = $content -replace '0, 255, 102', '255, 255, 255'
    $content = $content -replace '0,255,102', '255, 255, 255'
    
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Output "Made Achromatic: $($file.FullName)"
    }
}
