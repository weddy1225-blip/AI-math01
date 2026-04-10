/**
 * 數學拆彈專家 - 國小四年級專用版 (後端)
 * 整合 50 題保底題庫與 AI 即時出題功能
 */
function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('GEMINI_API_KEY');
  const stage = parseInt(e.parameter.stage) || 1; 

  // --- 50 題保底題庫 (完全符合 1-5 關難度設定) ---
  const fallbackDatabase = {
    1: [
      { "display": "24500 + 13200 = ", "answer": "37700" }, { "display": "58000 - 12500 = ", "answer": "45500" }, 
      { "display": "45670 + 12330 = ", "answer": "58000" }, { "display": "89000 - 45000 = ", "answer": "44000" }, 
      { "display": "12345 + 54321 = ", "answer": "66666" }, { "display": "67000 + 23000 = ", "answer": "90000" }, 
      { "display": "36000 + 14000 = ", "answer": "50000" }, { "display": "95000 - 25000 = ", "answer": "70000" }, 
      { "display": "15600 + 34400 = ", "answer": "50000" }, { "display": "72000 - 8000 = ", "answer": "64000" }
    ],
    2: [
      { "display": "25 × 4 - (30 + 20) = ", "answer": "50" }, { "display": "(25 + 15) × 4 = ", "answer": "160" }, 
      { "display": "100 - (12 + 8) × 3 = ", "answer": "40" }, { "display": "(50 + 50) ÷ 5 + 20 = ", "answer": "40" }, 
      { "display": "40 × (10 - 2) + 100 = ", "answer": "420" }, { "display": "(80 + 20) × 5 = ", "answer": "500" }, 
      { "display": "500 - (200 + 100) ÷ 3 = ", "answer": "400" }, { "display": "(15 + 5) × 10 - 50 = ", "answer": "150" }, 
      { "display": "120 ÷ (10 + 20) × 5 = ", "answer": "20" }, { "display": "(60 - 20) × (2 + 3) = ", "answer": "200" }
    ],
    3: [
      { "display": "5公里200公尺等於幾公尺？", "answer": "5200" }, { "display": "3公斤50公克等於幾公克？", "answer": "3050" }, 
      { "display": "8公升150毫升等於幾毫升？", "answer": "8150" }, { "display": "12公里等於幾公尺？", "answer": "12000" }, 
      { "display": "6公斤5公克等於幾公克？", "answer": "6005" }, { "display": "4公升等於幾毫升？", "answer": "4000" }, 
      { "display": "10公里500公尺等於幾公尺？", "answer": "10500" }, { "display": "20公斤等於幾公克？", "answer": "20000" }, 
      { "display": "1公升25毫升等於幾毫升？", "answer": "1025" }, { "display": "7公里80公尺等於幾公尺？", "answer": "7080" }
    ],
    4: [
      { "display": "小明走3公里50公尺，小華走2800公尺，兩人共走幾公尺？", "answer": "5850" }, 
      { "display": "繩子長5公尺，剪掉2公尺40公分，還剩幾公分？", "answer": "260" }, 
      { "display": "爸爸重75公斤，小強比爸爸輕42公斤500公克，小強重幾公克？", "answer": "32500" }, 
      { "display": "步道全長5公里，小美走了3200公尺，還要走幾公尺？", "answer": "1800" }, 
      { "display": "兩箱蘋果重10公斤，第一箱重4500公克，第二箱重幾公克？", "answer": "5500" }, 
      { "display": "小明145公分，弟弟比他矮20公分，弟弟是幾公分？", "answer": "125" }, 
      { "display": "一袋米5公斤，吃掉1200公克後，還剩下幾公克？", "answer": "3800" }, 
      { "display": "今天走1500公尺，明天走2200公尺，兩天共走幾公尺？", "answer": "3700" }, 
      { "display": "包裹重3公斤，箱子重500公克，內容物重幾公克？", "answer": "2500" }, 
      { "display": "1公里跑道跑了450公尺，還剩幾公尺？", "answer": "550" }
    ],
    5: [
      { "display": "5公升的水倒掉一半，還剩下幾毫升？", "answer": "2500" }, 
      { "display": "3公升的水倒入1500毫升後，共有幾毫升？", "answer": "4500" }, 
      { "display": "2公升500毫升鮮乳喝掉800毫升，還剩幾毫升？", "answer": "1700" }, 
      { "display": "大瓶可樂2公升，小瓶600毫升，兩瓶相差幾毫升？", "answer": "1400" }, 
      { "display": "水缸有8公升水，用掉3500毫升後，還剩幾毫升？", "answer": "4500" }, 
      { "display": "(500+500)毫升水倒入3公升水壺，還能裝幾毫升？", "answer": "2000" }, 
      { "display": "4公升水平均裝入8個杯子，每個杯子是幾毫升？", "answer": "500" }, 
      { "display": "一瓶洗手乳500毫升，買4瓶共是幾公升？(填純數字)", "answer": "2" }, 
      { "display": "(2000+500)×2 毫升等於幾毫升？", "answer": "5000" }, 
      { "display": "10公升水倒掉4500毫升，還剩幾毫升？", "answer": "5500" }
    ]
  };

  const stageRules = { 
    1: "五位數純加法或減法", 
    2: "含括號四則運算", 
    3: "公里/公尺、公斤/公克、公升/毫升單位換算", 
    4: "混合單位加減應用題", 
    5: "容量與公升毫升進階應用" 
  };

  try {
    const prompt = `你是台灣國小四年級數學老師。請出一道第 ${stage} 關題目。
    難度要求：${stageRules[stage]}。
    格式要求：不要出現「題目=」字樣，直接顯示算式並以「= 」結尾。
    回傳 JSON 格式 {"display": "...", "answer": "..."}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    const response = UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }], 
        generationConfig: { response_mime_type: "application/json" } 
      })
    });
    
    return ContentService.createTextOutput(JSON.parse(response.getContentText()).candidates[0].content.parts[0].text.trim())
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    // 當 API 發生錯誤時，從題庫中隨機選擇
    const pool = fallbackDatabase[stage] || fallbackDatabase[1];
    const selected = pool[Math.floor(Math.random() * pool.length)];
    return ContentService.createTextOutput(JSON.stringify(selected))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
