/**
 * Example: Data Extraction
 * 
 * Demonstrates various data extraction techniques from a web page.
 */

import {
  createSession,
  navigate,
  extractText,
  extractHTML,
  extractMetadata,
  extractLinks,
  executeScript,
  closeSession,
} from '../index';

async function exampleDataExtraction() {
  const session = await createSession('your-project-id');
  console.log('Session created:', session.id);

  try {
    // Navigate to page
    await navigate(session, {
      url: 'https://example.com',
    });

    // Extract page metadata
    const metadata = await extractMetadata(session);
    console.log('Page metadata:', metadata);

    // Extract all links
    const links = await extractLinks(session);
    console.log('Found links:', links.length);
    console.log('Sample links:', links.slice(0, 3));

    // Extract text from main content
    const mainText = await extractText(session, {
      selector: 'main',
    });
    console.log('Main content text length:', mainText.length);

    // Extract HTML from specific section
    const sectionHTML = await extractHTML(session, {
      selector: '.featured-section',
    });
    console.log('Section HTML length:', sectionHTML.length);

    // Execute custom JavaScript to extract structured data
    const customData = await executeScript(session, `
      return {
        title: document.title,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent),
        imageCount: document.querySelectorAll('img').length,
      };
    `);
    console.log('Custom extracted data:', customData);
  } finally {
    await closeSession(session);
  }
}

exampleDataExtraction().catch(console.error);
