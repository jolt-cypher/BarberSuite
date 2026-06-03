$searchPath = "c:\Users\Joao Arthur\OneDrive\Documentos\Valen Barbearia\barbersuite\src"
$files = Get-ChildItem -Path $searchPath -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content
    
    # Branding
    $content = $content -replace 'Minha Barbearia', 'Barbearia Suite'
    
    # Barbers
    $content = $content -replace 'José Shaper', 'Vitor Santos'
    $content = $content -replace 'Pablo Barber', 'Carlos Barber'
    
    # Services
    $content = $content -replace 'Corte Clássico', 'Fade Clássico'
    $content = $content -replace 'Corte Infantil', 'Barboterapia'
    
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Output "Updated Demo Data: $($file.FullName)"
    }
}
