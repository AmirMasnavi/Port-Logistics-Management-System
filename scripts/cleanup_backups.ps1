param (
    [string]$BackupPath,
    [string]$DbName
)

# --- CONFIGURATION ---
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logFile = Join-Path $BackupPath "retention_policy.log"
$today = Get-Date

# Retention periods
$dailyRetentionDays = 7      # Keep daily backups for last 7 days
$weeklyRetentionDays = 30    # Keep weekly backups for last 30 days (approximately 1 month)
$monthlyRetentionDays = 365  # Keep monthly backups for last 365 days (1 year)

# --- HELPER FUNCTION FOR LOGGING ---
function Log-Message {
    param ([string]$Msg, [string]$Level)
    $logEntry = "[$Level] $timestamp - $Msg"
    Write-Host $logEntry
    Add-Content $logFile $logEntry
}

# --- VALIDATE BACKUP PATH ---
if (!(Test-Path -Path $BackupPath)) {
    Write-Host "ERROR: Backup path does not exist: $BackupPath"
    exit 1
}

Log-Message "Starting backup retention policy enforcement for $DbName..." "INFO"

# --- GET ALL BACKUP FILES ---
$backupFiles = Get-ChildItem -Path $BackupPath -Filter "$($DbName)_*.sql" | Sort-Object CreationTime -Descending

if ($backupFiles.Count -eq 0) {
    Log-Message "No backup files found matching pattern: $($DbName)_*.sql" "WARNING"
    exit 0
}

Log-Message "Found $($backupFiles.Count) backup files to evaluate." "INFO"

# --- CATEGORIZE BACKUPS BY RETENTION PERIOD ---
$backupsToKeep = @()
$backupsToDelete = @()

# Helper function to parse date from filename
function Get-BackupDate {
    param ([string]$FileName)
    try {
        # Expected format: <dbname>_yyyyMMdd.sql
        if ($FileName -match "_(\d{8})\.sql$") {
            $dateStr = $matches[1]
            return [DateTime]::ParseExact($dateStr, "yyyyMMdd", $null)
        }
    } catch {
        return $null
    }
    return $null
}

# --- DAILY RETENTION (Last 7 days) ---
$dailyCutoffDate = $today.AddDays(-$dailyRetentionDays)
$dailyBackups = $backupFiles | Where-Object {
    $backupDate = Get-BackupDate $_.Name
    $backupDate -ne $null -and $backupDate -gt $dailyCutoffDate
}

foreach ($backup in $dailyBackups) {
    $backupsToKeep += $backup
}

Log-Message "Daily retention: Keeping $($dailyBackups.Count) backups from last $dailyRetentionDays days." "INFO"

# --- WEEKLY RETENTION (Last 30 days, excluding daily retention period) ---
$weeklyCutoffDate = $today.AddDays(-$weeklyRetentionDays)
$weeklyBackups = $backupFiles | Where-Object {
    $backupDate = Get-BackupDate $_.Name
    $backupDate -ne $null -and $backupDate -le $dailyCutoffDate -and $backupDate -gt $weeklyCutoffDate
} | Group-Object { 
    $backupDate = Get-BackupDate $_.Name
    # Group by ISO week number and year
    "$($backupDate.Year)-W$(Get-Date $backupDate -UFormat %V)"
} | ForEach-Object {
    # Keep the most recent backup from each week
    $_.Group | Sort-Object CreationTime -Descending | Select-Object -First 1
}

foreach ($backup in $weeklyBackups) {
    if ($backupsToKeep -notcontains $backup) {
        $backupsToKeep += $backup
    }
}

Log-Message "Weekly retention: Keeping $($weeklyBackups.Count) weekly backups." "INFO"

# --- MONTHLY RETENTION (Last 365 days, excluding daily and weekly retention periods) ---
$monthlyBackups = $backupFiles | Where-Object {
    $backupDate = Get-BackupDate $_.Name
    $backupDate -ne $null -and $backupDate -le $weeklyCutoffDate -and $backupDate -gt $today.AddDays(-$monthlyRetentionDays)
} | Group-Object { 
    $backupDate = Get-BackupDate $_.Name
    # Group by year and month
    "$($backupDate.Year)-$($backupDate.Month.ToString('00'))"
} | ForEach-Object {
    # Keep the most recent backup from each month
    $_.Group | Sort-Object CreationTime -Descending | Select-Object -First 1
}

foreach ($backup in $monthlyBackups) {
    if ($backupsToKeep -notcontains $backup) {
        $backupsToKeep += $backup
    }
}

Log-Message "Monthly retention: Keeping $($monthlyBackups.Count) monthly backups." "INFO"

# --- DETERMINE BACKUPS TO DELETE ---
foreach ($backup in $backupFiles) {
    if ($backupsToKeep -notcontains $backup) {
        $backupsToDelete += $backup
    }
}

Log-Message "Total backups to keep: $($backupsToKeep.Count)" "INFO"
Log-Message "Total backups to delete: $($backupsToDelete.Count)" "INFO"

# --- DELETE OLD BACKUPS ---
$deletedCount = 0
$failedCount = 0

foreach ($backup in $backupsToDelete) {
    try {
        $backupDate = Get-BackupDate $backup.Name
        $ageInDays = ($today - $backupDate).Days
        
        Log-Message "Deleting old backup: $($backup.Name) (Age: $ageInDays days, Size: $($backup.Length) bytes)" "INFO"
        
        Remove-Item -Path $backup.FullName -Force
        $deletedCount++
        
        Log-Message "Successfully deleted: $($backup.Name)" "INFO"
    } catch {
        Log-Message "Failed to delete $($backup.Name): $($_.Exception.Message)" "ERROR"
        $failedCount++
    }
}

# --- SUMMARY ---
Log-Message "========================================" "INFO"
Log-Message "Retention policy enforcement completed." "INFO"
Log-Message "Total files evaluated: $($backupFiles.Count)" "INFO"
Log-Message "Files kept: $($backupsToKeep.Count)" "INFO"
Log-Message "Files deleted: $deletedCount" "INFO"
if ($failedCount -gt 0) {
    Log-Message "Failed deletions: $failedCount" "ERROR"
}
Log-Message "========================================" "INFO"

# Exit with error code if there were failures
if ($failedCount -gt 0) {
    exit 1
}

exit 0

