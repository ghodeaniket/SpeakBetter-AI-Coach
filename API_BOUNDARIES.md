# SpeakBetter AI Coach: API Boundaries

This document outlines the boundaries and interactions between packages in the SpeakBetter AI Coach monorepo.

## Package Responsibilities

### @speakbetter/core

Responsible for:
- Defining data models and interfaces used across the application
- Providing service interfaces that define the contract for implementation
- Offering shared utility functions for common tasks
- Implementing validation logic that is platform-agnostic

This package does NOT:
- Implement service interfaces
- Contain platform-specific code
- Depend on any other package in the monorepo

### @speakbetter/api

Responsible for:
- Implementing the service interfaces defined in @speakbetter/core
- Handling API communication with external services
- Providing platform-specific adapters for service implementations
- Managing authentication and authorization with external services

This package depends on:
- @speakbetter/core (for interfaces and models)

### @speakbetter/ui

Responsible for:
- Defining shared UI component interfaces
- Implementing platform-agnostic UI components
- Providing a shared design system
- Implementing UI-related custom hooks

This package depends on:
- @speakbetter/core (for models and utilities)

### @speakbetter/web

Responsible for:
- Implementing the web application UI
- Providing web-specific adapters for services
- Managing web-specific functionality and routing
- Integrating the shared components with web-specific features

This package depends on:
- @speakbetter/core (for models, services, and utilities)
- @speakbetter/api (for API implementations)
- @speakbetter/ui (for shared UI components)

### @speakbetter/mobile

Responsible for:
- Implementing the mobile application UI
- Providing mobile-specific adapters for services
- Managing mobile-specific functionality and navigation
- Integrating shared components with mobile-specific features

This package depends on:
- @speakbetter/core (for models, services, and utilities)
- @speakbetter/api (for API implementations)
- @speakbetter/ui (for shared UI components)

## Dependency Flow

The dependencies should flow in one direction:

```
@speakbetter/web   @speakbetter/mobile
       ↓                  ↓
@speakbetter/api  @speakbetter/ui
       ↓                  ↓
          @speakbetter/core
```

## Communication Patterns

### Service Implementation

1. Service interfaces are defined in @speakbetter/core
2. Service implementations are provided in @speakbetter/api
3. Web and mobile applications consume the implementations from @speakbetter/api

Example:

```typescript
// In @speakbetter/core/src/services/auth.ts
export interface AuthService {
  signIn(): Promise<User | null>;
  // ...
}

// In @speakbetter/api/src/firebase/auth.ts
export class FirebaseAuthService implements AuthService {
  signIn(): Promise<User | null> {
    // Implementation
  }
  // ...
}

// In @speakbetter/web/src/app.tsx
import { FirebaseAuthService } from '@speakbetter/api';

const authService = new FirebaseAuthService();
// Use the service
```

### UI Component Implementation

1. Component interfaces are defined in @speakbetter/ui
2. Base implementations are provided in @speakbetter/ui
3. Platform-specific adaptations are made in @speakbetter/web and @speakbetter/mobile

Example:

```typescript
// In @speakbetter/ui/src/components/button.tsx
export interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  // Base implementation
};

// In @speakbetter/web/src/components/button.tsx
import { Button as BaseButton, ButtonProps } from '@speakbetter/ui';

export const Button: React.FC<ButtonProps & { webSpecificProp?: string }> = (props) => {
  // Web-specific adaptation
  return <BaseButton {...props} />;
};
```

## Cross-Package Communication

### Events and State Management

For cross-package communication, we use a combination of:

1. **Service interfaces**: For direct method calls
2. **Callbacks**: For notification of specific events
3. **Adapters**: For platform-specific implementations

### Error Handling

Errors should be handled at the appropriate level:

1. **Service implementations**: Handle API-specific errors and translate them to domain errors
2. **Application code**: Handle domain errors and present them to the user

Example:

```typescript
// In @speakbetter/api/src/speech/googleSpeech.ts
export class GoogleSpeechService implements SpeechService {
  async transcribeAudio(audioBlob: Blob): Promise<SpeechAnalysisResult> {
    try {
      // API call
    } catch (error) {
      if (error.code === 'QUOTA_EXCEEDED') {
        throw new Error('Speech recognition quota exceeded');
      }
      throw new Error('Failed to transcribe audio');
    }
  }
}

// In @speakbetter/web/src/features/speech/components/recorder.tsx
try {
  const result = await speechService.transcribeAudio(audioBlob);
  // Handle result
} catch (error) {
  // Present error to user
}
```

## Testing Boundaries

When testing across package boundaries:

1. **Unit tests**: Test package functionality in isolation using mocks for dependencies
2. **Integration tests**: Test interactions between packages
3. **End-to-end tests**: Test complete user flows across all packages

Example:

```typescript
// Unit test for SpeechService implementation
describe('GoogleSpeechService', () => {
  it('transcribes audio correctly', async () => {
    const service = new GoogleSpeechService();
    const mockBlob = new Blob();
    
    // Mock the Google API client
    service.client.recognize = jest.fn().mockResolvedValue({
      results: [{
        alternatives: [{
          transcript: 'Hello world',
        }]
      }]
    });
    
    const result = await service.transcribeAudio(mockBlob);
    
    expect(result.transcription).toBe('Hello world');
  });
});
```
