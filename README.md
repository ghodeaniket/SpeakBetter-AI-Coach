# SpeakBetter AI Coach

SpeakBetter AI Coach is an innovative cross-platform application that provides real-time AI-powered speech coaching to help users improve their communication skills.

## Monorepo Structure

This project uses a Turborepo monorepo structure to manage multiple packages:

```
speakbetter/
├── packages/
│   ├── core/       # Shared business logic
│   ├── ui/         # Shared UI component interfaces
│   ├── api/        # API client implementations
│   ├── web/        # Web application (React)
│   └── mobile/     # Mobile application (React Native)
└── apps/
    ├── web-app/    # Web app entry point
    └── mobile-app/ # Mobile app entry point
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)
- Docker and Docker Compose (for containerized development)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/speakbetter-ai-coach.git
   cd speakbetter-ai-coach
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build all packages:
   ```
   npm run build
   ```

### Development

#### Using Docker (recommended)

Start the development environment with Docker:

```
docker-compose up
```

This will start both the web and mobile development servers.

#### Local Development

Start the development server for the web application:

```
npm run dev -- --workspace=@speakbetter/web
```

Start the development server for the mobile application:

```
npm run dev -- --workspace=@speakbetter/mobile
```

## Package Structure

### @speakbetter/core

Contains shared business logic, service interfaces, and data models.

### @speakbetter/ui

Contains shared UI components, hooks, and theming that work across platforms.

### @speakbetter/api

Contains API client implementations for Firebase, speech services, and storage.

### @speakbetter/web

The web application built with React and Material UI.

### @speakbetter/mobile

The mobile application built with React Native.

## Commands

- `npm run dev`: Start all development servers
- `npm run build`: Build all packages
- `npm run lint`: Lint all packages
- `npm run test`: Run tests for all packages
- `npm run clean`: Clean build artifacts

## Docker Development

The project includes Docker configuration for consistent development environments:

- `docker-compose up web`: Start only the web development environment
- `docker-compose up mobile`: Start only the mobile development environment
- `docker-compose up`: Start both environments

## Contributing

Please refer to our contributing guidelines for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
