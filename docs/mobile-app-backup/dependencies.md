# Mobile App Dependencies and Native Modules

## Package.json Dependencies

{
"@speakbetter/api": "_",
"@speakbetter/core": "_",
"@speakbetter/mobile": "_",
"@speakbetter/state": "_",
"@speakbetter/ui": "\*",
"react": "18.2.0",
"react-native": "0.73.0",
"react-native-config": "^1.5.1",
"react-native-safe-area-context": "^4.5.0"
}
-e

## Native Modules

### AudioSessionModule

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <AVFoundation/AVFoundation.h>

@interface AudioSessionModule : RCTEventEmitter <RCTBridgeModule>

@property (nonatomic, strong) AVAudioEngine *audioEngine;
@property (nonatomic, strong) AVAudioInputNode *inputNode;
@property (nonatomic, assign) BOOL isMonitoringInput;

@end
-e

## Podfile Dependencies

```ruby
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, min_ios_version_supported
prepare_react_native_project!

# Uncomment to opt-in to using Flipper
# Note that if you have use_frameworks! enabled, Flipper will not work
#
# flipper_config = ENV['NO_FLIPPER'] == "1" ? FlipperConfiguration.disabled : FlipperConfiguration.enabled
#
# linkage = ENV['USE_FRAMEWORKS']
# if linkage != nil
#   Pod::UI.puts "Configuring Pod with #{linkage}ally linked Frameworks".green
#   use_frameworks! :linkage => linkage.to_sym
# end

# Audio-related dependencies
pod 'ReactNativeAudioToolkit', :path => '../node_modules/@react-native-community/audio-toolkit'
pod 'RNAudio', :path => '../node_modules/react-native-audio'
pod 'RNPermissions', :path => '../node_modules/react-native-permissions'

# Environment configuration
pod 'react-native-config', :path => '../node_modules/react-native-config'

target 'SpeakBetterCoach' do
  config = use_native_modules!

  # Flags change depending on the env values.
  flags = get_default_flags()

  use_react_native!(
    :path => config[:reactNativePath],
    # Hermes is now enabled by default. Disable by setting this flag to false.
    :hermes_enabled => flags[:hermes_enabled],
    :fabric_enabled => flags[:fabric_enabled],
    # Enables Flipper.
    # Note that if you use_frameworks!, Flipper will not work and
    # you should disable the next line.
    # :flipper_configuration => flipper_config,
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  # For more information about permissions, see:
  # https://github.com/zoontek/react-native-permissions#ios
  permissions_path = '../node_modules/react-native-permissions/ios'
  pod 'Permission-Microphone', :path => "#{permissions_path}/Microphone"
  pod 'Permission-Camera', :path => "#{permissions_path}/Camera"
  pod 'Permission-Speech', :path => "#{permissions_path}/Speech"

  target 'SpeakBetterCoachTests' do
    inherit! :complete
    # Pods for testing
  end

  post_install do |installer|
    # https://github.com/facebook/react-native/blob/main/packages/react-native/scripts/react_native_pods.rb#L197-L202
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
    __apply_Xcode_12_5_M1_post_install_workaround(installer)
  end
end
-e
```
