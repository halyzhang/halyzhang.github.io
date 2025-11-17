#!/usr/bin/env node

/**
 * SEO and Modern Web Practices Compliance Tests
 * Validates that the site follows SEO best practices and modern web standards
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('Starting SEO and web compliance tests...\n');

let hasErrors = false;
let hasWarnings = false;

/**
 * Test if a file exists
 */
function testFileExists(filePath, description) {
    console.log(`Testing: ${description}`);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${description} exists\n`);
        return true;
    } else {
        console.error(`❌ ${description} not found at ${filePath}\n`);
        hasErrors = true;
        return false;
    }
}

/**
 * Test HTML file for SEO compliance
 * @param {string} htmlPath - Path to the HTML file
 * @param {string} pageName - Name of the page for reporting
 * @param {boolean} isCompleteDoc - Whether this should be a complete HTML document (default: false for partials)
 */
function testHTMLForSEO(htmlPath, pageName, isCompleteDoc = false) {
    console.log(`\n=== Testing ${pageName} for SEO compliance ===\n`);

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

        // Test 1: Check for meta description
        console.log('Checking meta tags...');
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc && metaDesc.getAttribute('content')) {
            console.log('✓ Meta description found');
        } else {
            console.warn('⚠️  Meta description missing or empty');
            hasWarnings = true;
        }

        // Test 2: Check for viewport meta
        const viewport = doc.querySelector('meta[name="viewport"]');
        if (viewport) {
            console.log('✓ Viewport meta tag found');
        } else {
            console.error('❌ Viewport meta tag missing');
            hasErrors = true;
        }

        // Test 3: Check for Open Graph tags
        const ogTitle = doc.querySelector('meta[property="og:title"]');
        const ogDesc = doc.querySelector('meta[property="og:description"]');
        const ogUrl = doc.querySelector('meta[property="og:url"]');
        const ogImage = doc.querySelector('meta[property="og:image"]');

        if (ogTitle && ogDesc && ogUrl) {
            console.log('✓ Open Graph tags found (title, description, url)');
        } else {
            console.error('❌ Missing some Open Graph tags');
            hasErrors = true;
        }

        if (ogImage) {
            console.log('✓ Open Graph image found');
        } else {
            console.warn('⚠️  Open Graph image missing');
            hasWarnings = true;
        }

        // Test 4: Check for Twitter Card tags
        const twitterCard = doc.querySelector('meta[name="twitter:card"]');
        const twitterTitle = doc.querySelector('meta[name="twitter:title"]');
        const twitterDesc = doc.querySelector('meta[name="twitter:description"]');

        if (twitterCard && twitterTitle && twitterDesc) {
            console.log('✓ Twitter Card tags found');
        } else {
            console.error('❌ Missing some Twitter Card tags');
            hasErrors = true;
        }

        // Test 5: Check for canonical URL
        const canonical = doc.querySelector('link[rel="canonical"]');
        if (canonical) {
            console.log('✓ Canonical URL found');
        } else {
            console.error('❌ Canonical URL missing');
            hasErrors = true;
        }

        // Test 6: Check for theme-color
        const themeColor = doc.querySelector('meta[name="theme-color"]');
        if (themeColor) {
            console.log('✓ Theme color meta tag found');
        } else {
            console.warn('⚠️  Theme color meta tag missing');
            hasWarnings = true;
        }

        // Test 7: Check for title tag
        const title = doc.querySelector('title');
        if (title && title.textContent.trim()) {
            console.log('✓ Title tag found and not empty');
        } else {
            console.error('❌ Title tag missing or empty');
            hasErrors = true;
        }

        // Test 8: Check for manifest link
        const manifest = doc.querySelector('link[rel="manifest"]');
        if (manifest) {
            console.log('✓ Web manifest link found');
        } else {
            console.warn('⚠️  Web manifest link missing');
            hasWarnings = true;
        }

        // Test 9: Check for favicon
        const favicon = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        if (favicon) {
            console.log('✓ Favicon found');
        } else {
            console.warn('⚠️  Favicon missing');
            hasWarnings = true;
        }

        // Test 10: Check for apple-touch-icon
        const appleTouchIcon = doc.querySelector('link[rel="apple-touch-icon"]');
        if (appleTouchIcon) {
            console.log('✓ Apple touch icon found');
        } else {
            console.warn('⚠️  Apple touch icon missing');
            hasWarnings = true;
        }

        // Test 11: Check for structured data (JSON-LD)
        const structuredData = doc.querySelector('script[type="application/ld+json"]');
        if (structuredData) {
            console.log('✓ Structured data (JSON-LD) found');

            // Validate JSON-LD syntax
            try {
                JSON.parse(structuredData.textContent);
                console.log('✓ Structured data is valid JSON');
            } catch (e) {
                console.error('❌ Structured data has invalid JSON syntax:', e.message);
                hasErrors = true;
            }
        } else {
            console.warn('⚠️  Structured data (JSON-LD) missing');
            hasWarnings = true;
        }

        // Test 12: Check images for alt text
        console.log('\nChecking images for alt text...');
        const images = doc.querySelectorAll('img');
        let missingAltCount = 0;

        images.forEach((img, idx) => {
            const src = img.getAttribute('src') || 'unknown';
            const alt = img.getAttribute('alt');

            if (!alt || alt.trim() === '') {
                console.error(`❌ Image missing alt text: ${src}`);
                missingAltCount++;
            }
        });

        if (missingAltCount === 0 && images.length > 0) {
            console.log(`✓ All ${images.length} images have alt text`);
        } else if (images.length === 0) {
            console.log('ℹ️  No images found in this file');
        } else {
            console.error(`❌ ${missingAltCount} out of ${images.length} images missing alt text`);
            hasErrors = true;
        }

        // Test 13: Check for lang attribute on html tag (only for complete documents)
        if (isCompleteDoc) {
            console.log('\nChecking HTML lang attribute...');
            const html = doc.querySelector('html');
            if (html && html.getAttribute('lang')) {
                console.log('✓ HTML lang attribute found');
            } else {
                console.error('❌ HTML lang attribute missing');
                hasErrors = true;
            }
        }

        console.log(`\n✅ ${pageName} SEO tests completed\n`);

    } catch (error) {
        console.error(`❌ Error parsing ${htmlPath}:`, error.message);
        hasErrors = true;
    }
}

/**
 * Test manifest.json validity
 */
function testManifest(manifestPath) {
    console.log('\n=== Testing manifest.json ===\n');

    if (!fs.existsSync(manifestPath)) {
        console.error('❌ manifest.json not found');
        hasErrors = true;
        return;
    }

    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        // Check required fields
        const requiredFields = ['name', 'short_name', 'start_url', 'display'];
        let allPresent = true;

        requiredFields.forEach(field => {
            if (manifest[field]) {
                console.log(`✓ Manifest has ${field}`);
            } else {
                console.error(`❌ Manifest missing ${field}`);
                hasErrors = true;
                allPresent = false;
            }
        });

        // Check recommended fields
        if (manifest.icons && manifest.icons.length > 0) {
            console.log('✓ Manifest has icons');
        } else {
            console.warn('⚠️  Manifest missing icons');
            hasWarnings = true;
        }

        if (manifest.theme_color) {
            console.log('✓ Manifest has theme_color');
        } else {
            console.warn('⚠️  Manifest missing theme_color');
            hasWarnings = true;
        }

        if (allPresent) {
            console.log('\n✅ manifest.json is valid\n');
        }

    } catch (error) {
        console.error('❌ Error parsing manifest.json:', error.message);
        hasErrors = true;
    }
}

/**
 * Test robots.txt
 */
function testRobotsTxt(robotsPath) {
    console.log('\n=== Testing robots.txt ===\n');

    if (!fs.existsSync(robotsPath)) {
        console.error('❌ robots.txt not found');
        hasErrors = true;
        return;
    }

    const content = fs.readFileSync(robotsPath, 'utf8');

    // Check for Sitemap directive (most important part)
    if (content.includes('Sitemap:')) {
        console.log('✓ robots.txt has Sitemap directive');
    } else {
        console.error('❌ robots.txt missing Sitemap directive');
        hasErrors = true;
    }

    // User-agent directive is optional (defaults to allowing all if not present)
    if (content.includes('User-agent:')) {
        console.log('✓ robots.txt has User-agent directive');
    } else {
        console.log('ℹ️  robots.txt has no User-agent directive (defaults to allowing all crawlers)');
    }

    console.log('\n✅ robots.txt tests completed\n');
}

// Run all tests
const projectRoot = path.join(__dirname, '..');

// Test 1: Required files
console.log('=== Testing for required files ===\n');
testFileExists(path.join(projectRoot, 'robots.txt'), 'robots.txt');
testFileExists(path.join(projectRoot, 'manifest.json'), 'manifest.json');
console.log('');

// Test 2: Layout template (the head include is in all pages)
// Note: head.html is a partial, so we don't check for <html lang> attribute
testHTMLForSEO(path.join(projectRoot, '_includes', 'head.html'), 'head.html template', false);

// Test 3: Sample pages (these will include the head template when built)
// Note: Testing individual pages for their own front matter
const pagesToTest = [
    { path: path.join(projectRoot, '_pages', 'books.html'), name: 'Books page' },
    { path: path.join(projectRoot, '_pages', 'about.md'), name: 'About page' }
];

// For Jekyll pages, we mainly check for images and content structure
console.log('\n=== Testing individual pages ===\n');

pagesToTest.forEach(page => {
    if (fs.existsSync(page.path)) {
        const content = fs.readFileSync(page.path, 'utf8');

        // Check for images without alt text (basic regex check)
        const imgTags = content.match(/<img[^>]*>/gi) || [];
        let missingAlt = 0;

        imgTags.forEach(tag => {
            if (!tag.includes('alt=')) {
                missingAlt++;
                console.error(`❌ ${page.name}: Image tag missing alt attribute`);
            }
        });

        if (imgTags.length > 0 && missingAlt === 0) {
            console.log(`✓ ${page.name}: All ${imgTags.length} images have alt attributes`);
        } else if (imgTags.length === 0) {
            console.log(`ℹ️  ${page.name}: No images found`);
        }
    }
});

// Test 4: manifest.json
testManifest(path.join(projectRoot, 'manifest.json'));

// Test 5: robots.txt
testRobotsTxt(path.join(projectRoot, 'robots.txt'));

// Final summary
console.log('\n=== Test Summary ===\n');

if (hasErrors) {
    console.error('❌ Some SEO compliance tests FAILED. Please fix the errors above.\n');
    process.exit(1);
} else if (hasWarnings) {
    console.warn('⚠️  All critical tests passed, but there are some warnings to address.\n');
    process.exit(0);
} else {
    console.log('✅ All SEO and web compliance tests PASSED!\n');
    process.exit(0);
}