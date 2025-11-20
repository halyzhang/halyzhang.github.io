/**
 * Visual Regression Tests
 *
 * Takes screenshots of all website pages across different browsers/platforms
 * to catch unintended visual changes.
 *
 * Run with: npm run test:visual
 * Update screenshots: npm run test:visual:update
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Pages to test - add more as needed
const pages = [
  { path: '/', name: 'home' },
  { path: '/wuxianame/', name: 'wuxia-name-generator', dynamicSelector: '#nameDisplay' },
  { path: '/writingprompt/', name: 'writing-prompts', dynamicSelector: '#promptDisplay' },
  { path: '/books/', name: 'books' },
  { path: '/about/', name: 'about' },
];

test.describe('Visual Regression Tests - Desktop', () => {
  const siteDir = path.resolve(__dirname, '..', '_site');

  test.beforeAll(async () => {
    if (!fs.existsSync(siteDir)) {
      throw new Error('Site not built. Run "npm run build" first.');
    }
  });

  for (const page of pages) {
    test(`${page.name} - full page`, async ({ page: browserPage, browserName }) => {
      await browserPage.goto(page.path);
      await browserPage.waitForLoadState('networkidle');

      // Remove dynamic content for pages with random generation
      if (page.dynamicSelector) {
        await browserPage.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (element) {
            element.remove();
          }
        }, page.dynamicSelector);
      }

      // Take full page screenshot
      const screenshot = await browserPage.screenshot({ fullPage: true });

      expect(screenshot).toMatchSnapshot(`${page.name}-${browserName}.png`);
    });
  }
});

test.describe('Visual Regression Tests - Mobile', () => {
  const siteDir = path.resolve(__dirname, '..', '_site');

  test.beforeAll(async () => {
    if (!fs.existsSync(siteDir)) {
      throw new Error('Site not built. Run "npm run build" first.');
    }
  });

  for (const page of pages) {
    test(`${page.name} - mobile`, async ({ page: browserPage, browserName }) => {
      await browserPage.goto(page.path);
      await browserPage.waitForLoadState('networkidle');

      // Remove dynamic content for pages with random generation
      if (page.dynamicSelector) {
        await browserPage.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (element) {
            element.remove();
          }
        }, page.dynamicSelector);
      }

      // Take full page screenshot
      const screenshot = await browserPage.screenshot({ fullPage: true });

      expect(screenshot).toMatchSnapshot(`${page.name}-mobile-${browserName}.png`);
    });
  }
});
