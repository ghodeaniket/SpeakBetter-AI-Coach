# GitHub Workflows for SpeakBetter AI Coach

This directory contains GitHub Actions workflows for continuous integration and deployment of the SpeakBetter AI Coach application.

## Workflows

### CI (ci.yml)

This workflow runs on every push to main and develop branches, as well as on pull requests to these branches.

It includes the following jobs:
- **Lint**: Runs linting checks on the codebase
- **Build**: Builds all packages in the monorepo
- **Test**: Runs tests for all packages (with some exclusions for expected failures)
- **Report**: Consolidates results and reports status

### React Native (react-native.yml)

This workflow is specifically for the React Native mobile app (packages/mobile).

**Note:** The Android and iOS build jobs are disabled until Phase 4 implementation begins.

It includes the following jobs:
- **Check Mobile Structure**: Verifies the mobile package structure
- **Build Android**: Builds the Android app (disabled until Phase 4)
- **Build iOS**: Builds the iOS app (disabled until Phase 4)

### Deploy (deploy.yml)

This workflow handles deployment to different environments.

It can be triggered:
- Automatically on push to main
- Automatically when a version tag is pushed
- Manually via workflow_dispatch

It includes the following jobs:
- **Prepare**: Determines the target environment
- **Deploy Web**: Deploys the web app to Firebase Hosting
- **Deploy Functions**: Deploys Cloud Functions to Firebase

## Environment Secrets

The following secrets are required:

- **FIREBASE_SERVICE_ACCOUNT**: Service account key for Firebase deployment

## Customization

To customize these workflows:

1. Edit the YAML files in the `.github/workflows` directory
2. Add or modify jobs as needed
3. Update environment variables and secrets in GitHub repository settings
