// НАСТРОЙКИ ТЕЛЕГРАМ
const TELEGRAM_TOKEN = 'ВАШ_ТОКЕН_ОТ_BOTFATHER'; // Вставьте токен внутри кавычек
const CHAT_ID = 'ВАШ_CHAT_ID'; // Вставьте ID чата внутри кавычек

function monitorChangesAndNotify() {
  const sheetName = "test1";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return;

  // Берем данные: 
  // Колонка 1 (A) - URL сайта (для красоты сообщения)
  // Колонка 4 (D) - Новый статус
  // Колонка 5 (E) - Старый статус (для проверки)
  // startRow = 1, numRows = lastRow, numCols = 5 (A to E)
  const range = sheet.getRange(1, 1, lastRow, 5);
  const data = range.getValues();

  // Массив для обновления колонки E (чтобы не писать по одной ячейке)
  const updatesForColE = [];
  let changesFound = false;

  for (let i = 0; i < data.length; i++) {
    const siteUrl = data[i][0];       // Col A
    const newStatus = data[i][3];     // Col D (индекс 3, т.к. отсчет с 0)
    const oldStatus = data[i][4];     // Col E (индекс 4)

    // Если статусы отличаются (значит, что-то изменилось)
    if (newStatus !== oldStatus) {
      
      // Формируем сообщение, только если новый статус не пустой
      if (newStatus !== "") {
        const message = `⚠️ <b>Change Detected!</b>\n\n` +
                        `🌐 <b>Site:</b> ${siteUrl}\n` +
                        `🆕 <b>New Status:</b> ${newStatus}\n` +
                        `Run Time: ${new Date().toLocaleString()}`;
        
        sendTelegramMessage(message);
        changesFound = true;
      }
      
      // Запоминаем новый статус как "старый" для колонки E
      updatesForColE.push([newStatus]);
    } else {
      // Если изменений нет, оставляем старое значение
      updatesForColE.push([oldStatus]);
    }
  }

  // Если были изменения, обновляем колонку E
  if (changesFound) {
    sheet.getRange(1, 5, updatesForColE.length, 1).setValues(updatesForColE);
    Logger.log("Telegram notifications sent and history updated.");
  } else {
    Logger.log("No changes detected.");
  }
}

// Вспомогательная функция отправки
function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    'chat_id': CHAT_ID,
    'text': text,
    'parse_mode': 'HTML' // Позволяет использовать жирный шрифт
  };
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("Telegram Error: " + e.message);
  }
}
