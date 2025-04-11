// Service interfaces
import { User, SessionMetadata, SpeechAnalysisResult } from '../models';

export interface AuthService {
  signIn(): Promise<User | null>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

export interface SpeechService {
  transcribeAudio(audioBlob: Blob): Promise<SpeechAnalysisResult>;
  synthesizeSpeech(text: string, voice?: string): Promise<ArrayBuffer>;
}

export interface SessionService {
  getSessions(userId: string): Promise<SessionMetadata[]>;
  getSession(sessionId: string): Promise<SessionMetadata | null>;
  saveSession(session: SessionMetadata): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
}
