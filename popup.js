// Tab functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize tabs
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      button.classList.add('active');
      document.getElementById(targetTab + '-tab').classList.add('active');
    });
  });
  
  // Load bookmarks and tags on popup open
  loadBookmarks();
  loadTags();
});

// Original functionality
document.getElementById('open-manager-button').addEventListener('click', () => {
  browser.runtime.sendMessage({ command: "open-bookmark-manager" });
  window.close();
});

document.getElementById('start-button').addEventListener('click', () => {
  browser.runtime.sendMessage({ command: "start-tagging" });
  window.close();
});

document.getElementById('analyze-bookmarks-button').addEventListener('click', () => {
  browser.runtime.sendMessage({ command: "analyze-all-bookmarks" });
  window.close();
});

// AI Content Analysis
document.getElementById('analyze-page').addEventListener('click', async () => {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    const response = await browser.runtime.sendMessage({
      command: "analyze-ai-content",
      tabId: activeTab.id,
      url: activeTab.url
    });
    
    if (response && response.analysis) {
      showAIAnalysis(response.analysis);
    }
  } catch (error) {
    console.error('Error analyzing page:', error);
  }
});

// Close AI analysis
document.getElementById('close-analysis').addEventListener('click', () => {
  document.getElementById('ai-analysis-result').classList.add('hidden');
});

// Vault functionality
document.getElementById('unlock-vault').addEventListener('click', async () => {
  const password = document.getElementById('master-password').value;
  
  if (!password) {
    return;
  }
  
  try {
    const response = await browser.runtime.sendMessage({
      command: "unlock-vault",
      password: password
    });
    
    if (response && response.success) {
      document.getElementById('vault-locked').classList.add('hidden');
      document.getElementById('vault-unlocked').classList.remove('hidden');
      loadVaultBookmarks(response.bookmarks);
    } else {
      // Show error - wrong password
      const input = document.getElementById('master-password');
      input.style.borderColor = '#ff0000';
      input.style.boxShadow = '0 0 10px #ff0000';
      setTimeout(() => {
        input.style.borderColor = '#ffaa00';
        input.style.boxShadow = '';
      }, 2000);
    }
  } catch (error) {
    console.error('Error unlocking vault:', error);
  }
});

// Search functionality
document.getElementById('search-bookmarks').addEventListener('input', (e) => {
  filterBookmarks(e.target.value);
});

document.getElementById('search-vault').addEventListener('input', (e) => {
  filterVaultBookmarks(e.target.value);
});

// Functions for bookmark management
async function loadBookmarks() {
  try {
    const response = await browser.runtime.sendMessage({ command: "get-bookmarks" });
    if (response && response.bookmarks) {
      displayBookmarks(response.bookmarks, 'bookmarks-list');
    }
  } catch (error) {
    console.error('Error loading bookmarks:', error);
  }
}

async function loadTags() {
  try {
    const response = await browser.runtime.sendMessage({ command: "get-tags" });
    if (response && response.tags) {
      displayTags(response.tags);
    }
  } catch (error) {
    console.error('Error loading tags:', error);
  }
}

function displayBookmarks(bookmarks, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  bookmarks.slice(0, 10).forEach(bookmark => { // Limit to 10 for popup
    const bookmarkEl = document.createElement('div');
    bookmarkEl.className = 'bookmark-item';
    bookmarkEl.innerHTML = `
      <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
      <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
    `;
    bookmarkEl.addEventListener('click', () => {
      browser.tabs.create({ url: bookmark.url });
      window.close();
    });
    container.appendChild(bookmarkEl);
  });
}

function displayTags(tags) {
  const container = document.getElementById('tags-cloud');
  container.innerHTML = '';
  
  Object.entries(tags).slice(0, 20).forEach(([tag, count]) => {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag-item';
    tagEl.textContent = `${tag} (${count})`;
    tagEl.addEventListener('click', () => {
      filterBookmarksByTag(tag);
    });
    container.appendChild(tagEl);
  });
}

function loadVaultBookmarks(bookmarks) {
  displayBookmarks(bookmarks, 'vault-bookmarks');
}

function filterBookmarks(query) {
  // Implementation for filtering bookmarks
  // This would typically call the background script
}

function filterVaultBookmarks(query) {
  // Implementation for filtering vault bookmarks
}

function filterBookmarksByTag(tag) {
  // Switch to main tab and filter by tag
  document.querySelector('.tab-button[data-tab="main"]').click();
  // Implementation for tag filtering
}

function showAIAnalysis(analysis) {
  document.getElementById('ai-probability').textContent = analysis.probability;
  document.getElementById('ai-reason').textContent = analysis.reason;
  document.getElementById('ai-analysis-result').classList.remove('hidden');
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
