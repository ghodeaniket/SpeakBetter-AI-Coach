# SpeakBetter Scripts

This directory contains utility scripts for the SpeakBetter AI Coach application.

## Available Scripts

### prepare-env.sh

Securely prepares environment files for deployment in CI/CD pipelines.

#### Usage

```bash
./prepare-env.sh [development|production]
```

#### Description

This script creates environment files using variables from the CI/CD environment. It's designed to be used in CI/CD pipelines to securely inject sensitive configuration without storing it in version control.

#### Required Environment Variables

The following environment variables must be set in the CI/CD environment:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `GOOGLE_CLOUD_API_KEY`
- `API_URL`

#### Example GitHub Actions Workflow

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup environment
        run: ./scripts/prepare-env.sh production
        env:
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
          GOOGLE_CLOUD_API_KEY: ${{ secrets.GOOGLE_CLOUD_API_KEY }}
          API_URL: ${{ secrets.PROD_API_URL }}
```
