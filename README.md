# SpeakBetter AI Coach

SpeakBetter AI Coach is an innovative application that provides real-time AI-powered speech coaching to help users improve their communication skills.

## Project Structure

This project uses a monorepo architecture with Turborepo to manage multiple packages:

```
speakbetter/
├── packages/           # Shared packages
│   ├── core/           # Core business logic and data models
│   │   ├── models/       # Data models and interfaces
│   │   ├── services/     # Service interfaces and shared implementations
│   │   ├── utils/        # Shared utilities
│   │   └── validation/   # Data validation
│   ├── ui/             # Shared UI component interfaces
│   │   ├── components/   # Platform-agnostic component definitions
│   │   ├── theming/      # Shared design system
│   │   └── hooks/        # UI-related hooks
│   ├── api/            # API client implementations
│   │   ├── firebase/     # Firebase clients
│   │   ├── speech/       # Speech processing API clients
│   │   └── storage/      # Data storage interfaces
│   ├── state/          # Shared state management
│   │   ├── auth/         # Authentication state
│   │   ├── user/         # User profile state
│   │   ├── sessions/     # Session management state
│   │   └── speech/       # Speech analysis state
│   ├── web/            # Web-specific implementation
│   │   ├── adapters/     # Platform-specific adapters
│   │   ├── components/   # Web-specific components
│   │   └── features/     # Web feature implementations
│   └── mobile/         # React Native implementation
│       ├── adapters/     # Platform-specific adapters
│       ├── components/   # Mobile-specific components
│       └── screens/      # Mobile screens
└── apps/
    ├── web-app/        # Web app entry point and build configuration
    └── mobile-app/     # Mobile app entry point and build configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- For mobile: iOS/Android development environment

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/speakbetter-ai-coach.git
cd speakbetter-ai-coach

# Install dependencies
npm install
```

### Development

```bash
# Start web development server
npm run dev:web

# Start mobile development server
npm run dev:mobile

# Run tests
npm run test

# Build all packages
npm run build
```

## Architecture

SpeakBetter AI Coach follows a shared-code architecture with platform-specific implementations:

- **Core Package**: Contains platform-agnostic business logic, data models, and service interfaces
- **API Package**: Implements service interfaces for various backends (Firebase, Google Cloud, etc.)
- **UI Package**: Provides shared component interfaces and theming
- **State Package**: Manages application state using Zustand
- **Web/Mobile Packages**: Implement platform-specific UI components and adapters
- **App Packages**: Provide entry points and environment-specific configuration

## Documentation

All current documentation is maintained in the `/docs` directory:

- [Architecture Documentation](./docs/architecture.md) - Monorepo structure and design patterns
- [Development Guide](./docs/development-guide.md) - Setup and workflow instructions
- [API Documentation](./docs/api.md) - Service interfaces and implementations
- [Testing Guide](./docs/testing.md) - Testing strategy and guidelines
- [Contributing Guidelines](./docs/contributing.md) - Contribution workflow

Each package also contains its own README.md with specific implementation details:

- [Core Package](./packages/core/README.md) - Business logic and data models
- [API Package](./packages/api/README.md) - Service implementations
- [UI Package](./packages/ui/README.md) - Shared UI components
- [State Package](./packages/state/README.md) - State management
- [Web Package](./packages/web/README.md) - Web implementation
- [Mobile Package](./packages/mobile/README.md) - React Native implementation

> Note: Some older documentation files have been archived. See [Documentation Cleanup Guide](./docs/DOCUMENTATION_CLEANUP.md) for details.

## Contributing

We welcome contributions to SpeakBetter AI Coach! Here's how you can help:

1. **Explore the Issues**: Check out open issues to find something you'd like to work on
2. **Follow the Development Workflow**: Read our [Development Guide](./docs/development-guide.md) to get started
3. **Understand the Architecture**: Review the [Architecture Documentation](./docs/architecture.md) to understand how things work
4. **Test Thoroughly**: Follow our [Testing Guide](./docs/testing.md) for best practices
5. **Submit Pull Requests**: Follow our [Contributing Guidelines](./docs/contributing.md) for details on our code of conduct and the PR process

We value cross-platform compatibility, high-quality code, and comprehensive tests!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
