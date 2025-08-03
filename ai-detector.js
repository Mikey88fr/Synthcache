// AI-generated content detector

// Main analysis function
async function analyzePageForAIContent(tabId) {
  try {
    // Fetch page content
    const pageContent = await browser.tabs.executeScript(tabId, {
      code: `
        // Get all paragraph and list text content
        Array.from(document.querySelectorAll('p, li, h1, h2, h3, h4, h5, article'))
          .map(el => el.textContent)
          .join('\\n');
      `
    });
    
    if (!pageContent || !pageContent[0]) {
      return { probability: "Low", reason: "No content to analyze" };
    }
    
    const text = pageContent[0];
    
    // Run various heuristics
    const patternScore = checkLinguisticPatterns(text);
    const burstinessScore = analyzeSentenceBurstiness(text);
    const listStructureScore = detectListicleStructure(text);
    
    // Calculate total score
    const totalScore = patternScore + burstinessScore + listStructureScore;
    
    // Determine probability level
    let probability, reason;
    if (totalScore > 7) {
      probability = "High";
      reason = determinePrimaryReason(patternScore, burstinessScore, listStructureScore);
    } else if (totalScore > 4) {
      probability = "Medium";
      reason = determinePrimaryReason(patternScore, burstinessScore, listStructureScore);
    } else {
      probability = "Low";
      reason = "No strong indicators of AI generation";
    }
    
    return { probability, reason, details: { patternScore, burstinessScore, listStructureScore } };
  } catch (error) {
    console.error("Error analyzing page:", error);
    return { probability: "Error", reason: "Failed to analyze page" };
  }
}

// Check for common AI linguistic patterns
function checkLinguisticPatterns(text) {
  let score = 0;
  
  // Define AI-typical phrases
  const aiPhrases = [
    "as a language model",
    "as an ai",
    "i'm an ai",
    "as an artificial intelligence",
    "in conclusion",
    "it is important to note",
    "it's important to note",
    "it's worth mentioning",
    "let me",
    "i don't have personal",
    "i don't have the ability to",
    "i cannot access",
    "i cannot browse"
  ];
  
  // Check for typical phrases
  for (const phrase of aiPhrases) {
    if (text.toLowerCase().includes(phrase)) {
      score += 1;
    }
  }
  
  // Check for transition word density
  const transitionWords = [
    "furthermore", "moreover", "additionally", "consequently",
    "therefore", "thus", "hence", "accordingly", "firstly",
    "secondly", "thirdly", "finally"
  ];
  
  let transitionCount = 0;
  for (const word of transitionWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      transitionCount += matches.length;
    }
  }
  
  // Calculate transition density
  const wordCount = text.split(/\s+/).length;
  const transitionDensity = (transitionCount / wordCount) * 100;
  
  if (transitionDensity > 2) { // Over 2% is high
    score += 2;
  } else if (transitionDensity > 1) {
    score += 1;
  }
  
  return Math.min(score, 5); // Cap at 5
}

// Analyze sentence "burstiness"
function analyzeSentenceBurstiness(text) {
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length < 5) {
    return 0; // Not enough sentences for analysis
  }
  
  // Calculate sentence lengths
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  
  // Calculate standard deviation
  const avg = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const squareDiffs = lengths.map(len => Math.pow(len - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  
  // Normalize to a score
  if (stdDev < 2) {
    return 3; // Very uniform sentences (high AI probability)
  } else if (stdDev < 3) {
    return 2; // Somewhat uniform
  } else if (stdDev < 4) {
    return 1; // Slight uniformity
  } else {
    return 0; // Good variation (more human-like)
  }
}

// Detect listicle structure
function detectListicleStructure(text) {
  const listItems = text.match(/^[0-9]+\.\s|^\-\s|^\•\s/gm);
  
  if (!listItems) return 0;
  
  const listItemCount = listItems.length;
  const paragraphCount = text.split(/\n\s*\n/).length;
  
  // Calculate list density
  const listDensity = listItemCount / paragraphCount;
  
  if (listDensity > 0.5) {
    return 3; // High list density
  } else if (listDensity > 0.3) {
    return 2; // Medium list density
  } else if (listDensity > 0.1) {
    return 1; // Low list density
  } else {
    return 0; // Very low list density
  }
}

// Determine the primary reason for the score
function determinePrimaryReason(patternScore, burstinessScore, listStructureScore) {
  const highest = Math.max(patternScore, burstinessScore, listStructureScore);
  
  if (highest === patternScore) {
    return "Contains common AI linguistic patterns";
  } else if (highest === burstinessScore) {
    return "Text has unusually uniform sentence structure";
  } else {
    return "Content has high density of list structures";
  }
}