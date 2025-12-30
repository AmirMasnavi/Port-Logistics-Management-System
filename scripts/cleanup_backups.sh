#!/bin/bash

# Database Backup Retention Management Script
# Implements retention policy:
# - Daily backups: last 7 days
# - Weekly backups: last 30 days
# - Monthly backups: last 365 days

# --- CONFIGURATION ---
BACKUP_PATH=""
DB_NAME=""
DAILY_RETENTION_DAYS=7
WEEKLY_RETENTION_DAYS=30
MONTHLY_RETENTION_DAYS=365

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup-path)
            BACKUP_PATH="$2"
            shift 2
            ;;
        --db-name)
            DB_NAME="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 --backup-path <path> --db-name <name>"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$BACKUP_PATH" ]] || [[ -z "$DB_NAME" ]]; then
    echo "ERROR: Missing required parameters"
    echo "Usage: $0 --backup-path <path> --db-name <name>"
    exit 1
fi

# Validate backup path exists
if [[ ! -d "$BACKUP_PATH" ]]; then
    echo "ERROR: Backup path does not exist: $BACKUP_PATH"
    exit 1
fi

LOG_FILE="$BACKUP_PATH/retention_policy.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TODAY=$(date '+%s')

# --- LOGGING FUNCTION ---
log_message() {
    local level=$1
    local message=$2
    local log_entry="[$level] $TIMESTAMP - $message"
    echo "$log_entry"
    echo "$log_entry" >> "$LOG_FILE"
}

log_message "INFO" "Starting backup retention policy enforcement for $DB_NAME..."

# --- FIND ALL BACKUP FILES ---
BACKUP_FILES=()
while IFS= read -r -d '' file; do
    BACKUP_FILES+=("$file")
done < <(find "$BACKUP_PATH" -maxdepth 1 -name "${DB_NAME}_*.sql" -type f -print0 | sort -z)

if [[ ${#BACKUP_FILES[@]} -eq 0 ]]; then
    log_message "WARNING" "No backup files found matching pattern: ${DB_NAME}_*.sql"
    exit 0
fi

log_message "INFO" "Found ${#BACKUP_FILES[@]} backup files to evaluate."

# --- HELPER FUNCTION: Extract date from filename ---
get_backup_date() {
    local filename=$(basename "$1")
    # Expected format: <dbname>_yyyyMMdd.sql
    if [[ $filename =~ _([0-9]{8})\.sql$ ]]; then
        local date_str="${BASH_REMATCH[1]}"
        # Convert yyyyMMdd to epoch timestamp - using gdate if available, otherwise date
        if command -v gdate &> /dev/null; then
            gdate -d "$date_str" "+%s" 2>/dev/null || echo "0"
        else
            # macOS date format
            local year="${date_str:0:4}"
            local month="${date_str:4:2}"
            local day="${date_str:6:2}"
            date -j -f "%Y%m%d" "$date_str" "+%s" 2>/dev/null || echo "0"
        fi
    else
        echo "0"
    fi
}

# --- HELPER FUNCTION: Get week number ---
get_week_key() {
    local timestamp=$1
    if command -v gdate &> /dev/null; then
        gdate -d "@$timestamp" "+%Y-W%V" 2>/dev/null || echo ""
    else
        date -r "$timestamp" "+%Y-W%V" 2>/dev/null || echo ""
    fi
}

# --- HELPER FUNCTION: Get month key ---
get_month_key() {
    local timestamp=$1
    if command -v gdate &> /dev/null; then
        gdate -d "@$timestamp" "+%Y-%m" 2>/dev/null || echo ""
    else
        date -r "$timestamp" "+%Y-%m" 2>/dev/null || echo ""
    fi
}

# Temporary files to track backups (instead of associative arrays)
KEEP_FILE=$(mktemp)
WEEKLY_FILE=$(mktemp)
MONTHLY_FILE=$(mktemp)

# Calculate cutoff dates (in epoch seconds)
DAILY_CUTOFF=$((TODAY - (DAILY_RETENTION_DAYS * 86400)))
WEEKLY_CUTOFF=$((TODAY - (WEEKLY_RETENTION_DAYS * 86400)))
MONTHLY_CUTOFF=$((TODAY - (MONTHLY_RETENTION_DAYS * 86400)))

DAILY_COUNT=0
WEEKLY_COUNT=0
MONTHLY_COUNT=0

# --- PROCESS EACH BACKUP FILE ---
for backup_file in "${BACKUP_FILES[@]}"; do
    backup_date=$(get_backup_date "$backup_file")
    
    if [[ "$backup_date" == "0" ]]; then
        log_message "WARNING" "Could not parse date from filename: $(basename "$backup_file")"
        continue
    fi
    
    # DAILY RETENTION (last 7 days)
    if [[ $backup_date -gt $DAILY_CUTOFF ]]; then
        echo "$backup_file" >> "$KEEP_FILE"
        DAILY_COUNT=$((DAILY_COUNT + 1))
    
    # WEEKLY RETENTION (8-30 days ago)
    elif [[ $backup_date -gt $WEEKLY_CUTOFF ]]; then
        week_key=$(get_week_key "$backup_date")
        echo "$week_key|$backup_date|$backup_file" >> "$WEEKLY_FILE"
    
    # MONTHLY RETENTION (31-365 days ago)
    elif [[ $backup_date -gt $MONTHLY_CUTOFF ]]; then
        month_key=$(get_month_key "$backup_date")
        echo "$month_key|$backup_date|$backup_file" >> "$MONTHLY_FILE"
    fi
done

# Process weekly backups - keep most recent per week
if [[ -f "$WEEKLY_FILE" ]] && [[ -s "$WEEKLY_FILE" ]]; then
    sort -t'|' -k1,1 -k2,2nr "$WEEKLY_FILE" | awk -F'|' '!seen[$1]++ {print $3}' >> "$KEEP_FILE"
    WEEKLY_COUNT=$(sort -t'|' -k1,1 -k2,2nr "$WEEKLY_FILE" | awk -F'|' '!seen[$1]++' | wc -l | tr -d ' ')
fi

# Process monthly backups - keep most recent per month
if [[ -f "$MONTHLY_FILE" ]] && [[ -s "$MONTHLY_FILE" ]]; then
    sort -t'|' -k1,1 -k2,2nr "$MONTHLY_FILE" | awk -F'|' '!seen[$1]++ {print $3}' >> "$KEEP_FILE"
    MONTHLY_COUNT=$(sort -t'|' -k1,1 -k2,2nr "$MONTHLY_FILE" | awk -F'|' '!seen[$1]++' | wc -l | tr -d ' ')
fi

log_message "INFO" "Daily retention: Keeping $DAILY_COUNT backups from last $DAILY_RETENTION_DAYS days."
log_message "INFO" "Weekly retention: Keeping $WEEKLY_COUNT weekly backups."
log_message "INFO" "Monthly retention: Keeping $MONTHLY_COUNT monthly backups."

TOTAL_KEEP=$(cat "$KEEP_FILE" | wc -l | tr -d ' ')
log_message "INFO" "Total backups to keep: $TOTAL_KEEP"

# --- DELETE OLD BACKUPS ---
DELETED_COUNT=0
FAILED_COUNT=0

for backup_file in "${BACKUP_FILES[@]}"; do
    if ! grep -Fxq "$backup_file" "$KEEP_FILE"; then
        backup_date=$(get_backup_date "$backup_file")
        age_days=$(( (TODAY - backup_date) / 86400 ))
        file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
        
        log_message "INFO" "Deleting old backup: $(basename "$backup_file") (Age: $age_days days, Size: $file_size bytes)"
        
        if rm -f "$backup_file" 2>/dev/null; then
            DELETED_COUNT=$((DELETED_COUNT + 1))
            log_message "INFO" "Successfully deleted: $(basename "$backup_file")"
        else
            FAILED_COUNT=$((FAILED_COUNT + 1))
            log_message "ERROR" "Failed to delete: $(basename "$backup_file")"
        fi
    fi
done

# Cleanup temporary files
rm -f "$KEEP_FILE" "$WEEKLY_FILE" "$MONTHLY_FILE"

# --- SUMMARY ---
KEPT_COUNT=$((${#BACKUP_FILES[@]} - DELETED_COUNT - FAILED_COUNT))
log_message "INFO" "========================================"
log_message "INFO" "Retention policy enforcement completed."
log_message "INFO" "Total files evaluated: ${#BACKUP_FILES[@]}"
log_message "INFO" "Files kept: $KEPT_COUNT"
log_message "INFO" "Files deleted: $DELETED_COUNT"
if [[ $FAILED_COUNT -gt 0 ]]; then
    log_message "ERROR" "Failed deletions: $FAILED_COUNT"
fi
log_message "INFO" "========================================"

# Exit with error code if there were failures
if [[ $FAILED_COUNT -gt 0 ]]; then
    exit 1
fi

exit 0

