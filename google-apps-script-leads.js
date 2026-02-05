/**
 * Google Apps Script для відправки лідів на email ТА запису в Google Sheets
 * 
 * ІНСТРУКЦІЯ ПО НАЛАШТУВАННЮ:
 * 
 * 1. Відкрийте вашу Google Sheets таблицю
 * 2. Натисніть "Розширення" > "Apps Script"
 * 3. Вставте цей код (замініть функцію myFunction)
 * 4. Збережіть проект (Ctrl+S)
 * 5. Натисніть "Розгорнути" > "Нове розгортання"
 * 6. Тип: "Веб-додаток"
 * 7. "Виконувати як": Ваш обліковий запис
 * 8. "Хто має доступ": Будь-хто
 * 9. Натисніть "Розгорнути" і надайте дозволи
 * 10. Скопіюйте URL веб-додатку
 * 11. Вставте URL в valuation-residential.html в APPS_SCRIPT_URL
 */

// ============================================
// НАЛАШТУВАННЯ
// ============================================

// Email куди відправляти ліди
const RECIPIENT_EMAIL = 'loter.kiev@gmail.com';

// ============================================
// ГОЛОВНА ФУНКЦІЯ ОБРОБКИ POST ЗАПИТІВ
// ============================================

function doPost(e) {
  try {
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get active sheet (first sheet in the spreadsheet)
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Add headers if first row is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Дата/Час',
        'Ім\'я',
        'Email',
        'Телефон',
        'Адреса',
        'ATTOM ID',
        'Оціночна вартість',
        'Площа (кв.фт)',
        'Спалень',
        'Ванних',
        'Рік побудови',
        'Тип'
      ]);
    }
    
    // Append data row
    sheet.appendRow([
      new Date(),
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
      data.propertyDetails?.propertyType || ''
    ]);
    
    // Send email
    MailApp.sendEmail({
      to: RECIPIENT_EMAIL,
      subject: '🏡 Новий Лід: ' + data.name,
      body: `
Ім'я: ${data.name}
Email: ${data.email}
Телефон: ${data.phone || '-'}
Адреса: ${data.propertyAddress || '-'}
Оціночна вартість: ${data.propertyDetails?.estimatedValue || '-'}
ATTOM ID: ${data.propertyDetails?.attomId || '-'}
      `
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// TESTING
// ============================================

// For testing GET requests
function doGet(e) {
  return ContentService
    .createTextOutput('✅ Lead submission endpoint is working!\n\n📧 Sends email to: ' + RECIPIENT_EMAIL)
    .setMimeType(ContentService.MimeType.TEXT);
}
