
#  SynthCache – Firefox Extension

_A retro-futuristic bookmark manager that auto-tags, organizes, and styles your web clutter with synthwave precision._

---

##  Core Features

###  Three-Directory System
- **Normal Browsing** – Bookmarks with smart auto-tags
- **Incognito Browsing** – Stored in a separate folder
- **Private Content** – Hidden NSFW bookmarks (nested in Incognito; viewable only in private mode)

###  Auto-Tagging System
- Extracts top 5 keywords from title and meta tags
- Removes stop words and filters short/noisy terms
- Rewrites titles with `[tag1, tag2, tag3]` format
- Works with both new and existing bookmarks

###  Dynamic Toolbar Icons
- **Normal Mode**: Neon synthwave magenta/cyan
- **Incognito Mode**: Grayscale + incognito glasses
- Auto-switches icon based on tab state

###  HTML Bookmark Import
- Import `.html` bookmark exports
- Choose import target: Normal or Incognito
- Runs full tag analysis on import

###  Built-in Bookmark Manager
- Filter by folder, tags, or search terms
- Grid/List view toggles
- Tag cloud and usage stats
- Sort by title, date, folder, or tag density

---

##  Installation

### Method 1: Developer Mode (Recommended)
1. Visit `about:debugging` in Firefox  
2. Click **This Firefox** → **Load Temporary Add-on**  
3. Select the `manifest.json` in your project folder  
4. Icon will appear in the toolbar

### Method 2: Packaged XPI Install
1. Zip all extension files (exclude `.git`, `README.md`)
2. Rename the `.zip` to `.xpi`
3. Drag & drop into Firefox or install via `about:addons`

---

##  File Structure

<details>
<summary>Click to expand</summary>

```
synthcache/
├── manifest.json               # Extension manifest
├── background.js               # Core logic & bookmarking
├── content-script.js           # Page parsing & tagging
├── popup.html/js/css           # Toolbar popup interface
├── manager.html/js/css         # Full-screen manager
├── browser-polyfill.js         # Cross-browser glue
├── icon-*.svg                  # Default mode icons
├── icon-incognito-*.svg        # Incognito mode icons
└── README.md                   # This file
```

</details>

---

##  How It Works

###  Page Analysis
- Scripts parse every visited page
- Extract keywords from `<title>`, meta, `<h1>`-`<h3>`
- Filters: min length 4, alpha-only, stop-word blacklist
- Detects video/NSFW cues for classification

###  Bookmark Organization
- `Normal` → "Normal Browsing"
- `Incognito` → "Incognito Browsing"
- `NSFW` → Nested "Private Content" folder (Incognito only)
- Tagging applied to titles like `[vaporwave, chrome, ai]`

###  Icon Management
- Detects incognito tab context
- Updates toolbar icon theme:
  - **Normal:** Synthwave neon gradient with “SC”
  - **Private:** Grayscale with “INC” glasses

---

##  Usage Guide

###  Basic Flow
1. Install extension – icon appears in toolbar  
2. Browse normally – bookmarks auto-tag  
3. Switch to incognito – icon + folder change  
4. NSFW – stored in hidden “Private Content” folder  

###  Manual Tools
- **Popup:** Quick controls (scan tabs, tag all)  
- **HTML Import:** Upload & auto-process exports  
- **Manager UI:** Explore, filter, sort, and search  

###  Bookmark Manager Highlights
-  Search: title, tag, or URL  
-  Tag Cloud: popular tags = instant filter  
-  View Switch: Grid ↔ List  
-  Analytics: Total, Tagged, NSFW  
-  Sorting: Title, Date, Folder, Tag Count

---

##  Configuration

###  Customizing Tagging
Edit `content-script.js`:

```js
this.minTagLength = 4;
this.maxTags = 5;
this.stopWords = new Set([
  'the', 'and', 'or', // etc.
]);
```

###  Theme & Style
Modify `style.css` or `manager.css`:
- Swap neon shades or font styles
- Customize layouts and UI effects

###  Privacy Defaults
- No external web requests
- NSFW folder is private and hidden
- Incognito data separate and sandboxed

---

##  Troubleshooting

###  Icons Missing
- Confirm `icon-*.svg` files exist  
- Check `about:addons` for permissions  
- Reload the extension

###  Tags Not Applying
- Wait a few seconds post-visit  
- Check browser console logs  
- Confirm page was successfully bookmarked

###  Missing Folders
- Check “Other Bookmarks” section  
- Verify permissions in manifest  
- Reload extension, rebookmark

###  Manager Won’t Load
- Disable other bookmark managers  
- Open DevTools → Console for errors  
- Confirm `manager.html` exists and is valid

---

##  Customization Ideas

###  Color Presets
- **Cyberpunk** – Electric greens + cool blues  
- **Synthwave** – Pink/purple haze  
- **Matrix** – Black/green code aesthetic  
- **Retro** – Sunset oranges + teal vibes

###  Smarter Tagging
- Tag by domain or site category  
- Add multilingual language detection  
- Rule-based or trained tag suggestions  
- Integrate keyword ML model (optional)

###  Advanced Features
- Bookmark backup/export  
- Usage analytics dashboard  
- Shareable link/tag bundles  
- API integrations (e.g. Notion, Obsidian)
