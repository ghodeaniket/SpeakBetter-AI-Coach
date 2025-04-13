import { use{{StoreName}}Store } from './{{storeName}}';

describe('{{StoreName}} Store', () => {
  beforeEach(() => {
    // Reset the store to its initial state before each test
    const { setState } = use{{StoreName}}Store;
    setState(use{{StoreName}}Store.getState());
  });

  it('should initialize with default state', () => {
    const state = use{{StoreName}}Store.getState();
    // Add assertions for initial state
    expect(state).toBeDefined();
  });

  // Tests for individual actions
  // Example:
  // it('should update a property', () => {
  //   const { setProperty } = use{{StoreName}}Store.getState();
  //   setProperty('new value');
  //   const newState = use{{StoreName}}Store.getState();
  //   expect(newState.property).toBe('new value');
  // });
});
