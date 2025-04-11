/**
 * Tests for Visualization Service Interface
 */

import {
  VisualizationService,
  VisualizationContext,
  VisualizationGradient,
  VisualizationOptions,
  VisualizationType
} from '../visualization';

/**
 * Mock implementation of VisualizationContext
 */
class MockVisualizationContext implements VisualizationContext {
  clear = jest.fn();
  setFillStyle = jest.fn();
  setStrokeStyle = jest.fn();
  setLineWidth = jest.fn();
  beginPath = jest.fn();
  moveTo = jest.fn();
  lineTo = jest.fn();
  rect = jest.fn();
  roundedRect = jest.fn();
  fill = jest.fn();
  stroke = jest.fn();
  createLinearGradient = jest.fn();
  createRadialGradient = jest.fn();
  fillText = jest.fn();
  setTextAlign = jest.fn();
  setTextBaseline = jest.fn();
  setFont = jest.fn();
  save = jest.fn();
  restore = jest.fn();
}

/**
 * Mock implementation of VisualizationGradient
 */
class MockVisualizationGradient implements VisualizationGradient {
  addColorStop = jest.fn();
}

/**
 * Mock implementation of VisualizationService
 */
class MockVisualizationService implements VisualizationService {
  createContext = jest.fn();
  releaseContext = jest.fn();
  drawAudioVisualization = jest.fn();
  drawWordTimings = jest.fn();
  drawWaveform = jest.fn();
  createWaveformImage = jest.fn();
  createSpectrogramImage = jest.fn();
  isSupported = jest.fn();
}

describe('VisualizationService Interface', () => {
  let service: VisualizationService;
  let context: VisualizationContext;
  
  beforeEach(() => {
    service = new MockVisualizationService();
    context = new MockVisualizationContext();
    
    (service.createContext as jest.Mock).mockReturnValue(context);
  });
  
  describe('createContext', () => {
    it('should create a visualization context', () => {
      const container = {};
      const width = 100;
      const height = 50;
      
      const result = service.createContext(container, width, height);
      
      expect(service.createContext).toHaveBeenCalledWith(container, width, height);
      expect(result).toBe(context);
    });
  });
  
  describe('releaseContext', () => {
    it('should release a visualization context', () => {
      service.releaseContext(context);
      
      expect(service.releaseContext).toHaveBeenCalledWith(context);
    });
  });
  
  describe('drawAudioVisualization', () => {
    it('should draw audio visualization', () => {
      const audioData = new Uint8Array(10);
      const options: VisualizationOptions = {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 50
      };
      
      service.drawAudioVisualization(context, audioData, options);
      
      expect(service.drawAudioVisualization).toHaveBeenCalledWith(
        context, audioData, options
      );
    });
  });
  
  describe('drawWordTimings', () => {
    it('should draw word timings visualization', () => {
      const wordTimings = [
        { word: 'hello', startTime: 0, endTime: 0.5 },
        { word: 'world', startTime: 0.6, endTime: 1.0 }
      ];
      const currentTime = 0.7;
      const totalDuration = 1.0;
      const options: Partial<VisualizationOptions> = {
        width: 100,
        height: 50
      };
      
      service.drawWordTimings(context, wordTimings, currentTime, totalDuration, options);
      
      expect(service.drawWordTimings).toHaveBeenCalledWith(
        context, wordTimings, currentTime, totalDuration, options
      );
    });
  });
  
  describe('drawWaveform', () => {
    it('should draw waveform from audio buffer', () => {
      const audioBuffer = {} as any;
      const options: Partial<VisualizationOptions> = {
        width: 100,
        height: 50
      };
      
      service.drawWaveform(context, audioBuffer, options);
      
      expect(service.drawWaveform).toHaveBeenCalledWith(
        context, audioBuffer, options
      );
    });
  });
  
  describe('createWaveformImage', () => {
    it('should create a waveform image', async () => {
      const audioData = new Uint8Array(10);
      const options: VisualizationOptions = {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 50
      };
      const imageUrl = 'data:image/png;base64,test';
      
      (service.createWaveformImage as jest.Mock).mockResolvedValue(imageUrl);
      
      const result = await service.createWaveformImage(audioData, options);
      
      expect(service.createWaveformImage).toHaveBeenCalledWith(audioData, options);
      expect(result).toBe(imageUrl);
    });
  });
  
  describe('createSpectrogramImage', () => {
    it('should create a spectrogram image', async () => {
      const audioData = new Uint8Array(10);
      const options: VisualizationOptions = {
        type: VisualizationType.SPECTROGRAM,
        width: 100,
        height: 50
      };
      const imageUrl = 'data:image/png;base64,test';
      
      (service.createSpectrogramImage as jest.Mock).mockResolvedValue(imageUrl);
      
      const result = await service.createSpectrogramImage(audioData, options);
      
      expect(service.createSpectrogramImage).toHaveBeenCalledWith(audioData, options);
      expect(result).toBe(imageUrl);
    });
  });
  
  describe('isSupported', () => {
    it('should return support status', () => {
      (service.isSupported as jest.Mock).mockReturnValue(true);
      
      const supported = service.isSupported();
      
      expect(supported).toBe(true);
    });
  });
});

describe('VisualizationContext Interface', () => {
  let context: VisualizationContext;
  
  beforeEach(() => {
    context = new MockVisualizationContext();
  });
  
  it('should provide drawing methods', () => {
    context.clear();
    expect(context.clear).toHaveBeenCalled();
    
    context.setFillStyle('red');
    expect(context.setFillStyle).toHaveBeenCalledWith('red');
    
    context.setStrokeStyle('blue');
    expect(context.setStrokeStyle).toHaveBeenCalledWith('blue');
    
    context.setLineWidth(2);
    expect(context.setLineWidth).toHaveBeenCalledWith(2);
    
    context.beginPath();
    expect(context.beginPath).toHaveBeenCalled();
    
    context.moveTo(10, 20);
    expect(context.moveTo).toHaveBeenCalledWith(10, 20);
    
    context.lineTo(30, 40);
    expect(context.lineTo).toHaveBeenCalledWith(30, 40);
    
    context.rect(10, 20, 30, 40);
    expect(context.rect).toHaveBeenCalledWith(10, 20, 30, 40);
    
    context.roundedRect(10, 20, 30, 40, 5);
    expect(context.roundedRect).toHaveBeenCalledWith(10, 20, 30, 40, 5);
    
    context.fill();
    expect(context.fill).toHaveBeenCalled();
    
    context.stroke();
    expect(context.stroke).toHaveBeenCalled();
    
    context.fillText('text', 10, 20);
    expect(context.fillText).toHaveBeenCalledWith('text', 10, 20);
    
    context.setTextAlign('center');
    expect(context.setTextAlign).toHaveBeenCalledWith('center');
    
    context.setTextBaseline('middle');
    expect(context.setTextBaseline).toHaveBeenCalledWith('middle');
    
    context.setFont('12px Arial');
    expect(context.setFont).toHaveBeenCalledWith('12px Arial');
    
    context.save();
    expect(context.save).toHaveBeenCalled();
    
    context.restore();
    expect(context.restore).toHaveBeenCalled();
  });
  
  it('should create gradients', () => {
    const gradient = new MockVisualizationGradient();
    
    (context.createLinearGradient as jest.Mock).mockReturnValue(gradient);
    (context.createRadialGradient as jest.Mock).mockReturnValue(gradient);
    
    const linearGradient = context.createLinearGradient(0, 0, 100, 100);
    expect(context.createLinearGradient).toHaveBeenCalledWith(0, 0, 100, 100);
    expect(linearGradient).toBe(gradient);
    
    const radialGradient = context.createRadialGradient(50, 50, 0, 50, 50, 50);
    expect(context.createRadialGradient).toHaveBeenCalledWith(50, 50, 0, 50, 50, 50);
    expect(radialGradient).toBe(gradient);
  });
});
