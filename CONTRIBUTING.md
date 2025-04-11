# Contributing to SpeakBetter AI Coach

This guide will help you set up and contribute to the SpeakBetter AI Coach project effectively.

## Monorepo Structure

SpeakBetter AI Coach is structured as a monorepo using Turborepo. The key directories are:

- **packages/**: Contains the core packages that make up the application
  - **core/**: Platform-agnostic shared business logic and services
  - **api/**: API client implementations
  - **ui/**: Shared UI components and design system
  - **web/**: Web application
  - **mobile/**: React Native mobile application
- **apps/**: Contains the deployable applications
  - **web-app/**: Web app entry point
  - **mobile-app/**: Mobile app entry point

## Development Environment Setup

### Prerequisites

- Node.js 18 or later
- npm 8 or later
- Docker and Docker Compose (for containerized development)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/speakbetter-ai-coach.git
   cd speakbetter-ai-coach
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Husky pre-commit hooks:
   ```
   npm run prepare
   ```

### Development Workflow

#### Running the Development Server

You can start the development servers for all packages with:

```
npm run dev
```

To start a specific workspace:

```
npm run dev -- --workspace=@speakbetter/web
```

#### Building Packages

To build all packages:

```
npm run build
```

To build specific packages:

```
npm run build -- --filter=@speakbetter/core
```

#### Running Tests

To run all tests:

```
npm run test
```

To run tests for a specific package:

```
npm run test -- --workspace=@speakbetter/core
```

### Using Docker for Development

The project includes Docker configuration for consistent development environments.

To start the development environment:

```
docker-compose up
```

## Package Development Guidelines

### Core Package

The `@speakbetter/core` package contains platform-agnostic business logic and services.

- Models: Shared data models and interfaces
- Services: Service interfaces
- Utils: Utility functions
- Validation: Data validation functions

When adding functionality to `@speakbetter/core`:

1. Define interfaces first
2. Write tests for the functionality
3. Implement the functionality
4. Update exports in index files

### API Package

The `@speakbetter/api` package contains API client implementations.

- Firebase: Firebase client implementations
- Speech: Speech processing API clients
- Storage: Storage API clients

### UI Package

The `@speakbetter/ui` package contains shared UI components and design system.

- Components: Platform-agnostic component definitions
- Theming: Shared design system
- Hooks: UI-related hooks

## Coding Standards

### TypeScript

- Always use proper types
- Avoid the `any` type where possible
- Use interfaces for object shapes
- Use type guards for runtime type checking

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic to custom hooks
- Use proper prop types with TypeScript interfaces

### Testing

- Write unit tests for all utilities and services
- Test components with React Testing Library
- Aim for at least 80% test coverage for critical code

## Git Workflow

1. Create a feature branch from `main`: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Commit your changes using conventional commit messages
6. Push to your branch: `git push origin feature/your-feature-name`
7. Create a pull request to `main`

### Commit Message Format

We follow the Conventional Commits specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that don't affect code functionality
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(core): add user validation functions
```

## Documentation

- Document all public functions and interfaces with JSDoc comments
- Keep README files up to date for each package
- Add examples for non-trivial functionality

## Questions and Support

If you have any questions, please reach out to the project maintainers.
