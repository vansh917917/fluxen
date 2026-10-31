#!/bin/bash
set -e

BACKUP_DIR="/home/ubuntu/backups"
DB_PATH="/home/ubuntu/fluxen/server/fluxen.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/fluxen_${TIMESTAMP}.db"

mkdir -p "${BACKUP_DIR}"

if [ -f "${DB_PATH}" ]; then
  # Safe backup using sqlite3 CLI if available, otherwise direct copy
  if command -v sqlite3 &> /dev/null; then
    sqlite3 "${DB_PATH}" ".backup '${BACKUP_FILE}'"
  else
    cp "${DB_PATH}" "${BACKUP_FILE}"
  fi
  echo "Backup created: ${BACKUP_FILE}"

  # Keep only backups from the last 14 days
  find "${BACKUP_DIR}" -type f -name "fluxen_*.db" -mtime +14 -delete
else
  echo "Database file not found at ${DB_PATH}"
fi
