$searchPath = "c:\Users\Joao Arthur\OneDrive\Documentos\Valen Barbearia\barbersuite\src"
$files = Get-ChildItem -Path $searchPath -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($content -match '#d4af37|#b8942f|#f0d98a|btn-gold|text-gold-gradient') {
        $content = $content -replace '#d4af37', '#00ff66'
        $content = $content -replace '#b8942f', '#00cc52'
        $content = $content -replace '#f0d98a', '#ccffea'
        $content = $content -replace 'btn-gold', 'btn-neon'
        $content = $content -replace 'text-gold-gradient', 'text-neon-gradient'
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Output "Updated: $($file.FullName)"
    }
}
