# aggiorna.ps1 - Aggiorna il progetto CLB con lo ZIP piu' recente scaricato (clb.zip).
#
# Metti questo file (e aggiorna.cmd) nella cartella del progetto, accanto a package.json.
# Uso:
#   .\aggiorna.ps1                 aggiorna dal piu' recente clb*.zip nella cartella Download
#   .\aggiorna.ps1 -Zip C:\percorso\clb.zip
#   .\aggiorna.ps1 -Forza          reinstalla anche se la versione e' la stessa
#   .\aggiorna.ps1 -Dev            alla fine avvia il server di sviluppo (npm run dev)
#   .\aggiorna.ps1 -SenzaControlli salta typecheck e test
#
# Il salvataggio di gioco sta nel browser e non viene toccato.

param(
    [string]$Zip,
    [switch]$Forza,
    [switch]$Dev,
    [switch]$SenzaControlli
)

$ErrorActionPreference = "Continue"
$progetto = $PSScriptRoot
if (-not $progetto) { $progetto = (Get-Location).Path }

function Scrivi($testo, $colore = "Gray") { Write-Host $testo -ForegroundColor $colore }
function Fallisci($testo) { Scrivi "ERRORE: $testo" "Red"; exit 1 }

# 1. Strumenti necessari
foreach ($comando in @("node", "npm")) {
    if (-not (Get-Command $comando -ErrorAction SilentlyContinue)) {
        Fallisci "$comando non trovato. Installa Node.js (versione LTS) e riprova."
    }
}

# 2. Quale ZIP usare
if (-not $Zip) {
    $download = Join-Path $env:USERPROFILE "Downloads"
    $candidato = Get-ChildItem -Path $download -Filter "clb*.zip" -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $candidato) { Fallisci "Nessun file clb*.zip trovato in $download. Scaricalo oppure usa -Zip <percorso>." }
    $Zip = $candidato.FullName
}
if (-not (Test-Path $Zip)) { Fallisci "File non trovato: $Zip" }
Scrivi "ZIP: $Zip"

# 3. Versione contenuta nello ZIP (si legge senza estrarre)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archivio = [System.IO.Compression.ZipFile]::OpenRead($Zip)
try {
    $voce = $archivio.Entries | Where-Object { $_.FullName -eq "VERSIONE.txt" } | Select-Object -First 1
    if (-not $voce) { Fallisci "Lo ZIP non contiene VERSIONE.txt: non sembra un aggiornamento di CLB." }
    $lettore = New-Object System.IO.StreamReader($voce.Open())
    $nuova = $lettore.ReadToEnd().Trim()
    $lettore.Close()
}
finally {
    $archivio.Dispose()
}

$fileVersione = Join-Path $progetto "VERSIONE.txt"
$vecchia = "nessuna"
if (Test-Path $fileVersione) { $vecchia = (Get-Content $fileVersione -Raw).Trim() }
Scrivi "Versione installata: $vecchia   ->   versione nello ZIP: $nuova" "Cyan"
if (($vecchia -eq $nuova) -and (-not $Forza)) {
    Scrivi "La stessa versione e' gia' installata. Usa -Forza per reinstallarla." "Yellow"
    exit 0
}

# 4. Commit di sicurezza con Git (se la cartella e' un repository)
$usaGit = (Test-Path (Join-Path $progetto ".git")) -and [bool](Get-Command git -ErrorAction SilentlyContinue)
if ($usaGit) {
    $modifiche = git -C $progetto status --porcelain
    if ($modifiche) {
        git -C $progetto add -A | Out-Null
        git -C $progetto commit -m "CLB $vecchia (stato prima di aggiornare a $nuova)" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Fallisci "Il commit di sicurezza non e' riuscito (hai configurato git user.name e user.email?). Non ho toccato nulla."
        }
        Scrivi "Stato attuale salvato con Git." "Green"
    }
    else {
        Scrivi "Git: nessuna modifica da salvare."
    }
}
else {
    Scrivi "Git non usato (nessun repository in questa cartella)." "DarkGray"
}

# 5. Sostituzione dei file del progetto
foreach ($cartella in @("src", "tests", "docs", "strumenti")) {
    $percorso = Join-Path $progetto $cartella
    if (Test-Path $percorso) {
        try { Remove-Item -Recurse -Force $percorso -ErrorAction Stop }
        catch { Fallisci "Non riesco a eliminare $percorso (e' aperta in un altro programma?). $_" }
    }
}
try { Expand-Archive -Path $Zip -DestinationPath $progetto -Force -ErrorAction Stop }
catch { Fallisci "Estrazione fallita: $_" }
Scrivi "File aggiornati." "Green"

# 6. Dipendenze e controlli
Push-Location $progetto
try {
    npm install
    if ($LASTEXITCODE -ne 0) { Fallisci "npm install e' fallito." }

    $controlliOk = $true
    if (-not $SenzaControlli) {
        npm run typecheck
        if ($LASTEXITCODE -ne 0) { $controlliOk = $false }
        npm test
        if ($LASTEXITCODE -ne 0) { $controlliOk = $false }
    }

    if ($controlliOk) {
        Scrivi "Aggiornamento completato: CLB $nuova" "Green"
    }
    else {
        Scrivi "ATTENZIONE: typecheck o test non sono passati. Mandami l'output completo." "Yellow"
        if ($usaGit) {
            Scrivi "Per tornare alla versione precedente:  git reset --hard   e poi   git clean -fd" "Yellow"
        }
    }

    if ($Dev) { npm run dev }
}
finally {
    Pop-Location
}
