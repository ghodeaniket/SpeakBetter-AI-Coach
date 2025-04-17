#import "AudioSessionModule.h"
#import <AVFoundation/AVFoundation.h>

@implementation AudioSessionModule

RCT_EXPORT_MODULE();

// Supported events that can be emitted to JavaScript
- (NSArray<NSString *> *)supportedEvents {
  return @[
    @"audioSessionInterruption", 
    @"audioRouteChange", 
    @"audioInputLevel",
    @"permissionChange"
  ];
}

- (void)dealloc {
  [self invalidate];
}

- (void)invalidate {
  // Clean up all observers
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  
  // Stop any ongoing audio processes
  if (self.audioEngine && self.audioEngine.isRunning) {
    [self.audioEngine stop];
    [self.inputNode removeTapOnBus:0];
    self.isMonitoringInput = NO;
  }
}

RCT_EXPORT_METHOD(configureAudioSession:(NSString *)mode
                  withOptions:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  AVAudioSessionCategory category;
  AVAudioSessionCategoryOptions categoryOptions = 0;
  
  // Select the appropriate category based on mode
  if ([mode isEqualToString:@"recording"]) {
    category = AVAudioSessionCategoryRecord;
  } else if ([mode isEqualToString:@"playback"]) {
    category = AVAudioSessionCategoryPlayback;
  } else if ([mode isEqualToString:@"speechRecognition"]) {
    // Special mode for speech recognition
    category = AVAudioSessionCategoryRecord;
    // Default options for speech recognition
  } else {
    // Default to playAndRecord
    category = AVAudioSessionCategoryPlayAndRecord;
    categoryOptions = AVAudioSessionCategoryOptionDefaultToSpeaker;
  }
  
  // Add additional options from JS
  if (options[@"allowBluetooth"] && [options[@"allowBluetooth"] boolValue]) {
    categoryOptions |= AVAudioSessionCategoryOptionAllowBluetooth;
  }
  
  if (options[@"allowBluetoothA2DP"] && [options[@"allowBluetoothA2DP"] boolValue]) {
    categoryOptions |= AVAudioSessionCategoryOptionAllowBluetoothA2DP;
  }
  
  if (options[@"mixWithOthers"] && [options[@"mixWithOthers"] boolValue]) {
    categoryOptions |= AVAudioSessionCategoryOptionMixWithOthers;
  }
  
  NSError *error = nil;
  
  // Configure and activate the audio session
  [[AVAudioSession sharedInstance] setCategory:category
                                   withOptions:categoryOptions
                                         error:&error];
  if (error) {
    reject(@"audio_session_error", @"Failed to configure audio session category", error);
    return;
  }
  
  // Set mode if specified
  if (options[@"mode"]) {
    NSString *audioMode = options[@"mode"];
    AVAudioSessionMode avMode;
    
    if ([audioMode isEqualToString:@"default"]) {
      avMode = AVAudioSessionModeDefault;
    } else if ([audioMode isEqualToString:@"measurement"]) {
      avMode = AVAudioSessionModeMeasurement;
    } else if ([audioMode isEqualToString:@"videoRecording"]) {
      avMode = AVAudioSessionModeVideoRecording;
    } else if ([audioMode isEqualToString:@"voiceChat"]) {
      avMode = AVAudioSessionModeVoiceChat;
    } else if ([audioMode isEqualToString:@"gameChat"]) {
      avMode = AVAudioSessionModeGameChat;
    } else if ([audioMode isEqualToString:@"spokenAudio"]) {
      avMode = AVAudioSessionModeSpokenAudio;
    } else {
      avMode = AVAudioSessionModeDefault;
    }
    
    [[AVAudioSession sharedInstance] setMode:avMode error:&error];
    if (error) {
      reject(@"audio_session_error", @"Failed to set audio session mode", error);
      return;
    }
  }
  
  // Set preferred sample rate if specified
  if (options[@"sampleRate"]) {
    double sampleRate = [options[@"sampleRate"] doubleValue];
    [[AVAudioSession sharedInstance] setPreferredSampleRate:sampleRate error:&error];
    if (error) {
      NSLog(@"Warning: Failed to set preferred sample rate: %@", error);
      // Non-fatal error, continue
    }
  }
  
  // Set preferred buffer duration if specified
  if (options[@"bufferDuration"]) {
    double bufferDuration = [options[@"bufferDuration"] doubleValue];
    [[AVAudioSession sharedInstance] setPreferredIOBufferDuration:bufferDuration error:&error];
    if (error) {
      NSLog(@"Warning: Failed to set preferred IO buffer duration: %@", error);
      // Non-fatal error, continue
    }
  }
  
  [[AVAudioSession sharedInstance] setActive:YES error:&error];
  if (error) {
    reject(@"audio_session_error", @"Failed to activate audio session", error);
    return;
  }
  
  // Set up notification observers for audio session events
  [self setupNotifications];
  
  resolve(@{@"success": @YES});
}

// For backward compatibility with existing code
RCT_EXPORT_METHOD(configureAudioSession:(NSString *)mode 
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  [self configureAudioSession:mode withOptions:@{} resolver:resolve rejecter:reject];
}

// Optimize audio session specifically for speech recognition
RCT_EXPORT_METHOD(optimizeForSpeechRecognition:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSError *error = nil;
  
  // Set the audio session mode to measurement, which is optimal for speech processing
  [[AVAudioSession sharedInstance] setMode:AVAudioSessionModeMeasurement error:&error];
  if (error) {
    reject(@"audio_session_error", @"Failed to set audio session mode", error);
    return;
  }
  
  // Set preferred input parameters for speech recognition
  // 16 kHz is standard for speech recognition algorithms
  [[AVAudioSession sharedInstance] setPreferredSampleRate:16000 error:&error];
  if (error) {
    NSLog(@"Warning: Failed to set preferred sample rate: %@", error);
    // Non-fatal error, continue
  }
  
  // Lower I/O buffer duration improves speech recognition latency
  [[AVAudioSession sharedInstance] setPreferredIOBufferDuration:0.005 error:&error];
  if (error) {
    NSLog(@"Warning: Failed to set preferred IO buffer duration: %@", error);
    // Non-fatal error, continue
  }
  
  resolve(@{@"success": @YES});
}

RCT_EXPORT_METHOD(deactivateAudioSession:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSError *error = nil;
  
  [[AVAudioSession sharedInstance] setActive:NO
                                 withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                                       error:&error];
  
  if (error) {
    reject(@"audio_session_error", @"Failed to deactivate audio session", error);
    return;
  }
  
  resolve(@{@"success": @YES});
}

- (void)checkMicrophoneAuthorization:(void(^)(BOOL granted))completion {
  AVAudioSessionRecordPermission permissionStatus = [[AVAudioSession sharedInstance] recordPermission];
  
  switch (permissionStatus) {
    case AVAudioSessionRecordPermissionGranted:
      completion(YES);
      break;
    case AVAudioSessionRecordPermissionDenied:
      completion(NO);
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
        dispatch_async(dispatch_get_main_queue(), ^{
          // Send event to JS when permission status changes
          [self sendEventWithName:@"permissionChange" body:@{
            @"microphone": granted ? @"granted" : @"denied"
          }];
          completion(granted);
        });
      }];
      break;
    default:
      completion(NO);
      break;
  }
}

RCT_EXPORT_METHOD(checkPermissions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  [self checkMicrophoneAuthorization:^(BOOL microphoneGranted) {
    NSDictionary *result = @{
      @"microphone": microphoneGranted ? @"granted" : @"denied"
    };
    resolve(result);
  }];
}

RCT_EXPORT_METHOD(getAudioSessionInfo:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  AVAudioSession *session = [AVAudioSession sharedInstance];
  double sampleRate = session.sampleRate;
  NSInteger outputChannels = session.outputNumberOfChannels;
  NSInteger inputChannels = session.inputNumberOfChannels;
  double bufferDuration = session.IOBufferDuration;
  BOOL isInputAvailable = session.isInputAvailable;
  
  // Get additional information about available inputs
  NSMutableArray *availableInputs = [NSMutableArray array];
  for (AVAudioSessionPortDescription *port in session.availableInputs) {
    [availableInputs addObject:@{
      @"name": port.portName,
      @"type": port.portType,
      @"uid": port.UID ?: @"",
      @"hasDataSource": @(port.dataSources.count > 0)
    }];
  }
  
  // Get audio session mode
  NSString *modeString;
  if ([session.mode isEqualToString:AVAudioSessionModeDefault]) {
    modeString = @"default";
  } else if ([session.mode isEqualToString:AVAudioSessionModeMeasurement]) {
    modeString = @"measurement";
  } else if ([session.mode isEqualToString:AVAudioSessionModeVideoRecording]) {
    modeString = @"videoRecording";
  } else if ([session.mode isEqualToString:AVAudioSessionModeVoiceChat]) {
    modeString = @"voiceChat";
  } else if ([session.mode isEqualToString:AVAudioSessionModeGameChat]) {
    modeString = @"gameChat";
  } else if ([session.mode isEqualToString:AVAudioSessionModeSpokenAudio]) {
    modeString = @"spokenAudio";
  } else {
    modeString = @"unknown";
  }
  
  // Get permission status
  NSString *permissionStatus;
  AVAudioSessionRecordPermission permission = session.recordPermission;
  switch (permission) {
    case AVAudioSessionRecordPermissionGranted:
      permissionStatus = @"granted";
      break;
    case AVAudioSessionRecordPermissionDenied:
      permissionStatus = @"denied";
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      permissionStatus = @"undetermined";
      break;
    default:
      permissionStatus = @"unknown";
      break;
  }
  
  resolve(@{
    @"sampleRate": @(sampleRate),
    @"outputChannels": @(outputChannels),
    @"inputChannels": @(inputChannels),
    @"bufferDuration": @(bufferDuration),
    @"isInputAvailable": @(isInputAvailable),
    @"availableInputs": availableInputs,
    @"currentRoute": [self getCurrentAudioRouteInfo],
    @"mode": modeString,
    @"permissionStatus": permissionStatus,
    @"isActive": @(session.isOtherAudioPlaying)
  });
}

// Audio level monitoring methods
RCT_EXPORT_METHOD(startInputLevelMonitoring:(nonnull NSNumber *)intervalInSeconds
                     resolver:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject) {
  // Check if already monitoring
  if (self.isMonitoringInput) {
    resolve(@{@"success": @YES, @"message": @"Already monitoring input levels"});
    return;
  }
  
  // Ensure we have a valid interval
  NSTimeInterval interval = [intervalInSeconds doubleValue] > 0 ? [intervalInSeconds doubleValue] : 0.1;
  
  // Check permissions first
  [self checkMicrophoneAuthorization:^(BOOL granted) {
    if (!granted) {
      reject(@"permission_error", @"Microphone permission not granted", nil);
      return;
    }
    
    // Create an audio engine and install tap to monitor levels
    self.audioEngine = [[AVAudioEngine alloc] init];
    self.inputNode = self.audioEngine.inputNode;
    
    // Configure format - single channel float for level monitoring
    AVAudioFormat *format = [self.inputNode inputFormatForBus:0];
    
    [self.inputNode installTapOnBus:0 bufferSize:1024 format:format block:^(AVAudioPCMBuffer * _Nonnull buffer, AVAudioTime * _Nonnull when) {
      // Get audio buffer
      float *samples = buffer.floatChannelData[0];
      NSUInteger frameCount = buffer.frameLength;
      
      // Calculate RMS (root mean square) value
      float sum = 0;
      for (NSUInteger i = 0; i < frameCount; i++) {
        float sample = samples[i];
        sum += sample * sample;
      }
      
      float rms = sqrtf(sum / frameCount);
      float db = 20 * log10f(rms);
      
      // Convert to a 0-1 scale for easier use in JS
      // Typical values: -60 dB (quiet) to 0 dB (loud)
      float normalizedLevel = (db + 60) / 60;
      if (normalizedLevel < 0) normalizedLevel = 0;
      if (normalizedLevel > 1) normalizedLevel = 1;
      
      // Emit event to JS
      [self sendEventWithName:@"audioInputLevel" body:@{
        @"level": @(normalizedLevel),
        @"db": @(db)
      }];
    }];
    
    // Start the engine
    NSError *error = nil;
    [self.audioEngine prepare];
    [self.audioEngine startAndReturnError:&error];
    
    if (error) {
      reject(@"audio_engine_error", @"Failed to start audio monitoring", error);
      return;
    }
    
    self.isMonitoringInput = YES;
    resolve(@{@"success": @YES});
  }];
}

RCT_EXPORT_METHOD(stopInputLevelMonitoring:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject) {
  if (!self.isMonitoringInput) {
    resolve(@{@"success": @YES, @"message": @"Not monitoring input"});
    return;
  }
  
  // Stop and reset the audio engine
  [self.audioEngine stop];
  [self.inputNode removeTapOnBus:0];
  self.isMonitoringInput = NO;
  
  resolve(@{@"success": @YES});
}

#pragma mark - Private Methods

- (void)setupNotifications {
  // Remove any existing observers
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  
  // Register for audio session interruption notifications
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleAudioSessionInterruption:)
                                               name:AVAudioSessionInterruptionNotification
                                             object:nil];
  
  // Register for audio route change notifications
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleAudioRouteChange:)
                                               name:AVAudioSessionRouteChangeNotification
                                             object:nil];
  
  // Register for application state change notifications
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(applicationDidEnterBackground:)
                                               name:UIApplicationDidEnterBackgroundNotification
                                             object:nil];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(applicationWillEnterForeground:)
                                               name:UIApplicationWillEnterForegroundNotification
                                             object:nil];
}

- (void)handleAudioSessionInterruption:(NSNotification *)notification {
  NSNumber *interruptionType = notification.userInfo[AVAudioSessionInterruptionTypeKey];
  NSNumber *interruptionOption = notification.userInfo[AVAudioSessionInterruptionOptionKey];
  
  NSDictionary *payload = @{
    @"type": interruptionType,
    @"options": interruptionOption ?: @(0)
  };
  
  [self sendEventWithName:@"audioSessionInterruption" body:payload];
}

- (void)handleAudioRouteChange:(NSNotification *)notification {
  NSNumber *routeChangeReason = notification.userInfo[AVAudioSessionRouteChangeReasonKey];
  
  NSDictionary *payload = @{
    @"reason": routeChangeReason,
    @"currentRoute": [self getCurrentAudioRouteInfo]
  };
  
  [self sendEventWithName:@"audioRouteChange" body:payload];
}

- (void)applicationDidEnterBackground:(NSNotification *)notification {
  // Ensure the audio session stays active in background if needed
  // This is important for recording or playback that should continue
  if (self.isMonitoringInput) {
    NSError *error = nil;
    [[AVAudioSession sharedInstance] setActive:YES withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:&error];
    
    if (error) {
      // Log error but don't fatally fail
      NSLog(@"Error keeping audio session active in background: %@", error);
    }
  }
}

- (void)applicationWillEnterForeground:(NSNotification *)notification {
  // Ensure audio session is still properly configured
  [self reconfigureAudioSessionIfNeeded];
}

- (void)reconfigureAudioSessionIfNeeded {
  // Only reconfigure if we're monitoring input or have an active session
  if (self.isMonitoringInput) {
    AVAudioSession *session = [AVAudioSession sharedInstance];
    
    // Check if the session is still active
    if (!session.isOtherAudioPlaying) {
      NSError *error = nil;
      [session setActive:YES error:&error];
      if (error) {
        NSLog(@"Error reactivating audio session: %@", error);
      }
    }
  }
}

- (NSDictionary *)getCurrentAudioRouteInfo {
  AVAudioSession *session = [AVAudioSession sharedInstance];
  
  NSMutableArray *inputs = [NSMutableArray array];
  for (AVAudioSessionPortDescription *port in session.currentRoute.inputs) {
    [inputs addObject:@{
      @"name": port.portName,
      @"type": port.portType
    }];
  }
  
  NSMutableArray *outputs = [NSMutableArray array];
  for (AVAudioSessionPortDescription *port in session.currentRoute.outputs) {
    [outputs addObject:@{
      @"name": port.portName,
      @"type": port.portType
    }];
  }
  
  return @{
    @"inputs": inputs,
    @"outputs": outputs
  };
}

@end
