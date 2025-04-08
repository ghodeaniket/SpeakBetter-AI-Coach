# SpeakBetter AI Coach - Style Guide

## Code Organization

### File Size
- **Maximum file size**: 200 lines of code
- **Exceptions**: Test files, automatically generated code
- **Recommendation**: If a file exceeds 200 lines, consider splitting it into smaller, focused files

### Directory Structure
- Follow the feature-based organization pattern
- Place shared code in the `shared` directory
- Keep feature-specific code within its feature directory

## Naming Conventions

### Files and Directories
- Use **PascalCase** for React components: `AudioRecorder.tsx`
- Use **camelCase** for utilities, hooks, and services: `speechToTextService.ts`
- Use **index.ts** files for clean exports

### Component Names
- Use **PascalCase** for component names: `AudioRecorder`
- Add descriptive suffixes when appropriate: `UserProfileForm`, `SettingsPanel`

### Variables and Functions
- Use **camelCase** for variables and functions: `handleSubmit`, `userData`
- Use descriptive names that explain purpose: `handleAudioCaptured` not `handle`

### Interfaces and Types
- Prefix interfaces with `I`: `IAudioRecorderProps`
- Use PascalCase for types and interfaces
- Export types when they might be useful outside the component

## Component Structure

### Component Declaration
- Use functional components with TypeScript
- Declare props interface above the component
- Use explicit return types

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return (
    <button
      className={`button button--${variant}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
```

### Component Organization
1. Import statements
2. Interface/type definitions
3. Component declaration
4. Hooks (useState, useEffect, custom hooks)
5. Helper functions
6. Return statement
7. Export statement

## Styling

### Material UI
- Use Material UI's `sx` prop for component-specific styling
- Use theme variables for colors, spacing, etc.
- Follow Material Design principles for UI elements

### Style Organization
- Keep styles close to the components they style
- Use meaningful names for style classes
- Use theme variables for consistent styling

## Code Formatting

### General Guidelines
- Use 2 spaces for indentation
- Use single quotes for strings
- Include semicolons at the end of statements
- Keep lines under 100 characters

### TypeScript
- Use explicit types for function parameters and return values
- Use interfaces for defining component props
- Use proper import sorting (React first, then external libraries, then internal modules)

## Comments

### When to Comment
- Complex logic that isn't immediately obvious
- Workarounds for known issues
- API integrations
- Business rules implemented in code

### Comment Style
- Use `//` for single-line comments
- Use JSDoc style for function/component documentation

```tsx
/**
 * Calculates speaking rate in words per minute
 * @param wordCount - Number of words in the transcript
 * @param durationSeconds - Duration of the audio in seconds
 * @returns Words per minute or null if duration is zero
 */
function calculateSpeakingRate(wordCount: number, durationSeconds: number): number | null {
  if (durationSeconds <= 0) return null;
  const durationMinutes = durationSeconds / 60;
  return Math.round(wordCount / durationMinutes);
}
```

## State Management

### Component State
- Use React's `useState` for component-specific state
- Extract complex state logic into custom hooks

### Application State
- Use React Context for state that needs to be accessed by multiple components
- Consider adding Redux for more complex state management needs
- Create separate contexts for different domains (auth, speech, preferences)

## Error Handling

### General Guidelines
- Always handle potential errors in async functions
- Provide meaningful error messages to users
- Log errors to the console in development
- Add error boundaries around key UI sections

### API Error Handling
- Add proper error handling for all API calls
- Include retry logic where appropriate
- Show loading states during API calls

## Performance

### Optimization Techniques
- Memoize expensive calculations with `useMemo`
- Optimize re-renders with `React.memo` and `useCallback`
- Avoid unnecessary re-renders by keeping props stable
- Implement lazy loading for components not needed immediately

### Rendering
- Use key props correctly in lists
- Avoid inline function definitions in render methods when possible
- Keep component trees shallow when possible

## Testing

### Component Testing
- Write tests for critical user flows
- Test component rendering and interactions
- Mock external dependencies

### Service Testing
- Test service functions in isolation
- Mock API calls for predictable results
- Test both success and error cases

## Accessibility

### Guidelines
- Use semantic HTML elements
- Add proper ARIA attributes when necessary
- Ensure proper keyboard navigation
- Maintain good color contrast
- Provide alternative text for images

## Git Practices

### Commit Messages
- Use descriptive commit messages
- Start with a verb in imperative form: "Add", "Fix", "Update"
- Keep the first line under 50 characters
- Include issue/ticket numbers when applicable

### Branching
- Use feature branches for new features
- Use fix branches for bug fixes
- Name branches descriptively: `feature/speech-analysis`, `fix/audio-recording-bug`

## Documentation

### Code Documentation
- Document public APIs, hooks, and components
- Include examples where helpful
- Keep documentation up to date with code changes

### Project Documentation
- Update README.md with project overview and setup instructions
- Maintain ARCHITECTURE_README.md with architectural decisions
- Document API integrations and configuration requirements
