/**
 * 數學拆彈專家 - 階層遞進版 (API 優先 + 50 題分關備援)
 */

function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('GEMINI_API_KEY');
  
  // 核心控制：從前端傳入的 stage 決定難度
  const stage = parseInt(e.parameter.stage) || 1; 

  // --- 分關保底題庫 (嚴格對應 stage) ---
  const fallbackDatabase = {
    1: [ // 第一關：純加減 (已修正 5483+2103)
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
    2: [ // 第二關：四則運算 (含括號與先後順序)
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
    3: [ // 第三關：基礎單位轉換
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
    4: [ // 第四關：長度與重量跨單位應用
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
    5: [ // 第五關：容量應用與魔王混合題
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

  // 難度進階描述 (API 依照此描述遞進出題)
  const stageDifficulty = {
    1: "【基礎層級】僅限五位數以內的加法或減法計算，不准有乘除法。",
    2: "【中階層級】包含括號與四則運算的邏輯題目，需強調運算順序。",
    3: "【單位轉換】聚焦在公里/公尺、公斤/公克、公升/毫升的大單位轉小單位轉換。",
    4: "【應用層級】長度與重量的生活應用題，需處理跨單位(例如公里與公尺混合)的加減算式。",
    5: "【魔王層級】容量(公升/毫升)的複雜應用，包含剩餘量計算或多步驟混合運算。"
  };

  const currentRule = stageDifficulty[stage] || stageDifficulty[1];

  try {
    // --- 1. 優先嘗試連接 API ---
    const prompt = `你現在是台灣國小四年級數學老師。請依照目前學生的進度出一題拆彈題目。
當前關卡：第 ${stage} 關
難度要求：${currentRule}
格式要求：
1. 嚴格格式：「第${stage}關：(題目內容)=」。
2. 乘法符號用「×」，除法符號用「÷」。
3. 嚴禁任何解釋或引號。
4. 應用題請確保問題最後是問「幾公尺」、「幾公克」或「幾毫升」，學生只會回答純數字。
回傳格式：必須為 JSON {"display": "...", "answer": "..."}`;

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
      const aiResponse = result.candidates[0].content.parts[0].text.trim();
      return ContentService.createTextOutput(aiResponse).setMimeType(ContentService.MimeType.JSON);
    } else {
      throw new Error("Invalid AI Data");
    }

  } catch (error) {
    // --- 2. API 失敗，嚴格按照 stage 從備援題庫隨機抽取 ---
    const pool = fallbackDatabase[stage];
    const randomIndex = Math.floor(Math.random() * pool.length);
    const fallbackItem = pool[randomIndex];
    
    return ContentService.createTextOutput(JSON.stringify(fallbackItem))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
