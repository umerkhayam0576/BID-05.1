$p = 'src\components\wealth\CompanyWorkspaceView.tsx'

$s = Get-Content $p -Raw

if ($s -match "'settings-organization'") {
    Write-Host "Tab already exists. No changes made."
    exit
}

$s = $s -replace "\| 'people';", "| 'people'`r`n  | 'settings-organization';"

[System.IO.File]::WriteAllText(
    (Resolve-Path $p),
    $s,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "Tab added."