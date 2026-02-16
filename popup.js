document.getElementById('scanBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      // איסוף נתונים בתוך הדף
      return {
        url: window.location.href,
        title: document.title,
        screen: window.innerWidth + 'x' + window.innerHeight,
        tech: document.querySelector('[class*="bg-"]') ? "Tailwind CSS" : "Standard CSS",
        html: document.body.innerText.slice(0, 500) // לוקח טעימה מהטקסט בדף
      };
    }
  }, (results) => {
    const data = results[0].result;
    
    // בניית הפרומפט האוניברסלי (באנגלית - לביצועי AI מקסימליים)
    const finalPrompt = `
[AI VIBE CHECK CONTEXT]
Project URL: ${data.url}
Page Title: ${data.title}
Environment: ${data.tech}, Screen size ${data.screen}

Page Content Snippet:
"${data.html}..."

INSTRUCTION: I'm building this page. Based on this context, please help me improve the UI and functionality. Focus on keeping the vibe consistent.
    `.trim();

    navigator.clipboard.writeText(finalPrompt).then(() => {
      status.innerText = "✅ הפרומפט הועתק!";
      setTimeout(() => { status.innerText = ""; }, 3000);
    });
  });
});
