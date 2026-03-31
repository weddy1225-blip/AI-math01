function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('API_KEY');
  // 確保 stage 是數字，預設為 1
  const stage = parseInt(e.parameter.stage) || 1; 

  // 根據關卡設定難度描述，讓 AI 出題更精確
  const difficultyLevels = {
    1: "簡單：五位數加減法（例如：12345 + 67890）。",
    2: "中等：三位數乘法（例如：456 * 123）。",
    3: "進階：除法，除數為一位數（例如：896 / 7）。",
    4: "挑戰：重量、長度或容量單位換算（例如：3公升50毫升等於多少毫升）。",
    5: "魔王：混合運算且包含括號（例如：(45 + 55) * 8 - 120）。"
  };

  const levelTask = difficultyLevels[stage] || difficultyLevels[1];

  const prompt = `你是一個國小四年級數學老師。現在要進行拆彈遊戲，請根據以下難度規範出一道數學題：
關卡：第 ${stage} 關
難度規範：${levelTask}
輸出格式：必須嚴格回傳 JSON 格式，不得包含任何 Markdown 標記或額外文字。
範例：{"display": "第${stage}題：(題目內容)", "answer": "純數字答案"}
禁止輸出任何解釋文字。`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    // 強制 AI 只輸出 JSON 物件，減少解析錯誤
    generationConfig: {
      response_mime_type: "application/json"
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    let aiText = result.candidates[0].content.parts[0].text;
    
    // 雖然設定了 response_mime_type，但保險起見還是回傳乾淨的內容
    return ContentService.createTextOutput(aiText.trim())
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // 錯誤處理：若 API 失敗，回傳一個保底題目
    const fallback = {
      "display": `第${stage}題：連線異常，請手動拆彈：100 + ${stage} = ?`,
      "answer": (100 + stage).toString()
    };
    return ContentService.createTextOutput(JSON.stringify(fallback))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
