#!/usr/bin/env node

/**
 * Accessibility Compliance Tests
 * Validates that the site follows WCAG accessibility guidelines
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('Starting accessibility compliance tests...\n');

let hasErrors = false;
let hasWarnings = false;

/**
 * Test HTML file for accessibility
 */
function testHTMLForAccessibility(htmlPath, pageName) {
    console.log(`\n=== Testing ${pageName} for accessibility ===\n`);

    if (!fs.existsSync(htmlPath)) {
        console.error(`❌ File not found: ${htmlPath}\n`);
        hasErrors = true;
        return;
    }

    const content = fs.readFileSync(htmlPath, 'utf8');

    // Remove Jekyll front matter for parsing
    const htmlContent = content.replace(/^---[\s\S]*?---/, '');

    try {
        const dom = new JSDOM(htmlContent, {
            runScripts: "outside-only"
        });
        const doc = dom.window.document;

        // Test 1: Check for lang attribute
        console.log('Checking language attributes...');
        const html = doc.querySelector('html');
        if (html && html.getAttribute('lang')) {
            console.log('✓ HTML has lang attribute');
        } else {
            console.error('❌ HTML missing lang attribute');
            hasErrors = true;
        }

        // Test 2: Check heading hierarchy
        console.log('\nChecking heading hierarchy...');
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        let headingIssues = 0;

        headings.forEach((heading, idx) => {
            const level = parseInt(heading.tagName.substring(1));

            // First heading should ideally be h1
            if (idx === 0 && level !== 1) {
                console.warn(`⚠️  First heading is <${heading.tagName.toLowerCase()}>, should be <h1>`);
                hasWarnings = true;
            }

            // Check for skipped levels
            if (previousLevel > 0 && level > previousLevel + 1) {
                console.warn(`⚠️  Heading level skipped from h${previousLevel} to h${level}`);
                hasWarnings = true;
                headingIssues++;
            }

            previousLevel = level;
        });

        if (headingIssues === 0 && headings.length > 0) {
            console.log(`✓ Heading hierarchy is correct (${headings.length} headings)`);
        } else if (headings.length === 0) {
            console.log('ℹ️  No headings found');
        }

        // Test 3: Check for images with alt text
        console.log('\nChecking images for alt text...');
        const images = doc.querySelectorAll('img');
        let missingAltCount = 0;
        let emptyAltCount = 0;

        images.forEach((img) => {
            const src = img.getAttribute('src') || 'unknown';
            const alt = img.getAttribute('alt');

            if (!alt) {
                console.error(`❌ Image missing alt attribute: ${src}`);
                missingAltCount++;
            } else if (alt.trim() === '') {
                // Empty alt is acceptable for decorative images
                emptyAltCount++;
            }
        });

        if (missingAltCount === 0 && images.length > 0) {
            console.log(`✓ All ${images.length} images have alt attributes`);
            if (emptyAltCount > 0) {
                console.log(`ℹ️  ${emptyAltCount} images have empty alt (decorative)`);
            }
        } else if (images.length === 0) {
            console.log('ℹ️  No images found');
        } else {
            console.error(`❌ ${missingAltCount} out of ${images.length} images missing alt attributes`);
            hasErrors = true;
        }

        // Test 4: Check forms for labels
        console.log('\nChecking forms for accessibility...');
        const inputs = doc.querySelectorAll('input, textarea, select');
        let unlabeledInputs = 0;

        inputs.forEach((input) => {
            const id = input.getAttribute('id');
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledBy = input.getAttribute('aria-labelledby');
            const type = input.getAttribute('type');

            // Skip hidden and submit/button types
            if (type === 'hidden' || type === 'submit' || type === 'button') {
                return;
            }

            // Check for associated label
            let hasLabel = false;
            if (id) {
                const label = doc.querySelector(`label[for="${id}"]`);
                if (label) {
                    hasLabel = true;
                }
            }

            if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
                console.error(`❌ Input missing label or aria-label: ${input.outerHTML.substring(0, 50)}...`);
                unlabeledInputs++;
            }
        });

        if (unlabeledInputs === 0 && inputs.length > 0) {
            console.log(`✓ All ${inputs.length} form controls have labels`);
        } else if (inputs.length === 0) {
            console.log('ℹ️  No form controls found');
        } else {
            console.error(`❌ ${unlabeledInputs} out of ${inputs.length} form controls missing labels`);
            hasErrors = true;
        }

        // Test 5: Check links for descriptive text
        console.log('\nChecking links for descriptive text...');
        const links = doc.querySelectorAll('a');
        let emptyLinks = 0;
        let nonDescriptiveLinks = 0;

        const nonDescriptiveTexts = ['click here', 'here', 'read more', 'more', 'link'];

        links.forEach((link) => {
            const text = link.textContent.trim().toLowerCase();
            const ariaLabel = link.getAttribute('aria-label');

            if (!text && !ariaLabel) {
                console.warn(`⚠️  Link has no text content: ${link.getAttribute('href')}`);
                emptyLinks++;
            } else if (nonDescriptiveTexts.includes(text) && !ariaLabel) {
                console.warn(`⚠️  Link has non-descriptive text: "${text}"`);
                nonDescriptiveLinks++;
            }
        });

        if (emptyLinks === 0 && nonDescriptiveLinks === 0 && links.length > 0) {
            console.log(`✓ All ${links.length} links have descriptive text`);
        } else if (links.length === 0) {
            console.log('ℹ️  No links found');
        } else {
            if (emptyLinks > 0) {
                console.error(`❌ ${emptyLinks} links have no text`);
                hasErrors = true;
            }
            if (nonDescriptiveLinks > 0) {
                console.warn(`⚠️  ${nonDescriptiveLinks} links have non-descriptive text`);
                hasWarnings = true;
            }
        }

        // Test 6: Check buttons for accessible names
        console.log('\nChecking buttons for accessible names...');
        const buttons = doc.querySelectorAll('button');
        let unlabeledButtons = 0;

        buttons.forEach((button) => {
            const text = button.textContent.trim();
            const ariaLabel = button.getAttribute('aria-label');

            if (!text && !ariaLabel) {
                console.error(`❌ Button has no accessible name: ${button.outerHTML.substring(0, 50)}...`);
                unlabeledButtons++;
            }
        });

        if (unlabeledButtons === 0 && buttons.length > 0) {
            console.log(`✓ All ${buttons.length} buttons have accessible names`);
        } else if (buttons.length === 0) {
            console.log('ℹ️  No buttons found');
        } else {
            console.error(`❌ ${unlabeledButtons} out of ${buttons.length} buttons missing accessible names`);
            hasErrors = true;
        }

        // Test 7: Check for ARIA landmarks
        console.log('\nChecking for ARIA landmarks...');
        const nav = doc.querySelector('nav, [role="navigation"]');
        const main = doc.querySelector('main, [role="main"]');
        const header = doc.querySelector('header, [role="banner"]');
        const footer = doc.querySelector('footer, [role="contentinfo"]');

        if (nav) {
            console.log('✓ Navigation landmark found');
        } else {
            console.warn('⚠️  Navigation landmark missing');
            hasWarnings = true;
        }

        if (main) {
            console.log('✓ Main landmark found');
        } else {
            console.warn('⚠️  Main landmark missing');
            hasWarnings = true;
        }

        if (header) {
            console.log('✓ Header/banner landmark found');
        } else {
            console.warn('⚠️  Header/banner landmark missing');
            hasWarnings = true;
        }

        if (footer) {
            console.log('✓ Footer/contentinfo landmark found');
        } else {
            console.warn('⚠️  Footer/contentinfo landmark missing');
            hasWarnings = true;
        }

        console.log(`\n✅ ${pageName} accessibility tests completed\n`);

    } catch (error) {
        console.error(`❌ Error parsing ${htmlPath}:`, error.message);
        hasErrors = true;
    }
}

// Run tests
const projectRoot = path.join(__dirname, '..');

// Test layout files
testHTMLForAccessibility(path.join(projectRoot, '_layouts', 'default.html'), 'Default layout');
testHTMLForAccessibility(path.join(projectRoot, '_includes', 'header.html'), 'Header include');
testHTMLForAccessibility(path.join(projectRoot, '_includes', 'footer.html'), 'Footer include');

// Test sample pages
const pagesToTest = [
    { path: path.join(projectRoot, '_pages', 'books.html'), name: 'Books page' },
    { path: path.join(projectRoot, '_pages', 'about.md'), name: 'About page' }
];

pagesToTest.forEach(page => {
    if (fs.existsSync(page.path)) {
        testHTMLForAccessibility(page.path, page.name);
    }
});

// Final summary
console.log('\n=== Test Summary ===\n');

if (hasErrors) {
    console.error('❌ Some accessibility tests FAILED. Please fix the errors above.\n');
    process.exit(1);
} else if (hasWarnings) {
    console.warn('⚠️  All critical accessibility tests passed, but there are some warnings to address.\n');
    process.exit(0);
} else {
    console.log('✅ All accessibility tests PASSED!\n');
    process.exit(0);
}
