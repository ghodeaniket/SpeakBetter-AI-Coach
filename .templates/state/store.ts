import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface {{StoreName}}State {
  // State properties
  
  // Actions
}

export const use{{StoreName}}Store = create<{{StoreName}}State>()(
  immer((set) => ({
    // Initial state
    
    // Action implementations that use immer for immutable updates
    // Example:
    // setProperty: (value) => set((state) => { state.property = value; }),
  }))
);
