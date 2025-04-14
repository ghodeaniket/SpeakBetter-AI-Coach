# SpeakBetter AI Coach: Documentation Cleanup Guide

## Overview

This document identifies outdated documentation in the project and provides guidance on which documents to reference for current information.

## Outdated Documentation

The following documents contain outdated information and should be considered legacy references only:

1. **ARCHITECTURE_README.md** (Root directory)

   - Contains information about an older architecture that uses a feature-based folder structure
   - References direct Google Cloud API integration instead of the newer monorepo architecture
   - Superseded by: `docs/architecture.md`

2. **TESTING.md** (Root directory)

   - Focuses specifically on testing Firebase Extensions integration
   - Contains outdated testing instructions for components that may no longer exist
   - Superseded by: `docs/testing.md`

3. **UI_ENHANCEMENTS.md** (Root directory)

   - Planning document from April 2023
   - Contains UI enhancement plans that have since been implemented
   - No direct replacement; refer to current UI implementation

4. **DIRECT_API_INTEGRATION.md** (Root directory)

   - Describes the integration approach prior to the monorepo architecture
   - Superseded by the API services in the `packages/api` directory and `docs/api.md`

5. **MANUAL_TESTING.md** (Root directory)
   - Contains manual testing instructions for the pre-monorepo architecture
   - Superseded by the automated testing approach documented in `docs/testing.md`

## Current Documentation Structure

All current documentation is maintained in the `/docs` directory:

- `architecture.md`: Current monorepo architecture documentation
- `api.md`: API service documentation
- `development-guide.md`: Development workflow and guidelines
- `testing.md`: Comprehensive testing strategy and guidelines
- `contributing.md`: Contribution guidelines

## Moving Forward

When updating or adding documentation:

1. Always place new documentation in the `/docs` directory
2. Maintain package-specific README.md files within each package
3. Keep the root README.md updated with links to current documentation
4. When documents become outdated, move them to `docs/archive/legacy` instead of deleting

## Document Migration Plan

### Phase 1 (Completed)

The following files have been moved to the archive:

```bash
mv ARCHITECTURE_README.md docs/archive/legacy/
mv TESTING.md docs/archive/legacy/
mv UI_ENHANCEMENTS.md docs/archive/legacy/
mv DIRECT_API_INTEGRATION.md docs/archive/legacy/
mv MANUAL_TESTING.md docs/archive/legacy/
mv API_BOUNDARIES.md docs/archive/legacy/
```

### Phase 2 (Completed)

Additional files moved to the archive:

```bash
mv API_CREDENTIALS_SETUP.md docs/archive/legacy/
mv CONTRIBUTING.md docs/archive/legacy/
mv PHASE_7_TESTING_PLAN.md docs/archive/legacy/
mv STYLE_GUIDE.md docs/archive/legacy/
```

Integration stubs created for important content:

- `docs/api-credentials.md` - Summarizes API credential setup with links to archived details
- `docs/style-guide.md` - References coding standards with link to archived full style guide

### Files Maintained in Root Directory

The following files are kept in the root directory as they contain current, actionable information:

- `KNOWN_ISSUES.md` - Current list of known issues and workarounds
- `LAUNCH_CHECKLIST.md` - Active checklist for the upcoming launch

The root README.md has been updated to point to current documentation.
