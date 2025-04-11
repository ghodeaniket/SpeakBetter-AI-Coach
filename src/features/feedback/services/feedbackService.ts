import { TranscriptionResult } from '../../../services/google-cloud/speech';
import { db } from '../../../firebase/config';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateSpeech } from '../../text-to-speech/services/textToSpeechService';

// Feedback generation template type
export interface FeedbackTemplate {
  positive: string;
  improvement: string;
  suggestion: string;
  encouragement: string;
}

// Feedback storage model
export interface Feedback {
  id: string;
  sessionId: string;
  userId: string;
  positive: string;
  improvement: string;
  suggestion: string;
  encouragement: string;
  fullText: string;
  audioUrl?: string;
  createdAt: Date;
  viewedAt?: Date;
}

// Metrics thresholds for feedback
const METRICS_THRESHOLDS = {
  wordsPerMinute: {
    slow: 110,
    optimal: 140,
    fast: 170,
  },
  fillerWordPercentage: {
    low: 2,
    medium: 5,
    high: 8,
  },
  pauseFrequency: {
    low: 4,
    optimal: 8,
    high: 15,
  },
  clarityScore: {
    low: 60,
    medium: 75,
    high: 90,
  }
};

// Common filler words to detect
const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'so', 'actually', 'basically', 'literally',
  'honestly', 'right', 'I mean', 'kind of', 'sort of', 'just', 'stuff', 'thing'
];

/**
 * Generate feedback based on speech analysis and user goals
 */
export const generateFeedback = (transcriptionResult: TranscriptionResult, userGoals?: string[]): FeedbackTemplate => {
  const {
    transcript = '',
    confidence = 0,
    wordsPerMinute = 0,
    fillerWordCount = 0,
    totalWords = 0,
    durationMs = 0,
  } = transcriptionResult;
  
  // Calculate metrics
  const fillerWordPercentage = totalWords > 0 ? (fillerWordCount / totalWords) * 100 : 0;
  const clarityScore = Math.min(100, Math.round(confidence * 100));
  const durationSeconds = durationMs / 1000;
  const pauseFrequency = 10; // Placeholder - would be calculated from actual pause analysis
  
  // Track identified strengths and areas for improvement
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  // Check if user has specific goals to focus on
  const hasPaceGoal = userGoals?.includes('pace');
  const hasFillerWordsGoal = userGoals?.includes('fillers');
  const hasClarityGoal = userGoals?.includes('clarity');
  const hasConfidenceGoal = userGoals?.includes('confidence');
  
  // Analyze speaking pace
  if (wordsPerMinute < METRICS_THRESHOLDS.wordsPerMinute.slow) {
    improvements.push('speaking pace is on the slower side');
  } else if (wordsPerMinute > METRICS_THRESHOLDS.wordsPerMinute.fast) {
    improvements.push('speaking pace is quite fast');
  } else {
    strengths.push('speaking at a good pace');
  }
  
  // Analyze filler words
  if (fillerWordPercentage > METRICS_THRESHOLDS.fillerWordPercentage.high) {
    improvements.push('using a high number of filler words');
  } else if (fillerWordPercentage > METRICS_THRESHOLDS.fillerWordPercentage.medium) {
    improvements.push('using some filler words');
  } else {
    strengths.push('minimal use of filler words');
  }
  
  // Analyze clarity
  if (clarityScore < METRICS_THRESHOLDS.clarityScore.low) {
    improvements.push('speech clarity could be improved');
  } else if (clarityScore > METRICS_THRESHOLDS.clarityScore.high) {
    strengths.push('speaking with excellent clarity');
  } else {
    strengths.push('speaking with good clarity');
  }
  
  // Analyze pause frequency
  if (pauseFrequency < METRICS_THRESHOLDS.pauseFrequency.low) {
    improvements.push('using fewer pauses than optimal');
  } else if (pauseFrequency > METRICS_THRESHOLDS.pauseFrequency.high) {
    improvements.push('pausing too frequently');
  } else {
    strengths.push('using pauses effectively');
  }
  
  // Check transcript length
  if (totalWords < 30) {
    improvements.push('the sample was quite short');
  } else if (totalWords > 200) {
    strengths.push('providing a substantial speech sample');
  }
  
  // Generate positive feedback
  let positive = '';
  if (strengths.length > 0) {
    const strengthsList = strengths.slice(0, 2).join(' and ');
    positive = `You're ${strengthsList}. `;
    
    if (strengths.length > 2) {
      positive += `I also noticed that you're ${strengths[2]}. `;
    }
    
    // Add specific details
    if (wordsPerMinute >= METRICS_THRESHOLDS.wordsPerMinute.slow && 
        wordsPerMinute <= METRICS_THRESHOLDS.wordsPerMinute.fast) {
      positive += `Your pace of ${Math.round(wordsPerMinute)} words per minute is in the optimal range for listeners to understand and engage with your content. `;
    }
    
    if (fillerWordPercentage <= METRICS_THRESHOLDS.fillerWordPercentage.medium) {
      positive += `Your limited use of filler words helps you sound more confident and professional. `;
    }
  } else {
    positive = "You've taken an important step by practicing your speaking skills. ";
  }
  
  // Generate improvement feedback
  let improvement = '';
  if (improvements.length > 0) {
    improvement = `I noticed you're ${improvements[0]}. `;
    
    if (improvements.length > 1) {
      improvement += `You're also ${improvements[1]}. `;
    }
    
    // Add specific details
    if (fillerWordPercentage > METRICS_THRESHOLDS.fillerWordPercentage.medium) {
      const commonFillers = findCommonFillerWords(transcript);
      if (commonFillers.length > 0) {
        improvement += `I noticed you frequently used filler words like "${commonFillers.join('", "')}". `;
      }
    }
    
    if (wordsPerMinute < METRICS_THRESHOLDS.wordsPerMinute.slow) {
      improvement += `Your speaking rate was ${Math.round(wordsPerMinute)} words per minute, which is slower than the optimal range of 120-160 words per minute. `;
    } else if (wordsPerMinute > METRICS_THRESHOLDS.wordsPerMinute.fast) {
      improvement += `Your speaking rate was ${Math.round(wordsPerMinute)} words per minute, which is faster than the optimal range of 120-160 words per minute. `;
    }
  } else {
    improvement = "There were no significant issues in your speech pattern. ";
  }
  
  // Generate suggestions with priority on user goals
  let suggestion = '';
  
  // Prioritize suggestions based on user goals and metrics
  if (hasFillerWordsGoal && fillerWordPercentage > METRICS_THRESHOLDS.fillerWordPercentage.low) {
    suggestion = "To reduce filler words, try replacing them with brief pauses. Before speaking, take a deep breath and organize your thoughts. It's perfectly acceptable to pause briefly between ideas. You can also try listing common filler words you use and practice being conscious of them during conversations. ";
  } else if (hasPaceGoal && (wordsPerMinute < METRICS_THRESHOLDS.wordsPerMinute.slow || wordsPerMinute > METRICS_THRESHOLDS.wordsPerMinute.fast)) {
    if (wordsPerMinute < METRICS_THRESHOLDS.wordsPerMinute.slow) {
      suggestion = "To increase your speaking pace, try practicing with a timer. Set a goal to cover specific content within a time limit, gradually increasing your pace with each practice session. Reading aloud from books or articles can also help you develop a more fluid rhythm. ";
    } else {
      suggestion = "To slow down your speaking pace, try inserting deliberate pauses between key points. Focus on clear articulation of each word, and consider marking pauses in your notes if you're using them. Taking a breath before important points can help pace yourself naturally. ";
    }
  } else if (hasClarityGoal && clarityScore < METRICS_THRESHOLDS.clarityScore.high) {
    suggestion = "To improve speech clarity, try exaggerating your pronunciation during practice sessions. Focus on fully articulating each syllable, especially at the ends of words. Recording yourself and listening back can help identify specific words that need more attention. Daily vocal exercises can also strengthen your articulation muscles. ";
  } else if (hasConfidenceGoal) {
    suggestion = "To build speaking confidence, try the 'power pose' technique before important talks - stand tall with shoulders back for two minutes. Practice maintaining eye contact and speaking with conviction. Remember that confident speakers use deliberate pacing and aren't afraid of strategic pauses. ";
  } else if (fillerWordPercentage > METRICS_THRESHOLDS.fillerWordPercentage.medium) {
    suggestion = "To reduce filler words, try replacing them with brief pauses. Before speaking, take a deep breath and organize your thoughts. It's perfectly acceptable to pause briefly between ideas. ";
  } else if (wordsPerMinute < METRICS_THRESHOLDS.wordsPerMinute.slow) {
    suggestion = "To increase your speaking pace, try practicing with a timer. Set a goal to cover specific content within a time limit, gradually increasing your pace with each practice session. ";
  } else if (wordsPerMinute > METRICS_THRESHOLDS.wordsPerMinute.fast) {
    suggestion = "To slow down your speaking pace, try inserting deliberate pauses between key points. Focus on clear articulation of each word, and consider marking pauses in your notes if you're using them. ";
  } else if (clarityScore < METRICS_THRESHOLDS.clarityScore.medium) {
    suggestion = "To improve speech clarity, try exaggerating your pronunciation during practice sessions. Focus on fully articulating each syllable, especially at the ends of words. Recording yourself and listening back can help identify specific words that need more attention. ";
  } else {
    suggestion = "For your next practice session, challenge yourself by varying your vocal tone more to add emphasis to key points. Consider recording yourself and identifying 2-3 specific aspects you'd like to improve. ";
  }
  
  // Generate encouragement based on user goals
  let encouragement = "Keep practicing regularly, and you'll continue to see improvement. ";
  
  // Add goal-specific encouragement
  if (userGoals && userGoals.length > 0) {
    if (hasPaceGoal) {
      encouragement += "Your focus on speaking pace is a great approach. With consistent practice, you'll find your optimal rhythm. ";
    }
    
    if (hasFillerWordsGoal) {
      encouragement += "Your awareness of filler words is the first step to reducing them. Continue being mindful of them during conversations. ";
    }
    
    if (hasClarityGoal) {
      encouragement += "Working on speech clarity will make your ideas more impactful. Keep practicing clear articulation. ";
    }
    
    if (hasConfidenceGoal) {
      encouragement += "Building confidence comes with practice. Each session is strengthening your speaking abilities. ";
    }
  }
  
  encouragement += "Remember that even professional speakers were once beginners. Each practice session builds your skills and confidence!";
  
  // Combine all sections into full text
  const fullText = `${positive}\n\n${improvement}\n\n${suggestion}\n\n${encouragement}`;
  
  return {
    positive,
    improvement,
    suggestion,
    encouragement,
  };
};

/**
 * Find most common filler words in transcript
 */
const findCommonFillerWords = (transcript: string): string[] => {
  const lowerTranscript = transcript.toLowerCase();
  const foundFillers: string[] = [];
  
  FILLER_WORDS.forEach(filler => {
    // Count occurrences using regex to find whole words
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerTranscript.match(regex);
    
    if (matches && matches.length > 0) {
      foundFillers.push(filler);
    }
  });
  
  // Return top 3 most common fillers
  return foundFillers.slice(0, 3);
};

/**
 * Save feedback to Firestore
 */
export const saveFeedback = async (
  feedback: FeedbackTemplate,
  sessionId: string,
  userId: string,
  audioUrl?: string
): Promise<string> => {
  try {
    // Combine all feedback sections into a single text
    const fullText = `${feedback.positive}\n\n${feedback.improvement}\n\n${feedback.suggestion}\n\n${feedback.encouragement}`;
    
    // Create feedback document
    const feedbackRef = collection(db, 'feedback');
    const newFeedback = await addDoc(feedbackRef, {
      sessionId,
      userId,
      positive: feedback.positive,
      improvement: feedback.improvement,
      suggestion: feedback.suggestion,
      encouragement: feedback.encouragement,
      fullText,
      audioUrl,
      createdAt: serverTimestamp(),
      viewedAt: null
    });
    
    // Also update the session with a reference to this feedback
    const sessionRef = doc(db, 'sessions', sessionId);
    await setDoc(sessionRef, { hasFeedback: true, feedbackId: newFeedback.id }, { merge: true });
    
    return newFeedback.id;
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
};

/**
 * Get feedback by ID
 */
export const getFeedback = async (feedbackId: string): Promise<Feedback | null> => {
  try {
    const feedbackRef = doc(db, 'feedback', feedbackId);
    const feedbackSnap = await getDoc(feedbackRef);
    
    if (feedbackSnap.exists()) {
      const data = feedbackSnap.data();
      return {
        id: feedbackSnap.id,
        sessionId: data.sessionId,
        userId: data.userId,
        positive: data.positive,
        improvement: data.improvement,
        suggestion: data.suggestion,
        encouragement: data.encouragement,
        fullText: data.fullText,
        audioUrl: data.audioUrl,
        createdAt: data.createdAt.toDate(),
        viewedAt: data.viewedAt ? data.viewedAt.toDate() : undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting feedback:', error);
    throw error;
  }
};

/**
 * Mark feedback as viewed
 */
export const markFeedbackAsViewed = async (feedbackId: string): Promise<void> => {
  try {
    const feedbackRef = doc(db, 'feedback', feedbackId);
    await setDoc(feedbackRef, { viewedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error('Error marking feedback as viewed:', error);
    throw error;
  }
};

/**
 * Generate audio feedback using text-to-speech
 */
export const generateAudioFeedback = async (feedback: FeedbackTemplate, voiceId?: string): Promise<string> => {
  try {
    // Validate feedback sections
    if (!feedback || !feedback.positive || !feedback.improvement || !feedback.suggestion || !feedback.encouragement) {
      console.warn('Incomplete feedback template provided');
      // Provide default content for any missing sections
      feedback = {
        positive: feedback?.positive || "You've taken a good step by practicing.",
        improvement: feedback?.improvement || "Continue working on your delivery.",
        suggestion: feedback?.suggestion || "Try recording yourself more frequently.",
        encouragement: feedback?.encouragement || "Keep practicing!"
      };
    }

    // Combine feedback sections into a single text with pauses
    const textWithPauses = `${feedback.positive} <break time="1s"/> ${feedback.improvement} <break time="1s"/> ${feedback.suggestion} <break time="1s"/> ${feedback.encouragement}`;
    
    console.log('Generating audio feedback with text length:', textWithPauses.length);
    
    // Generate speech with WaveNet voice
    try {
      const result = await generateSpeech(textWithPauses, {
        voiceId: voiceId || 'en-US-Wavenet-D', // Default to a WaveNet voice
        speakingRate: 0.95, // Slightly slower for coaching
        pitch: 0.0,
        useSSML: true,
        saveToStorage: true
      });
      
      console.log('Audio feedback generated successfully, URL length:', result.audioUrl.length);
      return result.audioUrl;
    } catch (speechError) {
      console.error('Speech generation failed:', speechError);
      // Return empty string to allow the app to continue
      return '';
    }
  } catch (error) {
    console.error('Error in generateAudioFeedback:', error);
    // Return empty string to allow the app to continue
    return '';
  }
};

export default {
  generateFeedback,
  saveFeedback,
  getFeedback,
  markFeedbackAsViewed,
  generateAudioFeedback
};
