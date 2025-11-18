#!/usr/bin/env node

/**
 * Generator Functionality Tests
 * Tests that the wuxia name and writing prompts generators work correctly
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('Starting generator functionality tests...\n');

let hasErrors = false;

/**
 * Test that a generator page has proper structure and JavaScript
 */
function testGeneratorPage(htmlPath, pageName, expectations) {
    console.log(`\n=== Testing ${pageName} ===\n`);

    if (!fs.existsSync(htmlPath)) {
        console.error(`❌ File not found: ${htmlPath}\n`);
        hasErrors = true;
        return;
    }

    const content = fs.readFileSync(htmlPath, 'utf8');
    const htmlContent = content.replace(/^---[\s\S]*?---/, '');

    try {
        // Test 1: Check for required DOM elements
        console.log('Checking required DOM elements...');
        expectations.elements.forEach(elementId => {
            if (htmlContent.includes(`id="${elementId}"`)) {
                console.log(`✓ Found element: #${elementId}`);
            } else {
                console.error(`❌ Missing element: #${elementId}`);
                hasErrors = true;
            }
        });

        // Test 2: Check for required functions
        console.log('\nChecking required JavaScript functions...');
        expectations.functions.forEach(funcName => {
            const functionPattern = new RegExp(`function\\s+${funcName}\\s*\\(|const\\s+${funcName}\\s*=|let\\s+${funcName}\\s*=`, 'g');
            if (functionPattern.test(htmlContent)) {
                console.log(`✓ Found function: ${funcName}`);
            } else {
                console.error(`❌ Missing function: ${funcName}`);
                hasErrors = true;
            }
        });

        // Test 3: Check for event listeners
        console.log('\nChecking event listeners...');
        expectations.buttons.forEach(btn => {
            // Check for both addEventListener and jQuery .on() patterns
            const addEventListenerPattern = new RegExp(`getElementById\\(['"]${btn.id}['"]\\).*addEventListener\\(['"]click['"]`, 's');
            const jqueryOnPattern = new RegExp(`\\(['"]#${btn.id}['"]\\).*\\.on\\(['"]click['"]`, 's');
            const jqueryClickPattern = new RegExp(`\\(['"]#${btn.id}['"]\\).*\\.click\\(`, 's');

            if (addEventListenerPattern.test(htmlContent) || jqueryOnPattern.test(htmlContent) || jqueryClickPattern.test(htmlContent)) {
                console.log(`✓ Event listener attached to #${btn.id}`);
            } else {
                console.error(`❌ No event listener for #${btn.id}`);
                hasErrors = true;
            }
        });

        // Test 4: Check JavaScript syntax (basic validation)
        console.log('\nChecking JavaScript syntax...');
        const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
        if (scriptMatch) {
            const scriptContent = scriptMatch[1];

            // Count braces
            const openBraces = (scriptContent.match(/{/g) || []).length;
            const closeBraces = (scriptContent.match(/}/g) || []).length;

            if (openBraces === closeBraces) {
                console.log(`✓ Braces balanced: ${openBraces} opening, ${closeBraces} closing`);
            } else {
                console.error(`❌ Braces unbalanced: ${openBraces} opening, ${closeBraces} closing`);
                hasErrors = true;
            }

            // Count parentheses
            const openParens = (scriptContent.match(/\(/g) || []).length;
            const closeParens = (scriptContent.match(/\)/g) || []).length;

            if (openParens === closeParens) {
                console.log(`✓ Parentheses balanced: ${openParens} opening, ${closeParens} closing`);
            } else {
                console.error(`❌ Parentheses unbalanced: ${openParens} opening, ${closeParens} closing`);
                hasErrors = true;
            }

            // Check for IIFE pattern
            if (scriptContent.includes('(function()') && scriptContent.includes('})();')) {
                console.log('✓ JavaScript wrapped in IIFE');
            } else {
                console.warn('⚠️  JavaScript not wrapped in IIFE (may cause global namespace pollution)');
            }
        } else {
            console.error('❌ No script tag found');
            hasErrors = true;
        }

        // Test 5: Check Bootstrap button classes
        console.log('\nChecking button styling...');
        expectations.buttons.forEach(btn => {
            const buttonPattern = new RegExp(`id="${btn.id}"[^>]*class="[^"]*btn\\s+btn-`, 'g');
            if (buttonPattern.test(htmlContent)) {
                console.log(`✓ #${btn.id} has proper Bootstrap button class`);
            } else {
                console.error(`❌ #${btn.id} missing Bootstrap button class`);
                hasErrors = true;
            }
        });

        console.log(`\n✅ ${pageName} tests completed\n`);

    } catch (error) {
        console.error(`❌ Error testing ${htmlPath}:`, error.message);
        hasErrors = true;
    }
}

// Run tests
const projectRoot = path.join(__dirname, '..');

// Test Writing Prompts Generator
testGeneratorPage(
    path.join(projectRoot, '_pages', 'writingprompts.html'),
    'Writing Prompts Generator',
    {
        elements: ['generateBtn', 'promptDisplay', 'promptText', 'copyBtn'],
        functions: ['generatePrompt', 'copyPrompt', 'getRandomElement', 'shuffle'],
        buttons: [
            { id: 'generateBtn', action: 'generate' },
            { id: 'copyBtn', action: 'copy' }
        ]
    }
);

// Test Wuxia Name Generator
testGeneratorPage(
    path.join(projectRoot, '_pages', 'wuxianame.html'),
    'Wuxia Name Generator',
    {
        elements: ['genname', 'nameDisplay', 'includeZi'],
        functions: ['generateName'],  // Main function in wuxia generator
        buttons: [
            { id: 'genname', action: 'generate' }
        ]
    }
);

// Final summary
console.log('\n=== Test Summary ===\n');

if (hasErrors) {
    console.error('❌ Some generator tests FAILED. Please fix the errors above.\n');
    process.exit(1);
} else {
    console.log('✅ All generator tests PASSED!\n');
    process.exit(0);
}
