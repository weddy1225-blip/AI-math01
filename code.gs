/**
 * 數學拆彈專家：後端核心 (穩定格式版)
 */
function doPost(e) {
  try {
    const SCRIPT_PROP = PropertiesService.getScriptProperties();
    const API_KEY = SCRIPT_PROP.getProperty('GEMINI_API_KEY');
    
    if (!API_KEY) return createJsonResponse("❌ 錯誤：未在 GAS 設定 GEMINI_API_KEY");

    // 安全解析 JSON
    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (err) {
      return createJsonResponse("❌ 請求格式錯誤");
    }

    const chatHistory = requestData.history; 
    
    // 核心安全檢查：確保 contents 不是空的
    if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
      return createJsonResponse("❌ 錯誤：對話紀錄遺失，請重新整理網頁。");
    }
    
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + API_KEY;
    
    // 系統指令：開場詳細，過程極簡
    const sysRole = "你現在是『數學拆彈專家』遊戲 AI。指令：\n" +
      "1. 【開場】：詳細介紹 5 關挑戰、每題 60 秒、3 顆心、可跳過扣心。介紹完後直接給第 1 題(大數加減)。\n" +
      "2. 【答題】：玩家回答後，你只能回覆『正確。』或『錯誤。』，然後換行給出下一題。禁止廢話與表情符號。\n" +
      "3. 【難度】：1-2關大數加減、3-4關括號運算、5關單位換算應用題。\n" +
      "4. 【特殊】：收到『跳過』或『時間到』，回覆：『已跳過。下一題：[題目]』。\n" +
      "5. 【結尾】：第 5 關正確後回覆：『正確。遊戲結束。』";

    const payload = {
      "system_instruction": { "parts": [{ "text": sysRole }] },
      "contents": chatHistory,
      "generationConfig": { "temperature": 0.1, "maxOutputTokens": 500 }
    };
    
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true 
    };
    
    const response = UrlFetchApp.fetch(apiUrl, options);
    const result = JSON.parse(response.getContentText());

    if (result.error) {
      return createJsonResponse("❌ Google API 報錯：" + result.error.message);
    }
    
    if (result.candidates && result.candidates[0].content) {
      return createJsonResponse(result.candidates[0].content.parts[0].text);
    } else {
      return createJsonResponse("❌ AI 未能產生內容，請檢查 API 狀態。");
    }

  } catch (error) {
    return createJsonResponse("⚠️ 系統連線異常：" + error.toString());
  }
}

function createJsonResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ "reply": message }))
                       .setMimeType(ContentService.MimeType.JSON);
}
