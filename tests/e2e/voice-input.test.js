/**
 * End-to-end tests for voice input functionality
 * Tests speech recognition, UI interactions, and voice-to-categorization flow
 */

import { test, expect } from '@playwright/test';

test.describe('Voice Input E2E Tests', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="mind-dump-input"]');
  });

  test('should display voice input button', async ({ page }) => {
    // Check that voice button is visible
    const voiceButton = page.locator('[data-testid="voice-button"]');
    await expect(voiceButton).toBeVisible();
    
    // Check initial state
    await expect(voiceButton).toContainText('VOICE');
    await expect(voiceButton).not.toHaveClass(/animate-pulse/);
  });

  test('should start voice recognition when button is clicked', async ({ page }) => {
    // Mock speech recognition
    await page.addInitScript(() => {
      // Mock webkitSpeechRecognition
      window.webkitSpeechRecognition = class MockSpeechRecognition {
        constructor() {
          this.continuous = false;
          this.interimResults = false;
          this.lang = '';
          this.onstart = null;
          this.onresult = null;
          this.onerror = null;
          this.onend = null;
        }
        
        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart();
            
            // Simulate speech result
            setTimeout(() => {
              if (this.onresult) {
                const mockEvent = {
                  resultIndex: 0,
                  results: [{
                    isFinal: true,
                    0: { transcript: 'I want to start exercising every morning' }
                  }]
                };
                this.onresult(mockEvent);
              }
            }, 500);
            
            // Simulate end
            setTimeout(() => {
              if (this.onend) this.onend();
            }, 1000);
          }, 100);
        }
        
        stop() {
          if (this.onend) this.onend();
        }
      };
    });
    
    const voiceButton = page.locator('[data-testid="voice-button"]');
    const textArea = page.locator('[data-testid="thought-input"]');
    
    // Click voice button
    await voiceButton.click();
    
    // Should show recording state
    await expect(voiceButton).toContainText('STOP');
    await expect(voiceButton).toHaveClass(/animate-pulse/);
    
    // Wait for speech recognition to complete
    await page.waitForTimeout(1500);
    
    // Should populate text area
    await expect(textArea).toHaveValue('I want to start exercising every morning');
    
    // Should return to normal state
    await expect(voiceButton).toContainText('VOICE');
    await expect(voiceButton).not.toHaveClass(/animate-pulse/);
  });

  test('should handle voice input and categorization flow', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/thoughts', async route => {
      const request = route.request();
      const body = request.postDataJSON();
      
      // Simulate successful categorization
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          thought: {
            id: 'thought_test_123',
            raw_text: body.text,
            type: 'habit',
            expanded_text: 'Daily exercise habit for morning wellness routine',
            actions: ['Set alarm for 6 AM', 'Plan workout routine'],
            created_at: new Date().toISOString()
          },
          analysis: {
            type: 'habit',
            urgency: 'medium',
            sentiment: 'positive'
          },
          timestamp: new Date().toISOString()
        })
      });
    });
    
    // Mock speech recognition with habit input
    await page.addInitScript(() => {
      window.webkitSpeechRecognition = class MockSpeechRecognition {
        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart();
            setTimeout(() => {
              if (this.onresult) {
                const mockEvent = {
                  resultIndex: 0,
                  results: [{
                    isFinal: true,
                    0: { transcript: 'Start meditating for 10 minutes every morning' }
                  }]
                };
                this.onresult(mockEvent);
              }
            }, 300);
            setTimeout(() => {
              if (this.onend) this.onend();
            }, 600);
          }, 100);
        }
        stop() {
          if (this.onend) this.onend();
        }
      };
    });
    
    const voiceButton = page.locator('[data-testid="voice-button"]');
    const submitButton = page.locator('[data-testid="submit-button"]');
    const textArea = page.locator('[data-testid="thought-input"]');
    
    // Start voice input
    await voiceButton.click();
    
    // Wait for voice input to complete
    await page.waitForTimeout(800);
    
    // Verify text was captured
    await expect(textArea).toHaveValue('Start meditating for 10 minutes every morning');
    
    // Submit the thought
    await submitButton.click();
    
    // Should show processing state
    await expect(submitButton).toContainText('PROCESSING...');
    await expect(submitButton).toBeDisabled();
    
    // Wait for processing to complete
    await page.waitForSelector('[data-testid="success-notification"]', { timeout: 10000 });
    
    // Should show success notification
    const notification = page.locator('[data-testid="success-notification"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('Habit');
    
    // Should clear the input
    await expect(textArea).toHaveValue('');
    
    // Submit button should be enabled again
    await expect(submitButton).toContainText('TRANSMIT');
    await expect(submitButton).not.toBeDisabled();
  });

  test('should handle voice recognition errors gracefully', async ({ page }) => {
    // Mock speech recognition with error
    await page.addInitScript(() => {
      window.webkitSpeechRecognition = class MockSpeechRecognition {
        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart();
            setTimeout(() => {
              if (this.onerror) {
                this.onerror(new Error('Speech recognition error'));
              }
            }, 300);
          }, 100);
        }
        stop() {
          if (this.onend) this.onend();
        }
      };
    });
    
    const voiceButton = page.locator('[data-testid="voice-button"]');
    
    // Click voice button
    await voiceButton.click();
    
    // Should show recording state briefly
    await expect(voiceButton).toContainText('STOP');
    
    // Wait for error to occur
    await page.waitForTimeout(500);
    
    // Should return to normal state after error
    await expect(voiceButton).toContainText('VOICE');
    await expect(voiceButton).not.toHaveClass(/animate-pulse/);
  });

  test('should stop voice recognition when stop button is clicked', async ({ page }) => {
    // Mock speech recognition
    await page.addInitScript(() => {
      window.webkitSpeechRecognition = class MockSpeechRecognition {
        constructor() {
          this.isRecording = false;
        }
        
        start() {
          this.isRecording = true;
          setTimeout(() => {
            if (this.onstart) this.onstart();
          }, 100);
        }
        
        stop() {
          this.isRecording = false;
          if (this.onend) this.onend();
        }
      };
    });
    
    const voiceButton = page.locator('[data-testid="voice-button"]');
    
    // Start recording
    await voiceButton.click();
    await expect(voiceButton).toContainText('STOP');
    
    // Stop recording
    await voiceButton.click();
    
    // Should return to normal state
    await expect(voiceButton).toContainText('VOICE');
    await expect(voiceButton).not.toHaveClass(/animate-pulse/);
  });

  test('should handle browser without speech recognition support', async ({ page }) => {
    // Remove speech recognition support
    await page.addInitScript(() => {
      delete window.webkitSpeechRecognition;
      delete window.SpeechRecognition;
    });
    
    const voiceButton = page.locator('[data-testid="voice-button"]');
    
    // Click voice button
    await voiceButton.click();
    
    // Should show some indication that voice is not supported
    // (depends on implementation - might show a tooltip or disable the button)
    await page.waitForTimeout(500);
    
    // Button should remain in normal state since voice isn't supported
    await expect(voiceButton).toContainText('VOICE');
  });

  test('should append multiple voice inputs to existing text', async ({ page }) => {
    const textArea = page.locator('[data-testid="thought-input"]');
    
    // Type some initial text
    await textArea.fill('Initial thought:');
    
    // Mock speech recognition
    await page.addInitScript(() => {
      window.webkitSpeechRecognition = class MockSpeechRecognition {
        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart();
            setTimeout(() => {
              if (this.onresult) {
                const mockEvent = {
                  resultIndex: 0,
                  results: [{
                    isFinal: true,
                    0: { transcript: ' I want to learn a new language' }
                  }]
                };
                this.onresult(mockEvent);
              }
            }, 300);
            setTimeout(() => {
              if (this.onend) this.onend();
            }, 600);
          }, 100);
        }
        stop() {
          if (this.onend) this.onend();
        }
      };
    });
    
    const voiceButton = page.locator('[data-testid="voice-button"]');
    
    // Add voice input
    await voiceButton.click();
    await page.waitForTimeout(800);
    
    // Should append to existing text
    await expect(textArea).toHaveValue('Initial thought: I want to learn a new language');
  });

  test('should show character count during voice input', async ({ page }) => {
    // Mock speech recognition with longer text
    await page.addInitScript(() => {
      window.webkitSpeechRecognition = class MockSpeechRecognition {
        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart();
            setTimeout(() => {
              if (this.onresult) {
                const mockEvent = {
                  resultIndex: 0,
                  results: [{
                    isFinal: true,
                    0: { transcript: 'This is a longer voice input to test the character count feature' }
                  }]
                };
                this.onresult(mockEvent);
              }
            }, 300);
            setTimeout(() => {
              if (this.onend) this.onend();
            }, 600);
          }, 100);
        }
        stop() {
          if (this.onend) this.onend();
        }
      };
    });
    
    const voiceButton = page.locator('[data-testid="voice-button"]');
    const charCount = page.locator('[data-testid="char-count"]');
    
    // Start voice input
    await voiceButton.click();
    await page.waitForTimeout(800);
    
    // Character count should be visible and show correct count
    await expect(charCount).toBeVisible();
    await expect(charCount).toContainText('69 chars'); // Length of the mock transcript
  });

  test('should work with category selection and voice input', async ({ page }) => {
    // Mock API response for learning category
    await page.route('**/api/thoughts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          thought: {
            id: 'thought_test_456',
            raw_text: 'Learn Spanish through daily practice',
            type: 'learning',
            created_at: new Date().toISOString()
          },
          analysis: {
            type: 'learning',
            urgency: 'medium',
            sentiment: 'positive'
          }
        })
      });
    });
    
    // Mock speech recognition
    await page.addInitScript(() => {
      window.webkitSpeechRecognition = class MockSpeechRecognition {
        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart();
            setTimeout(() => {
              if (this.onresult) {
                const mockEvent = {
                  resultIndex: 0,
                  results: [{
                    isFinal: true,
                    0: { transcript: 'Learn Spanish through daily practice' }
                  }]
                };
                this.onresult(mockEvent);
              }
            }, 300);
            setTimeout(() => {
              if (this.onend) this.onend();
            }, 600);
          }, 100);
        }
        stop() {
          if (this.onend) this.onend();
        }
      };
    });
    
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    const voiceButton = page.locator('[data-testid="voice-button"]');
    const submitButton = page.locator('[data-testid="submit-button"]');
    
    // Select Learning category
    await categoryDropdown.click();
    await page.locator('text=LEARNING').click();
    
    // Verify category is selected
    await expect(categoryDropdown).toContainText('LEARNING');
    
    // Use voice input
    await voiceButton.click();
    await page.waitForTimeout(800);
    
    // Submit
    await submitButton.click();
    
    // Wait for success
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Should show Learning category in notification
    const notification = page.locator('[data-testid="success-notification"]');
    await expect(notification).toContainText('Learning');
  });
});