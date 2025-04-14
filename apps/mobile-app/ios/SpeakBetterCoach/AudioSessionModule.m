#import "AudioSessionModule.h"
#import <AVFoundation/AVFoundation.h>

@implementation AudioSessionModule

RCT_EXPORT_MODULE();

// Supported events that can be emitted to JavaScript
- (NSArray<NSString *> *)supportedEvents {
  return @[@"audioSessionInterruption", @"audioRouteChange"];
}

RCT_EXPORT_METHOD(configureAudioSession:(NSString *)mode 
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  AVAudioSessionCategory category;
  AVAudioSessionCategoryOptions options = 0;
  
  // Select the appropriate category based on mode
  if ([mode isEqualToString:@"recording"]) {
    category = AVAudioSessionCategoryRecord;
  } else if ([mode isEqualToString:@"playback"]) {
    category = AVAudioSessionCategoryPlayback;
  } else {
    // Default to playAndRecord
    category = AVAudioSessionCategoryPlayAndRecord;
    options = AVAudioSessionCategoryOptionDefaultToSpeaker;
  }
  
  NSError *error = nil;
  
  // Configure and activate the audio session
  [[AVAudioSession sharedInstance] setCategory:category
                                   withOptions:options
                                         error:&error];
  if (error) {
    reject(@"audio_session_error", @"Failed to configure audio session category", error);
    return;
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

RCT_EXPORT_METHOD(getAudioSessionInfo:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  AVAudioSession *session = [AVAudioSession sharedInstance];
  double sampleRate = session.sampleRate;
  NSInteger outputChannels = session.outputNumberOfChannels;
  NSInteger inputChannels = session.inputNumberOfChannels;
  double bufferDuration = session.IOBufferDuration;
  BOOL isInputAvailable = session.isInputAvailable;
  
  resolve(@{
    @"sampleRate": @(sampleRate),
    @"outputChannels": @(outputChannels),
    @"inputChannels": @(inputChannels),
    @"bufferDuration": @(bufferDuration),
    @"isInputAvailable": @(isInputAvailable),
    @"currentRoute": [self getCurrentAudioRouteInfo]
  });
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
