/**
 * 數學拆彈專家 - 後端邏輯 (API 優先 + 25題自動備援)
 */

function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('GEMINI_API_KEY');
  
  // 取得當前關卡，預設為 1
  const stage = parseInt(e.parameter.stage) || 1; 

  // --- 在地化保底題庫 (僅在 API 失敗時動用) ---
  const fallbackDatabase = {
    1: [
        { "display": "第1關：24500 + 13200=", "answer": "37700" },
        { "display": "第1關：50000 - 12500=", "answer": "37500" },
        { "display": "第1關：4567 - 2138=", "answer": "2429" },
        { "display": "第1關：43000 - 2150=", "answer": "40850" },
        { "display": "第1關：12345 + 54321=", "answer": "66666" }
    ],
    2: [
        { "display": "第2關：125 × 8=", "answer": "1000" },
        { "display": "第2關：250 × 4=", "answer": "1000" },
        { "display": "第2關：456 × 12=", "answer": "5472" },
        { "display": "第2關：300 × 25=", "answer": "7500" },
        { "display": "第2關：112 × 11=", "answer": "1232" }
    ],
    3: [
        { "display": "第3關：840 ÷ 8=", "answer": "105" },
        { "display": "第3關：963 ÷ 3=", "answer": "321" },
        { "display": "第3關：505 ÷ 5=", "answer": "101" },
        { "display": "第3關：728 ÷ 7=", "answer": "104" },
        { "display": "第3關：416 ÷ 4=", "answer": "104" }
    ],
    4: [
        { "display": "第4關：5公里200公尺等於幾公尺？", "answer": "5200" },
        { "display": "第4關：3公斤50公克等於幾公克？", "answer": "3050" },
        { "display": "第4關：8公升等於幾毫升？", "answer": "8000" },
        { "display": "第4關：2公升50毫升等於幾毫升？", "answer": "2050" },
        { "display": "第4關：10公里減去2公里500公尺是幾公尺？", "answer": "7500" }
    ],
    5: [
        { "display": "第5關：(45 + 55) × 8=", "answer": "800" },
        { "display": "第5關：1000 - 250 × 3=", "answer": "250" },
        { "display": "第5關：(120 - 20) ÷ 5=", "answer": "20" },
        { "display": "第5關：50 × (12 + 8)=", "answer": "1000" },
        { "display": "第5關：88 ÷ 8 + 90=", "answer": "101" }
    ]
  };

  // 難度描述 (供 AI 參考)
  const difficultyLevels = {
    1: "簡單：五位數加減法。",
    2: "中等：三位數乘法。",
    3: "進階：三位數除以一位數。",
    4: "挑戰：長度、重量、容量單位換算（由大單位換算為小單位，問總數）。",
    5: "魔王：包含括號的四則混合運算。"
  };

  const levelTask = difficultyLevels[stage] || difficultyLevels[1];

  // --- 優先嘗試連接 API ---
  try {
    const prompt = `你是一個台灣國小數學老師。請出一題第 ${stage} 關的數學題。
難度規範：${levelTask}
格式規範：
1. 嚴格格式：「第${stage}關：(題目內容)=」。
2. 乘法用「×」，除法用「÷」。
3. 嚴禁出現「請計算」或解釋文字。
4. 第 4 關請問總數是多少（例如：2公升50毫升等於幾毫升？），讓學生填純數字。
輸出格式：JSON 範例 {"display": "第${stage}關：123×4=", "answer": "492"}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json" }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: false // 設定為 false 以便觸發 catch 區塊
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.candidates && result.candidates[0].content) {
      const aiText = result.candidates[0].content.parts[0].text;
      // 成功獲取 AI 題目，回傳結果
      return ContentService.createTextOutput(aiText.trim()).setMimeType(ContentService.MimeType.JSON);
    } else {
      throw new Error("AI 回傳內容不完整");
    }
    
  } catch (error) {
    // --- API 連接失敗，動用保底題庫 ---
    console.log("觸發備援機制: " + error.toString());
    const stagePool = fallbackDatabase[stage];
    const fallbackQuiz = stagePool[Math.floor(Math.random() * stagePool.length)];
    
    return ContentService.createTextOutput(JSON.stringify(fallbackQuiz))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
