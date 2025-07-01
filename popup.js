document.getElementById('open-manager-button').addEventListener('click', () => {
  browser.runtime.sendMessage({ command: "open-bookmark-manager" });
  window.close();
});

document.getElementById('start-button').addEventListener('click', () => {
  browser.runtime.sendMessage({ command: "start-tagging" });
  window.close(); // Closes the popup after clicking
});

document.getElementById('analyze-bookmarks-button').addEventListener('click', () => {
  browser.runtime.sendMessage({ command: "analyze-all-bookmarks" });
  window.close();
});
