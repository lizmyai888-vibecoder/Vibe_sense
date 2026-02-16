document.getElementById('scanBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      // Collecting data from the browser tab
      return {
        url: window.location.href,
        title: document.title,
        screen: window.innerWidth + 'x' + window.innerHeight,
        tech: document.querySelector('[class*="bg-"], [class*="text-"]') ? "Tailwind CSS detected" : "Standard CSS",
        description: document.querySelector('meta[name="description"]')?.content || "No description found"
      };
    }
  }, (results) => {
    if (results && results[0]) {
      const data = results[0].result;
      
      // Building the Universal AI Prompt
      const finalPrompt = `
[VIBESENSE CONTEXT PACKAGE]
Project URL: ${data.url}
Page Title: ${data.title}
Environment: ${data.tech}
Screen Resolution: ${data.screen}
Page Description: ${data.description}

INSTRUCTIONS:
I am developing this page. Analyze the current state and help me improve the UI/UX. 
Please ensure all suggestions match the existing design language.
      `.trim();

      // Copying to Clipboard
      navigator.clipboard.writeText(finalPrompt).then(() => {
        status.innerText = "✅ Prompt Copied!";
        setTimeout(() => { status.innerText = ""; }, 3000);
      });
    }
  });
});
