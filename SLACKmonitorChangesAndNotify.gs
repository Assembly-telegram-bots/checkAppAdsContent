// Вставьте вашу ссылку Webhook, полученную на шаге 1
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX';

function monitorChangesAndNotifySlack() {
  const sheetName = "test1"; 
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  // Если данных нет (только заголовок или вообще пусто), выходим
  if (lastRow < 1) return;

  // Берем данные: A (URL), D (New Status), E (Old Status)
  // Диапазон: A1:E_lastRow
  const range = sheet.getRange(1, 1, lastRow, 5);
  const data = range.getValues();

  // Массив для обновления колонки E (память)
  const updatesForColE = [];
  
  // Флаг, чтобы не писать в лог/лист, если изменений не было
  let changesFound = false;

  for (let i = 0; i < data.length; i++) {
    const siteUrl = data[i][0];       // Col A
    const newStatus = data[i][3];     // Col D (индекс 3)
    const oldStatus = data[i][4];     // Col E (индекс 4)

    // Сравниваем
    if (newStatus !== oldStatus) {
      
      // Отправляем уведомление, только если новый статус не пустой 
      // (чтобы не спамить при очистке таблицы)
      if (newStatus !== "") {
        
        // Форматирование для Slack: *bold*, _italics_
        const message = `⚠️ *Change Detected!*\n\n` +
                        `🌐 *Site:* ${siteUrl}\n` +
                        `🆕 *New Status:* ${newStatus}\n` +
                        `_Time: ${new Date().toLocaleString()}_`;
        
        sendSlackMessage(message);
        changesFound = true;
      }
      
      // Запоминаем новый статус
      updatesForColE.push([newStatus]);
    } else {
      // Оставляем старый
      updatesForColE.push([oldStatus]);
    }
  }

  // Обновляем колонку E массово
  if (changesFound) {
    sheet.getRange(1, 5, updatesForColE.length, 1).setValues(updatesForColE);
    Logger.log("Slack notifications sent and history updated.");
  } else {
    Logger.log("No changes detected.");
  }
}

function sendSlackMessage(text) {
  const payload = {
    "text": text
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  try {
    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
  } catch (e) {
    Logger.log("Slack Error: " + e.message);
  }
}
