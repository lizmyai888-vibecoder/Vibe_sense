document.getElementById('scanBtn').addEventListener('click', async () => {
  const scanBtn = document.getElementById('scanBtn');
  const scanningStatus = document.getElementById('scanningStatus');
  const status = document.getElementById('status');
  const recommendationsContainer = document.getElementById('recommendationsContainer');
  
  // Reset UI
  scanBtn.disabled = true;
  scanningStatus.innerText = "Scanning page...";
  status.innerText = "";
  recommendationsContainer.style.display = "none";
  recommendationsContainer.innerHTML = "";
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const issues = [];
      
      // 1. Detect empty buttons (common AI mistake)
      const emptyButtons = Array.from(document.querySelectorAll('button'))
                                .filter(b => !b.innerText.trim() && !b.ariaLabel);
      if (emptyButtons.length > 0) {
        issues.push({
          title: `Empty Buttons (${emptyButtons.length} found)`,
          description: `Found ${emptyButtons.length} buttons without text or labels. This is a common accessibility issue.`,
          issue: `Found ${emptyButtons.length} buttons without text or labels.`
        });
      }

      // 2. Check for missing alt text on images
      const missingAlts = document.querySelectorAll('img:not([alt])').length;
      if (missingAlts > 0) {
        issues.push({
          title: `Missing Alt Text (${missingAlts} images)`,
          description: `Found ${missingAlts} images missing descriptive alt text. This affects accessibility and SEO.`,
          issue: `Found ${missingAlts} images missing descriptive alt text.`
        });
      }

      // 3. Analyze DOM nesting depth
      const deepElements = document.querySelectorAll('* * * * * * * * * *').length;
      if (deepElements > 50) {
        issues.push({
          title: `Deep DOM Nesting`,
          description: `DOM tree is too deep/nested (${deepElements} elements at depth 10+). This may cause performance or AI refactoring issues.`,
          issue: `DOM tree is too deep/nested. This may cause performance or AI refactoring issues.`
        });
      }

      // 4. Check for horizontal overflow (responsiveness)
      const overflowing = Array.from(document.querySelectorAll('*'))
                               .filter(el => el.offsetWidth > window.innerWidth);
      if (overflowing.length > 0) {
        issues.push({
          title: `Horizontal Overflow (${overflowing.length} elements)`,
          description: `Found ${overflowing.length} elements causing horizontal scroll issues. This affects mobile responsiveness.`,
          issue: `Found ${overflowing.length} elements causing horizontal scroll issues.`
        });
      }

      return {
        url: window.location.href,
        tech: document.querySelector('[class*="bg-"], [class*="text-"]') ? "Tailwind CSS" : "Standard CSS",
        recommendations: issues.length > 0 ? issues : [{
          title: "General UI Polish",
          description: "No critical bugs found. Suggest overall UI polish and optimization.",
          issue: "No critical bugs found. Suggest overall UI polish."
        }]
      };
    }
  }, (results) => {
    scanBtn.disabled = false;
    scanningStatus.innerText = "";
    
    if (results && results[0]) {
      const data = results[0].result;
      
      if (data.recommendations.length === 0) {
        status.innerText = "✅ Scan complete - No issues found";
        recommendationsContainer.innerHTML = '<div class="no-issues">No issues detected. The page looks good!</div>';
        recommendationsContainer.style.display = "flex";
        return;
      }
      
      status.innerText = `✅ Found ${data.recommendations.length} recommendation(s)`;
      
      // Display recommendations
      data.recommendations.forEach((rec, index) => {
        const recItem = document.createElement('div');
        recItem.className = 'recommendation-item';
        
        const recText = document.createElement('div');
        recText.className = 'recommendation-text';
        recText.innerHTML = `<strong>${rec.title}</strong><br>${rec.description}`;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerText = 'Copy Prompt';
        copyBtn.onclick = () => {
          const prompt = generatePromptForRecommendation(data.url, data.tech, rec.issue);
          navigator.clipboard.writeText(prompt).then(() => {
            copyBtn.innerText = '✓ Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.innerText = 'Copy Prompt';
              copyBtn.classList.remove('copied');
            }, 2000);
          });
        };
        
        recItem.appendChild(recText);
        recItem.appendChild(copyBtn);
        recommendationsContainer.appendChild(recItem);
      });
      
      recommendationsContainer.style.display = "flex";
    } else {
      status.innerText = "❌ Error scanning page";
      scanningStatus.innerText = "";
    }
  });
});

function generatePromptForRecommendation(url, tech, issue) {
  return `[VIBESENSE ANALYSIS REPORT]
Target URL: ${url}
Tech Stack: ${tech}

IDENTIFIED ISSUE:
${issue}

INSTRUCTIONS FOR AI:
I am using a Vibe Coding environment. Please refactor the code to fix the issue listed above. 
Ensure the fixes are performant and adhere to the existing design system. 
Provide the complete updated code block for the fix.`.trim();
}
