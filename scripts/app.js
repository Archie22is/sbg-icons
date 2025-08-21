/**
 * Sample SVG icons data - Replace this with your actual icons
 * @author Archie M
 * 
 */ 

// Global variables - will be populated by icon-loader.js
let iconsData = [];
let filteredIcons = [];
let currentCategory = 'all';

// Initialize the app
function init() {
    renderCategories();
    renderIcons();
    updateStats();
    setupEventListeners();
}

// Render category buttons
function renderCategories() {
    const categories = ['all', ...new Set(iconsData.map(icon => icon.category))];
    const categoriesContainer = document.getElementById('categories');
    
    // Function to format category names for display
    function formatCategoryName(category) {
        if (category === 'all') return 'All Icons';
        if (category === 'blue-default') return 'Blue Default';
        if (category === 'grey') return 'Grey';
        // Fallback for any other categories
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
    }
    
    categoriesContainer.innerHTML = categories.map(category => `
        <button class="category-btn ${category === 'all' ? 'active' : ''}" data-category="${category}">
            <svg class="folder-icon" viewBox="0 0 24 24">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
            </svg>
            ${formatCategoryName(category)}
        </button>
    `).join('');
}

// Render icons grid
function renderIcons() {
    const iconsGrid = document.getElementById('iconsGrid');
    const noResults = document.getElementById('noResults');
    
    if (filteredIcons.length === 0) {
        iconsGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    iconsGrid.style.display = 'grid';
    noResults.style.display = 'none';
    
    iconsGrid.innerHTML = filteredIcons.map(icon => `
        <div class="icon-item" onclick="openCopyModal('${icon.name}')">
            ${icon.svg}
            <div class="icon-name">${icon.name}</div>
        </div>
    `).join('');
}

// Filter icons
function filterIcons() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredIcons = iconsData.filter(icon => {
        const matchesSearch = icon.name.toLowerCase().includes(searchTerm) || 
                            icon.category.toLowerCase().includes(searchTerm);
        const matchesCategory = currentCategory === 'all' || icon.category === currentCategory;
        return matchesSearch && matchesCategory;
    });
    
    renderIcons();
    updateStats();
}

// Update statistics
function updateStats() {
    document.getElementById('totalCount').textContent = `${iconsData.length} icons total`;
    document.getElementById('visibleCount').textContent = `${filteredIcons.length} icons visible`;
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', filterIcons);
    
    // Category buttons
    document.getElementById('categories').addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            filterIcons();
        }
    });
    
    // Close modal when clicking outside
    document.getElementById('copyModal').addEventListener('click', (e) => {
        if (e.target.id === 'copyModal') {
            closeCopyModal();
        }
    });
}

// Open copy modal
function openCopyModal(iconName) {
    const icon = iconsData.find(i => i.name === iconName);
    if (!icon) return;
    
    document.getElementById('modalTitle').textContent = `Copy "${icon.name}" Icon`;
    document.getElementById('svgCode').textContent = icon.svg;
    document.getElementById('filePath').textContent = icon.path;
    document.getElementById('imgTag').textContent = `<img src="${icon.path}" alt="${icon.name}" />`;
    
    document.getElementById('copyModal').style.display = 'block';
}

// Close copy modal
function closeCopyModal() {
    document.getElementById('copyModal').style.display = 'none';
}

// Copy to clipboard
async function copyToClipboard(elementId, type) {
    const text = document.getElementById(elementId).textContent;
    
    try {
        await navigator.clipboard.writeText(text);
        showNotification(`${type} copied to clipboard!`);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification(`${type} copied to clipboard!`);
    }
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('copyNotification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);