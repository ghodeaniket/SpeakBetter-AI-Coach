module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@speakbetter/core': '../core/src',
          '@speakbetter/ui': '../ui/src',
          '@speakbetter/api': '../api/src',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
