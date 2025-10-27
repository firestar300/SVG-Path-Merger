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
 * Handles input changes in the textarea
 */
function handleInput() {
    const svgCode = inputSvg.value.trim();

    if (!svgCode) {
        resetOutput();
        return;
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode, 'image/svg+xml');

        // Check for parsing errors
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Invalid SVG: parsing error');
        }

        const svgElement = doc.querySelector('svg');
        if (!svgElement) {
            throw new Error('No SVG element found');
        }

        // Preview input SVG
        displayPreview(inputPreview, svgCode);

        // Get all path elements
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

    // Only add a default fill if the SVG parent doesn't have one and path has neither fill nor stroke
    const svgFill = svgElement.getAttribute('fill');
    if (!fill && !stroke && !svgFill) {
        newPath.setAttribute('fill', 'currentColor');
    }

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
 * Displays preview of SVG
 * @param {HTMLElement} container - The preview container
 * @param {string} svgCode - The SVG code to display
 */
function displayPreview(container, svgCode) {
    // Store current background setting
    const currentBg = container.getAttribute('data-bg') || 'transparent';

    container.innerHTML = svgCode;

    // Ensure SVG scales properly
    const svg = container.querySelector('svg');
    if (svg) {
        svg.style.maxWidth = '100%';
        svg.style.maxHeight = '100%';
        svg.style.height = 'auto';
        svg.style.width = 'auto';
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
    const sizeKb = (stats.size / 1024).toFixed(2);
    const reduction = inputStats === container ? '' : calculateReduction();

    container.innerHTML = `
        <div class="flex justify-between mb-1">
            <span>Number of paths:</span>
            <strong>${stats.paths}</strong>
        </div>
        <div class="flex justify-between mb-1">
            <span>Size:</span>
            <strong>${sizeKb} KB</strong>
        </div>
        ${reduction}
    `;
}

/**
 * Calculates the size reduction percentage
 * @returns {string} - HTML string with reduction info
 */
function calculateReduction() {
    const inputSize = new Blob([inputSvg.value]).size;
    const outputSize = new Blob([outputSvg.value]).size;
    const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
    const color = parseInt(reduction) === 0 ? 'inherit' : parseInt(reduction) > 0 ? '#22c55e' : '#ef4444';

    return `
        <div class="flex justify-between">
            <span>Reduction:</span>
            <strong style="color: ${color}">
                ${parseInt(reduction) > 0 ? '-' : '+'}${Math.abs(parseInt(reduction))}%
            </strong>
        </div>
    `;
}

/**
 * Resets the output
 */
function resetOutput() {
    const currentBg = outputPreview.getAttribute('data-bg') || 'transparent';
    outputSvg.value = '';
    outputPreview.innerHTML = '<div class="text-slate-500 dark:text-slate-400 italic text-center p-8">Preview will appear here</div>';
    applyPreviewBackground(outputPreview, currentBg);
    outputStats.innerHTML = '';
    inputStats.innerHTML = '';
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
    inputPreview.innerHTML = '<div class="text-slate-500 dark:text-slate-400 italic text-center p-8">Preview will appear here</div>';
    applyPreviewBackground(inputPreview, currentBg);
    resetOutput();
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success or error)
 */
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-custom-lg font-medium transition-all duration-300 ${
        type === 'error' ? 'bg-red-500 dark:bg-red-600' : 'bg-green-500 dark:bg-green-600'
    } text-white opacity-0 translate-y-4 pointer-events-none`;

    // Trigger reflow to restart animation
    void toast.offsetWidth;

    toast.classList.remove('opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }, 3000);
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
