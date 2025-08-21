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


// Configuration
const CONFIG = {
    iconFolders: ['blue-default', 'grey']
};

// Get the current base URL
function getBaseUrl() {
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
    return baseUrl;
}

// Load SVG content
async function loadSVG(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    } catch (error) {
        return null;
    }
}

// Method 1: Try to load icons-index.json (if it exists)
async function tryIndexFile() {
    const baseUrl = getBaseUrl();
    
    try {
        console.log('📋 Checking for icons-index.json...');
        const response = await fetch(`${baseUrl}icons-index.json`);
        
        if (!response.ok) {
            console.log('📋 No icons-index.json found, trying other methods...');
            return [];
        }
        
        const indexData = await response.json();
        console.log(`📋 Found icons-index.json with ${indexData.length} icons`);
        
        // Add timestamp check if available
        const indexTimestamp = indexData._generated || 0;
        const hoursSinceGenerated = (Date.now() - indexTimestamp) / (1000 * 60 * 60);
        
        if (hoursSinceGenerated > 24) {
            console.log('⚠️ Index file is over 24 hours old, consider regenerating');
        }
        
        const icons = [];
        const failedIcons = [];
        
        for (const item of indexData) {
            // Skip metadata
            if (item.name && item.category && item.path) {
                const iconUrl = `${baseUrl}${item.path}`;
                const svgContent = await loadSVG(iconUrl);
                
                if (svgContent) {
                    icons.push({
                        name: item.name,
                        category: item.category,
                        svg: svgContent,
                        path: item.path,
                        fullUrl: iconUrl
                    });
                    console.log(`✅ Loaded from index: ${item.name}`);
                } else {
                    failedIcons.push(item.name);
                    console.warn(`❌ Icon in index but file missing: ${item.name}`);
                }
            }
        }
        
        // If many icons failed to load, the index might be outdated
        if (failedIcons.length > 0) {
            console.warn(`⚠️ ${failedIcons.length} icons in index but not found on server. Index may be outdated.`);
            console.warn('💡 Tip: Delete icons-index.json to force fresh discovery, or run createIconsIndex() to regenerate');
        }
        
        return icons;
        
    } catch (error) {
        console.log('📋 Index file method failed, trying alternatives...');
        return [];
    }
}

// Method 2: GitHub API discovery (for GitHub Pages)
async function tryGitHubAPI() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    if (!hostname.includes('github.io')) {
        return [];
    }
    
    try {
        // Extract owner and repo from GitHub Pages URL
        const owner = hostname.split('.')[0];
        const pathParts = pathname.split('/').filter(part => part);
        const repo = pathParts[0] || `${owner}.github.io`;
        
        console.log(`🐙 Trying GitHub API: ${owner}/${repo}`);
        
        const icons = [];
        
        for (const folder of CONFIG.iconFolders) {
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/icons/${folder}`;
            
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) continue;
                
                const contents = await response.json();
                const svgFiles = contents.filter(item => 
                    item.type === 'file' && item.name.endsWith('.svg')
                );
                
                console.log(`🐙 GitHub API found ${svgFiles.length} SVG files in ${folder}`);
                
                for (const file of svgFiles) {
                    const iconName = file.name.replace('.svg', '');
                    const svgContent = await loadSVG(file.download_url);
                    
                    if (svgContent) {
                        icons.push({
                            name: iconName,
                            category: folder,
                            svg: svgContent,
                            path: `icons/${folder}/${file.name}`,
                            fullUrl: `${getBaseUrl()}icons/${folder}/${file.name}`
                        });
                        console.log(`✅ GitHub API loaded: ${iconName}`);
                    }
                }
            } catch (error) {
                console.log(`🐙 GitHub API failed for ${folder}:`, error.message);
            }
        }
        
        return icons;
        
    } catch (error) {
        console.log('🐙 GitHub API method failed:', error.message);
        return [];
    }
}

// Method 3: Directory listing (for local servers)
async function tryDirectoryListing() {
    const baseUrl = getBaseUrl();
    const icons = [];
    
    for (const folder of CONFIG.iconFolders) {
        try {
            const dirUrl = `${baseUrl}icons/${folder}/`;
            const response = await fetch(dirUrl);
            
            if (!response.ok) continue;
            
            const html = await response.text();
            const svgMatches = html.match(/href="([^"]*\.svg)"/g) || [];
            const svgFiles = svgMatches.map(match => 
                match.match(/href="([^"]*)"/)[1]
            ).filter(file => file.endsWith('.svg'));
            
            console.log(`📂 Directory listing found ${svgFiles.length} SVG files in ${folder}`);
            
            for (const filename of svgFiles) {
                const iconName = filename.replace('.svg', '');
                const iconUrl = `${dirUrl}${filename}`;
                const svgContent = await loadSVG(iconUrl);
                
                if (svgContent) {
                    icons.push({
                        name: iconName,
                        category: folder,
                        svg: svgContent,
                        path: `icons/${folder}/${filename}`,
                        fullUrl: iconUrl
                    });
                    console.log(`✅ Directory listing loaded: ${iconName}`);
                }
            }
        } catch (error) {
            console.log(`📂 Directory listing failed for ${folder}:`, error.message);
        }
    }
    
    return icons;
}

// Main discovery function - tries all methods
async function smartDiscoverIcons() {
    console.log('🔍 Starting smart icon discovery...');
    
    // Try Method 1: Index file (unless skipped)
    if (!window._skipIndex) {
        let icons = await tryIndexFile();
        if (icons.length > 0) {
            console.log(`🎯 Success! Used icons-index.json (${icons.length} icons)`);
            return icons;
        }
    }
    
    // Try Method 2: GitHub API
    let icons = await tryGitHubAPI();
    if (icons.length > 0) {
        console.log(`🎯 Success! Used GitHub API (${icons.length} icons)`);
        return icons;
    }
    
    // Try Method 3: Directory listing
    icons = await tryDirectoryListing();
    if (icons.length > 0) {
        console.log(`🎯 Success! Used directory listing (${icons.length} icons)`);
        return icons;
    }
    
    console.log('❌ All discovery methods failed');
    return [];
}

// Generate icons-index.json content for easy setup
function generateIndexFile(discoveredIcons) {
    const indexData = [
        // Add metadata
        {
            _generated: Date.now(),
            _timestamp: new Date().toISOString(),
            _totalIcons: discoveredIcons.length,
            _note: "Auto-generated by icon-loader.js. Delete this file to force fresh discovery."
        },
        // Add actual icon data
        ...discoveredIcons.map(icon => ({
            name: icon.name,
            category: icon.category,
            path: icon.path
        }))
    ];
    
    return JSON.stringify(indexData, null, 2);
}

// Initialize the icon library
async function initializeIconLibrary() {
    try {
        const iconsGrid = document.getElementById('iconsGrid');
        
        // Show loading state
        if (iconsGrid) {
            iconsGrid.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #64748b;">
                    <div style="margin-bottom: 1rem;">🔍 Smart discovery in progress...</div>
                    <div style="font-size: 0.9rem; opacity: 0.7;">Trying multiple discovery methods</div>
                </div>
            `;
        }
        
        // Smart discovery
        const discoveredIcons = await smartDiscoverIcons();
        
        if (discoveredIcons.length === 0) {
            if (iconsGrid) {
                iconsGrid.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #f59e0b;">
                        <h3>🤔 No Icons Auto-Discovered</h3>
                        <p>For GitHub Pages, create an <code>icons-index.json</code> file:</p>
                        
                        <div style="background: #fffbeb; border: 1px solid #fbbf24; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; text-align: left;">
                            <h4 style="margin-top: 0; color: #92400e;">📝 Quick Setup for GitHub Pages:</h4>
                            <ol style="margin: 0.5rem 0; padding-left: 1.5rem; color: #92400e;">
                                <li>Create <code>icons-index.json</code> in your root folder</li>
                                <li>Add this content:</li>
                            </ol>
                            <pre style="background: white; padding: 1rem; border-radius: 4px; font-size: 0.8rem; overflow-x: auto; margin: 0.5rem 0;">[
  {
    "name": "icn_access_card",
    "category": "blue-default", 
    "path": "icons/blue-default/icn_access_card.svg"
  }
]</pre>
                            <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                                <strong>💡 Tip:</strong> List all your SVG files in this format
                            </div>
                        </div>
                        
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; text-align: left;">
                            <strong>Verified that these work:</strong><br>
                            ✅ ${getBaseUrl()}icons/blue-default/icn_access_card.svg<br>
                            📁 Looking for: ${getBaseUrl()}icons-index.json
                        </div>
                        
                        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            🔄 Try Again
                        </button>
                    </div>
                `;
            }
            return;
        }
        
        // Store icons globally
        window.iconsData = discoveredIcons;
        window.filteredIcons = [...discoveredIcons];
        
        // Initialize UI
        if (typeof renderCategories === 'function') renderCategories();
        if (typeof renderIcons === 'function') renderIcons();
        if (typeof updateStats === 'function') updateStats();
        
        // Success log
        const breakdown = {};
        discoveredIcons.forEach(icon => {
            breakdown[icon.category] = (breakdown[icon.category] || 0) + 1;
        });
        
        console.log(`\n🎉 SUCCESS! Discovered ${discoveredIcons.length} icons!`);
        console.log('📊 Category breakdown:', breakdown);
        
        // Generate index file for future use
        const indexContent = generateIndexFile(discoveredIcons);
        console.log('\n📝 Generated icons-index.json content (copy this to a file for faster loading):');
        console.log(indexContent);
        
        // Show success message briefly
        if (iconsGrid) {
            iconsGrid.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #10b981;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">🎉 Discovery successful!</div>
                    <div style="font-size: 0.9rem;">Found ${discoveredIcons.length} icons automatically</div>
                </div>
            `;
            
            setTimeout(() => {
                renderIcons();
            }, 1500);
        }
        
    } catch (error) {
        console.error('❌ Failed to initialize icon library:', error);
        
        const iconsGrid = document.getElementById('iconsGrid');
        if (iconsGrid) {
            iconsGrid.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #ef4444;">
                    <h3>❌ Discovery Error</h3>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem;">
                        🔄 Retry
                    </button>
                </div>
            `;
        }
    }
}

// Helper function to create index file
window.createIconsIndex = function() {
    if (window.iconsData && window.iconsData.length > 0) {
        const indexContent = generateIndexFile(window.iconsData);
        console.log('📝 icons-index.json content:');
        console.log(indexContent);
        
        // Try to download the file
        const blob = new Blob([indexContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'icons-index.json';
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('💾 Downloaded icons-index.json file');
        console.log('📋 Upload this file to your repository root for faster loading');
    } else {
        console.log('❌ No icons loaded yet');
    }
};

// Helper to force refresh and bypass index
window.refreshIcons = function() {
    console.log('🔄 Forcing fresh icon discovery...');
    
    // Clear any cached data
    window.iconsData = [];
    window.filteredIcons = [];
    
    // Temporarily disable index method by setting a flag
    window._skipIndex = true;
    
    // Reinitialize
    initializeIconLibrary().then(() => {
        window._skipIndex = false;
        console.log('✅ Fresh discovery complete!');
        console.log('💡 Run createIconsIndex() to generate updated index file');
    });
};

// Helper to check if icons have been updated
window.checkForUpdates = async function() {
    console.log('🔍 Checking for icon updates...');
    
    // Force GitHub API discovery
    window._skipIndex = true;
    const freshIcons = await smartDiscoverIcons();
    window._skipIndex = false;
    
    const currentIcons = window.iconsData || [];
    
    const currentNames = new Set(currentIcons.map(i => `${i.category}/${i.name}`));
    const freshNames = new Set(freshIcons.map(i => `${i.category}/${i.name}`));
    
    const added = [...freshNames].filter(name => !currentNames.has(name));
    const removed = [...currentNames].filter(name => !freshNames.has(name));
    
    if (added.length > 0 || removed.length > 0) {
        console.log('🆕 Changes detected!');
        if (added.length > 0) console.log('➕ Added:', added);
        if (removed.length > 0) console.log('➖ Removed:', removed);
        console.log('💡 Run refreshIcons() to update the display');
        return true;
    } else {
        console.log('✅ No changes detected');
        return false;
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIconLibrary);
} else {
    initializeIconLibrary();
}