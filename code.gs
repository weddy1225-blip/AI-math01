const API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY');
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

// 備援題庫 (當 API 失敗時使用)
const FALLBACK_QUESTIONS = {
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

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('數學拆彈專家')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getMathQuestion(stage) {
  // 1. 設定 Prompt
  const prompt = `你是一個專業的國小四年級數學出題系統。請根據關卡數 ${stage} 出題。
  第1關:五位數加減。第2關:混合運算(先乘除後加減)。第3關:單位換算。第4關:長度重量應用題。第5關:公升毫升與魔王混合題。
  輸出格式限制：只需回傳純 JSON，格式如下：{"display": "第${stage}題：題目", "answer": "數字"}`;

  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(API_URL, options);
    const result = JSON.parse(response.getContentText());
    
    // 檢查 API 回傳是否正確
    if (result.candidates && result.candidates[0].content.parts[0].text) {
      return result.candidates[0].content.parts[0].text;
    } else {
      throw new Error("API Limit or Error");
    }
  } catch (e) {
    // 2. API 失敗時，觸發備援機制：從題庫隨機挑選
    const pool = FALLBACK_QUESTIONS[stage];
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selected = pool[randomIndex];
    
    // 確保回傳格式與 API 一致
    return JSON.stringify({
      display: `第${stage}題：${selected.display}`,
      answer: selected.answer
    });
  }
}
