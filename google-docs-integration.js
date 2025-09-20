/**
 * Google Apps Script for automatic URL shortening of new Google Docs.
 * Deploys as a Web App or can be triggered by events (e.g., on form submit, on document creation).
 */

const API_WEBHOOK_URL = 'https://us-central1-moni-url-short.cloudfunctions.net/api/api/v1/google-docs/webhook';
const API_KEY = ''; // No API key needed for this webhook

/**
 * Triggered when a new Google Doc is created or updated.
 * You would typically set up an installable trigger for this.
 * For example, an "On change" trigger for a specific folder, or "On form submit" if docs are created via forms.
 * @param {GoogleAppsScript.Events.DocsEvent|GoogleAppsScript.Events.FormsOnFormSubmit} e The event object.
 */
function onDocumentEvent(e) {
  let docUrl = '';
  let docName = '';
  let userEmail = Session.getActiveUser().getEmail();

  // Example for a Google Docs event (e.g., if you can capture new doc creation)
  // This part might need customization based on how you detect new docs.
  // Google Apps Script doesn't have a direct "on new doc created" trigger easily.
  // A common workaround is to monitor a folder or use a form submission.
  if (e.source.getUrl) { // Assuming e.source is a Document object
    docUrl = e.source.getUrl();
    docName = e.source.getName();
  } else if (e.response) { // Example for a Form Submit event
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    for (let i = 0; i < itemResponses.length; i++) {
      if (itemResponses[i].getItem().getTitle().toLowerCase().includes('document url')) {
        docUrl = itemResponses[i].getResponse();
      }
      if (itemResponses[i].getItem().getTitle().toLowerCase().includes('document name')) {
        docName = itemResponses[i].getResponse();
      }
    }
    userEmail = formResponse.getRespondentEmail() || userEmail;
  } else {
    // Fallback or other event types
    Logger.log('Unhandled event type: ' + JSON.stringify(e));
    return;
  }

  if (!docUrl || !docName) {
    Logger.log('Could not extract document URL or Name from event.');
    return;
  }

  createShortLink(docName, docUrl, userEmail);
}

/**
 * Creates a short link for a given Google Doc URL using the URL Shortener API.
 * @param {string} docName The name of the Google Doc.
 * @param {string} docUrl The long URL of the Google Doc.
 * @param {string} userEmail The email of the user creating the doc.
 */
function createShortLink(docName, docUrl, userEmail) {
  const payload = {
    docName: docName,
    docUrl: docUrl,
    createdBy: userEmail
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'headers': {
      // 'Authorization': 'Bearer ' + API_KEY // Uncomment if your webhook requires auth
    },
    'muteHttpExceptions': true
  };

  try {
    const response = UrlFetchApp.fetch(API_WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 201 || responseCode === 200) {
      Logger.log('Successfully created short link for ' + docName + ': ' + responseBody);
      // Optionally, you can parse responseBody to get the short URL and add it to the doc or a spreadsheet
      const responseData = JSON.parse(responseBody);
      if (responseData.success && responseData.data) {
        const shortUrl = 'https://go.monumental-i.com/' + responseData.data.slug;
        Logger.log('Short URL created: ' + shortUrl);
        return shortUrl;
      }
    } else {
      Logger.log('Error creating short link for ' + docName + ': ' + responseCode + ' - ' + responseBody);
    }
  } catch (e) {
    Logger.log('Exception when calling URL Shortener API: ' + e.toString());
  }
}

/**
 * Example of how to manually create a short link for an existing Google Doc.
 */
function manualCreateShortLink() {
  const doc = DocumentApp.getActiveDocument();
  const docName = doc.getName();
  const docUrl = doc.getUrl();
  const userEmail = Session.getActiveUser().getEmail();

  return createShortLink(docName, docUrl, userEmail);
}

/**
 * Deploys this script as a web app.
 * Go to "Deploy" -> "New deployment" in the Apps Script editor.
 * Select type "Web app".
 * Execute as: "Me"
 * Who has access: "Anyone" (or "Anyone with Google account" if you want to restrict)
 * The URL provided will be your webhook endpoint for testing.
 */
function doGet(e) {
  return HtmlService.createHtmlOutput('This script is designed to be used as a webhook or triggered by events, not directly via GET.');
}

function doPost(e) {
  if (e.postData.type === 'application/json') {
    const data = JSON.parse(e.postData.contents);
    const shortUrl = createShortLink(data.docName, data.docUrl, data.userEmail);
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      message: 'Webhook received and processed.',
      shortUrl: shortUrl
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'error', 
    message: 'Invalid content type or data.' 
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function to verify the integration works
 */
function testIntegration() {
  const testDocName = 'Test Document - ' + new Date().toISOString();
  const testDocUrl = 'https://docs.google.com/document/d/1ABC123DEF456GHI789JKL/edit';
  const testUserEmail = 'daniel@monumental-i.com';
  
  Logger.log('Testing Google Docs integration...');
  const result = createShortLink(testDocName, testDocUrl, testUserEmail);
  Logger.log('Test result: ' + result);
  return result;
}