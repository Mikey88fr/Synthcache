// Content script for analyzing webpage content
class PageAnalyzer {
  constructor() {
    this.debounceTimer = null;
    this.lastAnalysis = null;
    this.hasAnalyzed = false;
    
    // DEBUG: Log when content script loads
    console.log(`🚀 [DEBUG] SynthCache content script loaded on: ${window.location.href}`);
    
    // Enhanced stop words list matching your Python version
    this.stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'is', 'in', 'on', 'at', 'of', 'for', 'to',
      'with', 'by', 'from', 'about', 'as', 'this', 'that', 'here', 'there',
      'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their', 'which',
      'what', 'where', 'when', 'how', 'why', 'who', 'whom', 'have', 'has',
      'had', 'do', 'does', 'did', 'be', 'am', 'are', 'was', 'were',
      'can', 'could', 'will', 'would', 'should', 'get', 'go', 'see', 'make',
      'know', 'come', 'find', 'take', 'made', 'like', 'just',
      'don', 't', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn',
      'haven', 'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn',
      'wasn', 'weren', 'won', 'wouldn', 'using', 'based', 'guide', 'tutorial',
      'view', 'read', 'page', 'http', 'https', 'com', 'org', 'net', 'www',
      'article', 'blog', 'post', 'news', 'info', 'data', 'file', 'pdf',
      // Additional common words that aren't useful as tags
      'more', 'most', 'other', 'some', 'time', 'very', 'when', 'much', 'many',
      'such', 'long', 'good', 'great', 'new', 'old', 'first', 'last', 'own',
      'over', 'think', 'also', 'back', 'after', 'use', 'work', 'life', 'only',
      'way', 'even', 'may', 'say', 'each', 'right', 'might', 'came', 'show',
      'every', 'good', 'those', 'feel', 'fact', 'hand', 'high', 'year', 'day',
      'part', 'head', 'eye', 'ask', 'long', 'both', 'home', 'turn', 'move'
    ]);
    
    this.minTagLength = 4; // Increased from 3 to 4
    this.maxTags = 5; // Reduced from 8 to 5 for focus
  }

  // Enhanced keyword extraction with stronger filtering
  extractKeywords() {
    console.log(`📝 [DEBUG] Starting keyword extraction for: ${window.location.href}`);
    
    const wordFreq = {};
    const debugInfo = {
      url: window.location.href,
      title: document.title || '',
      description: '',
      headings: [],
      totalWordsFound: 0,
      validWordsAfterFiltering: 0,
      stopWordsRemoved: 0,
      shortWordsRemoved: 0,
      numericWordsRemoved: 0,
      finalKeywordCount: 0
    };
    
    try {
      // Get title (weighted 3x)
      const title = document.title || '';
      console.log(`📋 [DEBUG] Page title: "${title}"`);
      
      // Get meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      const description = metaDesc ? metaDesc.content : '';
      debugInfo.description = description;
      console.log(`📄 [DEBUG] Meta description: "${description}"`);
      
      // Get h1-h3 headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map(h => h.textContent.trim())
        .filter(text => text.length > 0);
      debugInfo.headings = headings;
      console.log(`🎯 [DEBUG] Found ${headings.length} headings:`, headings);
      
      // Process title with higher weight
      this.processTextWithDebug(title, wordFreq, 3, debugInfo);
      
      // Process description and headings with normal weight
      this.processTextWithDebug(description + ' ' + headings.join(' '), wordFreq, 1, debugInfo);
      
      // Count total words found before filtering
      debugInfo.totalWordsFound = Object.keys(wordFreq).length;
      
      // Sort by frequency and get top words
      const sortedWords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15) // Look at more options
        .map(([word]) => word);
      
      console.log(`🔍 [DEBUG] Sorted words (top 15):`, sortedWords);
      
      // Apply final filtering and limit
      const finalKeywords = [];
      for (const word of sortedWords) {
        if (finalKeywords.length >= this.maxTags) break;
        
        if (this.isValidTag(word)) {
          finalKeywords.push(word);
        }
      }
      
      debugInfo.validWordsAfterFiltering = finalKeywords.length;
      console.log(`✅ [DEBUG] Preliminary keywords:`, finalKeywords);
      
      // Add domain if space available
      if (finalKeywords.length < this.maxTags) {
        const domain = this.extractDomainTag();
        if (domain && this.isValidTag(domain)) {
          finalKeywords.push(domain);
        }
      }
      
      debugInfo.finalKeywordCount = finalKeywords.length;
      console.log(`🏷️ [DEBUG] Final keywords:`, finalKeywords);
      
      // Send debug info to background if no keywords were generated
      if (finalKeywords.length === 0) {
        this.sendKeywordDebugInfo(debugInfo);
      }
      
      return finalKeywords;
      
    } catch (error) {
      console.log('Keyword extraction error:', error);
      debugInfo.error = {
        message: error.message,
        stack: error.stack
      };
      this.sendKeywordDebugInfo(debugInfo);
      return [];
    }
  }

  // Enhanced text processing with debug tracking
  processTextWithDebug(text, wordFreq, weight, debugInfo) {
    if (!text) return;
    
    // Only letters, minimum 4 characters - NO NUMBERS
    const words = text.toLowerCase().match(/\b[a-z]{4,15}\b/g) || [];
    
    words.forEach(word => {
      if (this.stopWords.has(word)) {
        debugInfo.stopWordsRemoved++;
      } else if (word.length < this.minTagLength) {
        debugInfo.shortWordsRemoved++;
      } else if (this.containsNumbers(word)) {
        debugInfo.numericWordsRemoved++;
      } else if (this.isValidWord(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + weight;
      }
    });
  }

  // Send keyword extraction debug info to background
  sendKeywordDebugInfo(debugInfo) {
    try {
      browser.runtime.sendMessage({
        command: 'keyword-debug',
        data: debugInfo
      }).catch(error => {
        console.error(`💥 [DEBUG] Failed to send keyword debug info:`, error);
      });
    } catch (error) {
      console.error(`💥 [DEBUG] Error sending keyword debug info:`, error);
    }
  }



  // Strict word validation
  isValidWord(word) {
    return (
      word.length >= this.minTagLength &&
      word.length <= 15 &&
      !this.stopWords.has(word) &&
      /^[a-z]+$/.test(word) && // Only alphabetic characters
      !this.containsNumbers(word)
    );
  }

  // Final tag validation
  isValidTag(word) {
    return (
      this.isValidWord(word) &&
      word.length >= this.minTagLength &&
      word.length <= 15
    );
  }

  // Check for any numbers in the word
  containsNumbers(word) {
    return /\d/.test(word);
  }

  // Extract domain as potential tag
  extractDomainTag() {
    try {
      const hostname = window.location.hostname.replace('www.', '');
      const parts = hostname.split('.');
      const domain = parts.length > 1 ? parts[parts.length - 2] : parts[0];
      return domain;
    } catch (error) {
      return null;
    }
  }

  // Enhanced video detection
  detectVideoContent() {
    console.log(`🎬 [DEBUG] Starting video detection for: ${window.location.href}`);
    
    try {
      // Check for video elements and embeds
      const videoSelectors = [
        'video',
        'iframe[src*="youtube"]',
        'iframe[src*="youtu.be"]',
        'iframe[src*="vimeo"]',
        'iframe[src*="twitch"]',
        'iframe[src*="pornhub"]',
        'iframe[src*="xvideos"]',
        'iframe[src*="xhamster"]',
        'iframe[src*="redtube"]',
        'iframe[src*="youporn"]',
        'iframe[src*="tube8"]',
        'iframe[src*="spankbang"]',
        'iframe[src*="chaturbate"]',
        'iframe[src*="cam4"]',
        'iframe[src*="streamate"]',
        'embed[src*="video"]',
        'object[data*="video"]',
        '.video-player',
        '[class*="video-"]',
        '[id*="video-"]',
        '[class*="player-"]',
        '[id*="player-"]',
        '[class*="stream-"]',
        '[id*="stream-"]'
      ];
      
      // Also check URL patterns for common adult sites
      const adultSitePatterns = [
        'pornhub.com', 'xvideos.com', 'xhamster.com', 'redtube.com', 
        'youporn.com', 'tube8.com', 'spankbang.com', 'chaturbate.com',
        'cam4.com', 'streamate.com', 'camsoda.com', 'myfreecams.com',
        'bongacams.com', 'stripchat.com', 'livejasmin.com', 'flirt4free.com'
      ];
      
      const currentURL = window.location.href.toLowerCase();
      const isAdultSite = adultSitePatterns.some(pattern => currentURL.includes(pattern));
      
      if (isAdultSite) {
        console.log(`🔞 [DEBUG] Adult site detected from URL: ${window.location.hostname}`);
        return true;
      }
      
      let foundVideo = false;
      let matchedSelector = '';
      
      for (const selector of videoSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundVideo = true;
          matchedSelector = selector;
          console.log(`🎬 [DEBUG] Video detected! Selector: "${selector}", Elements: ${elements.length}`);
          break;
        }
      }
      
      if (!foundVideo) {
        console.log(`🎬 [DEBUG] No video content detected`);
      }
      
      return foundVideo;
      
    } catch (error) {
      console.error(`💥 [DEBUG] Video detection error:`, error);
      return false;
    }
  }

  // Perform analysis and send to background
  analyzeAndSend() {
    if (this.hasAnalyzed) {
      console.log(`⏭️ [DEBUG] Skipping analysis - already analyzed this page`);
      return; // Only analyze once per page load
    }
    
    console.log(`🔬 [DEBUG] Starting full page analysis for: ${window.location.href}`);
    
    try {
      const keywords = this.extractKeywords();
      const hasVideo = this.detectVideoContent();
      
      console.log(`📊 [DEBUG] Analysis results:`);
      console.log(`📊 [DEBUG] - Keywords: ${keywords.length}`, keywords);
      console.log(`📊 [DEBUG] - Has video: ${hasVideo}`);
      
      // Only send if we have meaningful data
      if (keywords.length > 0 || hasVideo) {
        // Create analysis data
        const analysisData = {
          url: window.location.href,
          keywords: keywords,
          hasVideo: hasVideo,
          timestamp: Date.now()
        };
        
        console.log(`📤 [DEBUG] Sending analysis to background script:`, analysisData);
        
        // Send to background script
        browser.runtime.sendMessage({
          command: 'page-analyzed',
          data: analysisData
        }).then(() => {
          console.log(`✅ [DEBUG] Analysis sent successfully`);
        }).catch(error => {
          console.error(`💥 [DEBUG] Failed to send analysis to background script:`, error);
          console.error(`💥 [DEBUG] Error details:`, {
            message: error.message,
            stack: error.stack,
            url: window.location.href
          });
        });
        
        this.lastAnalysis = analysisData;
        this.hasAnalyzed = true;
        
        console.log(`🎉 [DEBUG] Page analysis completed for: ${window.location.href}`);
      } else {
        console.log(`❌ [DEBUG] No meaningful data found - skipping analysis for: ${window.location.href}`);
      }
    } catch (error) {
      console.error(`💥 [DEBUG] Fatal error during analysis:`, error);
      console.error(`💥 [DEBUG] Error details:`, {
        message: error.message,
        stack: error.stack,
        url: window.location.href
      });
    }
  }

  // Debounced analysis
  scheduleAnalysis() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.analyzeAndSend();
    }, 1000); // Wait 1 second before analyzing
  }
}

// Initialize analyzer
const pageAnalyzer = new PageAnalyzer();

// Analyze on load and significant changes
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pageAnalyzer.scheduleAnalysis();
  });
} else {
  pageAnalyzer.scheduleAnalysis();
}

// Listen for dynamic content changes (but throttled)
let changeObserver = new MutationObserver(() => {
  if (!pageAnalyzer.hasAnalyzed) {
    pageAnalyzer.scheduleAnalysis();
  }
});

changeObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  changeObserver.disconnect();
  clearTimeout(pageAnalyzer.debounceTimer);
});
