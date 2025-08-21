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
    console.log(`🌍 Base URL: ${baseUrl}`);
    return baseUrl;
}

// Load SVG content
async function loadSVG(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    } catch (error) {
        console.warn(`Could not load SVG: ${url}`, error);
        return null;
    }
}

// Parse directory listing HTML to extract SVG files
function parseDirectoryListing(html) {
    const svgFiles = [];
    
    // Multiple patterns to catch different server directory listing formats
    const patterns = [
        // Apache directory listing
        /href="([^"]*\.svg)"/gi,
        // Nginx directory listing  
        /<a[^>]+href="([^"]*\.svg)"[^>]*>/gi,
        // IIS directory listing
        /href=["']([^"']*\.svg)["']/gi,
        // Generic HTML link patterns
        /<a[^>]*>([^<]*\.svg)<\/a>/gi
    ];
    
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const filename = match[1];
            if (filename && filename.endsWith('.svg') && !filename.includes('/')) {
                svgFiles.push(filename);
            }
        }
    }
    
    // Remove duplicates and sort
    return [...new Set(svgFiles)].sort();
}

// Try to auto-discover files from directory listing
async function autoDiscoverFromDirectory(folder) {
    const baseUrl = getBaseUrl();
    const dirUrl = `${baseUrl}icons/${folder}/`;
    
    try {
        console.log(`📂 Checking directory: ${dirUrl}`);
        const response = await fetch(dirUrl);
        
        if (!response.ok) {
            console.log(`❌ Directory listing not accessible: ${response.status}`);
            return [];
        }
        
        const html = await response.text();
        const svgFiles = parseDirectoryListing(html);
        
        if (svgFiles.length === 0) {
            console.log(`📁 No SVG files found in directory listing for ${folder}`);
            return [];
        }
        
        console.log(`🎯 Found ${svgFiles.length} SVG files in ${folder}:`, svgFiles);
        
        // Load each discovered SVG file
        const icons = [];
        for (const filename of svgFiles) {
            const iconName = filename.replace('.svg', '');
            const iconUrl = `${dirUrl}${filename}`;
            
            console.log(`📥 Loading: ${iconName}`);
            const svgContent = await loadSVG(iconUrl);
            
            if (svgContent) {
                icons.push({
                    name: iconName,
                    category: folder,
                    svg: svgContent,
                    path: `icons/${folder}/${filename}`,
                    fullUrl: iconUrl
                });
                console.log(`✅ Loaded: ${iconName}`);
            } else {
                console.log(`❌ Failed to load: ${iconName}`);
            }
        }
        
        return icons;
        
    } catch (error) {
        console.log(`❌ Directory access failed for ${folder}:`, error.message);
        return [];
    }
}

// Alternative: Try to use FileSystem API (modern browsers, local files)
async function tryFileSystemAccess(folder) {
    if (!('showDirectoryPicker' in window)) {
        return [];
    }
    
    try {
        // This would require user interaction, so not automatic
        // Keeping for future reference
        return [];
    } catch (error) {
        return [];
    }
}

// Main discovery function
async function autoDiscoverIcons() {
    console.log('🔍 Starting automatic icon discovery...');
    const allIcons = [];
    
    for (const folder of CONFIG.iconFolders) {
        console.log(`\n📁 Processing folder: ${folder}`);
        
        // Try directory listing
        const directoryIcons = await autoDiscoverFromDirectory(folder);
        allIcons.push(...directoryIcons);
        
        console.log(`📊 Found ${directoryIcons.length} icons in ${folder}`);
    }
    
    return allIcons;
}

// Initialize the icon library
async function initializeIconLibrary() {
    try {
        const iconsGrid = document.getElementById('iconsGrid');
        
        // Show loading state
        if (iconsGrid) {
            iconsGrid.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #64748b;">
                    <div style="margin-bottom: 1rem;">🔍 Auto-discovering icons...</div>
                    <div style="font-size: 0.9rem; opacity: 0.7;">Scanning icon folders automatically</div>
                </div>
            `;
        }
        
        // Auto-discover all icons
        const discoveredIcons = await autoDiscoverIcons();
        
        if (discoveredIcons.length === 0) {
            if (iconsGrid) {
                iconsGrid.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #f59e0b;">
                        <h3>🤔 Auto-Discovery Not Supported</h3>
                        <p>Your web server doesn't support automatic file discovery.</p>
                        
                        <div style="background: #fffbeb; border: 1px solid #fbbf24; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; text-align: left;">
                            <h4 style="margin-top: 0; color: #92400e;">💡 Solutions:</h4>
                            <ol style="margin: 0.5rem 0; padding-left: 1.5rem; color: #92400e;">
                                <li><strong>Local Development:</strong> Use a server like <code>python -m http.server</code> or <code>npx http-server</code></li>
                                <li><strong>Apache/Nginx:</strong> Enable directory listing in server config</li>
                                <li><strong>GitHub Pages:</strong> Unfortunately doesn't support directory listing</li>
                                <li><strong>Alternative:</strong> Create an <code>icons-index.json</code> file listing your icons</li>
                            </ol>
                        </div>
                        
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; text-align: left;">
                            <strong>Looking for icons at:</strong><br>
                            📁 ${getBaseUrl()}icons/blue-default/<br>
                            📁 ${getBaseUrl()}icons/grey/<br><br>
                            <strong>Current environment:</strong> ${window.location.protocol}//${window.location.host}
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
        
        console.log(`\n🎉 SUCCESS! Auto-discovered ${discoveredIcons.length} icons!`);
        console.log('📊 Category breakdown:', breakdown);
        console.log(`🌐 Serving from: ${getBaseUrl()}`);
        
        // Show success message briefly
        if (iconsGrid) {
            const originalContent = iconsGrid.innerHTML;
            iconsGrid.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #10b981;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">🎉 Auto-discovery successful!</div>
                    <div style="font-size: 0.9rem;">Found ${discoveredIcons.length} icons automatically</div>
                </div>
            `;
            
            setTimeout(() => {
                renderIcons(); // This will replace the success message with actual icons
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
                    <div style="background: #fef2f2; padding: 1rem; border-radius: 6px; margin: 1rem 0; text-align: left; font-family: monospace; font-size: 0.8rem;">
                        <strong>Debug Info:</strong><br>
                        URL: ${window.location.href}<br>
                        Base: ${getBaseUrl()}<br>
                        Icons: ${getBaseUrl()}icons/<br>
                        Protocol: ${window.location.protocol}
                    </div>
                    <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        🔄 Retry
                    </button>
                </div>
            `;
        }
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIconLibrary);
} else {
    initializeIconLibrary();
}