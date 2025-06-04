import puppeteer from 'puppeteer';

/**
 * Puppeteerを使用した高信頼性スクレイピング
 */
export async function scrapWithPuppeteer(url) {
  let browser = null;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
      ],
    });

    const page = await browser.newPage();
    
    // User-Agentの設定
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // ページの読み込み
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // メインテーブルの読み込み待機
    await page.waitForSelector('.ShutubaTable, .RaceTable01, .Shutuba_Table', { 
      timeout: 15000 
    });

    // 動的コンテンツの読み込み待機
    await page.waitForTimeout(3000);

    // HTMLの取得と解析
    const html = await page.content();
    const $ = (await import('cheerio')).load(html);

    return parseHorseDataFromHtml($);

  } catch (error) {
    console.error('Puppeteer scraping failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * HTMLからの馬データ解析（Puppeteer用）
 */
function parseHorseDataFromHtml($) {
  const horses = [];
  
  $('.HorseList, tr[id^="tr_"]').each((index, element) => {
    const $row = $(element);
    const $horseName = $row.find('.HorseName a, .HorseInfo .HorseName a');
    
    if (!$horseName.length) return;

    horses.push({
      frameNumber: $row.find('[class*="Waku"]').text().trim(),
      horseNumber: $row.find('[class*="Umaban"]').text().trim(),
      name: $horseName.text().trim(),
      url: $horseName.attr('href'),
      age: $row.find('.Barei').text().trim(),
      weight: $row.find('td').eq(5).text().trim(),
      odds: $row.find('[id^="odds-"]').text().trim() || 'N/A',
      popularity: $row.find('[id^="ninki-"]').text().trim() || 'N/A',
      jockey: $row.find('.Jockey a').text().trim(),
      trainer: $row.find('.Trainer a').text().trim(),
    });
  });

  return {
    horses,
    totalHorses: horses.length,
    scrapedAt: new Date().toISOString(),
    method: 'puppeteer'
  };
}