# Contributing to SpeakBetter AI Coach

Thank you for your interest in contributing to the SpeakBetter AI Coach project! This document provides guidelines and instructions for contributing to the codebase.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Pull Request Process](#pull-request-process)
5. [Coding Standards](#coding-standards)
6. [Commit Guidelines](#commit-guidelines)
7. [Package Structure](#package-structure)
8. [Testing](#testing)
9. [Documentation](#documentation)
10. [Resources](#resources)

## Code of Conduct

We expect all contributors to follow our Code of Conduct. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) to understand what actions will and will not be tolerated.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- For iOS development: Xcode and CocoaPods
- For Android development: Android Studio and JDK 11

### Setup

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/speakbetter-ai-coach.git
   cd speakbetter-ai-coach
   ```
3. Add the original repository as a remote to keep your fork up to date:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/speakbetter-ai-coach.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Monorepo Structure

SpeakBetter AI Coach uses a monorepo structure with the following packages:

- `packages/core`: Core business logic and models
- `packages/api`: API client implementations
- `packages/ui`: Shared UI component interfaces
- `packages/state`: Shared state management
- `packages/web`: Web implementation
- `packages/mobile`: React Native implementation
- `apps/web-app`: Web application entry point
- `apps/mobile-app`: Mobile application entry point

### Running the Application

#### Web App

```bash
# Start web development server
npm run dev:web
```

#### Mobile App

```bash
# Start Metro bundler
npm run dev:mobile

# Run on iOS
cd apps/mobile-app && npm run ios

# Run on Android
cd apps/mobile-app && npm run android
```

### Making Changes

1. Identify which package(s) need to be modified.
2. For significant changes, create an issue first to discuss the approach.
3. Make your changes following the code style guidelines.
4. Add tests for your changes.
5. Update documentation if necessary.

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Pull Request Process

1. **Create a Feature Branch**: Create a branch from `main` for your feature or bugfix.

2. **Make Your Changes**: Implement your changes, following the coding standards.

3. **Add Tests**: Add tests for your changes to maintain code quality.

4. **Run Tests**: Make sure all tests pass before submitting your PR.

   ```bash
   npm run test
   ```

5. **Update Documentation**: Update any relevant documentation.

6. **Commit Your Changes**: Follow the commit message guidelines.

7. **Push to Your Fork**: Push your changes to your fork on GitHub.

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Submit a Pull Request**: Create a PR against the `main` branch of the original repository.

9. **PR Review**: Address any feedback from code reviewers.

10. **Merge**: Once approved, a maintainer will merge your PR.

## Coding Standards

### TypeScript

- Use TypeScript for all code.
- Define proper interfaces and types.
- Avoid using `any` type where possible.
- Use readonly properties when appropriate.

### React / React Native

- Use functional components with hooks.
- Keep components small and focused.
- Use proper prop typing.
- Follow platform-specific design patterns.

### File Structure

- Group files by feature or domain.
- Use consistent naming conventions.
- Keep related files together.

### Code Formatting

This project uses ESLint and Prettier for code formatting. Make sure your code passes linting before submitting a PR.

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```
feat(web): add speech analysis visualization

feat(mobile): implement audio recording on iOS

fix(api): resolve authentication token expiration issue

docs: update README with setup instructions

test(core): add tests for speech analysis service
```

## Package Structure

When contributing to a specific package, follow the established structure:

### Core Package

```
core/
├── src/
│   ├── models/       # Data models
│   ├── services/     # Service interfaces
│   ├── utils/        # Utility functions
│   ├── validation/   # Validation logic
│   └── index.ts      # Entry point
├── tests/            # Unit tests
└── README.md         # Package documentation
```

### API Package

```
api/
├── src/
│   ├── firebase/     # Firebase implementations
│   ├── speech/       # Speech service implementations
│   ├── storage/      # Storage adapters
│   └── index.ts      # Entry point
├── tests/            # Unit tests
└── README.md         # Package documentation
```

### UI Package

```
ui/
├── src/
│   ├── components/   # UI component interfaces
│   ├── theming/      # Theme definitions
│   ├── hooks/        # UI-related hooks
│   └── index.ts      # Entry point
├── tests/            # Unit tests
└── README.md         # Package documentation
```

### Adding a New Package

If you need to create a new package:

1. Create the package structure following the existing patterns.
2. Add the package to the workspace in the root `package.json`.
3. Set up proper dependencies and build configuration.
4. Add documentation for the package.

## Testing

### Writing Tests

- Write unit tests for all non-trivial code.
- Use integration tests for component interactions.
- Write end-to-end tests for critical user flows.

### Running Tests

```bash
# Run tests for all packages
npm run test

# Run tests for a specific package
cd packages/core && npm run test

# Run tests with coverage
npm run test -- --coverage
```

See [testing.md](testing.md) for detailed testing guidelines.

## Documentation

### Code Documentation

- Use JSDoc comments for functions, classes, and interfaces.
- Document complex algorithms and business logic.
- Add inline comments for non-obvious code sections.

### Package Documentation

- Each package should have a README.md file.
- Document the package's purpose, usage, and API.
- Include examples where appropriate.

### Project Documentation

- Update the main README.md for significant changes.
- Update documentation in the `docs/` directory.
- Document any new features or changes in behavior.

## Resources

- [Monorepo Documentation](./docs/architecture.md)
- [Development Guide](./docs/development-guide.md)
- [API Documentation](./docs/api.md)
- [Testing Guide](./docs/testing.md)

---

Thank you for contributing to SpeakBetter AI Coach! Your efforts help improve the application for everyone.
