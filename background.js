console.log("SynthCache background script loaded");

// Debug logging system
class DebugLogger {
  constructor() {
    this.failedTaggingLog = [];
    this.nsfwClassificationLog = [];
    this.generalErrorLog = [];
    this.keywordExtractionLog = [];
    this.isDebugEnabled = true; // Set to false to disable debug logging
  }

  logFailedTagging(url, reason, details = {}) {
    if (!this.isDebugEnabled) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      url: url,
      reason: reason,
      details: details,
      userAgent: navigator.userAgent,
      extensionVersion: '1.0'
    };
    
    this.failedTaggingLog.push(entry);
    console.error(`🚫 [FAILED TAGGING] ${url}: ${reason}`, details);
  }

  logNSFWClassification(url, hasVideo, isNSFW, reason, videoDetails = {}) {
    if (!this.isDebugEnabled) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      url: url,
      hasVideo: hasVideo,
      isNSFW: isNSFW,
      reason: reason,
      videoDetails: videoDetails,
      userAgent: navigator.userAgent,
      extensionVersion: '1.0'
    };
    
    this.nsfwClassificationLog.push(entry);
    console.log(`🔞 [NSFW CHECK] ${url}: hasVideo=${hasVideo}, isNSFW=${isNSFW}, reason=${reason}`);
  }

  logGeneralError(context, error, details = {}) {
    if (!this.isDebugEnabled) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      context: context,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      details: details,
      userAgent: navigator.userAgent,
      extensionVersion: '1.0'
    };
    
    this.generalErrorLog.push(entry);
    console.error(`💥 [GENERAL ERROR] ${context}:`, error, details);
  }

  logKeywordExtraction(url, debugInfo) {
    if (!this.isDebugEnabled) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      url: url,
      ...debugInfo,
      userAgent: navigator.userAgent,
      extensionVersion: '1.0'
    };
    
    this.keywordExtractionLog.push(entry);
    console.log(`📝 [KEYWORD DEBUG] ${url}: ${debugInfo.finalKeywordCount} keywords generated`, debugInfo);
  }

  logKeywordExtractionFailure(url, reason, details = {}) {
    if (!this.isDebugEnabled) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      url: url,
      reason: reason,
      details: details,
      userAgent: navigator.userAgent,
      extensionVersion: '1.0'
    };
    
    this.keywordExtractionLog.push(entry);
    console.warn(`⚠️ [KEYWORD FAILURE] ${url}: ${reason}`, details);
  }

  async saveDebugFiles() {
    if (!this.isDebugEnabled) return;
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Save failed tagging log
      if (this.failedTaggingLog.length > 0) {
        const failedTaggingData = {
          generatedAt: new Date().toISOString(),
          totalFailures: this.failedTaggingLog.length,
          summary: this.generateFailedTaggingSummary(),
          entries: this.failedTaggingLog
        };
        
        await this.downloadJSONFile(
          `synthcache-failed-tagging-${timestamp}.json`,
          failedTaggingData
        );
      }

      // Save NSFW classification log
      if (this.nsfwClassificationLog.length > 0) {
        const nsfwData = {
          generatedAt: new Date().toISOString(),
          totalChecked: this.nsfwClassificationLog.length,
          summary: this.generateNSFWSummary(),
          entries: this.nsfwClassificationLog
        };
        
        await this.downloadJSONFile(
          `synthcache-nsfw-classification-${timestamp}.json`,
          nsfwData
        );
      }

      // Save general errors log
      if (this.generalErrorLog.length > 0) {
        const errorData = {
          generatedAt: new Date().toISOString(),
          totalErrors: this.generalErrorLog.length,
          summary: this.generateErrorSummary(),
          entries: this.generalErrorLog
        };
        
        await this.downloadJSONFile(
          `synthcache-general-errors-${timestamp}.json`,
          errorData
        );
      }

      // Save keyword extraction log
      if (this.keywordExtractionLog.length > 0) {
        const keywordData = {
          generatedAt: new Date().toISOString(),
          totalEntries: this.keywordExtractionLog.length,
          summary: this.generateKeywordExtractionSummary(),
          entries: this.keywordExtractionLog
        };
        
        await this.downloadJSONFile(
          `synthcache-keyword-extraction-${timestamp}.json`,
          keywordData
        );
      }

      console.log(`📁 [DEBUG] Debug files saved with timestamp: ${timestamp}`);
      
    } catch (error) {
      console.error('💥 [DEBUG] Failed to save debug files:', error);
    }
  }

  generateFailedTaggingSummary() {
    const reasonCounts = {};
    this.failedTaggingLog.forEach(entry => {
      reasonCounts[entry.reason] = (reasonCounts[entry.reason] || 0) + 1;
    });
    
    return {
      reasonBreakdown: reasonCounts,
      mostCommonReason: Object.keys(reasonCounts).reduce((a, b) => 
        reasonCounts[a] > reasonCounts[b] ? a : b, 'none'
      ),
      timeRange: {
        first: this.failedTaggingLog[0]?.timestamp,
        last: this.failedTaggingLog[this.failedTaggingLog.length - 1]?.timestamp
      }
    };
  }

  generateNSFWSummary() {
    const nsfwCount = this.nsfwClassificationLog.filter(entry => entry.isNSFW).length;
    const videoCount = this.nsfwClassificationLog.filter(entry => entry.hasVideo).length;
    
    return {
      totalChecked: this.nsfwClassificationLog.length,
      nsfwDetected: nsfwCount,
      videoDetected: videoCount,
      nsfwPercentage: this.nsfwClassificationLog.length > 0 ? 
        Math.round((nsfwCount / this.nsfwClassificationLog.length) * 100) : 0,
      videoPercentage: this.nsfwClassificationLog.length > 0 ? 
        Math.round((videoCount / this.nsfwClassificationLog.length) * 100) : 0
    };
  }

  generateErrorSummary() {
    const contextCounts = {};
    this.generalErrorLog.forEach(entry => {
      contextCounts[entry.context] = (contextCounts[entry.context] || 0) + 1;
    });
    
    return {
      contextBreakdown: contextCounts,
      mostCommonContext: Object.keys(contextCounts).reduce((a, b) => 
        contextCounts[a] > contextCounts[b] ? a : b, 'none'
      ),
      uniqueErrors: [...new Set(this.generalErrorLog.map(entry => entry.error.message))]
    };
  }

  generateKeywordExtractionSummary() {
    const reasonCounts = {};
    const successfulExtractions = this.keywordExtractionLog.filter(entry => entry.finalKeywordCount > 0);
    const failedExtractions = this.keywordExtractionLog.filter(entry => entry.reason || entry.finalKeywordCount === 0);
    
    failedExtractions.forEach(entry => {
      const reason = entry.reason || 'NO_KEYWORDS_GENERATED';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    
    return {
      totalAttempts: this.keywordExtractionLog.length,
      successfulExtractions: successfulExtractions.length,
      failedExtractions: failedExtractions.length,
      successRate: this.keywordExtractionLog.length > 0 ? 
        Math.round((successfulExtractions.length / this.keywordExtractionLog.length) * 100) : 0,
      failureReasons: reasonCounts,
      mostCommonFailure: Object.keys(reasonCounts).reduce((a, b) => 
        reasonCounts[a] > reasonCounts[b] ? a : b, 'none'
      )
    };
  }

  async downloadJSONFile(filename, data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    await browser.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    });
    
    // Clean up the blob URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  clearLogs() {
    this.failedTaggingLog = [];
    this.nsfwClassificationLog = [];
    this.generalErrorLog = [];
    this.keywordExtractionLog = [];
    console.log('🧹 [DEBUG] All debug logs cleared');
  }
}

// Global debug logger instance
const debugLogger = new DebugLogger();

// Folder IDs for bookmark organization - Two-directory system
let bookmarkFolders = {
  normal: null,      // Normal browsing bookmarks (visible in both modes)
  nsfwHidden: null   // Hidden NSFW content (incognito-only access)
};

// Initialize bookmark folder structure - Three-directory system
async function setupBookmarkFolders() {
  try {
    // Check if SynthCache folder exists
    const existingFolders = await browser.bookmarks.search({ title: "SynthCache" });
    
    if (existingFolders.length === 0) {
      // Create main SynthCache folder
      const mainFolder = await browser.bookmarks.create({
        title: "SynthCache",
        type: "folder"
      });
      
      // Create Normal browsing subfolder (visible in both modes)
      const normalFolder = await browser.bookmarks.create({
        title: "Normal Browsing",
        type: "folder",
        parentId: mainFolder.id
      });
      
      // Create hidden NSFW folder (incognito-only access)
      const nsfwHidden = await browser.bookmarks.create({
        title: "Private Content",
        type: "folder",
        parentId: mainFolder.id
      });
      
      bookmarkFolders.normal = normalFolder.id;
      bookmarkFolders.nsfwHidden = nsfwHidden.id;
      
      // Store folder IDs
      await browser.storage.local.set({ bookmarkFolders });
      
      console.log("Created SynthCache folder structure");
    } else {
      // Load existing folder structure
      const mainFolder = existingFolders[0];
      const children = await browser.bookmarks.getChildren(mainFolder.id);
      
      for (const child of children) {
        if (child.title === "Normal Browsing") {
          bookmarkFolders.normal = child.id;
        } else if (child.title === "Private Content") {
          bookmarkFolders.nsfwHidden = child.id;
        }
      }
      
      // Create missing folders if needed
      if (!bookmarkFolders.normal) {
        const normalFolder = await browser.bookmarks.create({
          title: "Normal Browsing",
          type: "folder", 
          parentId: mainFolder.id
        });
        bookmarkFolders.normal = normalFolder.id;
      }
      
      if (!bookmarkFolders.nsfwHidden) {
        const nsfwHidden = await browser.bookmarks.create({
          title: "Private Content",
          type: "folder",
          parentId: mainFolder.id
        });
        bookmarkFolders.nsfwHidden = nsfwHidden.id;
      }
      
      // Store folder IDs
      await browser.storage.local.set({ bookmarkFolders });
    }
  } catch (error) {
    console.error("Error setting up bookmark folders:", error);
  }
}

// Check if current tab is in incognito mode
async function isIncognitoMode(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);
    return tab.incognito;
  } catch (error) {
    return false;
  }
}

// Process page analysis and tag bookmarks
async function processPageAnalysis(data) {
  const { url, keywords, hasVideo, tabId } = data;
  
  // DEBUG: Log incoming analysis data
  console.log(`🔍 [DEBUG] Processing analysis for: ${url}`);
  console.log(`🔍 [DEBUG] Keywords found: ${keywords?.length || 0}`, keywords);
  console.log(`🔍 [DEBUG] Has video: ${hasVideo}`);
  console.log(`🔍 [DEBUG] Tab ID: ${tabId}`);
  
  try {
    // Find existing bookmarks for this URL
    const existingBookmarks = await browser.bookmarks.search({ url });
    
    if (existingBookmarks.length === 0) {
      debugLogger.logFailedTagging(url, 'NO_BOOKMARK_EXISTS', {
        keywords: keywords,
        hasVideo: hasVideo,
        tabId: tabId,
        searchResults: existingBookmarks.length
      });
      console.log(`❌ [DEBUG] No bookmark found for URL: ${url}`);
      return; // No bookmark exists for this URL
    }
    
    const bookmark = existingBookmarks[0];
    console.log(`✅ [DEBUG] Found bookmark: "${bookmark.title}" (ID: ${bookmark.id})`);
    
    let tags = keywords ? keywords.slice(0, 5) : []; // Limit to 5 most relevant tags
    
    // Determine if current browsing is incognito mode
    const isIncognito = tabId ? await isIncognitoMode(tabId) : false;
    console.log(`🕶️ [DEBUG] Incognito mode: ${isIncognito}`);
    
    // Log NSFW classification decision
    const isNSFWClassified = hasVideo;
    let nsfwReason = '';
    let videoDetails = {};
    
    if (hasVideo) {
      nsfwReason = 'Video content detected';
      videoDetails = {
        detectionMethod: 'content-script-analysis',
        keywords: keywords,
        isIncognito: isIncognito
      };
    } else {
      nsfwReason = 'No video content detected';
    }
    
    debugLogger.logNSFWClassification(url, hasVideo, isNSFWClassified, nsfwReason, videoDetails);
    
    // Handle NSFW content - always goes to hidden directory
    if (hasVideo) {
      if (!tags.includes('nsfw')) {
        tags.push('nsfw');
      }
      console.log(`🔞 [DEBUG] NSFW content detected, adding 'nsfw' tag`);
      
      // Move bookmark to hidden NSFW folder (incognito-only access)
      if (bookmark.parentId !== bookmarkFolders.nsfwHidden) {
        console.log(`📁 [DEBUG] Moving to NSFW folder (${bookmarkFolders.nsfwHidden})`);
        try {
          await browser.bookmarks.move(bookmark.id, {
            parentId: bookmarkFolders.nsfwHidden
          });
          console.log(`✅ [DEBUG] Moved NSFW bookmark to hidden folder: ${bookmark.title}`);
        } catch (moveError) {
          debugLogger.logGeneralError('NSFW_FOLDER_MOVE', moveError, {
            bookmarkId: bookmark.id,
            targetFolderId: bookmarkFolders.nsfwHidden,
            bookmarkTitle: bookmark.title
          });
          throw moveError;
        }
      } else {
        console.log(`📁 [DEBUG] Bookmark already in NSFW folder`);
      }
    } else {
      // Handle normal content - always goes to normal folder
      const targetFolder = bookmarkFolders.normal;
      console.log(`📁 [DEBUG] Target folder: Normal (${targetFolder})`);
      
      // Move to normal folder if not already there
      if (bookmark.parentId !== targetFolder && bookmark.parentId !== bookmarkFolders.nsfwHidden) {
        console.log(`📁 [DEBUG] Moving to normal folder (${targetFolder})`);
        try {
          await browser.bookmarks.move(bookmark.id, {
            parentId: targetFolder
          });
          console.log(`✅ [DEBUG] Moved bookmark to normal folder: ${bookmark.title}`);
        } catch (moveError) {
          debugLogger.logGeneralError('NORMAL_FOLDER_MOVE', moveError, {
            bookmarkId: bookmark.id,
            targetFolderId: targetFolder,
            bookmarkTitle: bookmark.title
          });
          throw moveError;
        }
      } else {
        console.log(`📁 [DEBUG] Bookmark already in correct folder`);
      }
    }
    
    // Update bookmark title with tags (only if tags exist)
    if (tags.length > 0) {
      const tagString = tags.join(', ');
      const originalTitle = bookmark.title.replace(/ \[.*\]$/, ''); // Remove existing tags
      const newTitle = `${originalTitle} [${tagString}]`;
      
      console.log(`🏷️ [DEBUG] Updating title: "${originalTitle}" -> "${newTitle}"`);
      try {
        await browser.bookmarks.update(bookmark.id, { title: newTitle });
        console.log(`✅ [DEBUG] Successfully tagged bookmark: [${tagString}]`);
      } catch (updateError) {
        debugLogger.logFailedTagging(url, 'BOOKMARK_UPDATE_FAILED', {
          bookmarkId: bookmark.id,
          originalTitle: originalTitle,
          newTitle: newTitle,
          tags: tags,
          error: updateError.message
        });
        throw updateError;
      }
    } else {
      debugLogger.logFailedTagging(url, 'NO_TAGS_GENERATED', {
        bookmarkId: bookmark.id,
        bookmarkTitle: bookmark.title,
        keywords: keywords,
        hasVideo: hasVideo,
        keywordCount: keywords ? keywords.length : 0
      });
      console.log(`❌ [DEBUG] No tags to add for: ${url}`);
    }
    
  } catch (error) {
    debugLogger.logGeneralError('PROCESS_PAGE_ANALYSIS', error, {
      url: url,
      keywords: keywords,
      hasVideo: hasVideo,
      tabId: tabId,
      hasBookmark: false
    });
    console.error(`💥 [DEBUG] Error processing bookmark for ${url}:`, error);
    console.error(`💥 [DEBUG] Error details:`, {
      message: error.message,
      stack: error.stack,
      url: url,
      hasBookmark: false
    });
  }
}

// Send progress updates to any open bookmark manager tabs
async function sendProgressUpdate(progressData) {
  try {
    // Find all bookmark manager tabs
    const tabs = await browser.tabs.query({});
    const managerTabs = tabs.filter(tab => 
      tab.url && tab.url.includes('manager.html')
    );
    
    if (managerTabs.length > 0) {
      // Send to all manager tabs via content script injection
      for (const tab of managerTabs) {
        try {
          await browser.tabs.executeScript(tab.id, {
            code: `
              if (window.bookmarkManager && window.bookmarkManager.updateProgress) {
                window.bookmarkManager.updateProgress(${JSON.stringify(progressData)});
              }
            `
          });
        } catch (error) {
          // Tab might not be ready yet, ignore
          console.log(`Could not send progress to tab ${tab.id}`);
        }
      }
    }
    
    console.log(`📊 [DEBUG] Progress update sent:`, progressData);
  } catch (error) {
    console.error('Error sending progress update:', error);
  }
}

// Handle messages from content script and popup
browser.runtime.onMessage.addListener(async (message, sender) => {
  console.log(`📨 [DEBUG] Received message:`, message.command, message);
  
  try {
    switch (message.command) {
      case 'page-analyzed':
        console.log(`📨 [DEBUG] Processing page analysis from tab ${sender.tab?.id}:`, message.data);
        try {
          await processPageAnalysis(message.data);
          console.log(`✅ [DEBUG] Page analysis processed successfully`);
        } catch (error) {
          debugLogger.logGeneralError('PAGE_ANALYSIS_HANDLER', error, {
            messageData: message.data,
            senderTabId: sender.tab?.id
          });
          console.error(`💥 [DEBUG] Error processing page analysis:`, error);
        }
        break;
        
      case 'start-tagging':
        // Get all tabs and analyze existing bookmarks
        const tabs = await browser.tabs.query({});
        
        // Send progress update instead of notification
        sendProgressUpdate({
          status: `Starting to analyze ${tabs.length} open tabs...`,
          total: tabs.length,
          processed: 0,
          success: 0,
          failed: 0,
          isRunning: true
        });
        
        let tabSuccessCount = 0;
        let tabFailedCount = 0;
        
        // Inject content script into all tabs to analyze them
        for (const tab of tabs) {
          try {
            await browser.tabs.executeScript(tab.id, {
              file: 'content-script.js'
            });
            tabSuccessCount++;
          } catch (error) {
            tabFailedCount++;
            debugLogger.logFailedTagging(tab.url, 'CONTENT_SCRIPT_INJECTION_FAILED', {
              tabId: tab.id,
              tabTitle: tab.title,
              error: error.message
            });
            // Skip tabs where we can't inject scripts (chrome://, about:, etc.)
            console.log(`Skipping tab: ${tab.url}`);
          }
        }
        
        // Send final update for tab analysis
        sendProgressUpdate({
          status: `Tab analysis complete: ${tabSuccessCount} successful, ${tabFailedCount} failed`,
          total: tabs.length,
          processed: tabs.length,
          success: tabSuccessCount,
          failed: tabFailedCount,
          isComplete: true,
          isRunning: false
        });
        break;

      case 'analyze-all-bookmarks':
        // Get ALL bookmarks and analyze them
        const allBookmarks = await browser.bookmarks.getTree();
        const bookmarkUrls = extractAllUrls(allBookmarks);
        
        // Initialize progress tracking
        let processedCount = 0;
        let successCount = 0;
        let failedCount = 0;
        const totalCount = bookmarkUrls.length;
        const failedUrls = [];
        
        console.log(`📊 [DEBUG] Starting analysis of ${totalCount} bookmarks`);
        
        // Send initial progress update
        sendProgressUpdate({
          status: `Starting analysis of ${totalCount} bookmarks...`,
          total: totalCount,
          processed: 0,
          success: 0,
          failed: 0,
          isRunning: true
        });

        // Analyze each bookmark with delay to avoid overwhelming servers
        for (let i = 0; i < bookmarkUrls.length; i++) {
          setTimeout(async () => {
            try {
              console.log(`📈 [DEBUG] Processing bookmark ${i + 1}/${totalCount}: ${bookmarkUrls[i]}`);
              await analyzeBookmarkUrl(bookmarkUrls[i]);
              successCount++;
            } catch (error) {
              failedCount++;
              failedUrls.push(bookmarkUrls[i]);
              debugLogger.logFailedTagging(bookmarkUrls[i], 'BOOKMARK_ANALYSIS_FAILED', {
                bookmarkIndex: i + 1,
                totalBookmarks: totalCount,
                error: error.message,
                errorStack: error.stack
              });
              console.error(`💥 [DEBUG] Failed to analyze bookmark ${i + 1}: ${bookmarkUrls[i]}`, error);
            }
            
            processedCount++;
            
            // Send progress updates every 5 bookmarks or at completion
            if (processedCount % 5 === 0 || processedCount === totalCount) {
              const progressData = {
                total: totalCount,
                processed: processedCount,
                success: successCount,
                failed: failedCount,
                isRunning: processedCount < totalCount
              };
              
              if (processedCount === totalCount) {
                const successRate = Math.round((successCount / totalCount) * 100);
                progressData.status = `✅ Analysis Complete! ${successCount}/${totalCount} successful (${successRate}%)`;
                progressData.isComplete = true;
                
                // Auto-save debug files after completion
                setTimeout(async () => {
                  await debugLogger.saveDebugFiles();
                  console.log(`📁 [DEBUG] Debug files auto-saved after bookmark analysis completion`);
                }, 2000);
              } else {
                progressData.status = `Processing bookmark ${processedCount}/${totalCount}...`;
              }
              
              sendProgressUpdate(progressData);
            }
            
            // Final completion summary
            if (processedCount === totalCount) {
              setTimeout(() => {
                const successRate = Math.round((successCount / totalCount) * 100);
                console.log(`📊 [DEBUG] Analysis complete: ${successCount} successful, ${failedCount} failed out of ${totalCount} total`);
                if (failedUrls.length > 0) {
                  console.log(`❌ [DEBUG] Failed URLs:`, failedUrls);
                }
              }, 1000);
            }
          }, i * 2000); // 2 second delay between each request
        }
        break;
        
      case 'save-debug-files':
        // Manual debug file save command
        try {
          await debugLogger.saveDebugFiles();
          console.log(`📁 [DEBUG] Debug files saved manually`);
          return { success: true, message: 'Debug files saved successfully' };
        } catch (error) {
          debugLogger.logGeneralError('MANUAL_DEBUG_SAVE', error);
          return { success: false, message: 'Failed to save debug files' };
        }
        
      case 'clear-debug-logs':
        // Clear debug logs command
        debugLogger.clearLogs();
        return { success: true, message: 'Debug logs cleared' };
        
      case 'get-bookmark-folders':
        // Return folder info for popup/options
        return { bookmarkFolders };
        
      case 'import-html-bookmarks':
        // Handle HTML bookmark file import
        await importHtmlBookmarks(message.htmlContent, message.isIncognito || false);
        break;
        
      case 'open-bookmark-manager':
        // Open the full bookmark manager interface with incognito context
        const currentTab = await browser.tabs.query({ active: true, currentWindow: true });
        const isCurrentIncognito = currentTab.length > 0 ? currentTab[0].incognito : false;
        
        console.log(`📱 [DEBUG] Opening manager in ${isCurrentIncognito ? 'incognito' : 'normal'} mode`);
        
        const managerUrl = browser.runtime.getURL('manager.html') + (isCurrentIncognito ? '?incognito=true' : '');
        await browser.tabs.create({
          url: managerUrl,
          active: true
        });
        break;
        
      case 'keyword-debug':
        // Handle keyword extraction debug info from content script
        console.log(`🔍 [DEBUG] Received keyword extraction debug info:`, message.data);
        debugLogger.logKeywordExtractionFailure(
          message.data.url,
          message.data.reason,
          message.data.details
        );
        break;
        
      case 'analyze-ai-content':
        // Analyze page for AI-generated content
        try {
          if (typeof analyzePageForAIContent === 'function') {
            const analysis = await analyzePageForAIContent(message.tabId);
            return { success: true, analysis };
          } else {
            console.error('AI detector not loaded');
            return { success: false, error: 'AI detector not available' };
          }
        } catch (error) {
          console.error('Error analyzing AI content:', error);
          return { success: false, error: error.message };
        }
        
      case 'unlock-vault':
        // Unlock NSFW vault with password
        try {
          const result = await unlockVault(message.password);
          return result;
        } catch (error) {
          console.error('Error unlocking vault:', error);
          return { success: false, error: error.message };
        }
        
      case 'get-bookmarks':
        // Get regular bookmarks for popup display
        try {
          const bookmarks = await getRecentBookmarks();
          return { success: true, bookmarks };
        } catch (error) {
          console.error('Error getting bookmarks:', error);
          return { success: false, error: error.message };
        }
        
      case 'get-tags':
        // Get bookmark tags for popup display
        try {
          const tags = await getBookmarkTags();
          return { success: true, tags };
        } catch (error) {
          console.error('Error getting tags:', error);
          return { success: false, error: error.message };
        }
        
      case 'flag-nsfw':
        // Flag content as NSFW and move to vault
        try {
          await addToNSFWVault({
            url: message.url,
            title: message.title,
            dateAdded: new Date().toISOString()
          });
          return { success: true };
        } catch (error) {
          console.error('Error flagging NSFW:', error);
          return { success: false, error: error.message };
        }
    }
  } catch (error) {
    debugLogger.logGeneralError('MESSAGE_HANDLER', error, {
      messageCommand: message.command,
      messageData: message
    });
    console.error(`💥 [DEBUG] Error in message handler for command ${message.command}:`, error);
  }
});

// Dynamic icon management for incognito mode indication
let currentIconState = 'normal';

async function updateToolbarIcon(isIncognito = false) {
  const newState = isIncognito ? 'incognito' : 'normal';
  
  if (currentIconState !== newState) {
    currentIconState = newState;
    
    try {
      // Use your existing custom icons exactly as designed
      const iconPath = isIncognito ? {
        16: "icon-incognito-16.png",
        48: "icon-incognito-48.png",
        128: "icon-incognito-128.png"
      } : {
        16: "icon-16.png",
        48: "icon-48.png", 
        128: "icon-128.png"
      };
      
      await browser.browserAction.setIcon({ path: iconPath });
      
      // Clear tooltip to indicate the current mode
      const title = isIncognito ? 
        "SynthCache - Incognito Mode (Private content accessible)" : 
        "SynthCache - Normal Mode (Private content hidden)";
      await browser.browserAction.setTitle({ title });
      
    } catch (error) {
      console.error("Error updating toolbar icon:", error);
    }
  }
}

// Monitor tab changes to update icon state
browser.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await browser.tabs.get(activeInfo.tabId);
    await updateToolbarIcon(tab.incognito);
  } catch (error) {
    console.error("Error checking tab incognito state:", error);
  }
});

// Monitor when tabs are updated (including incognito changes)
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await updateToolbarIcon(tab.incognito);
  }
});

// Initialize on startup
browser.runtime.onStartup.addListener(setupBookmarkFolders);
browser.runtime.onInstalled.addListener(setupBookmarkFolders);

// Load stored folder IDs on startup
browser.storage.local.get('bookmarkFolders').then(result => {
  if (result.bookmarkFolders) {
    bookmarkFolders = result.bookmarkFolders;
  }
});

// Monitor for new bookmarks (including HTML imports)
browser.bookmarks.onCreated.addListener(async (id, bookmark) => {
  // Wait a moment for the bookmark to be fully created
  setTimeout(async () => {
    await analyzeBookmarkUrl(bookmark.url);
  }, 500);
});

// Analyze a bookmark URL without visiting the page
async function analyzeBookmarkUrl(url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('moz-extension://')) {
    console.log(`🚫 [DEBUG] Skipping special URL: ${url}`);
    return; // Skip special URLs
  }

  console.log(`🌐 [DEBUG] Starting analysis for: ${url}`);
  let tabId = null;

  try {
    // For existing bookmarks, we'll try to open in a hidden tab instead of fetch (CORS workaround)
    const tab = await browser.tabs.create({
      url: url,
      active: false // Open in background
    });
    
    tabId = tab.id;
    console.log(`📄 [DEBUG] Created tab ${tabId} for: ${url}`);

    // Wait a moment for page to load
    setTimeout(async () => {
      try {
        console.log(`💉 [DEBUG] Attempting to inject script into tab ${tabId}`);
        // Inject content script to analyze the page
        await browser.tabs.executeScript(tabId, {
          file: 'content-script.js'
        });
        
        console.log(`✅ [DEBUG] Successfully injected script into tab ${tabId}`);
        
        // Close the tab after a few seconds
        setTimeout(() => {
          console.log(`🗑️ [DEBUG] Closing tab ${tabId} for: ${url}`);
          browser.tabs.remove(tabId).catch((error) => {
            console.log(`⚠️ [DEBUG] Failed to close tab ${tabId}:`, error.message);
          });
        }, 3000);
      } catch (error) {
        console.error(`💥 [DEBUG] Script injection failed for tab ${tabId} (${url}):`, error.message);
        console.log(`🗑️ [DEBUG] Force closing tab ${tabId} due to injection failure`);
        browser.tabs.remove(tabId).catch((closeError) => {
          console.error(`💥 [DEBUG] Failed to close tab ${tabId} after injection failure:`, closeError.message);
        });
      }
    }, 2000);

    // Emergency tab cleanup - force close after 10 seconds regardless
    setTimeout(() => {
      browser.tabs.get(tabId).then(tab => {
        if (tab) {
          console.log(`⏰ [DEBUG] Emergency cleanup: Force closing stuck tab ${tabId} (${url})`);
          browser.tabs.remove(tabId).catch((error) => {
            console.error(`💥 [DEBUG] Emergency cleanup failed for tab ${tabId}:`, error.message);
          });
        }
      }).catch(() => {
        console.log(`✅ [DEBUG] Tab ${tabId} already closed or doesn't exist`);
      });
    }, 10000); // 10 second emergency cleanup

    return; // Exit early since we're using tab-based analysis

  } catch (error) {
    console.error(`💥 [DEBUG] Failed to create tab for ${url}:`, error.message);
    
    // Fallback: Basic URL-based analysis (limited but CORS-free)
    console.log(`🔄 [DEBUG] Falling back to URL-based analysis for: ${url}`);
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      const domainParts = hostname.split('.');
      const domain = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0];
      
      // Basic video site detection from URL
      const videoSites = ['youtube', 'vimeo', 'twitch', 'pornhub', 'xvideos', 'xhamster'];
      const urlHasVideo = videoSites.some(site => hostname.includes(site));
      
      // Use domain as a basic keyword
      const urlKeywords = [domain].filter(k => k && k.length >= 4);
      
      console.log(`🔍 [DEBUG] URL-based analysis: domain=${domain}, hasVideo=${urlHasVideo}, keywords=[${urlKeywords.join(', ')}]`);
      
      // Process basic analysis
      await processPageAnalysis({
        url: url,
        keywords: urlKeywords,
        hasVideo: urlHasVideo
      });
    } catch (fallbackError) {
      console.error(`💥 [DEBUG] Fallback analysis also failed for ${url}:`, fallbackError.message);
    }
  }
}

// Import HTML bookmarks with automatic tagging
async function importHtmlBookmarks(htmlContent, isIncognito = false) {
  try {
    // Parse HTML content to extract bookmarks
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const bookmarkLinks = doc.querySelectorAll('a[href]');
    
    const targetFolder = isIncognito ? bookmarkFolders.incognito : bookmarkFolders.normal;
    let imported = 0;
    
    // Send progress update instead of notification
    sendProgressUpdate({
      status: `Importing ${bookmarkLinks.length} bookmarks...`,
      total: bookmarkLinks.length,
      processed: 0,
      success: 0,
      failed: 0,
      isRunning: true
    });
    
    for (const link of bookmarkLinks) {
      const url = link.href;
      const title = link.textContent || link.title || url;
      
      // Skip invalid URLs
      if (!url || url.startsWith('javascript:') || url.startsWith('data:')) {
        continue;
      }
      
      try {
        // Check if bookmark already exists
        const existing = await browser.bookmarks.search({ url });
        if (existing.length > 0) {
          console.log(`Bookmark already exists: ${url}`);
          continue;
        }
        
        // Create bookmark in appropriate folder
        const bookmark = await browser.bookmarks.create({
          title: title,
          url: url,
          parentId: targetFolder
        });
        
        imported++;
        
        // Schedule analysis with delay to avoid overwhelming servers
        setTimeout(() => {
          analyzeBookmarkUrl(url);
        }, imported * 1500); // 1.5 second delay between analyses
        
      } catch (error) {
        console.error(`Error importing bookmark ${url}:`, error);
      }
    }
    
    // Send completion progress update
    setTimeout(() => {
      sendProgressUpdate({
        status: `✅ Import Complete! Successfully imported ${imported} bookmarks`,
        total: bookmarkLinks.length,
        processed: bookmarkLinks.length,
        success: imported,
        failed: bookmarkLinks.length - imported,
        isComplete: true,
        isRunning: false
      });
    }, 2000);
    
  } catch (error) {
    console.error("Error importing HTML bookmarks:", error);
    sendProgressUpdate({
      status: '❌ Import Error: Failed to import bookmarks',
      isComplete: true,
      isRunning: false
    });
  }
}

// Helper function for stop words
function isStopWord(word) {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'is', 'in', 'on', 'at', 'of', 'for', 'to',
    'with', 'by', 'from', 'about', 'as', 'this', 'that', 'here', 'there'
    // Add more stop words as needed
  ]);
  return stopWords.has(word) || word.length < 4;
}

// Helper function to extract all URLs from bookmark tree
function extractAllUrls(bookmarkTree) {
  const urls = [];
  
  function traverse(nodes) {
    for (const node of nodes) {
      if (node.url) {
        urls.push(node.url);
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(bookmarkTree);
  return urls;
}

// NSFW Vault Functionality
// Initialize context menu for NSFW flagging
try {
  browser.contextMenus.create({
    id: "flag-nsfw",
    title: "Flag as NSFW",
    contexts: ["page", "link"]
  });
} catch (error) {
  // Context menu might already exist
  console.log('Context menu already exists or creation failed:', error);
}

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "flag-nsfw") {
    const url = info.linkUrl || info.pageUrl;
    const title = tab.title;
    
    await addToNSFWVault({ url, title, dateAdded: new Date().toISOString() });
  }
});

// Add bookmark to NSFW vault
async function addToNSFWVault(bookmark) {
  try {
    // Get or create master password
    let { masterPassword } = await browser.storage.local.get("masterPassword");
    
    if (!masterPassword) {
      // Generate a temporary password until user sets one
      masterPassword = 'temp_' + Date.now();
      await browser.storage.local.set({ masterPassword });
    }
    
    // Encrypt bookmark data
    const encryptedData = await encryptBookmarkData(bookmark, masterPassword);
    
    // Get existing vault
    const { nsfwVault = [] } = await browser.storage.local.get("nsfwVault");
    
    // Add to vault
    nsfwVault.push(encryptedData);
    await browser.storage.local.set({ nsfwVault });
    
    // Remove from regular bookmarks if it exists there
    const existingBookmarks = await browser.bookmarks.search({ url: bookmark.url });
    for (const existing of existingBookmarks) {
      await browser.bookmarks.remove(existing.id);
    }
    
    console.log('Bookmark added to NSFW vault:', bookmark.url);
    
  } catch (error) {
    console.error('Error adding to NSFW vault:', error);
  }
}

// Unlock vault with password
async function unlockVault(password) {
  try {
    const { masterPassword, nsfwVault = [] } = await browser.storage.local.get(["masterPassword", "nsfwVault"]);
    
    if (!masterPassword || masterPassword !== password) {
      return { success: false, error: 'Invalid password' };
    }
    
    // Decrypt all vault bookmarks
    const decryptedBookmarks = [];
    for (const encryptedBookmark of nsfwVault) {
      try {
        const decrypted = await decryptBookmarkData(encryptedBookmark, password);
        decryptedBookmarks.push(decrypted);
      } catch (error) {
        console.error('Error decrypting bookmark:', error);
      }
    }
    
    return { success: true, bookmarks: decryptedBookmarks };
    
  } catch (error) {
    console.error('Error unlocking vault:', error);
    return { success: false, error: error.message };
  }
}

// Encryption using Web Crypto API
async function encryptBookmarkData(data, password) {
  try {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const dataToEncrypt = JSON.stringify(data);
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(dataToEncrypt)
    );
    
    return {
      encryptedData: Array.from(new Uint8Array(encryptedData)),
      iv: Array.from(iv),
      salt: Array.from(salt)
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

// Decryption using Web Crypto API
async function decryptBookmarkData(encryptedBookmark, password) {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const passwordData = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array(encryptedBookmark.salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    const decryptedData = await crypto.subtle.decrypt(
      { 
        name: "AES-GCM", 
        iv: new Uint8Array(encryptedBookmark.iv) 
      },
      key,
      new Uint8Array(encryptedBookmark.encryptedData)
    );
    
    return JSON.parse(decoder.decode(decryptedData));
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

// Get recent bookmarks for popup
async function getRecentBookmarks() {
  try {
    const bookmarks = await browser.bookmarks.getRecent(20);
    return bookmarks.filter(bookmark => bookmark.url); // Only return actual bookmarks, not folders
  } catch (error) {
    console.error('Error getting recent bookmarks:', error);
    return [];
  }
}

// Get bookmark tags for popup
async function getBookmarkTags() {
  try {
    // This is a simplified version - in a real implementation,
    // you'd extract tags from bookmark titles or stored metadata
    const { bookmarkTags = {} } = await browser.storage.local.get('bookmarkTags');
    return bookmarkTags;
  } catch (error) {
    console.error('Error getting bookmark tags:', error);
    return {};
  }
}

// Listen for window focus changes to detect private browsing
browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== browser.windows.WINDOW_ID_NONE) {
    try {
      const window = await browser.windows.get(windowId);
      const isIncognito = window.incognito;
      
      // Update icon based on private browsing status
      const iconPath = isIncognito ? "icon-incognito-48.png" : "icon-48.png";
      browser.browserAction.setIcon({ path: iconPath });
      
    } catch (error) {
      console.error("Error checking private browsing:", error);
    }
  }
});