# VibeSense AI Helper

A Chrome extension that scans web pages for common issues and generates AI prompts for the Vibe Coding platform.

## Features

- **Two-Stage Workflow**:  
  1. **Scan**: Click "Scan Page" to analyze the current page for issues  
  2. **Copy Prompts**: View recommendations and copy individual prompts for each issue

- **Issue Detection**:
  - Empty buttons without text or labels
  - Missing alt text on images
  - Deep DOM nesting (performance issues)
  - Horizontal overflow (responsiveness issues)

- **Visual Highlights**:
  - For supported issues, a **“Show on Page”** button highlights the problematic elements directly on the website:
    - Empty buttons highlighted in red
    - Images missing `alt` highlighted in orange
    - Overflow elements highlighted in purple
  - The view scrolls to the first highlighted element so you can see exactly where the problem is.

- **Individual Prompts**: Each recommendation generates a focused prompt that can be copied directly to the Vibe Coding chat.

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to any webpage you want to analyze
2. Click the VibeSense extension icon
3. Click **"Scan Page"** to analyze the page
4. Review the recommendations that appear
5. For supported issues, click **"Show on Page"** to highlight where the problem is on the website
6. Click **"Copy Prompt"** on any recommendation to copy a formatted prompt to your clipboard
7. Paste the prompt into your Vibe Coding chat to get AI assistance fixing the issue

## How It Works

The extension scans the active tab's DOM for common web development issues and accessibility problems. Each detected issue is displayed as a separate recommendation with its own buttons:

- **Show on Page**: visually highlights the relevant elements on the page and scrolls them into view  
- **Copy Prompt**: generates a formatted prompt containing:
  - The target URL
  - Detected tech stack
  - The specific issue
  - Instructions for the AI to fix it

This allows you both to **see exactly where the issue is on the site** and to get focused, actionable help from Vibe Coding for each individual issue.
