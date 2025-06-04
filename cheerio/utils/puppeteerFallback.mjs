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
        '--lang=ja-JP',  // 日本語環境を明示的に指定
      ],
    });

    const page = await browser.newPage();
    
    // 日本語環境の設定
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8'
    });
    
    // User-Agentの設定
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // ページの読み込み
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // メインテーブルの読み込み待機
    await page.waitForSelector('.ShutubaTable, .RaceTable01, .Shutuba_Table, table', { 
      timeout: 15000 
    });

    // 動的コンテンツの読み込み待機
    await page.waitForTimeout(3000);

    // JavaScriptで文字エンコーディングを確認
    const charset = await page.evaluate(() => {
      return document.characterSet || document.charset;
    });
    console.log(`Page charset: ${charset}`);

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
  const raceInfo = extractRaceInfo($);
  
  // より柔軟なセレクタで馬情報を取得
  $('.HorseList, tr[id^="tr_"], .RaceTable01 tr, .ShutubaTable tr').each((index, element) => {
    const $row = $(element);
    
    // ヘッダー行をスキップ
    if ($row.find('th').length > 0) return;
    
    const $horseName = $row.find('.HorseName a, .HorseInfo .HorseName a, td a[href*="/horse/"]').first();
    
    if (!$horseName.length) return;

    const horse = {
      frameNumber: extractFrameNumber($row),
      horseNumber: extractHorseNumber($row),
      name: $horseName.text().trim(),
      url: $horseName.attr('href'),
      horseId: extractHorseId($horseName.attr('href')),
      age: extractAge($row),
      weight: extractWeight($row),
      odds: extractOdds($row),
      popularity: extractPopularity($row),
      jockey: extractJockey($row),
      trainer: extractTrainer($row),
    };

    if (horse.name && horse.name !== '') {
      horses.push(horse);
    }
  });

  return {
    raceInfo,
    horses,
    totalHorses: horses.length,
    scrapedAt: new Date().toISOString(),
    method: 'puppeteer'
  };
}

/**
 * レース情報の抽出
 */
function extractRaceInfo($) {
  return {
    title: $('.RaceName, .race_name, h1.raceTitle').first().text().trim() || 'レース情報',
    date: $('.RaceData01, .race_date, .raceData01').first().text().trim() || 'N/A',
    course: $('.RaceData02, .course_info, .raceData02').first().text().trim() || 'N/A',
    class: $('.RaceData03, .race_class, .raceData03').first().text().trim() || 'N/A',
  };
}

/**
 * 枠番の抽出
 */
function extractFrameNumber($row) {
  const frameElement = $row.find('[class*="Waku"], td.waku').first();
  if (frameElement.length) {
    return frameElement.text().trim();
  }
  
  const firstTd = $row.find('td').eq(0);
  const text = firstTd.text().trim();
  if (text && /^\d+$/.test(text)) {
    return text;
  }
  
  return 'N/A';
}

/**
 * 馬番の抽出
 */
function extractHorseNumber($row) {
  const horseNumElement = $row.find('[class*="Umaban"], td.umaban').first();
  if (horseNumElement.length) {
    return horseNumElement.text().trim();
  }
  
  const secondTd = $row.find('td').eq(1);
  const text = secondTd.text().trim();
  if (text && /^\d+$/.test(text)) {
    return text;
  }
  
  return 'N/A';
}

/**
 * 年齢の抽出
 */
function extractAge($row) {
  const ageElement = $row.find('.Barei, td.barei').first();
  if (ageElement.length) {
    return ageElement.text().trim();
  }
  
  const ageTd = $row.find('td').filter((i, el) => {
    const text = $(el).text().trim();
    return /^[牡牝セ][0-9]+$/.test(text);
  }).first();
  
  return ageTd.text().trim() || 'N/A';
}

/**
 * 斤量の抽出
 */
function extractWeight($row) {
  const weightElement = $row.find('.Futan, td.futan').first();
  if (weightElement.length) {
    return weightElement.text().trim();
  }
  
  const weightTd = $row.find('td').filter((i, el) => {
    const text = $(el).text().trim();
    return /^\d+(\.\d+)?$/.test(text) && parseFloat(text) >= 48 && parseFloat(text) <= 65;
  }).first();
  
  return weightTd.text().trim() || 'N/A';
}

/**
 * オッズの抽出
 */
function extractOdds($row) {
  const oddsElement = $row.find('[id^="odds-"], .Popular span, .odds, td.odds').first();
  const oddsText = oddsElement.text().trim();
  return oddsText && oddsText !== '---.-' && oddsText !== '**' && oddsText !== '' ? oddsText : 'N/A';
}

/**
 * 人気の抽出
 */
function extractPopularity($row) {
  const popularityElement = $row.find('[id^="ninki-"], .Popular_Ninki span, td.ninki').first();
  const popularityText = popularityElement.text().trim();
  return popularityText && popularityText !== '**' && popularityText !== '' ? popularityText : 'N/A';
}

/**
 * 騎手情報の抽出
 */
function extractJockey($row) {
  const jockeyElement = $row.find('.Jockey a, td.jockey a, a[href*="/jockey/"]').first();
  return jockeyElement.text().trim() || 'N/A';
}

/**
 * 調教師情報の抽出
 */
function extractTrainer($row) {
  const trainerElement = $row.find('.Trainer a, td.trainer a, a[href*="/trainer/"]').first();
  return trainerElement.text().trim() || 'N/A';
}

/**
 * 馬IDの抽出
 */
function extractHorseId(url) {
  if (!url) return null;
  const match = url.match(/horse\/(\d+)/);
  return match ? match[1] : null;
}