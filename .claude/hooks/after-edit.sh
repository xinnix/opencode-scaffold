#!/bin/bash
# Hook: after-edit
# Description: Runs after Claude edits a file
# Environment: FILE_PATH is available

# Auto-format based on file type
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx)
    # Run prettier formatting if available (in respective app directory)
    if command -v npx &> /dev/null; then
      # Determine which app directory we're in
      if [[ "$FILE_PATH" == apps/admin/* ]]; then
        (cd apps/admin && npx prettier --write "../$FILE_PATH" 2>/dev/null || true)
      elif [[ "$FILE_PATH" == apps/api/* ]]; then
        (cd apps/api && npx prettier --write "../$FILE_PATH" 2>/dev/null || true)
      elif [[ "$FILE_PATH" == packages/* ]]; then
        # For packages, run from root
        npx prettier --write "$FILE_PATH" 2>/dev/null || true
      fi
    fi
    ;;
  *.json)
    # Format JSON files
    if command -v jq &> /dev/null; then
      jq '.' < "$FILE_PATH" > "$FILE_PATH.tmp" && mv "$FILE_PATH.tmp" "$FILE_PATH"
    fi
    ;;
esac

exit 0
