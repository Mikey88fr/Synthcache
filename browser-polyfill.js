// Cross-browser compatibility layer
// This ensures the extension works in both Firefox and Chrome

// Firefox uses 'browser' namespace, Chrome uses 'chrome'
// This creates a unified 'browser' object
if (typeof browser === "undefined") {
  // Chrome - wrap chrome API to match Firefox's promise-based API
  window.browser = {
    runtime: {
      sendMessage: (message) => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      },
      onMessage: chrome.runtime.onMessage,
      onStartup: chrome.runtime.onStartup,
      onInstalled: chrome.runtime.onInstalled
    },
    bookmarks: {
      search: (query) => {
        return new Promise((resolve) => {
          chrome.bookmarks.search(query, resolve);
        });
      },
      create: (bookmark) => {
        return new Promise((resolve) => {
          chrome.bookmarks.create(bookmark, resolve);
        });
      },
      update: (id, changes) => {
        return new Promise((resolve) => {
          chrome.bookmarks.update(id, changes, resolve);
        });
      },
      move: (id, destination) => {
        return new Promise((resolve) => {
          chrome.bookmarks.move(id, destination, resolve);
        });
      },
      getChildren: (id) => {
        return new Promise((resolve) => {
          chrome.bookmarks.getChildren(id, resolve);
        });
      },
      getTree: () => {
        return new Promise((resolve) => {
          chrome.bookmarks.getTree(resolve);
        });
      },
      onCreated: chrome.bookmarks.onCreated
    },
    tabs: {
      query: (queryInfo) => {
        return new Promise((resolve) => {
          chrome.tabs.query(queryInfo, resolve);
        });
      },
      get: (tabId) => {
        return new Promise((resolve) => {
          chrome.tabs.get(tabId, resolve);
        });
      },
      create: (createProperties) => {
        return new Promise((resolve) => {
          chrome.tabs.create(createProperties, resolve);
        });
      },
      remove: (tabIds) => {
        return new Promise((resolve) => {
          chrome.tabs.remove(tabIds, resolve);
        });
      },
      executeScript: (tabId, details) => {
        return new Promise((resolve, reject) => {
          chrome.tabs.executeScript(tabId, details, (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });
      }
    },
    storage: {
      local: {
        get: (keys) => {
          return new Promise((resolve) => {
            chrome.storage.local.get(keys, resolve);
          });
        },
        set: (items) => {
          return new Promise((resolve) => {
            chrome.storage.local.set(items, resolve);
          });
        }
      }
    },
    downloads: {
      download: (options) => {
        return new Promise((resolve, reject) => {
          chrome.downloads.download(options, (downloadId) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(downloadId);
            }
          });
        });
      }
    },
    notifications: {
      create: (notificationId, options) => {
        return new Promise((resolve) => {
          chrome.notifications.create(notificationId, options, resolve);
        });
      }
    }
  };
}
