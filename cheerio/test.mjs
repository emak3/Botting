import NetkeibaScraper from './netkeibaScraper.mjs';

async function testScraper() {
  const scraper = new NetkeibaScraper();
  const raceId = '202505030211'; // サンプルレースID
  
  console.log('🐎 Netkeiba Scraper Test Starting...');
  console.log(`Race ID: ${raceId}`);
  console.log('=' .repeat(50));

  try {
    const result = await scraper.scrapeRaceCard(raceId);
    
    const content = `
## 📊 Scraping Results

**Race Information:**
- Title: ${result.raceInfo?.title || 'N/A'}
- Date: ${result.raceInfo?.date || 'N/A'}
- Course: ${result.raceInfo?.course || 'N/A'}
- Total Horses: ${result.totalHorses}

**Horse Entries:**
${result.horses.map((horse, index) => `
${index + 1}. **${horse.name}** 
   - Frame: ${horse.frameNumber} | Number: ${horse.horseNumber}
   - Age: ${horse.age} | Weight: ${horse.weight}
   - Odds: ${horse.odds} | Popularity: ${horse.popularity}
   - Jockey: ${horse.jockey} | Trainer: ${horse.trainer}
   - URL: ${horse.url || 'N/A'}
`).join('')}

**Scraping Details:**
- Method Used: ${result.method || 'cheerio'}
- Scraped At: ${result.scrapedAt}
- Success: ✅
    `;

    console.log(content);
    return { success: true, content, data: result };

  } catch (error) {
    const errorContent = `
## ❌ Scraping Failed

**Error Details:**
- Message: ${error.message}
- Type: ${error.name}
- Time: ${new Date().toISOString()}

**Possible Issues:**
- Anti-scraping protection activated
- Network connectivity problems  
- HTML structure changes
- Rate limiting applied

**Recommended Actions:**
1. Check network connection
2. Try again after a few minutes
3. Use Puppeteer fallback mode
4. Verify race ID is valid
    `;
    
    console.error(error);
    console.log(errorContent);
    return { success: false, content: errorContent, error };
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  testScraper().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

export { testScraper };