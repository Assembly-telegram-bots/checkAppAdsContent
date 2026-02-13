function checkAppAdsContent() {
  const sheetName = "test1";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log("Error: Sheet '" + sheetName + "' not found.");
    return;
  }

  // ТЕПЕРЬ НАЧИНАЕМ С 1-Й СТРОКИ
  const startRow = 1; 
  const lastRow = sheet.getLastRow();
  
  Logger.log("Total rows found: " + lastRow);

  if (lastRow < startRow) {
    Logger.log("No data found to process.");
    return;
  }

  // Берем данные: Колонка 2 (B) и Колонка 3 (C)
  const range = sheet.getRange(startRow, 2, lastRow - startRow + 1, 2);
  const data = range.getValues();
  
  const outputStatuses = [];

  for (let i = 0; i < data.length; i++) {
    const url = data[i][0];       // Колонка 2 (URL app-ads.txt)
    const expectedText = data[i][1]; // Колонка 3 (Строки для проверки)
    
    Logger.log("Processing row " + (i + startRow));

    if (!url || url === "") {
      outputStatuses.push(["No URL"]);
      continue;
    }

    try {
      const response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
      const code = response.getResponseCode();
      
      if (code === 200) {
        const content = response.getContentText();
        
        // ВАЖНО: Разбиваем ТОЛЬКО по переносу строки (\n), чтобы сохранить запятые в строках
        // Например: "bidmachine.io, 60, RESELLER" останется целой строкой
        let linesToCheck = expectedText.toString().split('\n');
        
        // Убираем лишние пробелы вокруг каждой строки
        linesToCheck = linesToCheck.map(s => s.trim()).filter(s => s !== "");
        
        const missing = [];
        
        linesToCheck.forEach(line => {
          // Проверяем, содержится ли эта целая строка в файле
          if (!content.includes(line)) {
            missing.push(line);
          }
        });

        if (missing.length === 0) {
          outputStatuses.push(["Valid"]);
        } else {
          // Выводим список того, чего не нашли
          outputStatuses.push(["Missing: \n" + missing.join("\n")]);
        }
      } else {
        outputStatuses.push(["Error: HTTP " + code]);
      }

    } catch (e) {
      outputStatuses.push(["Error: " + e.message]);
      Logger.log("Error: " + e.message);
    }
  }

  // Записываем результат в 4-ю колонку (D)
  sheet.getRange(startRow, 4, outputStatuses.length, 1).setValues(outputStatuses);
}
