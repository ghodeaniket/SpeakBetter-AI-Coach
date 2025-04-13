module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@speakbetter/mobile': '../../packages/mobile/src',
          '@speakbetter/core': '../../packages/core/src',
          '@speakbetter/api': '../../packages/api/src',
          '@speakbetter/ui': '../../packages/ui/src',
          '@speakbetter/state': '../../packages/state/src'
        },
      },
    ],
  ],
};