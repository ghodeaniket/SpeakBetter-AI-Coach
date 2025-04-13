import { useSessionsStore } from '..';
import { Session } from '@speakbetter/core';

describe('Sessions Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useSessionsStore.setState({
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null,
      setSessions: useSessionsStore.getState().setSessions,
      setCurrentSession: useSessionsStore.getState().setCurrentSession,
      addSession: useSessionsStore.getState().addSession,
      updateSession: useSessionsStore.getState().updateSession,
      removeSession: useSessionsStore.getState().removeSession,
      setLoading: useSessionsStore.getState().setLoading,
      setError: useSessionsStore.getState().setError,
    });
  });

  it('should initialize with default values', () => {
    const state = useSessionsStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.currentSession).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set sessions', () => {
    const mockSessions: Session[] = [
      {
        id: 'session1',
        userId: 'user1',
        type: 'freestyle',
        status: 'completed',
        durationSeconds: 120,
        createdAt: new Date(),
        hasAnalysis: true,
        hasFeedback: true,
      },
      {
        id: 'session2',
        userId: 'user1',
        type: 'guided',
        status: 'completed',
        durationSeconds: 180,
        createdAt: new Date(),
        hasAnalysis: true,
        hasFeedback: false,
      },
    ];

    useSessionsStore.getState().setSessions(mockSessions);
    expect(useSessionsStore.getState().sessions).toEqual(mockSessions);
  });

  it('should set current session', () => {
    const mockSession: Session = {
      id: 'session1',
      userId: 'user1',
      type: 'freestyle',
      status: 'completed',
      durationSeconds: 120,
      createdAt: new Date(),
      hasAnalysis: true,
      hasFeedback: true,
    };

    useSessionsStore.getState().setCurrentSession(mockSession);
    expect(useSessionsStore.getState().currentSession).toEqual(mockSession);
  });

  it('should add a session', () => {
    const mockSession: Session = {
      id: 'session1',
      userId: 'user1',
      type: 'freestyle',
      status: 'completed',
      durationSeconds: 120,
      createdAt: new Date(),
      hasAnalysis: true,
      hasFeedback: true,
    };

    useSessionsStore.getState().addSession(mockSession);
    expect(useSessionsStore.getState().sessions).toHaveLength(1);
    expect(useSessionsStore.getState().sessions[0]).toEqual(mockSession);
  });

  it('should update a session', () => {
    const mockSession: Session = {
      id: 'session1',
      userId: 'user1',
      type: 'freestyle',
      status: 'processing',
      durationSeconds: 120,
      createdAt: new Date(),
      hasAnalysis: false,
      hasFeedback: false,
    };

    // Add a session first
    useSessionsStore.getState().addSession(mockSession);

    // Now update it
    const updates: Partial<Session> = {
      status: 'completed',
      hasAnalysis: true,
      hasFeedback: true,
    };

    useSessionsStore.getState().updateSession('session1', updates);
    
    const updatedSession = useSessionsStore.getState().sessions[0];
    expect(updatedSession.status).toBe('completed');
    expect(updatedSession.hasAnalysis).toBe(true);
    expect(updatedSession.hasFeedback).toBe(true);
  });

  it('should remove a session', () => {
    const mockSession: Session = {
      id: 'session1',
      userId: 'user1',
      type: 'freestyle',
      status: 'completed',
      durationSeconds: 120,
      createdAt: new Date(),
      hasAnalysis: true,
      hasFeedback: true,
    };

    // Add a session first
    useSessionsStore.getState().addSession(mockSession);
    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    // Now remove it
    useSessionsStore.getState().removeSession('session1');
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('should set loading state', () => {
    useSessionsStore.getState().setLoading(true);
    expect(useSessionsStore.getState().isLoading).toBe(true);
  });

  it('should set error', () => {
    const error = new Error('Test error');
    useSessionsStore.getState().setError(error);
    expect(useSessionsStore.getState().error).toEqual(error);
  });
});