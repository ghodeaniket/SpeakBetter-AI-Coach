import { 
  collection, 
  getDocs, 
  query, 
  where, 
  limit, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../../firebase/config';

// Interface for guided reading content
export interface GuidedReadingContent {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  text: string;
  estimatedDuration: number; // in seconds
  keywords: string[];
}

// Interface for Q&A question
export interface QAQuestion {
  id: string;
  question: string;
  context?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  suggestedTopics?: string[];
}

/**
 * Get guided reading content from Firestore
 * @param filters Optional filters for content selection
 * @returns Array of guided reading content
 */
export const getGuidedReadingContent = async (
  filters?: {
    level?: 'beginner' | 'intermediate' | 'advanced';
    category?: string;
    limit?: number;
  }
): Promise<GuidedReadingContent[]> => {
  try {
    let q = collection(db, 'guidedReadingContent');
    let queryConstraints = [];
    
    // Add filters if provided
    if (filters?.level) {
      queryConstraints.push(where('level', '==', filters.level));
    }
    
    if (filters?.category) {
      queryConstraints.push(where('category', '==', filters.category));
    }
    
    // Add ordering and limit
    queryConstraints.push(orderBy('title'));
    
    if (filters?.limit) {
      queryConstraints.push(limit(filters.limit));
    }
    
    // Apply query constraints
    const contentQuery = query(q, ...queryConstraints);
    const querySnapshot = await getDocs(contentQuery);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as GuidedReadingContent[];
  } catch (error) {
    console.error('Error getting guided reading content:', error);
    
    // Fallback to static content if Firestore query fails
    return getStaticGuidedReadingContent(filters);
  }
};

/**
 * Get a specific guided reading content by ID
 * @param contentId The ID of the content to get
 * @returns The guided reading content or null if not found
 */
export const getGuidedReadingContentById = async (contentId: string): Promise<GuidedReadingContent | null> => {
  try {
    const contentRef = doc(db, 'guidedReadingContent', contentId);
    const contentSnap = await getDoc(contentRef);
    
    if (contentSnap.exists()) {
      return { id: contentSnap.id, ...contentSnap.data() } as GuidedReadingContent;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting guided reading content by ID:', error);
    
    // Fallback to static content if Firestore query fails
    const staticContent = getStaticGuidedReadingContent();
    return staticContent.find(content => content.id === contentId) || null;
  }
};

/**
 * Get Q&A questions from Firestore
 * @param filters Optional filters for question selection
 * @returns Array of Q&A questions
 */
export const getQAQuestions = async (
  filters?: {
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    limit?: number;
  }
): Promise<QAQuestion[]> => {
  try {
    let q = collection(db, 'qaQuestions');
    let queryConstraints = [];
    
    // Add filters if provided
    if (filters?.difficulty) {
      queryConstraints.push(where('difficulty', '==', filters.difficulty));
    }
    
    if (filters?.category) {
      queryConstraints.push(where('category', '==', filters.category));
    }
    
    // Add ordering and limit
    queryConstraints.push(orderBy('question'));
    
    if (filters?.limit) {
      queryConstraints.push(limit(filters.limit));
    }
    
    // Apply query constraints
    const questionsQuery = query(q, ...queryConstraints);
    const querySnapshot = await getDocs(questionsQuery);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as QAQuestion[];
  } catch (error) {
    console.error('Error getting Q&A questions:', error);
    
    // Fallback to static questions if Firestore query fails
    return getStaticQAQuestions(filters);
  }
};

/**
 * Get a specific Q&A question by ID
 * @param questionId The ID of the question to get
 * @returns The Q&A question or null if not found
 */
export const getQAQuestionById = async (questionId: string): Promise<QAQuestion | null> => {
  try {
    const questionRef = doc(db, 'qaQuestions', questionId);
    const questionSnap = await getDoc(questionRef);
    
    if (questionSnap.exists()) {
      return { id: questionSnap.id, ...questionSnap.data() } as QAQuestion;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Q&A question by ID:', error);
    
    // Fallback to static questions if Firestore query fails
    const staticQuestions = getStaticQAQuestions();
    return staticQuestions.find(question => question.id === questionId) || null;
  }
};

/**
 * Get practice content recommendations based on user's goals and preferences
 * @param userId The ID of the user
 * @param practiceType The type of practice (guided or qa)
 * @returns Array of recommended content IDs
 */
export const getRecommendedContent = async (
  userId: string,
  practiceType: 'guided' | 'qa'
): Promise<string[]> => {
  // This function would ideally query Firestore for user's goals and history,
  // then recommend appropriate content based on that information
  
  // For now, return some static recommendations
  if (practiceType === 'guided') {
    return ['gr1', 'gr2', 'gr3'];
  } else {
    return ['qa1', 'qa2', 'qa3'];
  }
};

// Static content for fallback when Firestore is unavailable
export const getStaticGuidedReadingContent = (
  filters?: {
    level?: 'beginner' | 'intermediate' | 'advanced';
    category?: string;
    limit?: number;
  }
): GuidedReadingContent[] => {
  const staticContent: GuidedReadingContent[] = [
    {
      id: 'gr1',
      title: 'The Importance of Clear Communication',
      level: 'beginner',
      category: 'business',
      text: 'Clear communication is essential in every aspect of life, but especially in professional settings. When we communicate clearly, we reduce misunderstandings, build trust, and improve efficiency. Effective communicators consider their audience, choose their words carefully, and organize their thoughts logically. They also understand the importance of active listening, which is a critical but often overlooked component of communication. By prioritizing clear communication in our daily interactions, we can build stronger relationships and achieve better outcomes in both our personal and professional lives.',
      estimatedDuration: 45,
      keywords: ['communication', 'clarity', 'business', 'listening']
    },
    {
      id: 'gr2',
      title: 'Preparing for a Successful Presentation',
      level: 'intermediate',
      category: 'presentation',
      text: 'Delivering a successful presentation requires thorough preparation. Start by understanding your audience: their knowledge level, interests, and expectations. Then, structure your content with a clear beginning, middle, and end. The introduction should grab attention and establish your credibility. The main body should present your key points with supporting evidence. Finally, the conclusion should summarize your message and include a call to action. Practice your delivery multiple times, focusing on pace, clarity, and engaging your audience. Remember that your body language and vocal variety are just as important as your words. With proper preparation, you can deliver a presentation that resonates with your audience and achieves your goals.',
      estimatedDuration: 60,
      keywords: ['presentation', 'public speaking', 'preparation', 'structure']
    },
    {
      id: 'gr3',
      title: 'Techniques for Managing Interview Anxiety',
      level: 'intermediate',
      category: 'interview',
      text: 'Interview anxiety is a common experience, but there are effective techniques to manage it. First, thorough preparation helps build confidence: research the company, practice common questions, and prepare examples of your achievements. Before the interview, use deep breathing exercises to calm your nervous system. Visualize success by imagining yourself answering questions confidently. During the interview, remember to pause when needed instead of rushing or using filler words. Focus on the conversation rather than your internal worries. If you make a mistake, simply acknowledge it briefly and move on. Remember that some anxiety is normal and can actually help you perform better by keeping you alert and focused. With practice, these techniques can help you transform anxiety into positive energy during interviews.',
      estimatedDuration: 55,
      keywords: ['interview', 'anxiety', 'techniques', 'preparation']
    },
    {
      id: 'gr4',
      title: 'The Art of Persuasive Speaking',
      level: 'advanced',
      category: 'persuasion',
      text: 'Persuasive speaking is a powerful skill that enables you to influence others and drive action. ' +
            'The most effective persuasive speakers understand three key principles: ethos (credibility), pathos ' +
            '(emotional connection), and logos (logical reasoning). To establish credibility, demonstrate expertise ' +
            'and authenticity in your communication. To create emotional connection, tell compelling stories that ' +
            'resonate with your audience\'s values and experiences. For logical reasoning, present clear evidence ' +
            'and address potential counterarguments. Structure your persuasive message with a clear thesis, supporting ' +
            'points, and a compelling call to action. Remember that persuasion isn\'t about manipulation, but rather ' +
            'about helping others see the value in your perspective or proposal. By mastering these elements of ' +
            'persuasive speaking, you can become more influential in both professional and personal contexts.',
      estimatedDuration: 65,
      keywords: ['persuasion', 'influence', 'credibility', 'emotional connection']
    },
    {
      id: 'gr5',
      title: 'Everyday Conversation Skills',
      level: 'beginner',
      category: 'everyday',
      text: 'Everyday conversations form the foundation of our relationships and social interactions. ' +
            'To become a better conversationalist, focus on developing several key skills. First, practice ' +
            'active listening by maintaining eye contact, asking clarifying questions, and avoiding interruptions. ' +
            'Second, show genuine interest in others by asking open-ended questions that encourage detailed responses. ' +
            'Third, be mindful of balancing speaking and listening - aim for roughly equal participation. ' +
            'Fourth, develop your ability to find common ground and connections with diverse people. ' +
            'Finally, practice empathy by trying to understand others\' perspectives and feelings. ' +
            'Remember that good conversation is like a tennis match, with a natural back-and-forth flow. ' +
            'By improving these everyday conversation skills, you can build stronger connections and make ' +
            'a positive impression in both casual and professional settings.',
      estimatedDuration: 50,
      keywords: ['conversation', 'listening', 'social skills', 'everyday']
    }
  ];
  
  // Apply filters if provided
  let filteredContent = [...staticContent];
  
  if (filters?.level) {
    filteredContent = filteredContent.filter(content => content.level === filters.level);
  }
  
  if (filters?.category) {
    filteredContent = filteredContent.filter(content => content.category === filters.category);
  }
  
  // Apply limit if provided
  if (filters?.limit && filters.limit > 0) {
    filteredContent = filteredContent.slice(0, filters.limit);
  }
  
  return filteredContent;
};

// Static Q&A questions for fallback when Firestore is unavailable
export const getStaticQAQuestions = (
  filters?: {
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    limit?: number;
  }
): QAQuestion[] => {
  const staticQuestions: QAQuestion[] = [
    {
      id: 'qa1',
      question: 'Tell me about yourself and your background.',
      category: 'interview',
      difficulty: 'easy',
      suggestedTopics: ['professional experience', 'education', 'skills', 'career goals']
    },
    {
      id: 'qa2',
      question: 'What are your greatest strengths and how have you applied them?',
      category: 'interview',
      difficulty: 'medium',
      suggestedTopics: ['skills', 'achievements', 'examples', 'self-awareness']
    },
    {
      id: 'qa3',
      question: 'Describe a challenge you faced at work and how you overcame it.',
      category: 'interview',
      difficulty: 'medium',
      context: 'This question assesses your problem-solving skills and resilience.',
      suggestedTopics: ['problem-solving', 'teamwork', 'adaptability', 'results']
    },
    {
      id: 'qa4',
      question: 'How would you explain a complex technical concept to someone with no technical background?',
      category: 'presentation',
      difficulty: 'hard',
      suggestedTopics: ['analogies', 'simplification', 'visual aids', 'audience adaptation']
    },
    {
      id: 'qa5',
      question: 'Where do you see yourself in five years?',
      category: 'interview',
      difficulty: 'medium',
      context: 'This question evaluates your career planning and ambition.',
      suggestedTopics: ['career goals', 'growth', 'aspirations', 'development']
    },
    {
      id: 'qa6',
      question: 'Pitch your solution to a common problem in your industry.',
      category: 'presentation',
      difficulty: 'hard',
      suggestedTopics: ['innovation', 'problem-solution format', 'value proposition', 'implementation']
    },
    {
      id: 'qa7',
      question: 'Describe your approach to working in a team with diverse perspectives.',
      category: 'everyday',
      difficulty: 'medium',
      suggestedTopics: ['collaboration', 'diversity', 'conflict resolution', 'listening skills']
    },
    {
      id: 'qa8',
      question: 'How do you stay updated with the latest trends in your field?',
      category: 'interview',
      difficulty: 'easy',
      suggestedTopics: ['continuous learning', 'professional development', 'industry resources', 'networking']
    }
  ];
  
  // Apply filters if provided
  let filteredQuestions = [...staticQuestions];
  
  if (filters?.difficulty) {
    filteredQuestions = filteredQuestions.filter(question => question.difficulty === filters.difficulty);
  }
  
  if (filters?.category) {
    filteredQuestions = filteredQuestions.filter(question => question.category === filters.category);
  }
  
  // Apply limit if provided
  if (filters?.limit && filters.limit > 0) {
    filteredQuestions = filteredQuestions.slice(0, filters.limit);
  }
  
  return filteredQuestions;
};
