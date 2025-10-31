import './style.css';

// DOM Elements
const inputSvg = document.getElementById('inputSvg');
const outputSvg = document.getElementById('outputSvg');
const inputPreview = document.getElementById('inputPreview');
const outputPreview = document.getElementById('outputPreview');
const inputStats = document.getElementById('inputStats');
const outputStats = document.getElementById('outputStats');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const toast = document.getElementById('toast');
const darkModeToggle = document.getElementById('darkModeToggle');
const inputBgToggle = document.getElementById('inputBgToggle');
const outputBgToggle = document.getElementById('outputBgToggle');

// Background options
const bgOptions = ['transparent', 'white', 'black', 'gray'];

// Event Listeners
inputSvg.addEventListener('input', handleInput);
copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearInput);
darkModeToggle.addEventListener('click', toggleDarkMode);
inputBgToggle.addEventListener('click', () => togglePreviewBackground(inputPreview));
outputBgToggle.addEventListener('click', () => togglePreviewBackground(outputPreview));

// Load example on page load (optional)
window.addEventListener('DOMContentLoaded', () => {
    // Initialize dark mode
    initDarkMode();

    const exampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <path d="M 10 10 L 30 10 L 30 30 L 10 30 Z" fill="#4f46e5"/>
  <path d="M 40 10 L 60 10 L 60 30 L 40 30 Z" fill="#6366f1"/>
  <path d="M 70 10 L 90 10 L 90 30 L 70 30 Z" fill="#818cf8"/>
</svg>`;
    inputSvg.value = exampleSvg;
    handleInput();
});

/**
 * Pre-sanitizes SVG code using text replacement (first line of defense)
 * @param {string} svgCode - The SVG code to pre-sanitize
 * @returns {Object} - Object containing pre-sanitized code and warnings
 */
function preSanitizeSvg(svgCode) {
    const warnings = [];
    let sanitized = svgCode;

    // Remove script tags (case insensitive, with all variations)
    const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const scriptMatches = sanitized.match(scriptRegex);
    if (scriptMatches) {
        warnings.push(`${scriptMatches.length} <script> tag(s) removed for security`);
        sanitized = sanitized.replace(scriptRegex, '');
    }

    // Remove standalone script tags (unclosed)
    const standaloneScriptRegex = /<script\b[^>]*>/gi;
    if (standaloneScriptRegex.test(sanitized)) {
        warnings.push('Unclosed <script> tag(s) removed for security');
        sanitized = sanitized.replace(standaloneScriptRegex, '');
    }

    // Remove event handlers (onclick, onload, etc.)
    const eventHandlerRegex = /\s+on\w+\s*=\s*["'][^"']*["']/gi;
    const eventMatches = sanitized.match(eventHandlerRegex);
    if (eventMatches) {
        warnings.push(`${eventMatches.length} event handler(s) removed for security`);
        sanitized = sanitized.replace(eventHandlerRegex, '');
    }

    // Remove javascript: in href
    const jsHrefRegex = /\s+(href|xlink:href)\s*=\s*["']javascript:[^"']*["']/gi;
    const jsHrefMatches = sanitized.match(jsHrefRegex);
    if (jsHrefMatches) {
        warnings.push(`${jsHrefMatches.length} javascript: link(s) removed for security`);
        sanitized = sanitized.replace(jsHrefRegex, '');
    }

    return { code: sanitized, warnings };
}

/**
 * Sanitizes SVG code to prevent XSS attacks (second line of defense)
 * @param {string} svgCode - The SVG code to sanitize (already pre-sanitized)
 * @returns {Object} - Object containing sanitized SVG and all warnings
 */
function sanitizeSvg(svgCode) {
    // First line of defense: text-based sanitization
    const presan = preSanitizeSvg(svgCode);
    let sanitized = presan.code;
    const warnings = [...presan.warnings];

    // Second line of defense: DOM-based sanitization
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized, 'image/svg+xml');

    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
        return { code: sanitized, warnings };
    }

    // Remove dangerous elements (defensive check)
    const dangerousElements = [
        'script',
        'foreignObject',
        'iframe',
        'embed',
        'object',
        'link',
        'style'
    ];

    dangerousElements.forEach(tagName => {
        const elements = svgElement.querySelectorAll(tagName);
        if (elements.length > 0) {
            const msg = `${elements.length} <${tagName}> element(s) removed (DOM check)`;
            if (!warnings.some(w => w.includes(tagName))) {
                warnings.push(msg);
            }
            elements.forEach(el => el.remove());
        }
    });

    // Remove event handlers and dangerous attributes (defensive check)
    let eventHandlersRemoved = 0;
    let dangerousHrefsRemoved = 0;

    const allElements = svgElement.querySelectorAll('*');
    allElements.forEach(element => {
        // Remove event handler attributes (onclick, onload, etc.)
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                element.removeAttribute(attr.name);
                eventHandlersRemoved++;
            }

            // Remove javascript: protocol in href and xlink:href
            if ((attr.name === 'href' || attr.name === 'xlink:href') &&
                attr.value.toLowerCase().trim().startsWith('javascript:')) {
                element.removeAttribute(attr.name);
                dangerousHrefsRemoved++;
            }
        });
    });

    if (eventHandlersRemoved > 0 && !warnings.some(w => w.includes('event handler'))) {
        warnings.push(`${eventHandlersRemoved} event handler(s) removed (DOM check)`);
    }

    if (dangerousHrefsRemoved > 0 && !warnings.some(w => w.includes('link'))) {
        warnings.push(`${dangerousHrefsRemoved} dangerous link(s) removed (DOM check)`);
    }

    return {
        code: new XMLSerializer().serializeToString(svgElement),
        warnings: warnings
    };
}

/**
 * Handles input changes in the textarea
 */
function handleInput() {
    const svgCode = inputSvg.value.trim();

    if (!svgCode) {
        resetOutput();
        return;
    }

    try {
        // IMPORTANT: Sanitize FIRST before any other processing
        const sanitizationResult = sanitizeSvg(svgCode);
        const sanitizedSvgCode = sanitizationResult.code;

        // Show security warnings if any dangerous elements were removed
        if (sanitizationResult.warnings.length > 0) {
            const warningMessage = '⚠️ Security: ' + sanitizationResult.warnings.join(', ');
            showToast(warningMessage, 'warning');
        }

        // Now parse the SANITIZED SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitizedSvgCode, 'image/svg+xml');

        // Check for parsing errors
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Invalid SVG: parsing error');
        }

        const svgElement = doc.querySelector('svg');
        if (!svgElement) {
            throw new Error('No SVG element found');
        }

        // Preview input SVG with sanitized code
        displayPreview(inputPreview, sanitizedSvgCode);

        // Get all path elements from the SANITIZED SVG
        const paths = svgElement.querySelectorAll('path');

        if (paths.length === 0) {
            throw new Error('No <path> elements found in the SVG');
        }

        // Display input stats
        displayStats(inputStats, {
            paths: paths.length,
            size: new Blob([svgCode]).size
        });

        // Merge paths
        const mergedSvg = mergePaths(svgElement, paths);

        // Display output
        outputSvg.value = formatSvg(mergedSvg);
        displayPreview(outputPreview, mergedSvg);

        // Display output stats
        displayStats(outputStats, {
            paths: 1,
            size: new Blob([mergedSvg]).size
        });

    } catch (error) {
        showToast(error.message, 'error');
        resetOutput();
    }
}

/**
 * Merges all path elements into a single path
 * @param {SVGElement} svgElement - The SVG element
 * @param {NodeList} paths - Collection of path elements
 * @returns {string} - The merged SVG string
 */
function mergePaths(svgElement, paths) {
    // Clone the SVG element
    const clonedSvg = svgElement.cloneNode(true);

    // Collect all path data
    const pathDataArray = [];
    const transforms = [];

    paths.forEach(path => {
        const d = path.getAttribute('d');
        const transform = path.getAttribute('transform');

        if (d) {
            // If path has a transform, we need to apply it
            if (transform) {
                pathDataArray.push(applyTransformToPath(d, transform));
            } else {
                pathDataArray.push(d);
            }
        }
    });

    // Combine all path data
    const mergedPathData = pathDataArray.join(' ');

    // Remove all existing paths from the cloned SVG
    clonedSvg.querySelectorAll('path').forEach(path => path.remove());

    // Create a new merged path
    const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    newPath.setAttribute('d', mergedPathData);

    // Try to preserve fill and stroke from the first path if they exist
    const firstPath = paths[0];
    const fill = firstPath.getAttribute('fill');
    const stroke = firstPath.getAttribute('stroke');
    const strokeWidth = firstPath.getAttribute('stroke-width');

    if (fill) newPath.setAttribute('fill', fill);
    if (stroke) newPath.setAttribute('stroke', stroke);
    if (strokeWidth) newPath.setAttribute('stroke-width', strokeWidth);

    // Append the new path to the SVG
    clonedSvg.appendChild(newPath);

    // Return the serialized SVG
    return new XMLSerializer().serializeToString(clonedSvg);
}

/**
 * Apply transform to path data (basic implementation)
 * @param {string} pathData - The path d attribute
 * @param {string} transform - The transform attribute
 * @returns {string} - The transformed path data
 */
function applyTransformToPath(pathData, transform) {
    // For now, we'll just return the original path data
    // A full implementation would parse the transform and apply it to each coordinate
    // This is a complex task that would require a library like paper.js or svg-path-transformer
    console.warn('Transform detected but not applied. Consider using a library for complex transforms.');
    return pathData;
}

/**
 * Formats SVG code for better readability
 * @param {string} svgCode - The SVG code to format
 * @returns {string} - Formatted SVG code
 */
function formatSvg(svgCode) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode, 'image/svg+xml');
        const serializer = new XMLSerializer();
        let formatted = serializer.serializeToString(doc);

        // Format with proper indentation and remove extra spaces
        formatted = formatted
            .replace(/></g, '>\n<')           // Add line breaks between tags
            .replace(/\n\s+\n/g, '\n')        // Remove empty lines
            .replace(/>\s+</g, '><')          // Remove spaces between tags
            .trim();

        return formatted;
    } catch (error) {
        return svgCode;
    }
}

/**
 * Safely clones an SVG element, excluding dangerous elements
 * @param {Element} sourceElement - The source element to clone
 * @param {Element} targetElement - The target element to append to
 */
function safeCloneSvgElement(sourceElement, targetElement) {
    // Whitelist of safe SVG elements
    const safeElements = [
        'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
        'text', 'tspan', 'defs', 'use', 'symbol', 'marker', 'clipPath', 'mask',
        'linearGradient', 'radialGradient', 'stop', 'pattern', 'image', 'a',
        'title', 'desc', 'metadata'
    ];

    // Blacklist of dangerous attributes
    const dangerousAttrPrefixes = ['on']; // event handlers

    for (const child of sourceElement.children) {
        const tagName = child.tagName.toLowerCase();

        // Only clone safe elements
        if (safeElements.includes(tagName)) {
            const clonedElement = document.createElementNS('http://www.w3.org/2000/svg', tagName);

            // Copy safe attributes
            Array.from(child.attributes).forEach(attr => {
                const attrName = attr.name.toLowerCase();

                // Skip dangerous attributes
                if (dangerousAttrPrefixes.some(prefix => attrName.startsWith(prefix))) {
                    return;
                }

                // Skip javascript: in href
                if ((attrName === 'href' || attrName === 'xlink:href') &&
                    attr.value.toLowerCase().trim().startsWith('javascript:')) {
                    return;
                }

                // Copy the attribute
                try {
                    clonedElement.setAttribute(attr.name, attr.value);
                } catch (e) {
                    // Ignore if attribute cannot be set
                }
            });

            // Recursively clone children
            if (child.children.length > 0) {
                safeCloneSvgElement(child, clonedElement);
            } else if (child.textContent) {
                // Copy text content for text elements
                clonedElement.textContent = child.textContent;
            }

            targetElement.appendChild(clonedElement);
        }
    }
}

/**
 * Displays preview of SVG
 * @param {HTMLElement} container - The preview container
 * @param {string} svgCode - The SVG code to display (must be already sanitized)
 */
function displayPreview(container, svgCode) {
    // Store current background setting
    const currentBg = container.getAttribute('data-bg') || 'transparent';

    // Clear container safely
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    try {
        // Parse the sanitized SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');

        if (svgElement) {
            // Create a new SVG element instead of importing
            const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

            // Copy safe attributes from original SVG
            const safeAttrs = ['width', 'height', 'viewBox', 'xmlns', 'version', 'x', 'y',
                              'preserveAspectRatio', 'class', 'id'];

            safeAttrs.forEach(attrName => {
                const attrValue = svgElement.getAttribute(attrName);
                if (attrValue) {
                    newSvg.setAttribute(attrName, attrValue);
                }
            });

            // Safely clone children
            safeCloneSvgElement(svgElement, newSvg);

            // Ensure SVG scales properly
            newSvg.style.maxWidth = '100%';
            newSvg.style.maxHeight = '100%';
            newSvg.style.height = 'auto';
            newSvg.style.width = 'auto';

            // Append to container
            container.appendChild(newSvg);
        }
    } catch (error) {
        console.error('Error displaying preview:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 dark:text-red-400 text-center p-8';
        errorDiv.textContent = 'Error displaying preview';
        container.appendChild(errorDiv);
    }

    // Reapply background setting
    applyPreviewBackground(container, currentBg);
}

/**
 * Displays statistics about the SVG
 * @param {HTMLElement} container - The stats container
 * @param {Object} stats - The statistics object
 */
function displayStats(container, stats) {
    // Clear container safely
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    const sizeKb = (stats.size / 1024).toFixed(2);

    // Create paths info element
    const pathsDiv = document.createElement('div');
    pathsDiv.className = 'flex justify-between mb-1';

    const pathsLabel = document.createElement('span');
    pathsLabel.textContent = 'Number of paths:';

    const pathsValue = document.createElement('strong');
    pathsValue.textContent = stats.paths;

    pathsDiv.appendChild(pathsLabel);
    pathsDiv.appendChild(pathsValue);
    container.appendChild(pathsDiv);

    // Create size info element
    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'flex justify-between mb-1';

    const sizeLabel = document.createElement('span');
    sizeLabel.textContent = 'Size:';

    const sizeValue = document.createElement('strong');
    sizeValue.textContent = `${sizeKb} KB`;

    sizeDiv.appendChild(sizeLabel);
    sizeDiv.appendChild(sizeValue);
    container.appendChild(sizeDiv);

    // Add reduction info if this is output stats
    if (inputStats !== container) {
        const reductionElement = calculateReductionElement();
        if (reductionElement) {
            container.appendChild(reductionElement);
        }
    }
}

/**
 * Calculates the size reduction percentage and returns a DOM element
 * @returns {HTMLElement|null} - DOM element with reduction info
 */
function calculateReductionElement() {
    if (!inputSvg.value || !outputSvg.value) {
        return null;
    }

    const inputSize = new Blob([inputSvg.value]).size;
    const outputSize = new Blob([outputSvg.value]).size;
    const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
    const reductionNum = parseInt(reduction);
    const color = reductionNum === 0 ? 'inherit' : reductionNum > 0 ? '#22c55e' : '#ef4444';

    // Create reduction info element
    const reductionDiv = document.createElement('div');
    reductionDiv.className = 'flex justify-between';

    const reductionLabel = document.createElement('span');
    reductionLabel.textContent = 'Reduction:';

    const reductionValue = document.createElement('strong');
    reductionValue.style.color = color;
    reductionValue.textContent = `${reductionNum > 0 ? '-' : '+'}${Math.abs(reductionNum)}%`;

    reductionDiv.appendChild(reductionLabel);
    reductionDiv.appendChild(reductionValue);

    return reductionDiv;
}

/**
 * Resets the output
 */
function resetOutput() {
    const currentBg = outputPreview.getAttribute('data-bg') || 'transparent';
    outputSvg.value = '';

    // Clear and reset output preview safely
    while (outputPreview.firstChild) {
        outputPreview.removeChild(outputPreview.firstChild);
    }

    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'text-slate-500 dark:text-slate-400 italic text-center p-8';
    placeholderDiv.textContent = 'Preview will appear here';
    outputPreview.appendChild(placeholderDiv);

    applyPreviewBackground(outputPreview, currentBg);

    // Clear stats safely
    while (outputStats.firstChild) {
        outputStats.removeChild(outputStats.firstChild);
    }
    while (inputStats.firstChild) {
        inputStats.removeChild(inputStats.firstChild);
    }
}

/**
 * Copies the output SVG to clipboard
 */
async function copyToClipboard() {
    const text = outputSvg.value;

    if (!text) {
        showToast('Nothing to copy', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showToast('SVG copied to clipboard!');
    } catch (error) {
        showToast('Error copying to clipboard', 'error');
    }
}

/**
 * Clears the input
 */
function clearInput() {
    const currentBg = inputPreview.getAttribute('data-bg') || 'transparent';
    inputSvg.value = '';

    // Clear and reset input preview safely
    while (inputPreview.firstChild) {
        inputPreview.removeChild(inputPreview.firstChild);
    }

    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'text-slate-500 dark:text-slate-400 italic text-center p-8';
    placeholderDiv.textContent = 'Preview will appear here';
    inputPreview.appendChild(placeholderDiv);

    applyPreviewBackground(inputPreview, currentBg);
    resetOutput();
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, or warning)
 */
function showToast(message, type = 'success') {
    toast.textContent = message;

    let bgColor = 'bg-green-500 dark:bg-green-600'; // success
    if (type === 'error') {
        bgColor = 'bg-red-500 dark:bg-red-600';
    } else if (type === 'warning') {
        bgColor = 'bg-yellow-500 dark:bg-yellow-600';
    }

    toast.className = `fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-custom-lg font-medium transition-all duration-300 ${bgColor} text-white opacity-0 translate-y-4 pointer-events-none`;

    // Trigger reflow to restart animation
    void toast.offsetWidth;

    toast.classList.remove('opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    // Warnings stay longer (5 seconds instead of 3)
    const duration = type === 'warning' ? 5000 : 3000;

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }, duration);
}

/**
 * Initializes dark mode based on user preference or system settings
 */
function initDarkMode() {
    // Check for saved user preference, otherwise check system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

/**
 * Toggles dark mode
 */
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    darkModeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

/**
 * Toggles preview background through different options
 * @param {HTMLElement} previewElement - The preview element to change
 */
function togglePreviewBackground(previewElement) {
    const currentBg = previewElement.getAttribute('data-bg');
    const currentIndex = bgOptions.indexOf(currentBg);
    const nextIndex = (currentIndex + 1) % bgOptions.length;
    const nextBg = bgOptions[nextIndex];

    previewElement.setAttribute('data-bg', nextBg);
    applyPreviewBackground(previewElement, nextBg);
}

/**
 * Applies background style to preview element
 * @param {HTMLElement} previewElement - The preview element
 * @param {string} bgType - The background type
 */
function applyPreviewBackground(previewElement, bgType) {
    // Remove all background classes
    previewElement.classList.remove('preview-checkerboard', 'preview-white', 'preview-black', 'preview-gray');

    // Apply the appropriate background class
    switch (bgType) {
        case 'transparent':
            previewElement.classList.add('preview-checkerboard');
            break;
        case 'white':
            previewElement.classList.add('preview-white');
            break;
        case 'black':
            previewElement.classList.add('preview-black');
            break;
        case 'gray':
            previewElement.classList.add('preview-gray');
            break;
    }
}
