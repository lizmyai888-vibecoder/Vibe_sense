document.getElementById('scanBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const issues = [];
      
      // 1. Detect empty buttons (common AI mistake)
      const emptyButtons = Array.from(document.querySelectorAll('button'))
                                .filter(b => !b.innerText.trim() && !b.ariaLabel);
      if (emptyButtons.length > 0) issues.push(`- Found ${emptyButtons.length} buttons without text or labels.`);

      // 2. Check for missing alt text on images
      const missingAlts = document.querySelectorAll('img:not([alt])').length;
      if (missingAlts > 0) issues.push(`- Found ${missingAlts} images missing descriptive alt text.`);

      // 3. Analyze DOM nesting depth
      const deepElements = document.querySelectorAll('* * * * * * * * * *').length;
      if (deepElements > 50) issues.push(`- DOM tree is too deep/nested. This may cause performance or AI refactoring issues.`);

      // 4. Check for horizontal overflow (responsiveness)
      const overflowing = Array.from(document.querySelectorAll('*'))
                               .filter(el => el.offsetWidth > window.innerWidth);
      if (overflowing.length > 0) issues.push(`- Found ${overflowing.length} elements causing horizontal scroll issues.`);

      return {
        url: window.location.href,
        tech: document.querySelector('[class*="bg-"], [class*="text-"]') ? "Tailwind CSS" : "Standard CSS",
        recommendations: issues.length > 0 ? issues.join('\n') : "- No critical bugs found. Suggest overall UI polish."
      };
    }
  }, (results) => {
    if (results && results[0]) {
      const data = results[0].result;
      
      const finalPrompt = `
[VIBESENSE ANALYSIS REPORT]
Target URL: ${data.url}
Tech Stack: ${data.tech}

IDENTIFIED ISSUES:
${data.recommendations}

INSTRUCTIONS FOR AI:
I am using a Vibe Coding environment. Please refactor the code to fix the issues listed above. 
Ensure the fixes are performant and adhere to the existing design system. 
Provide the complete updated code block for the fix.
      `.trim();

      navigator.clipboard.writeText(finalPrompt).then(() => {
        status.innerText = "✅ Analysis & Fix-it Prompt Copied!";
        setTimeout(() => { status.innerText = ""; }, 3000);
      });
    }
  });
});
