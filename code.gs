/**
 * 數學拆彈專家：後端核心 (隱藏 KEY & 強度偵錯版)
 */

function doPost(e) {
  try {
    // 1. 從「專案設定」中安全讀取 API KEY
    const SCRIPT_PROP = PropertiesService.getScriptProperties();
    const API_KEY = SCRIPT_PROP.getProperty('GEMINI_API_KEY');
    
    if (!API_KEY) {
      return createJsonResponse("❌ 錯誤：未在『專案設定』中配置 GEMINI_API_KEY。");
    }

    // 2. 解析前端傳來的資料
    const requestData = JSON.parse(e.postData.contents);
    const chatHistory = requestData.history; 
    
    // 3. 設定 API 網址 (建議先使用最穩定的 1.5-flash 版本)
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + API_KEY;
    
    // 4. 定義系統規則
    const sysRole = "你現在是『數學拆彈專家』遊戲 AI。指令：\n" +
      "1. 【開場】：詳細介紹 5 關挑戰、每題 60 秒、3 顆心、可跳過扣心，隨後出第 1 題。\n" +
      "2. 【答題】：只能回覆『正確。』或『錯誤。』，然後換行給出下一題。嚴禁表情符號與廢話。\n" +
      "3. 【難度】：1-2關大數加減、3-4關括號運算、5關單位換算應用題。\n" +
      "4. 【特殊】：收到『跳過』或『時間到』，回覆：『已跳過。下一題：[新題目]』。\n" +
      "5. 【結尾】：第 5 關正確後回覆：『正確。遊戲結束。』";

    const payload = {
      "system_instruction": { "parts": [{ "text": sysRole }] },
      "contents": chatHistory,
      "generationConfig": { "temperature": 0.1, "maxOutputTokens": 400 }
    };
    
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true 
    };
    
    // 5. 執行請求並捕捉詳細錯誤
    const response = UrlFetchApp.fetch(apiUrl, options);
    const resText = response.getContentText();
    const result = JSON.parse(resText);

    if (result.error) {
      return createJsonResponse("❌ Google API 報錯：" + result.error.message);
    }
    
    if (result.candidates && result.candidates[0].content.parts[0].text) {
      return createJsonResponse(result.candidates[0].content.parts[0].text);
    } else {
      return createJsonResponse("❌ AI 無法生成回應，請檢查 API 設定。");
    }

  } catch (error) {
    return createJsonResponse("⚠️ GAS 系統異常：" + error.toString());
  }
}

function createJsonResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ "reply": message }))
                       .setMimeType(ContentService.MimeType.JSON);
}
