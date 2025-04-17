# SpeakBetter Mobile Package

This package serves as a bridge between the shared packages (core, api, ui, state) and the React Native mobile app. It provides the necessary adapters and components for the mobile app to use the shared functionality.

## Structure

- `src/index.ts` - Entry point for the package, exports all the adapters and components
- `src/App.tsx` - Main App component for the mobile app
- `src/types.ts` - Shared types between the mobile app and the package

## Development

This package is intended to be used in conjunction with a React Native app created in the `apps/mobile_app` directory. The mobile app will import this package and use it to interact with the shared packages.

## Phase 1 Implementation

This is a skeleton implementation for Phase 1 of the React Native upgrade plan. It provides the basic structure for the mobile package but does not include any actual functionality. The full implementation will be done in Phase 2.

## Dependencies

- React 18.2.0+
- React Native 0.79.0+
- TypeScript 5.0.4+

## Scripts

- `build` - Build the package using TypeScript
- `lint` - Lint the code using ESLint
- `clean` - Remove node_modules
- `test` - Run tests using Jest
