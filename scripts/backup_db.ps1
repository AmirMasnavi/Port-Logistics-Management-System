param (
    [string]$DbUser,
    [string]$DbPassword,
    [string]$DbHost,
    [string]$DbName,
    [string]$BackupPath
)

# --- CONFIGURATION ---
$date = Get-Date -Format "yyyyMMdd"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$fileName = "$($DbName)_$($date).sql"
$fullPath = Join-Path $BackupPath $fileName
$logFile = Join-Path $BackupPath "backup_history.log" #
$mysqldump = "E:\MySQL\mysql-9.5.0\mysql-9.5.0-winx64\bin\mysqldump.exe"

# --- HELPER FUNCTION FOR LOGGING ---
function Log-Message {
    param ([string]$Msg, [string]$Level)
    $logEntry = "[$Level] $timestamp - $Msg"
    Write-Host $logEntry
    Add-Content $logFile $logEntry
}

# 1. Create Directory
if (!(Test-Path -Path $BackupPath)) {
    New-Item -ItemType Directory -Force -Path $BackupPath
}

Log-Message "Starting backup process for $DbName..." "INFO"

# 2. Execute Dump
try {
    $dumpOutput = & $mysqldump --host=$DbHost --user=$DbUser --password=$DbPassword --column-statistics=0 --result-file=$fullPath $DbName 2>&1
    
    # If mysqldump failed (Exit Code is not 0), we print the error and stop.
    if ($LASTEXITCODE -ne 0) {
        Log-Message "MYSQLDUMP ERROR: $dumpOutput" "ERROR"
        exit 1
    }
    
    # 3. Validation
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        if ($size -gt 0) {
            Log-Message "SUCCESS: Backup created at $fileName. Size: $size bytes." "INFO"
        } else {
            Log-Message "FAILURE: File created but size is 0 bytes." "ERROR"
            exit 1
        }
    } else {
        Log-Message "FAILURE: Backup file was not created." "ERROR"
        exit 1
    }
} catch {
    Log-Message "CRITICAL ERROR: $($_.Exception.Message)" "ERROR"
    exit 1
}