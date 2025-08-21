/**
 * ========================================
 * GITHUB PAGES ICON LOADER
 * ========================================
 *
 * This script dynamically loads SVG icons for use in a GitHub Pages site.
 * It provides a simple way to manage and display icons without relying on server-side code.
 *
 * USAGE:
 * 1. Include this script in your HTML file.
 * 2. Call the `initializeIconLibrary` function to load and display icons.
 *
 */
 
// Configuration - Update these if needed
const CONFIG = {
    // GitHub repository info (auto-detected from current URL)
    owner: null,  // Will be auto-detected
    repo: null,   // Will be auto-detected
    branch: 'main', // Change if you use a different branch (e.g., 'master', 'gh-pages')
    
    // Icon folder paths
    iconFolders: ['blue-default', 'grey'],
    
    // GitHub API base URL
    apiBase: 'https://api.github.com'
};

// Auto-detect GitHub repository info from current URL
function detectRepoInfo() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    if (hostname.includes('github.io')) {
        // Format: username.github.io/repository-name
        const pathParts = pathname.split('/').filter(part => part);
        CONFIG.owner = hostname.split('.')[0];
        CONFIG.repo = pathParts[0] || CONFIG.owner + '.github.io';
    } else if (hostname.includes('github.com')) {
        // Direct GitHub Pages URL or development
        const pathParts = pathname.split('/').filter(part => part);
        CONFIG.owner = pathParts[0];
        CONFIG.repo = pathParts[1];
    } else {
        // Custom domain or local development
        console.warn('Cannot auto-detect repository info. Please set CONFIG.owner and CONFIG.repo manually.');
        return false;
    }
    
    console.log(`📂 Detected repository: ${CONFIG.owner}/${CONFIG.repo}`);
    return true;
}

// Function to fetch directory contents from GitHub API
async function fetchDirectoryContents(path) {
    if (!CONFIG.owner || !CONFIG.repo) {
        throw new Error('Repository information not configured');
    }
    
    const url = `${CONFIG.apiBase}/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Directory not found: ${path}`);
                return [];
            }
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const contents = await response.json();
        
        // Filter for SVG files
        return contents
            .filter(item => item.type === 'file' && item.name.endsWith('.svg'))
            .map(item => ({
                name: item.name.replace('.svg', ''),
                downloadUrl: item.download_url,
                path: item.path
            }));
            
    } catch (error) {
        console.error(`Failed to fetch directory contents for ${path}:`, error);
        return [];
    }
}

// Function to load SVG content
async function loadSVG(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load SVG: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.warn(`Could not load SVG from ${url}:`, error);
        return `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/><text x="12" y="16" text-anchor="middle" font-size="6" fill="white">?</text></svg>`;
    }
}

// Function to discover and load all icons automatically
async function autoDiscoverIcons() {
    const allIcons = [];
    
    console.log('🔍 Auto-discovering SVG icons...');
    
    for (const folder of CONFIG.iconFolders) {
        console.log(`📁 Scanning ${folder} folder...`);
        
        const iconPath = `icons/${folder}`;
        const svgFiles = await fetchDirectoryContents(iconPath);
        
        console.log(`Found ${svgFiles.length} SVG files in ${folder}`);
        
        // Load each SVG file
        for (const file of svgFiles) {
            try {
                const svgContent = await loadSVG(file.downloadUrl);
                
                allIcons.push({
                    name: file.name,
                    category: folder,
                    svg: svgContent,
                    path: `icons/${folder}/${file.name}.svg`
                });
                
                console.log(`✅ Loaded: ${file.name}`);
                
            } catch (error) {
                console.error(`❌ Failed to load ${file.name}:`, error);
            }
        }
    }
    
    return allIcons;
}

// Function to initialize the icon library
async function initializeIconLibrary() {
    try {
        // Show loading state
        const iconsGrid = document.getElementById('iconsGrid');
        if (iconsGrid) {
            iconsGrid.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #64748b;">
                    <div style="margin-bottom: 1rem;">🔍 Discovering icons...</div>
                    <div style="font-size: 0.9rem; opacity: 0.7;">Scanning your GitHub repository for SVG files</div>
                </div>
            `;
        }
        
        // Auto-detect repository info
        if (!detectRepoInfo()) {
            throw new Error('Could not detect GitHub repository information');
        }
        
        // Discover and load all icons
        const discoveredIcons = await autoDiscoverIcons();
        
        if (discoveredIcons.length === 0) {
            if (iconsGrid) {
                iconsGrid.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #f59e0b;">
                        <h3>No Icons Found</h3>
                        <p>No SVG files were found in:</p>
                        <ul style="list-style: none; padding: 0;">
                            <li>📁 icons/blue-default/</li>
                            <li>📁 icons/grey/</li>
                        </ul>
                        <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">
                            Make sure your SVG files are uploaded to these folders in your repository.
                        </p>
                    </div>
                `;
            }
            return;
        }
        
        // Update global variables
        if (typeof window !== 'undefined') {
            window.iconsData = discoveredIcons;
            window.filteredIcons = [...discoveredIcons];
        }
        
        // Initialize UI
        if (typeof renderCategories === 'function') renderCategories();
        if (typeof renderIcons === 'function') renderIcons();
        if (typeof updateStats === 'function') updateStats();
        
        // Log success
        const breakdown = {};
        discoveredIcons.forEach(icon => {
            breakdown[icon.category] = (breakdown[icon.category] || 0) + 1;
        });
        
        console.log(`🎉 Successfully loaded ${discoveredIcons.length} icons!`);
        console.log('📊 Breakdown by category:', breakdown);
        
    } catch (error) {
        console.error('❌ Failed to initialize icon library:', error);
        
        const iconsGrid = document.getElementById('iconsGrid');
        if (iconsGrid) {
            iconsGrid.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #ef4444;">
                    <h3>Failed to Load Icons</h3>
                    <p>Error: ${error.message}</p>
                    <details style="margin-top: 1rem; text-align: left;">
                        <summary style="cursor: pointer;">Show Debug Info</summary>
                        <div style="background: #f1f5f9; padding: 1rem; border-radius: 4px; margin-top: 0.5rem; font-family: monospace; font-size: 0.8rem;">
                            <strong>Repository:</strong> ${CONFIG.owner}/${CONFIG.repo}<br>
                            <strong>Branch:</strong> ${CONFIG.branch}<br>
                            <strong>Current URL:</strong> ${window.location.href}<br>
                            <strong>Error:</strong> ${error.stack}
                        </div>
                    </details>
                    <p style="margin-top: 1rem; font-size: 0.9rem;">
                        Check the browser console (F12) for more details.
                    </p>
                </div>
            `;
        }
    }
}

// Manual configuration helper (if auto-detection fails)
window.configureIconLibrary = function(owner, repo, branch = 'main') {
    CONFIG.owner = owner;
    CONFIG.repo = repo;
    CONFIG.branch = branch;
    console.log(`📝 Manual configuration set: ${owner}/${repo} (${branch})`);
    initializeIconLibrary();
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIconLibrary);
} else {
    initializeIconLibrary();
}