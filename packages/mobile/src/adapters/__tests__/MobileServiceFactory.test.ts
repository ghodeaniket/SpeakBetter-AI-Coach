/**
 * Mobile Service Factory Tests
 */

import {
  mobileServiceFactory,
  MobileServiceFactory,
} from "../MobileServiceFactory";
import { MobileAudioAdapter } from "../MobileAudioAdapter";
import { MobileSpeechAdapter } from "../MobileSpeechAdapter";
import { FirebaseAuthAdapter } from "../FirebaseAuthAdapter";
import { MobileNetworkAdapter } from "../MobileNetworkAdapter";
import { Platform } from "@speakbetter/core/services";

// Mock the service implementations to avoid actual API calls
jest.mock("../MobileAudioAdapter");
jest.mock("../MobileSpeechAdapter");
jest.mock("../FirebaseAuthAdapter");
jest.mock("../UserProfileAdapter");
jest.mock("../MobileNetworkAdapter");

describe("MobileServiceFactory", () => {
  let factory: MobileServiceFactory;

  beforeEach(() => {
    factory = new MobileServiceFactory();

    // Reset any cached instances
    jest.clearAllMocks();
  });

  it("should return the correct platform", () => {
    expect(factory.getPlatform()).toBe("mobile" as Platform);
  });

  it("should return a singleton instance of the auth service", () => {
    const authService1 = factory.getAuthService();
    const authService2 = factory.getAuthService();

    expect(authService1).toBeInstanceOf(FirebaseAuthAdapter);
    expect(authService1).toBe(authService2); // Should be the same instance
  });

  it("should return a singleton instance of the audio service", () => {
    const audioService1 = factory.getAudioService();
    const audioService2 = factory.getAudioService();

    expect(audioService1).toBeInstanceOf(MobileAudioAdapter);
    expect(audioService1).toBe(audioService2); // Should be the same instance
  });

  it("should return a singleton instance of the speech service", () => {
    const speechService1 = factory.getSpeechService();
    const speechService2 = factory.getSpeechService();

    expect(speechService1).toBeInstanceOf(MobileSpeechAdapter);
    expect(speechService1).toBe(speechService2); // Should be the same instance
  });

  it("should return a singleton instance of the network service", () => {
    const networkService1 = factory.getNetworkService();
    const networkService2 = factory.getNetworkService();

    expect(networkService1).toBeInstanceOf(MobileNetworkAdapter);
    expect(networkService1).toBe(networkService2); // Should be the same instance
  });

  it("should provide the same instance from getAllServices", () => {
    const services = factory.getAllServices();

    expect(services.auth).toBe(factory.getAuthService());
    expect(services.audio).toBe(factory.getAudioService());
    expect(services.speech).toBe(factory.getSpeechService());
    expect(services.network).toBe(factory.getNetworkService());
  });

  it("should export a singleton instance of the factory", () => {
    expect(mobileServiceFactory).toBeInstanceOf(MobileServiceFactory);
  });
});
