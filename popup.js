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

  // First, inject CSS and helper functions for highlighting
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      // Remove existing styles if any
      const existingStyle = document.getElementById('vibesense-highlight-style');
      if (existingStyle) existingStyle.remove();
      
      // Add CSS for highlighting
      const style = document.createElement('style');
      style.id = 'vibesense-highlight-style';
      style.textContent = `
        .vibesense-highlight-empty-button {
          outline: 3px solid #ef4444 !important;
          outline-offset: 2px !important;
          background-color: rgba(239, 68, 68, 0.1) !important;
          position: relative !important;
        }
        .vibesense-highlight-empty-button::before {
          content: "⚠ Empty Button" !important;
          position: absolute !important;
          top: -20px !important;
          left: 0 !important;
          background: #ef4444 !important;
          color: white !important;
          padding: 2px 6px !important;
          font-size: 11px !important;
          font-weight: bold !important;
          z-index: 999999 !important;
          border-radius: 3px !important;
        }
        .vibesense-highlight-missing-alt {
          outline: 3px solid #f59e0b !important;
          outline-offset: 2px !important;
          background-color: rgba(245, 158, 11, 0.1) !important;
          position: relative !important;
        }
        .vibesense-highlight-missing-alt::after {
          content: "⚠ Missing Alt" !important;
          position: absolute !important;
          top: -20px !important;
          left: 0 !important;
          background: #f59e0b !important;
          color: white !important;
          padding: 2px 6px !important;
          font-size: 11px !important;
          font-weight: bold !important;
          z-index: 999999 !important;
          border-radius: 3px !important;
        }
        .vibesense-highlight-overflow {
          outline: 3px solid #8b5cf6 !important;
          outline-offset: 2px !important;
          background-color: rgba(139, 92, 246, 0.1) !important;
          position: relative !important;
        }
        .vibesense-highlight-overflow::before {
          content: "⚠ Overflow" !important;
          position: absolute !important;
          top: -20px !important;
          left: 0 !important;
          background: #8b5cf6 !important;
          color: white !important;
          padding: 2px 6px !important;
          font-size: 11px !important;
          font-weight: bold !important;
          z-index: 999999 !important;
          border-radius: 3px !important;
        }
      `;
      document.head.appendChild(style);
      
      // Store highlight state
      window.vibesenseHighlights = window.vibesenseHighlights || {};
    }
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const issues = [];
      const elementSelectors = {};
      
      // Helper function to generate selector path
      function getElementSelector(element) {
        const path = [];
        let el = element;
        while (el && el !== document.body && el !== document.documentElement) {
          let selector = el.tagName.toLowerCase();
          if (el.id) {
            selector += '#' + el.id;
            path.unshift(selector);
            break;
          } else {
            let sibling = el;
            let nth = 1;
            while (sibling.previousElementSibling) {
              sibling = sibling.previousElementSibling;
              if (sibling.tagName === el.tagName) nth++;
            }
            if (nth > 1) {
              selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
          }
          el = el.parentElement;
        }
        return path.join(' > ');
      }
      
      // 1. Detect empty buttons (common AI mistake)
      const emptyButtons = Array.from(document.querySelectorAll('button'))
                                .filter(b => !b.innerText.trim() && !b.ariaLabel);
      if (emptyButtons.length > 0) {
        const selectors = emptyButtons.map(btn => getElementSelector(btn));
        
        issues.push({
          title: `Empty Buttons (${emptyButtons.length} found)`,
          description: `Found ${emptyButtons.length} buttons without text or labels. This is a common accessibility issue.`,
          issue: `Found ${emptyButtons.length} buttons without text or labels.`,
          type: 'empty-buttons',
          selectors: selectors
        });
        elementSelectors['empty-buttons'] = selectors;
      }

      // 2. Check for missing alt text on images
      const missingAltImages = Array.from(document.querySelectorAll('img:not([alt])'));
      if (missingAltImages.length > 0) {
        const selectors = missingAltImages.map(img => getElementSelector(img));
        
        issues.push({
          title: `Missing Alt Text (${missingAltImages.length} images)`,
          description: `Found ${missingAltImages.length} images missing descriptive alt text. This affects accessibility and SEO.`,
          issue: `Found ${missingAltImages.length} images missing descriptive alt text.`,
          type: 'missing-alt',
          selectors: selectors
        });
        elementSelectors['missing-alt'] = selectors;
      }

      // 3. Analyze DOM nesting depth
      const deepElements = document.querySelectorAll('* * * * * * * * * *').length;
      if (deepElements > 50) {
        issues.push({
          title: `Deep DOM Nesting`,
          description: `DOM tree is too deep/nested (${deepElements} elements at depth 10+). This may cause performance or AI refactoring issues.`,
          issue: `DOM tree is too deep/nested. This may cause performance or AI refactoring issues.`,
          type: 'deep-nesting',
          selectors: []
        });
      }

      // 4. Check for horizontal overflow (responsiveness)
      const overflowing = Array.from(document.querySelectorAll('*'))
                               .filter(el => el.offsetWidth > window.innerWidth);
      if (overflowing.length > 0) {
        const selectors = overflowing.slice(0, 20).map(el => getElementSelector(el));
        
        issues.push({
          title: `Horizontal Overflow (${overflowing.length} elements)`,
          description: `Found ${overflowing.length} elements causing horizontal scroll issues. This affects mobile responsiveness.`,
          issue: `Found ${overflowing.length} elements causing horizontal scroll issues.`,
          type: 'overflow',
          selectors: selectors
        });
        elementSelectors['overflow'] = selectors;
      }

      // Store selectors globally for highlighting
      window.vibesenseElementSelectors = elementSelectors;

      return {
        url: window.location.href,
        tech: document.querySelector('[class*="bg-"], [class*="text-"]') ? "Tailwind CSS" : "Standard CSS",
        recommendations: issues.length > 0 ? issues : [{
          title: "General UI Polish",
          description: "No critical bugs found. Suggest overall UI polish and optimization.",
          issue: "No critical bugs found. Suggest overall UI polish.",
          type: 'general',
          selectors: []
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
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '8px';
        
        const showBtn = document.createElement('button');
        showBtn.className = 'show-btn';
        showBtn.innerText = rec.selectors && rec.selectors.length > 0 ? 'Show on Page' : '';
        showBtn.style.display = rec.selectors && rec.selectors.length > 0 ? 'block' : 'none';
        showBtn.style.background = '#6366f1';
        showBtn.style.fontSize = '12px';
        showBtn.style.padding = '8px';
        showBtn.style.marginTop = '4px';
        showBtn.style.flex = '1';
        showBtn.style.cursor = 'pointer';
        showBtn.style.border = 'none';
        showBtn.style.borderRadius = '8px';
        showBtn.style.color = 'white';
        showBtn.style.fontWeight = '600';
        showBtn.style.transition = 'background 0.2s';
        
        let isHighlighted = false;
        showBtn.onclick = async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: (issueType, selectors) => {
              if (!selectors || selectors.length === 0) return;
              
              // Toggle highlights
              const shouldHighlight = !window.vibesenseHighlights[issueType];
              
              // Remove existing highlights for this type
              const classMap = {
                'empty-buttons': 'vibesense-highlight-empty-button',
                'missing-alt': 'vibesense-highlight-missing-alt',
                'overflow': 'vibesense-highlight-overflow'
              };
              
              const highlightClass = classMap[issueType];
              if (!highlightClass) return;
              
              const existingHighlights = document.querySelectorAll(`.${highlightClass}`);
              existingHighlights.forEach(el => {
                el.classList.remove(highlightClass);
              });
              
              if (shouldHighlight) {
                // Add highlights
                selectors.forEach(selector => {
                  try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                      el.classList.add(highlightClass);
                    });
                  } catch (e) {
                    console.log('Could not highlight:', selector, e);
                  }
                });
                
                // Scroll to first highlighted element
                try {
                  const firstSelector = selectors[0];
                  const firstElement = document.querySelector(firstSelector);
                  if (firstElement) {
                    firstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                } catch (e) {}
              }
              
              window.vibesenseHighlights[issueType] = shouldHighlight;
            },
            args: [rec.type, rec.selectors]
          });
          
          isHighlighted = !isHighlighted;
          showBtn.innerText = isHighlighted ? 'Hide Highlights' : 'Show on Page';
          showBtn.style.background = isHighlighted ? '#6b7280' : '#6366f1';
        };
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerText = 'Copy Prompt';
        copyBtn.style.flex = '1';
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
        
        buttonContainer.appendChild(showBtn);
        buttonContainer.appendChild(copyBtn);
        
        recItem.appendChild(recText);
        recItem.appendChild(buttonContainer);
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
