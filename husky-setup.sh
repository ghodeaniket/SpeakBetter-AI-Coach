#!/bin/bash
# This script should be run after cloning the repository to set up Husky

# Create Husky directory if it doesn't exist
mkdir -p .husky

# Create the pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
EOF

# Make the pre-commit hook executable
chmod +x .husky/pre-commit

echo "Husky pre-commit hook has been set up successfully."
