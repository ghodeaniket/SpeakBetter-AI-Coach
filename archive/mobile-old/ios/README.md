# iOS Project Directory

This directory needs to be initialized using the React Native CLI.

To initialize the iOS project, run:

```bash
cd "/Users/aniketghode/development/Planned Projects/Speak Better/speakbetter-ai-coach"
npx react-native init temp_project --template react-native-template-typescript
cp -r temp_project/ios/* packages/mobile/ios/
rm -rf temp_project
```

After initialization, you can build and run the iOS app using:

```bash
cd packages/mobile
npm run ios
```

Note: For iOS development, you'll need to install CocoaPods dependencies:

```bash
cd packages/mobile/ios
pod install
```
