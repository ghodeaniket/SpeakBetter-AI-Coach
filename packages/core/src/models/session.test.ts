import { Session } from './session';

describe('Session model', () => {
  it('should have the correct structure', () => {
    const session: Session = {
      id: 'session123',
      userId: 'user456',
      type: 'freestyle',
      status: 'completed',
      durationSeconds: 120,
      createdAt: new Date(),
      hasAnalysis: true,
      hasFeedback: true,
    };
    
    expect(session.id).toBe('session123');
    expect(session.userId).toBe('user456');
    expect(session.type).toBe('freestyle');
    expect(session.status).toBe('completed');
    expect(session.durationSeconds).toBe(120);
    expect(session.hasAnalysis).toBe(true);
    expect(session.hasFeedback).toBe(true);
  });
  
  it('should support optional recordingUrl', () => {
    const sessionWithUrl: Session = {
      id: 'session123',
      userId: 'user456',
      type: 'guided',
      status: 'completed',
      recordingUrl: 'https://storage.example.com/recordings/session123.mp3',
      durationSeconds: 180,
      createdAt: new Date(),
      hasAnalysis: true,
      hasFeedback: false,
    };
    
    expect(sessionWithUrl.recordingUrl).toBe('https://storage.example.com/recordings/session123.mp3');
    
    const sessionWithoutUrl: Session = {
      id: 'session123',
      userId: 'user456',
      type: 'qa',
      status: 'processing',
      durationSeconds: 90,
      createdAt: new Date(),
      hasAnalysis: false,
      hasFeedback: false,
    };
    
    expect(sessionWithoutUrl.recordingUrl).toBeUndefined();
  });
  
  it('should handle different session types', () => {
    const freestyleSession: Session = {
      id: 'freestyle123',
      userId: 'user456',
      type: 'freestyle',
      status: 'completed',
      durationSeconds: 120,
      createdAt: new Date(),
      hasAnalysis: true,
      hasFeedback: true,
    };
    
    const guidedSession: Session = {
      id: 'guided123',
      userId: 'user456',
      type: 'guided',
      status: 'completed',
      durationSeconds: 150,
      createdAt: new Date(),
      hasAnalysis: true,
      hasFeedback: true,
    };
    
    const qaSession: Session = {
      id: 'qa123',
      userId: 'user456',
      type: 'qa',
      status: 'completed',
      durationSeconds: 180,
      createdAt: new Date(),
      hasAnalysis: true,
      hasFeedback: true,
    };
    
    expect(freestyleSession.type).toBe('freestyle');
    expect(guidedSession.type).toBe('guided');
    expect(qaSession.type).toBe('qa');
  });
  
  it('should handle different session statuses', () => {
    const completedSession: Session = {
      id: 'session123',
      userId: 'user456',
      type: 'freestyle',
      status: 'completed',
      durationSeconds: 120,
      createdAt: new Date(),
      hasAnalysis: true,
      hasFeedback: true,
    };
    
    const processingSession: Session = {
      id: 'session124',
      userId: 'user456',
      type: 'freestyle',
      status: 'processing',
      durationSeconds: 120,
      createdAt: new Date(),
      hasAnalysis: false,
      hasFeedback: false,
    };
    
    const errorSession: Session = {
      id: 'session125',
      userId: 'user456',
      type: 'freestyle',
      status: 'error',
      durationSeconds: 60,
      createdAt: new Date(),
      hasAnalysis: false,
      hasFeedback: false,
    };
    
    expect(completedSession.status).toBe('completed');
    expect(processingSession.status).toBe('processing');
    expect(errorSession.status).toBe('error');
  });
});