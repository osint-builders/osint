/**
 * Example: Form Filling and Submission
 * 
 * Demonstrates how to fill a form, select options, and submit it.
 */

import {
  createSession,
  navigate,
  fill,
  selectOption,
  click,
  screenshot,
  closeSession,
} from '../index';

async function exampleFormFilling() {
  const session = await createSession('your-project-id');
  console.log('Session created:', session.id);

  try {
    // Navigate to form page
    await navigate(session, {
      url: 'https://example.com/contact-form',
    });
    console.log('Navigated to form');

    // Fill text inputs
    await fill(session, 'input[name="name"]', 'John Doe');
    await fill(session, 'input[name="email"]', 'john@example.com');

    // Fill textarea
    await fill(session, 'textarea[name="message"]', 'Hello, this is my message.');

    // Select dropdown option
    await selectOption(session, 'select[name="category"]', 'general-inquiry');

    // Click submit button
    await click(session, 'button[type="submit"]');
    console.log('Form submitted');

    // Wait a moment for processing and capture result
    // In a real scenario, you might wait for navigation or page change
    const result = await screenshot(session);
    console.log('Result screenshot captured');
  } finally {
    await closeSession(session);
  }
}

exampleFormFilling().catch(console.error);
