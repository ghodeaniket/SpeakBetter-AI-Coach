# @speakbetter/ui

Shared UI component interfaces for SpeakBetter AI Coach.

## Overview

This package provides platform-agnostic UI component interfaces and theming:

- Component interfaces that can be implemented across platforms
- Shared design system with colors, typography, and spacing
- UI-related hooks
- Theme provider

## Directory Structure

```
ui/
├── src/
│   ├── components/    # Platform-agnostic component interfaces
│   ├── theming/       # Shared design system
│   ├── hooks/         # UI-related hooks
│   └── index.ts       # Package entry point
├── tests/             # Unit tests
└── README.md          # This file
```

## Usage

```typescript
// Import theming
import { ThemeProvider, useTheme } from '@speakbetter/ui';

// Import components (interfaces)
import { Button, Card, TextField } from '@speakbetter/ui';

// Use in your application
function App() {
  return (
    <ThemeProvider>
      <MyComponent />
    </ThemeProvider>
  );
}

function MyComponent() {
  const { colors, spacing } = useTheme();

  return (
    <Card>
      <TextField
        label="Name"
        placeholder="Enter your name"
      />
      <Button
        variant="primary"
        onPress={() => console.log('Button pressed')}
      >
        Submit
      </Button>
    </Card>
  );
}
```

## Development

```bash
# Build the package
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Implementation Notes

This package defines interfaces that are implemented differently for web and mobile:

- Web implementations use React DOM components
- Mobile implementations use React Native components
- Both share the same theming system and component APIs

## Testing

The UI package includes tests for all component interfaces and hooks. Run the tests with:

```bash
npm run test
```

## Dependencies

This package has minimal dependencies to ensure it remains platform-agnostic.
