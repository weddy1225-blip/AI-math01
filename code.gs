/**
 * 數學拆彈專家：後端核心 (安全隱藏 API KEY 版)
 */

function doPost(e) {
  try {
    // 1. 從「專案設定」中安全地讀取 API KEY
    const SCRIPT_PROP = PropertiesService.getScriptProperties();
    const API_KEY = SCRIPT_PROP.getProperty('GEMINI_API_KEY');
    
    // 安全檢查：如果沒設定 Key 會回傳錯誤
    if (!API_KEY) {
      return createJsonResponse("❌ 錯誤：未在『專案設定』中配置 GEMINI_API_KEY。");
    }

    // 2. 解析前端傳來的 JSON 資料
    const requestData = JSON.parse(e.postData.contents);
    const chatHistory = requestData.history; 
    
    // 3. 設定 API 網址 (將 API_KEY 帶入網址參數)
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + API_KEY;
    
    // 4. 定義系統指令 (維持詳細規則開場 + 答題極簡化)
    const sysRole = "你現在是『數學拆彈專家』遊戲的出題 AI。指令如下：\n" +
      "1. 【開場階段】：詳細且生動地介紹 5 關挑戰、每題 60 秒、3 顆心、可跳過但扣心等規則，並直接給出第 1 題。\n" +
      "2. 【答題階段】：玩家回答後，你只能回覆『正確。』或『錯誤。』，然後立刻換行給出下一道題目。禁止表情符號、廢話或鼓勵。\n" +
      "3. 【難度設定】：1-2關(大數加減)、3-4關(括號混合運算)、5關(單位換算應用題)。\n" +
      "4. 【特殊指令】：若收到『跳過』或『時間到』，回覆：『已跳過。下一題：[題目]』。\n" +
      "5. 【結尾】：第 5 關正確後，回覆：『正確。遊戲結束。』";

    const payload = {
      "system_instruction": { "parts": [{ "text": sysRole }] },
      "contents": chatHistory,
      "generationConfig": { 
        "temperature": 0.1, 
        "maxOutputTokens": 400 
      }
    };
    
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true 
    };
    
    // 5. 呼叫 Gemini API
    const response = UrlFetchApp.fetch(apiUrl, options);
    const result = JSON.parse(response.getContentText());

    // 檢查 API 是否正常回傳
    if (result.candidates && result.candidates[0].content.parts[0].text) {
      const reply = result.candidates[0].content.parts[0].text;
      return createJsonResponse(reply);
    } else {
      return createJsonResponse("❌ API 暫時無法回應，請檢查配額或金鑰權限。");
    }

  } catch (error) {
    return createJsonResponse("⚠️ 系統連線異常：" + error.toString());
  }
}

/**
 * 格式化 JSON 回傳
 */
function createJsonResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ "reply": message }))
                       .setMimeType(ContentService.MimeType.JSON);
}
