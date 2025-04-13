import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { User, UserGoal, UserSettings } from '@speakbetter/core';

interface UserState {
  profile: Partial<User> | null;
  goals: UserGoal[];
  settings: UserSettings | null;
  isLoading: boolean;
  error: Error | null;
  
  setProfile: (profile: Partial<User> | null) => void;
  setGoals: (goals: UserGoal[]) => void;
  addGoal: (goal: UserGoal) => void;
  updateGoal: (index: number, goal: Partial<UserGoal>) => void;
  removeGoal: (index: number) => void;
  setSettings: (settings: UserSettings) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useUserStore = create<UserState>()(
  immer((set) => ({
    profile: null,
    goals: [],
    settings: null,
    isLoading: false,
    error: null,
    
    setProfile: (profile) => set((state) => { state.profile = profile; }),
    setGoals: (goals) => set((state) => { state.goals = goals; }),
    addGoal: (goal) => set((state) => { state.goals.push(goal); }),
    updateGoal: (index, goal) => set((state) => {
      if (index >= 0 && index < state.goals.length) {
        state.goals[index] = { ...state.goals[index], ...goal };
      }
    }),
    removeGoal: (index) => set((state) => {
      if (index >= 0 && index < state.goals.length) {
        state.goals.splice(index, 1);
      }
    }),
    setSettings: (settings) => set((state) => { state.settings = settings; }),
    updateSettings: (settings) => set((state) => {
      if (state.settings) {
        state.settings = { ...state.settings, ...settings };
      } else {
        state.settings = settings as UserSettings;
      }
    }),
    setLoading: (isLoading) => set((state) => { state.isLoading = isLoading; }),
    setError: (error) => set((state) => { state.error = error; }),
  }))
);