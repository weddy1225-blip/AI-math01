/**
 * 數學拆彈專家 - 5 關階層版 (API 優先 + 50 題保底備援)
 */

function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('GEMINI_API_KEY');
  
  // 取得當前關卡，預設為 1
  const stage = parseInt(e.parameter.stage) || 1; 

  // --- 在地化 50 題保底題庫 (當 API 失敗時隨機取用) ---
  const fallbackDatabase = {
    1: [ // 第一關：大數純加減
      { "display": "第1關：24500+13200=", "answer": "37700" },
      { "display": "第1關：50000-12500=", "answer": "37500" },
      { "display": "第1關：5483+2103=", "answer": "7586" },
      { "display": "第1關：43000-2150=", "answer": "40850" },
      { "display": "第1關：12345+54321=", "answer": "66666" },
      { "display": "第1關：67000+23000=", "answer": "90000" },
      { "display": "第1關：89000-4500=", "answer": "84500" },
      { "display": "第1關：15600+34400=", "answer": "50000" },
      { "display": "第1關：4567-2138=", "answer": "2429" },
      { "display": "第1關：72000-8000=", "answer": "64000" }
    ],
    2: [ // 第二關：四則混合運算 (含括號)
      { "display": "第2關：(25+15)×4=", "answer": "160" },
      { "display": "第2關：(25-5)×2-10+80=", "answer": "110" },
      { "display": "第2關：100-(12+8)×3=", "answer": "40" },
      { "display": "第2關：(50+50)÷5+20=", "answer": "40" },
      { "display": "第2關：40×(10-2)+100=", "answer": "420" },
      { "display": "第2關：(120-20)÷2+50=", "answer": "100" },
      { "display": "第2關：25×4-(30+20)=", "answer": "50" },
      { "display": "第2關：(80+20)×(15-10)=", "answer": "500" },
      { "display": "第2關：500-(200+100)÷3=", "answer": "400" },
      { "display": "第2關：(15+5)×10-50=", "answer": "150" }
    ],
    3: [ // 第三關：基礎單位換算 (大換小)
      { "display": "第3關：5公里200公尺等於幾公尺？", "answer": "5200" },
      { "display": "第3關：3公斤50公克等於幾公克？", "answer": "3050" },
      { "display": "第3關：8公升150毫升等於幾毫升？", "answer": "8150" },
      { "display": "第3關：12公里等於幾公尺？", "answer": "12000" },
      { "display": "第3關：6公斤5公克等於幾公克？", "answer": "6005" },
      { "display": "第3關：4公升等於幾毫升？", "answer": "4000" },
      { "display": "第3關：10公里500公尺等於幾公尺？", "answer": "10500" },
      { "display": "第3關：20公斤等於幾公克？", "answer": "20000" },
      { "display": "第3關：1公升25毫升等於幾毫升？", "answer": "1025" },
      { "display": "第3關：7公里80公尺等於幾公尺？", "answer": "7080" }
    ],
    4: [ // 第四關：長度與重量應用題
      { "display": "第4關：小明跑3公里50公尺，小華跑2800公尺，兩人一共跑幾公尺？", "answer": "5850" },
      { "display": "第4關：一條繩子長5公尺，剪掉2公尺40公分，還剩幾公分？", "answer": "260" },
      { "display": "第4關：爸爸體重75公斤，小強比爸爸輕42公斤500公克，小強是幾公克？", "answer": "32500" },
      { "display": "第4關：一輛車開了12公里，再開4500公尺，總共開了幾公尺？", "answer": "16500" },
      { "display": "第4關：步道全長5公里，小美走了3200公尺，還要走幾公尺才到終點？", "answer": "1800" },
      { "display": "第4關：兩箱蘋果共重10公斤，第一箱重4500公克，第二箱重幾公克？", "answer": "5500" },
      { "display": "第4關：小明身高1公尺45公分，比弟弟高20公分，弟弟是幾公分？", "answer": "125" },
      { "display": "第4關：一袋米5公斤，吃掉1200公克後，還剩下幾公克？", "answer": "3800" },
      { "display": "第4關：小青今天走1公里500公尺，明天走2200公尺，兩天共走幾公尺？", "answer": "3700" },
      { "display": "第4關：包裹重3公斤，裡面放了1800公克的書，箱子重幾公克？", "answer": "1200" }
    ],
    5: [ // 第五關：容量應用與魔王挑戰
      { "display": "第5關：水桶有3公升的水，倒入1500毫升後，共有幾毫升的水？", "answer": "4500" },
      { "display": "第5關：媽媽買了2公升500毫升鮮乳，喝掉800毫升，還剩幾毫升？", "answer": "1700" },
      { "display": "第5關：哥哥喝了500毫升果汁，妹妹喝1公升200毫升，共喝幾毫升？", "answer": "1700" },
      { "display": "第5關：大瓶可樂2公升，小瓶可樂600毫升，兩瓶相差幾毫升？", "answer": "1400" },
      { "display": "第5關：水缸原有8公升水，用掉3500毫升後，還剩幾毫升？", "answer": "4500" },
      { "display": "第5關：(500+500)毫升果汁倒入3公升水壺，還能裝幾毫升？", "answer": "2000" },
      { "display": "第5關：4公升水平均裝入8個500毫升杯子，剩幾毫升？", "answer": "0" },
      { "display": "第5關：一瓶洗手乳500毫升，買4瓶共是多少公升？(填純數字)", "answer": "2" },
      { "display": "第5關：(2000+500)×2 毫升等於幾毫升？", "answer": "5000" },
      { "display": "第5關：5公升的水倒掉一半，還剩下幾毫升？", "answer": "2500" }
    ]
  };

  // 難度分級描述 (用於提示 AI)
  const difficultyLevels = {
    1: "純粹的五位數加法或減法計算。",
    2: "四則混合運算，必須包含括號與先乘除後加減的邏輯（例如：(25+15)×4）。",
    3: "公里/公尺、公斤/公克、公升/毫升的基礎單位轉換。",
    4: "長度與重量的應用題，需先統一單位再進行加減運算，問總量（公尺或公克）。",
    5: "容量(公升/毫升)的綜合應用題，需處理剩餘量或倍數計算。"
  };

  const levelTask = difficultyLevels[stage] || difficultyLevels[1];

  // --- 優先嘗試連接 API ---
  try {
    const prompt = `你是一個台灣國小四年級數學老師。請出一題第 ${stage} 關的數學題。
難度層級：${levelTask}
格式規範：
1. 嚴格輸出格式：「第${stage}關：(題目內容)=」。
2. 乘法符號務必用「×」，除法符號務必用「÷」。
3. 嚴禁出現「請計算」或任何解釋文字。
4. 應用題請確保問題最後是問「幾公尺」、「幾公克」或「幾毫升」，讓學生回答純數字。
輸出格式：必須為 JSON，例如 {"display": "第${stage}關：(題目內容)=", "answer": "純數字答案"}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json" }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: false 
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.candidates && result.candidates[0].content) {
      const aiText = result.candidates[0].content.parts[0].text;
      return ContentService.createTextOutput(aiText.trim()).setMimeType(ContentService.MimeType.JSON);
    } else {
      throw new Error("AI Data Error");
    }
    
  } catch (error) {
    // --- API 失敗，從 50 題庫隨機挑選備援 ---
    const stagePool = fallbackDatabase[stage];
    const fallbackQuiz = stagePool[Math.floor(Math.random() * stagePool.length)];
    
    return ContentService.createTextOutput(JSON.stringify(fallbackQuiz))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
