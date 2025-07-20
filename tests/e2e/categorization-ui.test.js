/**
 * End-to-end tests for categorization UI and user interactions
 * Tests category selection, auto-detection, and UI feedback
 */

import { test, expect } from '@playwright/test';
import { CATEGORY_TEST_INPUTS } from '../mocks/testData.js';

test.describe('Categorization UI E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="mind-dump-input"]');
  });

  test('should display all 15 categories in dropdown', async ({ page }) => {
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    
    // Open dropdown
    await categoryDropdown.click();
    
    // Check that all categories are present
    const expectedCategories = [
      'AUTO_DETECT', 'GOAL', 'HABIT', 'PROJECT IDEA', 'TASK', 'REMINDER',
      'NOTE', 'INSIGHT', 'LEARNING', 'CAREER', 'METRIC', 'IDEA', 
      'SYSTEM', 'AUTOMATION', 'PERSON', 'SENSITIVE'
    ];
    
    for (const category of expectedCategories) {
      await expect(page.locator(`text=${category}`)).toBeVisible();
    }
    
    // Each category should have an emoji icon
    const categoryItems = page.locator('[data-testid="category-item"]');
    const count = await categoryItems.count();
    expect(count).toBe(16); // 15 categories + auto-detect
    
    // Close dropdown
    await page.keyboard.press('Escape');
  });

  test('should select category and show badge', async ({ page }) => {
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    
    // Initially should show AUTO_DETECT
    await expect(categoryDropdown).toContainText('AUTO_DETECT');
    
    // Open dropdown and select Goal
    await categoryDropdown.click();
    await page.locator('text=GOAL').click();
    
    // Should show selected category in dropdown
    await expect(categoryDropdown).toContainText('GOAL');
    
    // Should show category badge
    const badge = page.locator('[data-testid="category-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('GOAL');
    
    // Badge should have proper styling
    await expect(badge).toHaveClass(/bg-cyber-purple/);
  });

  test('should handle category selection with keyboard navigation', async ({ page }) => {
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    
    // Open dropdown with keyboard
    await categoryDropdown.focus();
    await page.keyboard.press('Enter');
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown'); // Should move to Goal
    await page.keyboard.press('ArrowDown'); // Should move to Habit
    await page.keyboard.press('Enter'); // Select Habit
    
    // Should show Habit as selected
    await expect(categoryDropdown).toContainText('HABIT');
    
    // Should show habit badge
    const badge = page.locator('[data-testid="category-badge"]');
    await expect(badge).toContainText('HABIT');
  });

  test('should process auto-detected categorization', async ({ page }) => {
    // Mock API response for auto-detection
    await page.route('**/api/thoughts', async route => {
      const request = route.request();
      const body = request.postDataJSON();
      
      // Simulate auto-detection of goal category
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          thought: {
            id: 'thought_auto_123',
            raw_text: body.text,
            type: 'goal',
            expanded_text: 'Personal fitness goal with specific target and timeline',
            actions: ['Create workout plan', 'Track daily progress'],
            created_at: new Date().toISOString()
          },
          analysis: {
            type: 'goal',
            title: 'Weight Loss Goal',
            urgency: 'medium',
            sentiment: 'positive'
          },
          timestamp: new Date().toISOString()
        })
      });
    });
    
    const textArea = page.locator('[data-testid="thought-input"]');
    const submitButton = page.locator('[data-testid="submit-button"]');
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    
    // Ensure auto-detect is selected
    await expect(categoryDropdown).toContainText('AUTO_DETECT');
    
    // Enter goal-like input
    await textArea.fill('I want to lose 20 pounds by summer');
    
    // Submit
    await submitButton.click();
    
    // Should show processing state
    await expect(submitButton).toContainText('PROCESSING...');
    
    // Wait for success notification
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Should show detected category in notification
    const notification = page.locator('[data-testid="success-notification"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('Goal');
    await expect(notification).toContainText('Weight Loss Goal');
  });

  test('should override auto-detection with manual selection', async ({ page }) => {
    // Mock API response that respects manual override
    await page.route('**/api/thoughts', async route => {
      const request = route.request();
      const body = request.postDataJSON();
      
      // API should use the manually selected category
      const manualCategory = body.category || 'auto-detect';
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          thought: {
            id: 'thought_manual_123',
            raw_text: body.text,
            type: manualCategory === 'note' ? 'note' : 'goal',
            expanded_text: 'Manual category override test',
            created_at: new Date().toISOString()
          },
          analysis: {
            type: manualCategory === 'note' ? 'note' : 'goal',
            urgency: 'low',
            sentiment: 'neutral'
          }
        })
      });
    });
    
    const textArea = page.locator('[data-testid="thought-input"]');
    const submitButton = page.locator('[data-testid="submit-button"]');
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    
    // Enter text that might be auto-detected as goal
    await textArea.fill('I want to lose weight');
    
    // Manually select Note category instead
    await categoryDropdown.click();
    await page.locator('text=NOTE').click();
    
    // Verify manual selection
    await expect(categoryDropdown).toContainText('NOTE');
    
    // Submit
    await submitButton.click();
    
    // Wait for success notification
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Should show manually selected category
    const notification = page.locator('[data-testid="success-notification"]');
    await expect(notification).toContainText('Note');
  });

  test('should test all category types with appropriate inputs', async ({ page }) => {
    // Test a subset of categories to keep test time reasonable
    const categoriesToTest = [
      { type: 'goal', input: 'I want to run a marathon next year', label: 'GOAL' },
      { type: 'task', input: 'Call dentist for appointment', label: 'TASK' },
      { type: 'project', input: 'Build a mobile app for expense tracking', label: 'PROJECT IDEA' },
      { type: 'habit', input: 'Meditate for 10 minutes daily', label: 'HABIT' },
      { type: 'learning', input: 'Learn React Native development', label: 'LEARNING' }
    ];
    
    for (const category of categoriesToTest) {
      // Mock API response for this category
      await page.route('**/api/thoughts', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            thought: {
              id: `thought_${category.type}_test`,
              raw_text: category.input,
              type: category.type,
              expanded_text: `Expanded ${category.type} content`,
              created_at: new Date().toISOString()
            },
            analysis: {
              type: category.type,
              urgency: 'medium',
              sentiment: 'positive'
            }
          })
        });
      });
      
      const textArea = page.locator('[data-testid="thought-input"]');
      const submitButton = page.locator('[data-testid="submit-button"]');
      const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
      
      // Clear any previous input
      await textArea.clear();
      
      // Select category manually
      await categoryDropdown.click();
      await page.locator(`text=${category.label}`).click();
      
      // Enter appropriate input
      await textArea.fill(category.input);
      
      // Submit
      await submitButton.click();
      
      // Wait for success
      await page.waitForSelector('[data-testid="success-notification"]');
      
      // Verify notification shows correct category
      const notification = page.locator('[data-testid="success-notification"]');
      await expect(notification).toBeVisible();
      
      // Close notification for next test
      const closeButton = page.locator('[data-testid="close-notification"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
      await page.waitForTimeout(500); // Wait for notification to close
    }
  });

  test('should handle sensitive category with special UI treatment', async ({ page }) => {
    // Mock API response for sensitive content
    await page.route('**/api/thoughts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          thought: {
            id: 'thought_sensitive_123',
            raw_text: 'Private family financial information',
            type: 'sensitive',
            created_at: new Date().toISOString()
          },
          analysis: {
            type: 'sensitive',
            urgency: 'high',
            sentiment: 'neutral'
          }
        })
      });
    });
    
    const textArea = page.locator('[data-testid="thought-input"]');
    const submitButton = page.locator('[data-testid="submit-button"]');
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    
    // Select Sensitive category
    await categoryDropdown.click();
    await page.locator('text=SENSITIVE').click();
    
    // Should show warning styling for sensitive category
    const badge = page.locator('[data-testid="category-badge"]');
    await expect(badge).toContainText('SENSITIVE');
    await expect(badge).toHaveClass(/red-400/); // Sensitive has red styling
    
    // Enter sensitive content
    await textArea.fill('Private family financial information');
    
    // Submit
    await submitButton.click();
    
    // Wait for success notification
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Should show sensitive category with appropriate warning
    const notification = page.locator('[data-testid="success-notification"]');
    await expect(notification).toContainText('Sensitive');
    
    // Should include privacy notice
    await expect(notification).toContainText('private'); // or similar privacy indicator
  });

  test('should show category confidence indicators for auto-detection', async ({ page }) => {
    // Mock API response with confidence score
    await page.route('**/api/thoughts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          thought: {
            id: 'thought_confidence_123',
            raw_text: 'Maybe I should exercise more',
            type: 'goal',
            created_at: new Date().toISOString()
          },
          analysis: {
            type: 'goal',
            urgency: 'low',
            sentiment: 'neutral',
            confidence: 0.75
          }
        })
      });
    });
    
    const textArea = page.locator('[data-testid="thought-input"]');
    const submitButton = page.locator('[data-testid="submit-button"]');
    
    // Enter ambiguous input
    await textArea.fill('Maybe I should exercise more');
    
    // Submit with auto-detect
    await submitButton.click();
    
    // Wait for success notification
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Should show confidence indicator
    const notification = page.locator('[data-testid="success-notification"]');
    await expect(notification).toBeVisible();
    
    // Look for confidence indicator (75% confidence)
    const confidenceIndicator = page.locator('[data-testid="confidence-score"]');
    if (await confidenceIndicator.isVisible()) {
      await expect(confidenceIndicator).toContainText('75%');
    }
  });

  test('should handle rapid category changes', async ({ page }) => {
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    
    // Rapidly change categories
    await categoryDropdown.click();
    await page.locator('text=GOAL').click();
    
    await categoryDropdown.click();
    await page.locator('text=TASK').click();
    
    await categoryDropdown.click();
    await page.locator('text=HABIT').click();
    
    // Should show final selection
    await expect(categoryDropdown).toContainText('HABIT');
    
    const badge = page.locator('[data-testid="category-badge"]');
    await expect(badge).toContainText('HABIT');
  });

  test('should maintain category selection across page interactions', async ({ page }) => {
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    const textArea = page.locator('[data-testid="thought-input"]');
    
    // Select a category
    await categoryDropdown.click();
    await page.locator('text=PROJECT IDEA').click();
    
    // Type some text
    await textArea.fill('Build something cool');
    
    // Click elsewhere on the page
    await page.locator('body').click();
    
    // Category should still be selected
    await expect(categoryDropdown).toContainText('PROJECT IDEA');
    
    const badge = page.locator('[data-testid="category-badge"]');
    await expect(badge).toContainText('PROJECT IDEA');
  });

  test('should clear category selection when reset', async ({ page }) => {
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    
    // Select a category
    await categoryDropdown.click();
    await page.locator('text=LEARNING').click();
    
    // Verify selection
    await expect(categoryDropdown).toContainText('LEARNING');
    
    // Reset to auto-detect
    await categoryDropdown.click();
    await page.locator('text=AUTO_DETECT').click();
    
    // Should return to auto-detect
    await expect(categoryDropdown).toContainText('AUTO_DETECT');
    
    // Badge should disappear
    const badge = page.locator('[data-testid="category-badge"]');
    await expect(badge).not.toBeVisible();
  });

  test('should show category-specific help text or hints', async ({ page }) => {
    const categoryDropdown = page.locator('[data-testid="category-dropdown"]');
    const textArea = page.locator('[data-testid="thought-input"]');
    
    // Select different categories and check if placeholder changes
    const categoryTests = [
      { 
        category: 'GOAL', 
        expectedPlaceholder: /goal|objective|target/i 
      },
      { 
        category: 'TASK', 
        expectedPlaceholder: /task|todo|action/i 
      },
      { 
        category: 'HABIT', 
        expectedPlaceholder: /habit|routine|daily/i 
      }
    ];
    
    for (const test of categoryTests) {
      await categoryDropdown.click();
      await page.locator(`text=${test.category}`).click();
      
      // Check if placeholder or help text changes based on category
      const placeholder = await textArea.getAttribute('placeholder');
      if (placeholder && test.expectedPlaceholder) {
        expect(placeholder.toLowerCase()).toMatch(test.expectedPlaceholder);
      }
    }
  });
});