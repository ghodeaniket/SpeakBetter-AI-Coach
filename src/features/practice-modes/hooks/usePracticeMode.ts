import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getGuidedReadingContent, 
  getGuidedReadingContentById,
  getQAQuestions,
  getQAQuestionById,
  getRecommendedContent,
  GuidedReadingContent,
  QAQuestion
} from '../services/practiceContentService';
import { createSession } from '../../session-management/services/sessionService';
import { useAuth } from '../../../shared/contexts/AuthContext';

type PracticeType = 'freestyle' | 'guided' | 'qa';

interface UsePracticeModeProps {
  initialType?: PracticeType;
}

interface PracticeModeState {
  practiceType: PracticeType;
  guidedContent: GuidedReadingContent[];
  qaQuestions: QAQuestion[];
  selectedContentId: string | null;
  selectedContent: GuidedReadingContent | QAQuestion | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing practice mode state and interactions
 */
export const usePracticeMode = (props?: UsePracticeModeProps) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // State
  const [state, setState] = useState<PracticeModeState>({
    practiceType: props?.initialType || 'freestyle',
    guidedContent: [],
    qaQuestions: [],
    selectedContentId: null,
    selectedContent: null,
    isLoading: false,
    error: null
  });
  
  /**
   * Set practice type and load relevant content
   */
  const setPracticeType = useCallback(async (type: PracticeType) => {
    setState(prev => ({ ...prev, practiceType: type, isLoading: true, error: null }));
    
    try {
      if (type === 'guided') {
        const content = await getGuidedReadingContent({ limit: 10 });
        setState(prev => ({ 
          ...prev, 
          practiceType: type, 
          guidedContent: content,
          selectedContentId: null,
          selectedContent: null,
          isLoading: false 
        }));
      } else if (type === 'qa') {
        const questions = await getQAQuestions({ limit: 10 });
        setState(prev => ({ 
          ...prev, 
          practiceType: type, 
          qaQuestions: questions,
          selectedContentId: null,
          selectedContent: null,
          isLoading: false 
        }));
      } else {
        // Freestyle doesn't need to load content
        setState(prev => ({ 
          ...prev, 
          practiceType: type, 
          selectedContentId: null,
          selectedContent: null,
          isLoading: false 
        }));
      }
    } catch (error: any) {
      console.error(`Error loading content for ${type} practice:`, error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Error loading content: ${error.message || 'Unknown error'}` 
      }));
    }
  }, []);
  
  /**
   * Select content for practice
   */
  const selectContent = useCallback(async (contentId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let content = null;
      
      if (state.practiceType === 'guided') {
        content = await getGuidedReadingContentById(contentId);
      } else if (state.practiceType === 'qa') {
        content = await getQAQuestionById(contentId);
      }
      
      if (!content) {
        throw new Error('Content not found');
      }
      
      setState(prev => ({ 
        ...prev, 
        selectedContentId: contentId,
        selectedContent: content,
        isLoading: false 
      }));
    } catch (error: any) {
      console.error('Error selecting content:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Error selecting content: ${error.message || 'Unknown error'}` 
      }));
    }
  }, [state.practiceType]);
  
  /**
   * Start a practice session
   */
  const startPracticeSession = useCallback(async () => {
    if (!userProfile?.uid) {
      setState(prev => ({ 
        ...prev, 
        error: 'You must be signed in to start a practice session' 
      }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Map practice type to session type
      const sessionType = state.practiceType === 'freestyle' 
        ? 'freestyle' 
        : state.practiceType === 'guided' 
          ? 'guided' 
          : 'qa';
      
      // Create a new session
      const sessionId = await createSession(userProfile.uid, sessionType);
      
      // Navigate to the speech analysis page with the session ID
      navigate(`/speech-analysis?sessionId=${sessionId}&type=${sessionType}${
        state.selectedContentId ? `&contentId=${state.selectedContentId}` : ''
      }`);
    } catch (error: any) {
      console.error('Error starting practice session:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Error starting session: ${error.message || 'Unknown error'}` 
      }));
    }
  }, [userProfile?.uid, state.practiceType, state.selectedContentId, navigate]);
  
  /**
   * Load recommended content for the user
   */
  const loadRecommendedContent = useCallback(async () => {
    if (!userProfile?.uid) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (state.practiceType === 'guided') {
        const recommendedIds = await getRecommendedContent(userProfile.uid, 'guided');
        const content = await getGuidedReadingContent();
        
        // Filter content to recommended IDs
        const recommendedContent = content.filter(item => 
          recommendedIds.includes(item.id)
        );
        
        setState(prev => ({ 
          ...prev, 
          guidedContent: recommendedContent.length > 0 ? recommendedContent : content,
          isLoading: false 
        }));
      } else if (state.practiceType === 'qa') {
        const recommendedIds = await getRecommendedContent(userProfile.uid, 'qa');
        const questions = await getQAQuestions();
        
        // Filter questions to recommended IDs
        const recommendedQuestions = questions.filter(item => 
          recommendedIds.includes(item.id)
        );
        
        setState(prev => ({ 
          ...prev, 
          qaQuestions: recommendedQuestions.length > 0 ? recommendedQuestions : questions,
          isLoading: false 
        }));
      }
    } catch (error: any) {
      console.error('Error loading recommended content:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Error loading recommendations: ${error.message || 'Unknown error'}` 
      }));
    }
  }, [userProfile?.uid, state.practiceType]);
  
  // Load initial content when practice type changes
  useEffect(() => {
    if (props?.initialType) {
      setPracticeType(props.initialType);
    }
  }, [props?.initialType, setPracticeType]);
  
  return {
    practiceType: state.practiceType,
    guidedContent: state.guidedContent,
    qaQuestions: state.qaQuestions,
    selectedContentId: state.selectedContentId,
    selectedContent: state.selectedContent,
    isLoading: state.isLoading,
    error: state.error,
    setPracticeType,
    selectContent,
    startPracticeSession,
    loadRecommendedContent
  };
};
