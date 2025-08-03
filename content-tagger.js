// Automatic content-based tagging

// Process a newly created bookmark
async function processNewBookmark(bookmark) {
  try {
    // Fetch page content
    const response = await fetch(bookmark.url);
    const html = await response.text();
    
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Extract important text elements
    const title = doc.querySelector("title")?.textContent || "";
    const description = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
    const h1s = Array.from(doc.querySelectorAll("h1")).map(el => el.textContent).join(" ");
    const h2s = Array.from(doc.querySelectorAll("h2")).map(el => el.textContent).join(" ");
    
    // Combine all text
    const allText = `${title} ${description} ${keywords} ${h1s} ${h2s}`;
    
    // Extract keywords
    const tags = extractKeywords(allText);
    
    // Update bookmark with tags
    await browser.bookmarks.update(bookmark.id, {
      title: bookmark.title,
      url: bookmark.url,
      // Store tags in description field or custom field
      // depending on how Firefox bookmarks API allows tagging
    });
    
    return tags;
  } catch (error) {
    console.error("Error processing bookmark:", error);
    return [];
  }
}

// Simple keyword extraction (no external libraries)
function extractKeywords(text) {
  // Convert to lowercase and split into words
  const words = text.toLowerCase().split(/\W+/);
  
  // Define stop words to ignore
  const stopWords = new Set([
    "the", "and", "a", "an", "in", "on", "at", "with", "by", "for",
    "to", "of", "is", "are", "was", "were", "be", "been", "being",
    "this", "that", "these", "those", "from", "as", "it", "its"
  ]);
  
  // Count word frequency (excluding stop words)
  const wordCount = {};
  for (const word of words) {
    if (word.length > 2 && !stopWords.has(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  }
  
  // Sort by frequency and get top 4
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(entry => entry[0]);
}

// Listen for bookmark creation
browser.bookmarks.onCreated.addListener(async (id, bookmark) => {
  const tags = await processNewBookmark({ id, ...bookmark });
  console.log("Generated tags:", tags);
});