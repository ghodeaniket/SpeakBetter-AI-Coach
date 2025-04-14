#!/bin/bash

# Script to move additional outdated documentation to the archive folder

# Ensure archive directory exists
mkdir -p docs/archive/legacy

# List of documentation files to move
outdated_files=(
  "API_CREDENTIALS_SETUP.md"
  "CONTRIBUTING.md"
  "PHASE_7_TESTING_PLAN.md"
  "STYLE_GUIDE.md"
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

# Create integration stubs in docs directory for key content
echo "Creating integration stubs for important content..."

# Create stub for API Credentials in the docs folder
cat > docs/api-credentials.md << 'EOL'
# API Credentials Setup

This document provides guidance on setting up API credentials for the SpeakBetter AI Coach application.

## Google Cloud API Credentials

The SpeakBetter AI Coach uses Google Cloud APIs for speech processing. For detailed setup instructions, refer to the archived [API_CREDENTIALS_SETUP.md](./archive/legacy/API_CREDENTIALS_SETUP.md).

Key points:

1. **Required APIs**:
   - Speech-to-Text API
   - Text-to-Speech API

2. **Credential Options**:
   - For development: API keys with appropriate restrictions
   - For production: Service accounts with minimal permissions

3. **Environment Configuration**:
   - Web: Configure in `.env.local` files
   - Mobile: Configure in appropriate environment files

See the [Development Guide](./development-guide.md) for more detailed setup instructions.
EOL

# Create stub for Style Guide in the docs folder
cat > docs/style-guide.md << 'EOL'
# SpeakBetter AI Coach - Style Guide

This document provides a reference to the coding style and conventions used in the SpeakBetter AI Coach project.

For the complete style guide, refer to the archived [STYLE_GUIDE.md](./archive/legacy/STYLE_GUIDE.md).

## Code Style Summary

- **TypeScript**: Use strict typing with interfaces for object shapes
- **Components**: Functional components with explicit prop interfaces
- **File Structure**: Feature-based organization
- **Naming**: PascalCase for components, camelCase for functions and variables
- **Testing**: Jest for unit tests, component testing with appropriate libraries

For detailed contributing guidelines, see [Contributing Guide](./contributing.md).
EOL

echo "Documentation reorganization complete."
