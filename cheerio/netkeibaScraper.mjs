import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { handleEncoding } from './utils/encoding.mjs';
import { scrapWithPuppeteer } from './utils/puppeteerFallback.mjs';

class NetkeibaScraper {
  constructor() {
    this.baseUrl = 'https://race.netkeiba.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  /**
   * メインの出馬表データ取得メソッド
   */
  async scrapeRaceCard(raceId) {
    const url = `${this.baseUrl}/race/shutuba.html?race_id=${raceId}`;
    
    try {
      // まずCheerioでの取得を試行
      const result = await this.scrapeWithCheerio(url);
      if (result && result.horses.length > 0) {
        return result;
      }
      
      // Cheerioで失敗した場合はPuppeteerを使用
      console.log('Cheerio approach failed, falling back to Puppeteer...');
      return await this.scrapeWithPuppeteer(url);
      
    } catch (error) {
      console.error('Error scraping race card:', error);
      throw new Error(`Failed to scrape race data: ${error.message}`);
    }
  }

  /**
   * Cheerioを使用したスクレイピング
   */
  async scrapeWithCheerio(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        responseType: 'arraybuffer',
        timeout: 10000,
        maxRedirects: 5,
      });

      // EUC-JP → UTF-8 変換
      const decodedData = handleEncoding(response.data);
      const $ = cheerio.load(decodedData);

      // メインテーブルの確認
      const mainTable = $('.ShutubaTable, .RaceTable01, .Shutuba_Table').first();
      if (!mainTable.length) {
        throw new Error('Race table not found');
      }

      return this.parseHorseData($);

    } catch (error) {
      console.error('Cheerio scraping failed:', error);
      return null;
    }
  }

  /**
   * 馬データの解析
   */
  parseHorseData($) {
    const horses = [];
    const raceInfo = this.extractRaceInfo($);

    // 各馬のデータを抽出
    $('.HorseList, tr[id^="tr_"]').each((index, element) => {
      const $row = $(element);
      
      // 馬名の抽出
      const $horseName = $row.find('.HorseName a, .HorseInfo .HorseName a');
      if (!$horseName.length) return;

      const horse = {
        frameNumber: this.extractText($row.find('.Waku1, .Waku2, .Waku3, .Waku4, .Waku5, .Waku6, .Waku7, .Waku8')),
        horseNumber: this.extractText($row.find('[class*="Umaban"]')),
        name: $horseName.text().trim(),
        url: $horseName.attr('href'),
        horseId: this.extractHorseId($horseName.attr('href')),
        age: this.extractText($row.find('.Barei')),
        weight: this.extractText($row.find('td').eq(5)), // 通常6番目のtdが斤量
        odds: this.extractOdds($row),
        popularity: this.extractPopularity($row),
        jockey: this.extractJockey($row),
        trainer: this.extractTrainer($row),
      };

      if (horse.name) {
        horses.push(horse);
      }
    });

    return {
      raceInfo,
      horses,
      totalHorses: horses.length,
      scrapedAt: new Date().toISOString(),
    };
  }

  /**
   * レース情報の抽出
   */
  extractRaceInfo($) {
    return {
      title: $('.RaceName, .race_name, h1').first().text().trim(),
      date: $('.RaceData01, .race_date').first().text().trim(),
      course: $('.RaceData02, .course_info').first().text().trim(),
      class: $('.RaceData03, .race_class').first().text().trim(),
    };
  }

  /**
   * オッズの抽出（動的コンテンツのため初期値は取得困難）
   */
  extractOdds($row) {
    const oddsElement = $row.find('[id^="odds-"], .Popular span, .odds').first();
    const oddsText = oddsElement.text().trim();
    return oddsText && oddsText !== '---.-' && oddsText !== '**' ? oddsText : 'N/A';
  }

  /**
   * 人気の抽出
   */
  extractPopularity($row) {
    const popularityElement = $row.find('[id^="ninki-"], .Popular_Ninki span').first();
    const popularityText = popularityElement.text().trim();
    return popularityText && popularityText !== '**' ? popularityText : 'N/A';
  }

  /**
   * 騎手情報の抽出
   */
  extractJockey($row) {
    const jockeyElement = $row.find('.Jockey a, [class*="jockey"] a').first();
    return jockeyElement.text().trim() || 'N/A';
  }

  /**
   * 調教師情報の抽出
   */
  extractTrainer($row) {
    const trainerElement = $row.find('.Trainer a, [class*="trainer"] a').first();
    return trainerElement.text().trim() || 'N/A';
  }

  /**
   * テキスト抽出のヘルパー
   */
  extractText($element) {
    return $element.text().trim() || 'N/A';
  }

  /**
   * 馬IDの抽出
   */
  extractHorseId(url) {
    if (!url) return null;
    const match = url.match(/horse\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Puppeteerフォールバック
   */
  async scrapeWithPuppeteer(url) {
    return await scrapWithPuppeteer(url);
  }
}

export default NetkeibaScraper;