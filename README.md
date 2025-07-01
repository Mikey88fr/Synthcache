#  SynthCache - Firefox Extension

A retro-futuristic Firefox extension that organizes your bookmarks with synthwave style and auto-tagging intelligence.

##  Core Features

###  **Three-Directory System**
- **Normal Browsing** - Regular bookmarks with auto-tags
- **Incognito Browsing** - Private browsing bookmarks (separate folder)
- **Private Content** - Hidden NSFW content (nested in incognito, only accessible in incognito mode)

###  **Auto-Tagging System**
- Extracts 5 most relevant keywords from page titles and descriptions
- Removes stop words and validates tag quality
- Updates bookmark titles with `[tag1, tag2, tag3]` format
- Analyzes existing bookmarks and new ones automatically

###  **Dynamic Toolbar Icons**
- **Normal Mode**: Vibrant synthwave colors (magenta/cyan)
- **Incognito Mode**: Grayscale with incognito glasses
- Icon changes automatically when switching modes

###  **HTML Import**
- Import HTML bookmark files with automatic tagging
- Choose target directory (Normal or Incognito)
- Processes all bookmarks with intelligent analysis

###  **Built-in Bookmark Manager**
- Filter by directory, tags, or search terms
- Grid and List view modes
- Popular tags cloud
- Statistics dashboard
- Sort by title, date, folder, or tag count

##  Installation

### Method 1: Developer Mode (Recommended)
1. Open Firefox and go to `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Navigate to the extension folder and select `manifest.json`
4. The extension will be loaded and icon appears in toolbar

### Method 2: Package and Install
1. Zip all files (excluding `.git`, `README.md`)
2. Rename to `.xpi` extension
3. Drag and drop into Firefox or use `about:addons`

##  File Structure

```
synthcache/
├── manifest.json              # Firefox extension manifest
├── background.js              # Core logic & bookmark management
├── content-script.js          # Page analysis & keyword extraction
├── popup.html/js/css         # Toolbar popup interface
├── manager.html/js/css       # Full bookmark manager
├── browser-polyfill.js       # Cross-browser compatibility
├── icon-*.svg                # Normal mode icons (synthwave)
├── icon-incognito-*.svg      # Incognito mode icons (grayscale)
└── README.md                 # This file
```

##  How It Works

###  **Page Analysis**
1. Content script runs on every page
2. Extracts keywords from title, meta description, and headings
3. Applies strict filtering (4+ characters, no numbers, no stop words)
4. Detects video content for NSFW classification

###  **Bookmark Organization**
1. **Normal browsing** → "Normal Browsing" folder
2. **Incognito browsing** → "Incognito Browsing" folder  
3. **NSFW content** → "Private Content" (hidden in incognito folder)
4. Tags added to bookmark titles: `[keyword1, keyword2, keyword3]`

###  **Icon Management**
- Monitors active tab incognito state
- Updates toolbar icon dynamically
- Normal: Bright synthwave gradient with "SC"
- Incognito: Grayscale with glasses and "INC"

##  Usage Guide

###  **Basic Operation**
1. **Install extension** - Icon appears in toolbar
2. **Browse normally** - Bookmarks auto-tagged and organized
3. **Switch to incognito** - Icon changes, separate folder used
4. **NSFW content** - Automatically moved to hidden directory

###  **Manual Controls**
- **Toolbar popup**: Quick actions (analyze tabs, all bookmarks)
- **Import HTML**: Import bookmark files with auto-tagging
- **Bookmark Manager**: Full interface for browsing and filtering

###  **Bookmark Manager Features**
- **Search**: Find bookmarks by title, URL, or tags
- **Filter**: Show/hide different directories
- **Tag Cloud**: Click popular tags to filter
- **Views**: Switch between grid and list layouts
- **Sort**: By title, date, folder, or tag count
- **Stats**: Total, tagged, and NSFW bookmark counts

##  Configuration

###  **Customizing Tags**
Edit `content-script.js`:
```javascript
this.minTagLength = 4;        // Minimum tag length
this.maxTags = 5;             // Max tags per bookmark
this.stopWords = new Set([    // Words to exclude
    'the', 'and', 'or', ...
]);
```

###  **Customizing Appearance**
Edit `style.css` or `manager.css`:
- Change synthwave colors
- Modify fonts and effects
- Update grid layouts

###  **Privacy Settings**
- NSFW content automatically hidden
- Incognito bookmarks separate from normal
- No external requests (all local processing)

##  Troubleshooting

###  **Icons Not Showing**
- Ensure SVG files are in extension directory
- Check Firefox permissions in `about:addons`
- Try refreshing/reloading extension

###  **Tags Not Appearing**
- Wait 1-2 seconds after visiting page
- Check console for content script errors
- Verify bookmark exists before tagging

###  **Folders Not Created**
- Check Firefox bookmark permissions
- Look in "Other Bookmarks" section
- Reload extension and try again

###  **Manager Not Loading**
- Disable other bookmark extensions
- Check browser console for errors
- Ensure `manager.html` file exists

##  Customization Ideas

###  **Color Themes**
- Cyberpunk: Change to green/blue neon
- Synthwave: Pink/purple gradients  
- Matrix: Green monochrome
- Retro: Orange/teal combinations

###  **Advanced Tagging**
- Add domain-based tags
- Include page language detection
- Custom tag rules per website
- Machine learning tag suggestions

###  **Additional Features**
- Export/backup bookmark data
- Tag statistics and analytics
- Bookmark sharing capabilities
- Integration with other services
