#!/bin/bash

# Script to move outdated documentation to the archive folder

# Create archive directory if it doesn't exist
mkdir -p docs/archive/legacy

# List of outdated documentation files to move
outdated_files=(
  "ARCHITECTURE_README.md"
  "TESTING.md"
  "UI_ENHANCEMENTS.md"
  "DIRECT_API_INTEGRATION.md"
  "MANUAL_TESTING.md"
  "API_BOUNDARIES.md"
)

# Move each file to the archive
for file in "${outdated_files[@]}"; do
  if [ -f "$file" ]; then
    echo "Moving $file to docs/archive/legacy/"
    mv "$file" docs/archive/legacy/
  else
    echo "File $file not found, skipping"
  fi
done

echo "Documentation cleanup complete. See docs/DOCUMENTATION_CLEANUP.md for details."
