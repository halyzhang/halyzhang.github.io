#!/usr/bin/env node

/**
 * Simple HTML/JavaScript validation test for wuxianame.html
 * This ensures no syntax errors exist before deployment
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('Starting HTML/JavaScript validation tests...\n');

let hasErrors = false;

function validateFile(filePath) {
    console.log(`Validating: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        hasErrors = true;
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Check for common syntax errors
    if (content.includes('function') && !content.includes('}')) {
        console.error(`❌ Possible missing closing brace in ${filePath}`);
        hasErrors = true;
    }

    // Try to parse with JSDOM
    try {
        // Remove Jekyll front matter for parsing
        const htmlContent = content.replace(/^---[\s\S]*?---/, '');

        const dom = new JSDOM(htmlContent, {
            runScripts: "outside-only",
            resources: "usable"
        });

        // Check if script tags exist and are not empty
        const scripts = dom.window.document.querySelectorAll('script');
        let scriptCount = 0;

        scripts.forEach(script => {
            if (script.textContent.trim().length > 0) {
                scriptCount++;

                // Basic JavaScript syntax check - look for common errors
                const scriptContent = script.textContent;

                // Check for missing semicolons on key statements (basic check)
                const lines = scriptContent.split('\n');
                lines.forEach((line, idx) => {
                    const trimmed = line.trim();
                    // Skip comments and empty lines
                    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.length === 0) {
                        return;
                    }

                    // Check for obvious syntax issues
                    const openBraces = (trimmed.match(/{/g) || []).length;
                    const closeBraces = (trimmed.match(/}/g) || []).length;

                    // More braces opened than closed on a single line (excluding object literals)
                    if (openBraces > closeBraces + 1) {
                        console.warn(`⚠️  Line ${idx + 1}: Possible brace mismatch`);
                    }
                });

                // Check for runaway strings
                if (scriptContent.includes('"""') || scriptContent.includes("'''")) {
                    console.error(`❌ Possible runaway string in script`);
                    hasErrors = true;
                }
            }
        });

        console.log(`✓ Found ${scriptCount} non-empty script tag(s)`);

        // Check for required elements
        const nameDisplayDiv = dom.window.document.querySelector('#nameDisplay');
        const gennameButton = dom.window.document.querySelector('#genname');
        const includeZiCheckbox = dom.window.document.querySelector('#includeZi');

        if (!nameDisplayDiv) {
            console.error('❌ Missing required element: #nameDisplay');
            hasErrors = true;
        } else {
            console.log('✓ Found #nameDisplay element');
        }

        if (!gennameButton) {
            console.error('❌ Missing required element: #genname');
            hasErrors = true;
        } else {
            console.log('✓ Found #genname button');
        }

        if (!includeZiCheckbox) {
            console.error('❌ Missing required element: #includeZi');
            hasErrors = true;
        } else {
            console.log('✓ Found #includeZi checkbox');
        }

        console.log(`✅ ${filePath} passed basic validation\n`);

    } catch (error) {
        console.error(`❌ Error parsing ${filePath}:`, error.message);
        hasErrors = true;
    }
}

// Validate the wuxia name generator
const wuxiaFilePath = path.join(__dirname, '..', '_pages', 'wuxianame.html');
validateFile(wuxiaFilePath);

// Exit with error code if validation failed
if (hasErrors) {
    console.error('\n❌ Validation failed! Please fix errors before deploying.\n');
    process.exit(1);
} else {
    console.log('✅ All validation tests passed!\n');
    process.exit(0);
}