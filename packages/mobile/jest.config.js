module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx|js|jsx)?$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '@speakbetter/core/(.*)': '<rootDir>/../core/src/$1',
    '@speakbetter/api/(.*)': '<rootDir>/../api/src/$1',
    '@speakbetter/ui/(.*)': '<rootDir>/../ui/src/$1',
    '@speakbetter/state/(.*)': '<rootDir>/../state/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-*|@react-native-*)/)',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
};
