import { User, UserSettings, UserGoal } from './user';

describe('User model', () => {
  it('should have the correct structure', () => {
    const user: User = {
      uid: '123',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    expect(user.uid).toBe('123');
    expect(user.displayName).toBe('Test User');
    expect(user.email).toBe('test@example.com');
  });
  
  it('should support optional settings', () => {
    const settings: UserSettings = {
      selectedVoice: 'male',
      coachPersonality: 'supportive',
    };
    
    const user: User = {
      uid: '123',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      settings,
    };
    
    expect(user.settings?.selectedVoice).toBe('male');
    expect(user.settings?.coachPersonality).toBe('supportive');
  });
  
  it('should support goals', () => {
    const goals: UserGoal[] = [
      {
        type: 'presentation',
        focus: ['pace', 'fillers'],
        weeklySessionTarget: 3,
      },
    ];
    
    const user: User = {
      uid: '123',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      goals,
    };
    
    expect(user.goals?.[0].type).toBe('presentation');
    expect(user.goals?.[0].focus).toContain('pace');
    expect(user.goals?.[0].weeklySessionTarget).toBe(3);
  });
});