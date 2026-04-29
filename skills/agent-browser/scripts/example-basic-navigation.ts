/**
 * Example: Basic Navigation and Screenshot
 * 
 * Demonstrates how to create a session, navigate to a URL, and capture a screenshot.
 * This is the most basic use case for the agent-browser skill.
 */

import {
  createSession,
  navigate,
  screenshot,
  closeSession,
} from '../index';

async function exampleBasicNavigation() {
  // Step 1: Create a browser session
  const session = await createSession('your-project-id');
  console.log('Session created:', session.id);

  try {
    // Step 2: Navigate to a URL
    await navigate(session, {
      url: 'https://example.com',
      timeout: 30000,
    });
    console.log('Navigated to example.com');

    // Step 3: Capture a screenshot
    const screenshotBuffer = await screenshot(session, {
      fullPage: true,
      format: 'png',
    });
    console.log('Screenshot captured, size:', screenshotBuffer.length, 'bytes');

    // Step 4: Save the screenshot (example with Node.js fs)
    // fs.writeFileSync('example-screenshot.png', screenshotBuffer);
  } finally {
    // Step 5: Always close the session to clean up resources
    await closeSession(session);
    console.log('Session closed');
  }
}

// Run the example
exampleBasicNavigation().catch(console.error);
