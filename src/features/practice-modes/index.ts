// Export pages
export { default as PracticePage } from './pages/PracticePage';

// Export components
export { default as PracticeTypeSelector } from './components/PracticeTypeSelector';
export { default as GuidedReading } from './components/GuidedReading';
export { default as QASimulation } from './components/QASimulation';

// Export hooks
export { usePracticeMode } from './hooks/usePracticeMode';

// Export services
export {
  getGuidedReadingContent,
  getGuidedReadingContentById,
  getQAQuestions,
  getQAQuestionById,
  getRecommendedContent,
  type GuidedReadingContent,
  type QAQuestion
} from './services/practiceContentService';
