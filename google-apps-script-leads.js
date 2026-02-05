/**
 * Google Apps Script для відправки лідів на email ТА запису в Google Sheets
 * 
 * ІНСТРУКЦІЯ ПО НАЛАШТУВАННЮ:
 * 
 * 1. Відкрийте https://script.google.com/
 * 2. Натисніть "Новий проект"
 * 3. Вставте цей код
 * 4. Збережіть проект (Ctrl+S), назвіть "Property Leads Sender"
 * 5. Створіть Google Sheets таблицю або використайте існуючу
 * 6. Скопіюйте ID таблиці з URL (це частина між /d/ та /edit)
 * 7. Вставте ID в змінну SPREADSHEET_ID нижче
 * 8. Натисніть "Розгорнути" > "Нове розгортання"
 * 9. Тип: "Веб-додаток"
 * 10. "Виконувати як": Ваш обліковий запис
 * 11. "Хто має доступ": Будь-хто
 * 12. Натисніть "Розгорнути"
 * 13. Скопіюйте URL веб-додатку
 * 14. Вставте цей URL в файли valuation-residential.html і valuation-land.html
 *     замість 'YOUR_APPS_SCRIPT_URL'
 */

// ============================================
// НАЛАШТУВАННЯ
// ============================================

// Email куди відправляти ліди
const RECIPIENT_EMAIL = 'loter.kiev@gmail.com';

// ID Google Sheets таблиці
// Приклад URL: https://docs.google.com/spreadsheets/d/1ABC123xyz456/edit
// ID = 1ABC123xyz456
// ⚠️ ВАЖЛИВО: Замініть на реальний ID вашої таблиці!
const SPREADSHEET_ID = '1fhZ0Gy_bLxTnNQJDWCCuUIpMEZBSvLjz-zF2_1TsFW8';

// Назва аркушів для різних типів нерухомості
const SHEET_NAME_RESIDENTIAL = 'Residential Leads';
const SHEET_NAME_LAND = 'Land Leads';

// ============================================
// ГОЛОВНА ФУНКЦІЯ ОБРОБКИ POST ЗАПИТІВ
// ============================================

function doPost(e) {
  try {
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Send email notification
    sendEmailNotification(data);
    
    // Save to Google Sheets
    saveToGoogleSheets(data);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Lead submitted successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log error
    console.error('Error processing lead:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// EMAIL NOTIFICATION
// ============================================

function sendEmailNotification(data) {
  // Determine lead type
  const leadType = data.type === 'land' ? 'Земельна Ділянка' : 'Житлова Нерухомість';
  
  // Format email subject
  const subject = `🏡 Новий Лід: ${leadType} - ${data.name}`;
  
  // Format email body
  let body = `
НОВИЙ ЛІД ОТРИМАНО!
==================

Тип: ${leadType}
Дата: ${new Date(data.timestamp).toLocaleString('uk-UA')}

КОНТАКТНА ІНФОРМАЦІЯ:
---------------------
Ім'я: ${data.name}
Email: ${data.email}
Телефон: ${data.phone || 'Не вказано'}

ІНФОРМАЦІЯ ПРО НЕРУХОМІСТЬ:
---------------------------
Адреса: ${data.propertyAddress}
`;

  // Add property details if available
  if (data.propertyDetails) {
    body += `\nДЕТАЛІ НЕРУХОМОСТІ:\n-------------------\n`;
    if (data.propertyDetails.attomId) {
      body += `ATTOM Property ID: ${data.propertyDetails.attomId}\n`;
    }
    if (data.propertyDetails.estimatedValue) {
      body += `Оціночна вартість: ${data.propertyDetails.estimatedValue}\n`;
    }
    if (data.propertyDetails.squareFeet) {
      body += `Площа (кв.фт): ${data.propertyDetails.squareFeet}\n`;
    }
    if (data.propertyDetails.bedrooms) {
      body += `Спалень: ${data.propertyDetails.bedrooms}\n`;
    }
    if (data.propertyDetails.bathrooms) {
      body += `Ванних: ${data.propertyDetails.bathrooms}\n`;
    }
    if (data.propertyDetails.yearBuilt) {
      body += `Рік побудови: ${data.propertyDetails.yearBuilt}\n`;
    }
    if (data.propertyDetails.propertyType) {
      body += `Тип: ${data.propertyDetails.propertyType}\n`;
    }
  }

  // Add specific fields for land
  if (data.type === 'land') {
    body += `Площа (акри): ${data.acres || 'Не вказано'}\n`;
    body += `Мета: ${data.purpose || 'Не вказано'}\n`;
  }
  
  body += `
ДОДАТКОВА ІНФОРМАЦІЯ:
--------------------
User Agent: ${data.userAgent || 'N/A'}
IP: ${data.ip || 'N/A'}

==================
✅ Дані також збережено в Google Sheets
Відповідайте на цей email швидко для максимальної конверсії!
`;

  // Send email
  MailApp.sendEmail({
    to: RECIPIENT_EMAIL,
    subject: subject,
    body: body
  });
}

// ============================================
// GOOGLE SHEETS INTEGRATION
// ============================================

function saveToGoogleSheets(data) {
  try {
    // Validate SPREADSHEET_ID
    if (!SPREADSHEET_ID || SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      console.error('❌ SPREADSHEET_ID not configured!');
      return;
    }
    
    // Open spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Determine sheet name based on lead type
    const sheetName = data.type === 'land' ? SHEET_NAME_LAND : SHEET_NAME_RESIDENTIAL;
    
    // Get or create sheet
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      // Setup headers
      setupSheetHeaders(sheet, data.type);
    }
    
    // Prepare row data
    const rowData = prepareRowData(data);
    
    // Append data to sheet
    sheet.appendRow(rowData);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, rowData.length);
    
    // Format the new row
    const lastRow = sheet.getLastRow();
    formatNewRow(sheet, lastRow);
    
    console.log('Data saved to Google Sheets successfully');
    
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    // Don't throw - we still want email to be sent even if Sheets fails
  }
}

function setupSheetHeaders(sheet, type) {
  if (type === 'land') {
    // Headers for land leads
    sheet.appendRow([
      'Дата/Час',
      'Ім\'я',
      'Email',
      'Телефон',
      'Адреса',
      'ATTOM Property ID',
      'Площа (акри)',
      'Мета',
      'Оціночна вартість',
      'User Agent',
      'Статус'
    ]);
  } else {
    // Headers for residential leads
    sheet.appendRow([
      'Дата/Час',
      'Ім\'я',
      'Email',
      'Телефон',
      'Адреса',
      'ATTOM Property ID',
      'Оціночна вартість',
      'Площа (кв.фт)',
      'Спалень',
      'Ванних',
      'Рік побудови',
      'Тип нерухомості',
      'User Agent',
      'Статус'
    ]);
  }
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4a86e8');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');
}

function prepareRowData(data) {
  const timestamp = new Date(data.timestamp);
  const formattedDate = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm:ss');
  
  if (data.type === 'land') {
    // Row data for land leads
    return [
      formattedDate,
      data.name || '',
      data.email || '',
      data.phone || '',
      data.propertyAddress || '',
      data.propertyDetails?.attomId || '',
      data.acres || '',
      data.purpose || '',
      data.propertyDetails?.estimatedValue || '',
      data.userAgent || '',
      'Новий'
    ];
  } else {
    // Row data for residential leads
    return [
      formattedDate,
      data.name || '',
      data.email || '',
      data.phone || '',
      data.propertyAddress || '',
      data.propertyDetails?.attomId || '',
      data.propertyDetails?.estimatedValue || '',
      data.propertyDetails?.squareFeet || '',
      data.propertyDetails?.bedrooms || '',
      data.propertyDetails?.bathrooms || '',
      data.propertyDetails?.yearBuilt || '',
      data.propertyDetails?.propertyType || '',
      data.userAgent || '',
      'Новий'
    ];
  }
}

function formatNewRow(sheet, rowNumber) {
  // Format the entire row
  const range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  
  // Alternate row colors for better readability
  if (rowNumber % 2 === 0) {
    range.setBackground('#f3f3f3');
  }
  
  // Format date column
  const dateCell = sheet.getRange(rowNumber, 1);
  dateCell.setHorizontalAlignment('center');
  
  // Format status column (last column)
  const statusCell = sheet.getRange(rowNumber, sheet.getLastColumn());
  statusCell.setBackground('#fff3cd');
  statusCell.setFontWeight('bold');
  statusCell.setHorizontalAlignment('center');
  
  // Format estimated value column (if exists)
  const lastCol = sheet.getLastColumn();
  for (let i = 1; i <= lastCol; i++) {
    const cell = sheet.getRange(rowNumber, i);
    const value = cell.getValue();
    // If cell contains $ (estimated value), format it specially
    if (typeof value === 'string' && value.includes('$')) {
      cell.setFontWeight('bold');
      cell.setFontColor('#0b5394');
    }
  }
}

// ============================================
// TESTING
// ============================================

// For testing GET requests
function doGet(e) {
  return ContentService
    .createTextOutput('✅ Lead submission endpoint is working!\n\n📧 Sends email to: ' + RECIPIENT_EMAIL + '\n📊 Saves to Google Sheets ID: ' + SPREADSHEET_ID + '\n\n📮 Use POST to submit leads.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Test function - run this in Apps Script editor to test
function testScript() {
  const testData = {
    type: 'residential',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    propertyAddress: '123 Main St, Los Angeles, CA 90001',
    propertyDetails: {
      estimatedValue: '$145,000 - $165,000',
      squareFeet: '1,500',
      bedrooms: '3',
      bathrooms: '2',
      yearBuilt: '1985',
      propertyType: 'Single Family'
    },
    timestamp: new Date().toISOString(),
    userAgent: 'Mozilla/5.0 (Test)'
  };
  
  try {
    sendEmailNotification(testData);
    saveToGoogleSheets(testData);
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
