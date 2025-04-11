/**
 * Tests for Visualization Service Interface - Mobile Edge Cases
 * 
 * This test suite focuses on mobile-specific scenarios such as:
 * - Resource constraints (memory, CPU)
 * - Intermittent rendering
 * - Device orientation changes
 * - Touch interactions
 * - Screen size adaptations
 */

import {
  VisualizationService,
  VisualizationContext,
  VisualizationGradient,
  VisualizationOptions,
  VisualizationType,
  VisualizationQualityTier
} from '../visualization';

/**
 * Mock visualization context for testing
 */
class MockMobileVisualizationContext implements VisualizationContext {
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
  createLinearGradient = jest.fn(() => new MockVisualizationGradient());
  createRadialGradient = jest.fn(() => new MockVisualizationGradient());
  fillText = jest.fn();
  setTextAlign = jest.fn();
  setTextBaseline = jest.fn();
  setFont = jest.fn();
  save = jest.fn();
  restore = jest.fn();
  
  // Add properties to track call counts for performance testing
  callCount = {
    clear: 0,
    setFillStyle: 0,
    rect: 0,
    fill: 0,
    stroke: 0,
    fillText: 0
  };
  
  constructor() {
    // Override methods to track call counts
    const originalClear = this.clear;
    this.clear = jest.fn(() => {
      this.callCount.clear++;
      return originalClear.call(this);
    });
    
    const originalSetFillStyle = this.setFillStyle;
    this.setFillStyle = jest.fn((style) => {
      this.callCount.setFillStyle++;
      return originalSetFillStyle.call(this, style);
    });
    
    const originalRect = this.rect;
    this.rect = jest.fn((x, y, w, h) => {
      this.callCount.rect++;
      return originalRect.call(this, x, y, w, h);
    });
    
    const originalFill = this.fill;
    this.fill = jest.fn(() => {
      this.callCount.fill++;
      return originalFill.call(this);
    });
    
    const originalStroke = this.stroke;
    this.stroke = jest.fn(() => {
      this.callCount.stroke++;
      return originalStroke.call(this);
    });
    
    const originalFillText = this.fillText;
    this.fillText = jest.fn((text, x, y) => {
      this.callCount.fillText++;
      return originalFillText.call(this, text, x, y);
    });
  }
  
  // Reset call counts for new tests
  resetCallCounts() {
    Object.keys(this.callCount).forEach(key => {
      this.callCount[key] = 0;
    });
  }
}

/**
 * Mock gradient for testing
 */
class MockVisualizationGradient implements VisualizationGradient {
  addColorStop = jest.fn();
}

/**
 * Extended mock visualization service for mobile testing
 */
class MockMobileVisualizationService implements VisualizationService {
  // Base implementation
  createContext = jest.fn();
  releaseContext = jest.fn();
  drawAudioVisualization = jest.fn();
  drawWordTimings = jest.fn();
  drawWaveform = jest.fn();
  createWaveformImage = jest.fn();
  createSpectrogramImage = jest.fn();
  isSupported = jest.fn();
  
  // Tracking for testing
  private contexts: Map<VisualizationContext, {
    active: boolean;
    size: { width: number; height: number };
    container: any;
  }> = new Map();
  
  // Mobile-specific state variables
  private screenOrientation: 'portrait' | 'landscape' = 'portrait';
  private memoryPressure: 'normal' | 'low' | 'critical' = 'normal';
  private isVisible: boolean = true;
  private performanceMode: 'normal' | 'battery-saving' | 'high-performance' = 'normal';
  
  constructor() {
    this.isSupported.mockReturnValue(true);
    
    // Setup createContext
    this.createContext.mockImplementation((container, width, height) => {
      const context = new MockMobileVisualizationContext();
      this.contexts.set(context, { 
        active: true,
        size: { width, height },
        container
      });
      return context;
    });
    
    // Setup releaseContext
    this.releaseContext.mockImplementation((context) => {
      if (this.contexts.has(context)) {
        this.contexts.delete(context);
      }
    });
    
    // Setup drawAudioVisualization with quality tier adaptation
    this.drawAudioVisualization.mockImplementation((context, audioData, options) => {
      if (!this.contexts.has(context) || !this.contexts.get(context)!.active) {
        throw new Error('Context is not active or has been released');
      }
      
      // Check visibility
      if (!this.isVisible) {
        // Skip rendering when not visible
        return;
      }
      
      // Determine appropriate quality tier based on current conditions
      let effectiveQualityTier = options.qualityTier || VisualizationQualityTier.STANDARD;
      
      // Adjust quality based on memory pressure
      if (this.memoryPressure === 'critical') {
        effectiveQualityTier = VisualizationQualityTier.MINIMAL;
      } else if (this.memoryPressure === 'low') {
        effectiveQualityTier = Math.min(
          effectiveQualityTier as number, 
          VisualizationQualityTier.STANDARD as number
        ) as VisualizationQualityTier;
      }
      
      // Adjust quality based on battery saving mode
      if (this.performanceMode === 'battery-saving') {
        effectiveQualityTier = VisualizationQualityTier.MINIMAL;
      } else if (this.performanceMode === 'high-performance') {
        effectiveQualityTier = VisualizationQualityTier.MAXIMUM;
      }
      
      // Simulate drawing operations
      (context as MockMobileVisualizationContext).clear();
      (context as MockMobileVisualizationContext).setFillStyle('#000');
      
      // Simulate different drawing complexities based on quality tier
      const drawOperations = this.getDrawOperationsForQualityTier(effectiveQualityTier);
      
      // Perform the simulated drawing operations
      for (let i = 0; i < drawOperations; i++) {
        (context as MockMobileVisualizationContext).rect(0, 0, 10, 10);
        (context as MockMobileVisualizationContext).fill();
      }
    });
    
    // Setup drawWordTimings
    this.drawWordTimings.mockImplementation((context, wordTimings, currentTime, totalDuration, options) => {
      if (!this.contexts.has(context) || !this.contexts.get(context)!.active) {
        throw new Error('Context is not active or has been released');
      }
      
      // Skip rendering when not visible
      if (!this.isVisible) {
        return;
      }
      
      // Simulate drawing operations
      (context as MockMobileVisualizationContext).clear();
      
      // Draw fewer words in battery saving mode
      const wordLimit = this.performanceMode === 'battery-saving' ? 5 : 
                        this.performanceMode === 'high-performance' ? Infinity : 20;
      
      const wordsToRender = wordTimings.slice(0, wordLimit);
      
      for (const word of wordsToRender) {
        (context as MockMobileVisualizationContext).fillText(word.word, 0, 0);
      }
    });
  }
  
  // Helper method to determine drawing complexity based on quality tier
  private getDrawOperationsForQualityTier(tier: VisualizationQualityTier): number {
    switch(tier) {
      case VisualizationQualityTier.MINIMAL:
        return 10;
      case VisualizationQualityTier.STANDARD:
        return 50;
      case VisualizationQualityTier.HIGH:
        return 100;
      case VisualizationQualityTier.MAXIMUM:
        return 200;
      default:
        return 50;
    }
  }
  
  // Methods to control mock state for testing
  
  setScreenOrientation(orientation: 'portrait' | 'landscape') {
    this.screenOrientation = orientation;
    
    // Update all context sizes based on orientation
    this.contexts.forEach((data, context) => {
      const currentWidth = data.size.width;
      const currentHeight = data.size.height;
      
      if (orientation === 'landscape' && currentWidth < currentHeight) {
        // Swap dimensions
        data.size.width = currentHeight;
        data.size.height = currentWidth;
      } else if (orientation === 'portrait' && currentWidth > currentHeight) {
        // Swap dimensions
        data.size.width = currentHeight;
        data.size.height = currentWidth;
      }
    });
  }
  
  setMemoryPressure(level: 'normal' | 'low' | 'critical') {
    this.memoryPressure = level;
    
    // If critical, release some contexts
    if (level === 'critical') {
      let contextsReleased = 0;
      
      // Release up to half of active contexts
      for (const [context, data] of this.contexts.entries()) {
        if (contextsReleased >= Math.floor(this.contexts.size / 2)) {
          break;
        }
        
        if (data.active) {
          data.active = false;
          contextsReleased++;
        }
      }
    }
  }
  
  setVisibility(isVisible: boolean) {
    this.isVisible = isVisible;
  }
  
  setPerformanceMode(mode: 'normal' | 'battery-saving' | 'high-performance') {
    this.performanceMode = mode;
  }
}

describe('VisualizationService Mobile Edge Cases', () => {
  let service: MockMobileVisualizationService;
  let context: MockMobileVisualizationContext;
  
  beforeEach(() => {
    service = new MockMobileVisualizationService();
    context = new MockMobileVisualizationContext();
    service.createContext({}, 100, 200);
  });
  
  describe('Screen Orientation Changes', () => {
    it('should adapt to orientation changes', () => {
      const container = {};
      const context = service.createContext(container, 200, 400) as MockMobileVisualizationContext;
      
      // Initial state - portrait
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 200,
        height: 400
      });
      
      // Record initial call counts
      const initialCallCount = { ...context.callCount };
      context.resetCallCounts();
      
      // Change to landscape
      service.setScreenOrientation('landscape');
      
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 400,
        height: 200
      });
      
      // Operation counts should be similar regardless of orientation
      expect(context.callCount.clear).toBe(initialCallCount.clear);
      expect(context.callCount.fill).toBe(initialCallCount.fill);
    });
  });
  
  describe('Memory Constraints', () => {
    it('should adapt visualization complexity based on memory pressure', () => {
      const container = {};
      const context = service.createContext(container, 100, 100) as MockMobileVisualizationContext;
      
      // Normal memory conditions
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 100,
        qualityTier: VisualizationQualityTier.HIGH
      });
      
      const normalCallCount = context.callCount.fill;
      context.resetCallCounts();
      
      // Critical memory pressure
      service.setMemoryPressure('critical');
      
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 100,
        qualityTier: VisualizationQualityTier.HIGH
      });
      
      // Should use fewer resources under memory pressure
      // It should downgrade to MINIMAL quality
      expect(context.callCount.fill).toBeLessThan(normalCallCount);
    });
    
    it('should handle context invalidation during memory pressure', () => {
      const container = {};
      const contexts = [
        service.createContext(container, 100, 100),
        service.createContext(container, 100, 100),
        service.createContext(container, 100, 100),
        service.createContext(container, 100, 100)
      ];
      
      // Simulate critical memory pressure
      service.setMemoryPressure('critical');
      
      // Some contexts should now be invalid
      let validContextCount = 0;
      let invalidContextCount = 0;
      
      for (const ctx of contexts) {
        try {
          service.drawAudioVisualization(ctx, new Uint8Array(100), {
            type: VisualizationType.WAVEFORM,
            width: 100,
            height: 100
          });
          validContextCount++;
        } catch (e) {
          invalidContextCount++;
        }
      }
      
      // We should have released some contexts due to memory pressure
      expect(invalidContextCount).toBeGreaterThan(0);
      expect(validContextCount + invalidContextCount).toBe(contexts.length);
    });
  });
  
  describe('Visibility Changes', () => {
    it('should skip rendering when visualization is not visible', () => {
      const container = {};
      const context = service.createContext(container, 100, 100) as MockMobileVisualizationContext;
      
      // Visible state
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100, 
        height: 100
      });
      
      const visibleCallCount = { ...context.callCount };
      context.resetCallCounts();
      
      // Set to not visible
      service.setVisibility(false);
      
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 100
      });
      
      // Should have no drawing operations when not visible
      expect(context.callCount.clear).toBe(0);
      expect(context.callCount.fill).toBe(0);
      
      // Set back to visible
      service.setVisibility(true);
      
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 100
      });
      
      // Should resume normal operation when visible again
      expect(context.callCount.clear).toBe(visibleCallCount.clear);
      expect(context.callCount.fill).toBe(visibleCallCount.fill);
    });
  });
  
  describe('Battery Optimization', () => {
    it('should reduce visualization quality in battery saving mode', () => {
      const container = {};
      const context = service.createContext(container, 100, 100) as MockMobileVisualizationContext;
      
      // Normal mode
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 100,
        qualityTier: VisualizationQualityTier.HIGH
      });
      
      const normalCallCount = context.callCount.fill;
      context.resetCallCounts();
      
      // Battery saving mode
      service.setPerformanceMode('battery-saving');
      
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 100,
        qualityTier: VisualizationQualityTier.HIGH
      });
      
      // Should use fewer resources in battery saving mode
      expect(context.callCount.fill).toBeLessThan(normalCallCount);
    });
    
    it('should enhance visualization quality in high performance mode', () => {
      const container = {};
      const context = service.createContext(container, 100, 100) as MockMobileVisualizationContext;
      
      // Normal mode
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 100,
        qualityTier: VisualizationQualityTier.STANDARD
      });
      
      const normalCallCount = context.callCount.fill;
      context.resetCallCounts();
      
      // High performance mode
      service.setPerformanceMode('high-performance');
      
      service.drawAudioVisualization(context, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 100,
        qualityTier: VisualizationQualityTier.STANDARD
      });
      
      // Should use more resources in high performance mode
      expect(context.callCount.fill).toBeGreaterThan(normalCallCount);
    });
  });
  
  describe('Word Timing Visualization', () => {
    it('should limit word rendering in battery saving mode', () => {
      const container = {};
      const context = service.createContext(container, 100, 100) as MockMobileVisualizationContext;
      
      // Create a large array of word timings
      const wordTimings = Array.from({ length: 30 }, (_, i) => ({
        word: `word${i}`,
        startTime: i * 0.5,
        endTime: (i + 1) * 0.5
      }));
      
      // Normal mode
      service.drawWordTimings(context, wordTimings, 5, 30);
      
      const normalCallCount = context.callCount.fillText;
      context.resetCallCounts();
      
      // Battery saving mode
      service.setPerformanceMode('battery-saving');
      
      service.drawWordTimings(context, wordTimings, 5, 30);
      
      // Should render fewer words in battery saving mode
      expect(context.callCount.fillText).toBeLessThan(normalCallCount);
    });
  });
  
  describe('Context Management', () => {
    it('should properly release contexts and handle cleanup', () => {
      const container = {};
      const context1 = service.createContext(container, 100, 100);
      const context2 = service.createContext(container, 100, 100);
      
      // Use both contexts
      service.drawAudioVisualization(context1, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 100
      });
      
      service.drawAudioVisualization(context2, new Uint8Array(100), {
        type: VisualizationType.WAVEFORM,
        width: 100,
        height: 100
      });
      
      // Release one context
      service.releaseContext(context1);
      
      // Should throw when using released context
      expect(() => {
        service.drawAudioVisualization(context1, new Uint8Array(100), {
          type: VisualizationType.WAVEFORM,
          width: 100,
          height: 100
        });
      }).toThrow();
      
      // Should still work with active context
      expect(() => {
        service.drawAudioVisualization(context2, new Uint8Array(100), {
          type: VisualizationType.WAVEFORM,
          width: 100,
          height: 100
        });
      }).not.toThrow();
    });
  });
});
