// Smart Bookmark Manager JavaScript
class BookmarkManager {
    constructor() {
        this.bookmarks = [];
        this.filteredBookmarks = [];
        this.currentView = 'grid';
        this.currentSort = 'title';
        this.isIncognito = false; // Track if we're in incognito mode
        this.filters = {
            search: '',
            normal: true,
            nsfw: false,
            tags: []
        };
        this.bookmarkFolders = {};
        
        // Progress tracking
        this.progressState = {
            isRunning: false,
            total: 0,
            processed: 0,
            success: 0,
            failed: 0
        };
        
        this.init();
    }
    
    async init() {
        // Detect if we're in incognito mode
        await this.detectIncognitoMode();
        
        this.setupEventListeners();
        this.showLoading(true);
        
        try {
            await this.loadBookmarkFolders();
            await this.loadBookmarks();
            this.updateStats();
            this.updateTagCloud();
            this.renderBookmarks();
        } catch (error) {
            console.error('Error initializing bookmark manager:', error);
        } finally {
            this.showLoading(false);
        }
    }
    
    async detectIncognitoMode() {
        try {
            // First, check URL parameters (most reliable method)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('incognito')) {
                this.isIncognito = urlParams.get('incognito') === 'true';
                console.log(`🔍 [DEBUG] Incognito mode detected from URL parameter: ${this.isIncognito}`);
            } else {
                // Fallback: Check if we have access to incognito APIs
                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                if (tabs.length > 0) {
                    this.isIncognito = tabs[0].incognito;
                    console.log(`🔍 [DEBUG] Incognito mode detected from tab query: ${this.isIncognito}`);
                } else {
                    this.isIncognito = false;
                    console.log(`🔍 [DEBUG] Could not detect incognito mode, defaulting to normal mode`);
                }
            }
        } catch (error) {
            // Fallback: assume normal mode
            this.isIncognito = false;
            console.error(`💥 [DEBUG] Error detecting incognito mode:`, error);
        }
        
        console.log(`🕶️ [DEBUG] Bookmark Manager running in: ${this.isIncognito ? 'Incognito Mode' : 'Normal Mode'}`);
        
        // Update UI based on mode
        this.updateUIForMode();
    }
    
    updateUIForMode() {
        const nsfwFilterContainer = document.getElementById('nsfw-filter-container');
        const nsfwStatsElement = document.getElementById('nsfw-bookmarks');
        
        if (!this.isIncognito) {
            // In normal mode, hide NSFW filter option completely
            if (nsfwFilterContainer) {
                nsfwFilterContainer.style.display = 'none';
            }
            
            // Hide NSFW stats
            if (nsfwStatsElement) {
                nsfwStatsElement.parentElement.style.display = 'none';
            }
            
            // Force NSFW filter to false in normal mode and clear any NSFW-related tag filters
            this.filters.nsfw = false;
            const nsfwRelatedTags = ['nsfw', 'adult', 'xxx', 'porn', 'explicit', 'mature', 'erotic'];
            this.filters.tags = this.filters.tags.filter(tag => {
                return !nsfwRelatedTags.some(nsfwTag => tag.toLowerCase().includes(nsfwTag));
            });
            
            console.log(`🔒 [DEBUG] Normal mode: NSFW content and filters disabled`);
        } else {
            // In incognito mode, show NSFW filter option
            if (nsfwFilterContainer) {
                nsfwFilterContainer.style.display = 'block';
            }
            
            // Show NSFW stats
            if (nsfwStatsElement) {
                nsfwStatsElement.parentElement.style.display = 'block';
            }
            
            console.log(`🕶️ [DEBUG] Incognito mode: NSFW content and filters enabled`);
        }
    }
    
    setupEventListeners() {
        // Search and filter controls
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });
        
        document.getElementById('filter-normal').addEventListener('change', (e) => {
            this.filters.normal = e.target.checked;
            this.applyFilters();
        });
        
        document.getElementById('filter-nsfw').addEventListener('change', (e) => {
            this.filters.nsfw = e.target.checked;
            this.applyFilters();
        });
        
        // View and sort controls
        document.getElementById('view-grid').addEventListener('click', () => {
            this.setView('grid');
        });
        
        document.getElementById('view-list').addEventListener('click', () => {
            this.setView('list');
        });
        
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFilters();
        });
        
        // Header controls
        document.getElementById('import-html-btn').addEventListener('click', () => {
            this.showImportModal();
        });
        
        document.getElementById('analyze-all-btn').addEventListener('click', () => {
            this.analyzeAllBookmarks();
        });
        
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refresh();
        });
        
        // Debug controls
        document.getElementById('save-debug-btn').addEventListener('click', async () => {
            await this.saveDebugLogs();
        });
        
        document.getElementById('clear-debug-btn').addEventListener('click', async () => {
            await this.clearDebugLogs();
        });
        
        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideImportModal();
        });
        
        document.getElementById('import-cancel-btn').addEventListener('click', () => {
            this.hideImportModal();
        });
        
        document.getElementById('import-confirm-btn').addEventListener('click', () => {
            this.processHtmlImport();
        });
        
        // File input handling
        const fileInput = document.getElementById('file-input');
        const dropZone = document.getElementById('file-drop-zone');
        const browseBtn = document.querySelector('.browse-btn');
        
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files[0]);
        });
        
        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'text/html') {
                this.handleFileSelection(file);
            }
        });
        
        // Modal click outside to close
        document.getElementById('import-modal').addEventListener('click', (e) => {
            if (e.target.id === 'import-modal') {
                this.hideImportModal();
            }
        });
    }
    
    async loadBookmarkFolders() {
        try {
            const response = await browser.runtime.sendMessage({ command: 'get-bookmark-folders' });
            this.bookmarkFolders = response.bookmarkFolders || {};
        } catch (error) {
            console.error('Error loading bookmark folders:', error);
        }
    }
    
    async loadBookmarks() {
        try {
            const bookmarkTree = await browser.bookmarks.getTree();
            this.bookmarks = this.extractBookmarksFromTree(bookmarkTree);
            this.applyFilters();
        } catch (error) {
            console.error('Error loading bookmarks:', error);
        }
    }
    
    extractBookmarksFromTree(tree) {
        const bookmarks = [];
        
        console.log(`📚 [DEBUG] Extracting bookmarks from tree. Folder IDs:`, this.bookmarkFolders);
        
        const traverse = (nodes, parentFolder = '') => {
            for (const node of nodes) {
                if (node.url) {
                    // Determine folder type (simplified two-folder system)
                    let folderType = 'other';
                    if (node.parentId === this.bookmarkFolders.normal) {
                        folderType = 'normal';
                        console.log(`📁 [DEBUG] Found normal bookmark: ${node.title}`);
                    } else if (node.parentId === this.bookmarkFolders.nsfwHidden) {
                        folderType = 'nsfw';
                        console.log(`🔞 [DEBUG] Found NSFW bookmark: ${node.title}`);
                    } else {
                        console.log(`❓ [DEBUG] Found bookmark in other folder (${node.parentId}): ${node.title}`);
                    }
                    
                    // Extract tags from title
                    const tags = this.extractTagsFromTitle(node.title);
                    const cleanTitle = node.title.replace(/ \[.*\]$/, '');
                    
                    bookmarks.push({
                        id: node.id,
                        title: cleanTitle,
                        url: node.url,
                        tags: tags,
                        folderType: folderType,
                        dateAdded: node.dateAdded || Date.now(),
                        parentId: node.parentId
                    });
                } else if (node.children) {
                    traverse(node.children, node.title);
                }
            }
        };
        
        traverse(tree);
        return bookmarks;
    }
    
    extractTagsFromTitle(title) {
        const match = title.match(/\[([^\]]+)\]$/);
        if (match) {
            return match[1].split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        return [];
    }
    
    applyFilters() {
        let filtered = [...this.bookmarks];
        
        console.log(`🔍 [DEBUG] Applying filters - Total bookmarks: ${this.bookmarks.length}, Incognito mode: ${this.isIncognito}`);
        console.log(`🔍 [DEBUG] Filter settings:`, this.filters);
        
        // Apply folder filters
        filtered = filtered.filter(bookmark => {
            if (bookmark.folderType === 'normal' && !this.filters.normal) {
                console.log(`🚫 [DEBUG] Filtering out normal bookmark: ${bookmark.title}`);
                return false;
            }
            
            // CRITICAL: Hide NSFW content completely in normal mode
            if (bookmark.folderType === 'nsfw') {
                if (!this.isIncognito) {
                    console.log(`🔞 [DEBUG] Hiding NSFW bookmark in normal mode: ${bookmark.title}`);
                    return false; // Always hide NSFW content in normal mode
                }
                if (!this.filters.nsfw) {
                    console.log(`🔞 [DEBUG] Filtering out NSFW bookmark (filter disabled): ${bookmark.title}`);
                    return false;
                }
                console.log(`🔞 [DEBUG] Showing NSFW bookmark in incognito mode: ${bookmark.title}`);
                return true; // In incognito mode, respect the filter setting
            }
            
            return true;
        });
        
        console.log(`🔍 [DEBUG] After folder filtering: ${filtered.length} bookmarks remain`);
        
        // Apply search filter
        if (this.filters.search) {
            const beforeSearch = filtered.length;
            filtered = filtered.filter(bookmark => {
                const searchTerms = this.filters.search.toLowerCase();
                
                // In normal mode, never show NSFW content in search results
                if (!this.isIncognito && bookmark.folderType === 'nsfw') {
                    return false;
                }
                
                return bookmark.title.toLowerCase().includes(searchTerms) ||
                       bookmark.url.toLowerCase().includes(searchTerms) ||
                       bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerms));
            });
            console.log(`🔍 [DEBUG] After search filtering: ${filtered.length} bookmarks remain (removed ${beforeSearch - filtered.length})`);
        }
        
        // Apply tag filters
        if (this.filters.tags.length > 0) {
            filtered = filtered.filter(bookmark => {
                return this.filters.tags.every(filterTag => 
                    bookmark.tags.some(bookmarkTag => 
                        bookmarkTag.toLowerCase().includes(filterTag.toLowerCase())
                    )
                );
            });
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'date':
                    return b.dateAdded - a.dateAdded;
                case 'folder':
                    return a.folderType.localeCompare(b.folderType);
                case 'tags':
                    return b.tags.length - a.tags.length;
                default:
                    return 0;
            }
        });
        
        this.filteredBookmarks = filtered;
        this.renderBookmarks();
    }
    
    renderBookmarks() {
        const container = document.getElementById('bookmark-list');
        container.innerHTML = '';
        
        if (this.filteredBookmarks.length === 0) {
            container.innerHTML = `
                <div class="no-bookmarks">
                    <h3>🔍 No bookmarks found</h3>
                    <p>Try adjusting your filters or import some bookmarks.</p>
                </div>
            `;
            return;
        }
        
        this.filteredBookmarks.forEach(bookmark => {
            const bookmarkElement = this.createBookmarkElement(bookmark);
            container.appendChild(bookmarkElement);
        });
    }
    
    createBookmarkElement(bookmark) {
        const div = document.createElement('div');
        div.className = 'bookmark-item';
        div.setAttribute('data-bookmark-id', bookmark.id);
        
        const folderClass = {
            'normal': 'folder-normal',
            'nsfw': 'folder-nsfw',
            'other': 'folder-other'
        };
        
        // Filter out NSFW-related tags in normal mode
        let displayTags = bookmark.tags;
        if (!this.isIncognito) {
            const nsfwRelatedTags = ['nsfw', 'adult', 'xxx', 'porn', 'explicit', 'mature', 'erotic'];
            displayTags = bookmark.tags.filter(tag => {
                return !nsfwRelatedTags.some(nsfwTag => tag.toLowerCase().includes(nsfwTag));
            });
        }
        
        const tagsHtml = displayTags.map(tag => 
            `<span class="bookmark-tag">${tag}</span>`
        ).join('');
        
        div.innerHTML = `
            <div class="bookmark-folder ${folderClass[bookmark.folderType]}">
                ${bookmark.folderType}
            </div>
            <div class="bookmark-title">${this.escapeHtml(bookmark.title)}</div>
            <div class="bookmark-url">${this.escapeHtml(bookmark.url)}</div>
            <div class="bookmark-tags">${tagsHtml}</div>
        `;
        
        // Add click handler to open bookmark
        div.addEventListener('click', () => {
            window.open(bookmark.url, '_blank');
        });
        
        return div;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    setView(view) {
        this.currentView = view;
        const container = document.getElementById('bookmark-list');
        const gridBtn = document.getElementById('view-grid');
        const listBtn = document.getElementById('view-list');
        
        if (view === 'grid') {
            container.className = 'bookmark-list grid-view';
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        } else {
            container.className = 'bookmark-list list-view';
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        }
    }
    
    updateStats() {
        const totalCount = this.bookmarks.length;
        const taggedCount = this.bookmarks.filter(b => b.tags.length > 0).length;
        
        document.getElementById('total-bookmarks').textContent = totalCount;
        document.getElementById('tagged-bookmarks').textContent = taggedCount;
        
        // Only show NSFW stats in incognito mode
        const nsfwStatsElement = document.getElementById('nsfw-bookmarks');
        if (this.isIncognito) {
            const nsfwCount = this.bookmarks.filter(b => b.folderType === 'nsfw').length;
            nsfwStatsElement.textContent = nsfwCount;
            nsfwStatsElement.parentElement.style.display = 'block';
        } else {
            nsfwStatsElement.parentElement.style.display = 'none';
        }
    }
    
    updateTagCloud() {
        const tagFreq = {};
        
        console.log(`🏷️ [DEBUG] Updating tag cloud. Incognito mode: ${this.isIncognito}, Total bookmarks: ${this.bookmarks.length}`);
        
        // Only include tags from bookmarks that are currently visible/accessible
        const visibleBookmarks = this.bookmarks.filter(bookmark => {
            // In normal mode, exclude NSFW content completely
            if (!this.isIncognito && bookmark.folderType === 'nsfw') {
                console.log(`🚫 [DEBUG] Excluding NSFW bookmark from tag cloud: ${bookmark.title}`);
                return false;
            }
            return true;
        });
        
        console.log(`🏷️ [DEBUG] Visible bookmarks for tag cloud: ${visibleBookmarks.length}`);
        
        visibleBookmarks.forEach(bookmark => {
            bookmark.tags.forEach(tag => {
                // Skip NSFW-related tags from appearing in normal mode
                const nsfwRelatedTags = ['nsfw', 'adult', 'xxx', 'porn', 'explicit', 'mature', 'erotic'];
                if (!this.isIncognito && nsfwRelatedTags.some(nsfwTag => tag.toLowerCase().includes(nsfwTag))) {
                    console.log(`🚫 [DEBUG] Excluding NSFW-related tag from tag cloud: ${tag}`);
                    return;
                }
                tagFreq[tag] = (tagFreq[tag] || 0) + 1;
            });
        });
        
        console.log(`🏷️ [DEBUG] Tag frequencies:`, tagFreq);
        
        const sortedTags = Object.entries(tagFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20);
        
        const tagCloudContainer = document.getElementById('tag-cloud');
        tagCloudContainer.innerHTML = sortedTags.map(([tag, count]) => 
            `<span class="tag-item" data-tag="${tag}">${tag} (${count})</span>`
        ).join('');
        
        // Add click handlers to tag items
        tagCloudContainer.querySelectorAll('.tag-item').forEach(tagItem => {
            tagItem.addEventListener('click', () => {
                const tag = tagItem.getAttribute('data-tag');
                this.toggleTagFilter(tag);
            });
        });
    }
    
    toggleTagFilter(tag) {
        // In normal mode, prevent NSFW-related tags from being used as filters
        if (!this.isIncognito) {
            const nsfwRelatedTags = ['nsfw', 'adult', 'xxx', 'porn', 'explicit', 'mature', 'erotic'];
            if (nsfwRelatedTags.some(nsfwTag => tag.toLowerCase().includes(nsfwTag))) {
                console.log(`🚫 [DEBUG] Preventing NSFW-related tag filter in normal mode: ${tag}`);
                return;
            }
        }
        
        const index = this.filters.tags.indexOf(tag);
        if (index === -1) {
            this.filters.tags.push(tag);
        } else {
            this.filters.tags.splice(index, 1);
        }
        this.applyFilters();
    }
    
    showLoading(show) {
        const loading = document.getElementById('loading-indicator');
        loading.style.display = show ? 'flex' : 'none';
    }
    
    showImportModal() {
        document.getElementById('import-modal').style.display = 'block';
    }
    
    hideImportModal() {
        document.getElementById('import-modal').style.display = 'none';
        document.getElementById('file-input').value = '';
        document.getElementById('import-confirm-btn').disabled = true;
    }
    
    handleFileSelection(file) {
        if (file && file.type === 'text/html') {
            this.selectedFile = file;
            document.getElementById('import-confirm-btn').disabled = false;
            
            // Update drop zone to show file selected
            const dropZone = document.getElementById('file-drop-zone');
            dropZone.innerHTML = `
                <div class="drop-content">
                    <span class="drop-icon">✅</span>
                    <span class="drop-text">File selected: ${file.name}</span>
                    <button class="browse-btn">Choose Different File</button>
                </div>
            `;
            
            // Re-add browse button event
            dropZone.querySelector('.browse-btn').addEventListener('click', () => {
                document.getElementById('file-input').click();
            });
        }
    }
    
    async processHtmlImport() {
        if (!this.selectedFile) return;
        
        try {
            const htmlContent = await this.selectedFile.text();
            const importMode = document.querySelector('input[name="import-mode"]:checked').value;
            const isIncognito = importMode === 'incognito';
            
            await browser.runtime.sendMessage({
                command: 'import-html-bookmarks',
                htmlContent: htmlContent,
                isIncognito: isIncognito
            });
            
            this.hideImportModal();
            
            // Show success message and refresh
            setTimeout(() => {
                this.refresh();
            }, 2000);
            
        } catch (error) {
            console.error('Error importing HTML bookmarks:', error);
            alert('Error importing bookmarks. Please check the file format.');
        }
    }
    
    async analyzeAllBookmarks() {
        console.log('🔬 [DEBUG] Starting analysis of all bookmarks from manager');
        
        // Reset and show progress
        this.resetProgress();
        this.updateProgress({
            status: 'Starting analysis...',
            isRunning: true
        });
        this.showProgress(true);
        
        try {
            await browser.runtime.sendMessage({ command: 'analyze-all-bookmarks' });
            console.log('✅ [DEBUG] Analysis request sent to background script');
            
            // Refresh after analysis is complete (progress will handle timing)
            setTimeout(() => {
                this.refresh();
            }, 8000);
            
        } catch (error) {
            console.error('💥 [DEBUG] Failed to start analysis:', error);
            this.updateProgress({
                status: '❌ Failed to start analysis',
                isRunning: false,
                isComplete: true
            });
        }
    }
    
    async refresh() {
        this.showLoading(true);
        try {
            await this.loadBookmarks();
            this.updateStats();
            this.updateTagCloud();
        } catch (error) {
            console.error('Error refreshing bookmarks:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async saveDebugLogs() {
        console.log('💾 [DEBUG] Manual debug log save requested');
        
        try {
            const response = await browser.runtime.sendMessage({ command: 'save-debug-files' });
            
            if (response?.success) {
                // Show temporary success message in progress bar
                this.updateProgress({
                    status: '✅ Debug files saved to Downloads folder',
                    isRunning: false,
                    isComplete: true
                });
                this.showProgress(true);
                
                // Auto-hide after 3 seconds
                setTimeout(() => {
                    this.showProgress(false);
                }, 3000);
                
                console.log('✅ [DEBUG] Debug files saved successfully');
            } else {
                throw new Error(response?.message || 'Failed to save debug files');
            }
        } catch (error) {
            console.error('💥 [DEBUG] Failed to save debug logs:', error);
            
            this.updateProgress({
                status: '❌ Failed to save debug files',
                isRunning: false,
                isComplete: true
            });
            this.showProgress(true);
            
            setTimeout(() => {
                this.showProgress(false);
            }, 3000);
        }
    }

    async clearDebugLogs() {
        console.log('🧹 [DEBUG] Manual debug log clear requested');
        
        try {
            const response = await browser.runtime.sendMessage({ command: 'clear-debug-logs' });
            
            if (response?.success) {
                // Show temporary success message in progress bar
                this.updateProgress({
                    status: '🧹 Debug logs cleared',
                    isRunning: false,
                    isComplete: true
                });
                this.showProgress(true);
                
                // Auto-hide after 2 seconds
                setTimeout(() => {
                    this.showProgress(false);
                }, 2000);
                
                console.log('✅ [DEBUG] Debug logs cleared successfully');
            } else {
                throw new Error(response?.message || 'Failed to clear debug logs');
            }
        } catch (error) {
            console.error('💥 [DEBUG] Failed to clear debug logs:', error);
            
            this.updateProgress({
                status: '❌ Failed to clear debug logs',
                isRunning: false,
                isComplete: true
            });
            this.showProgress(true);
            
            setTimeout(() => {
                this.showProgress(false);
            }, 3000);
        }
    }
    
    // Progress tracking methods
    showProgress(show = true) {
        const progressSection = document.getElementById('progress-section');
        if (show) {
            progressSection.style.display = 'block';
            progressSection.classList.add('active');
        } else {
            progressSection.style.display = 'none';
            progressSection.classList.remove('active');
        }
    }
    
    updateProgress(data) {
        if (!data) return;
        
        this.progressState = { ...this.progressState, ...data };
        
        const { total, processed, success, failed, status, isComplete } = this.progressState;
        
        // Update progress text
        const progressText = document.getElementById('progress-text');
        if (status) {
            progressText.textContent = status;
        } else if (isComplete) {
            const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
            progressText.textContent = `✅ Analysis Complete! Success rate: ${successRate}%`;
        } else {
            progressText.textContent = `Analyzing bookmarks... ${processed}/${total}`;
        }
        
        // Update progress bar
        const progressFill = document.getElementById('progress-fill');
        const progressPercentage = document.getElementById('progress-percentage');
        const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
        
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
        
        // Update counters
        document.getElementById('processed-count').textContent = processed || 0;
        document.getElementById('success-count').textContent = success || 0;
        document.getElementById('failed-count').textContent = failed || 0;
        
        // Show progress section if analysis is running
        if (processed > 0 && !isComplete) {
            this.showProgress(true);
        } else if (isComplete) {
            // Keep showing for a few seconds then hide
            setTimeout(() => {
                this.showProgress(false);
                this.progressState.isRunning = false;
            }, 5000);
        }
        
        console.log(`📊 [DEBUG] Progress updated:`, this.progressState);
    }
    
    resetProgress() {
        this.progressState = {
            isRunning: false,
            total: 0,
            processed: 0,
            success: 0,
            failed: 0
        };
        this.updateProgress(this.progressState);
        this.showProgress(false);
    }
}

// Initialize the bookmark manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookmarkManager = new BookmarkManager();
});
