<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1R1YDDD5EQYFzX8bXP7EI8UUHAc0TVWwa

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `OPENROUTER_API_KEY` in [.env.local](.env.local) to your OpenRouter API key
3. Run the app:
   `npm run dev`

## AI Configuration

This app uses OpenRouter with the `x-ai/grok-4.1-fast` model. The AI is configured to be:
- Very conversational and friendly for general interactions
- Highly intelligent and precise for 'smart' tasks (coding, analysis, research, etc.)

Configuration is stored in [ai-config.json](ai-config.json).
