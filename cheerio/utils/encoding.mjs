import iconv from 'iconv-lite';

/**
 * HTTPレスポンスからエンコーディングを検出
 */
export function detectEncodingFromResponse(response) {
  // Content-Typeヘッダーからエンコーディングを取得
  const contentType = response.headers['content-type'] || '';
  const charsetMatch = contentType.match(/charset=([^;]+)/i);
  
  if (charsetMatch) {
    const charset = charsetMatch[1].trim().toUpperCase();
    console.log(`Detected charset from header: ${charset}`);
    return charset;
  }
  
  return null;
}

/**
 * HTMLコンテンツからエンコーディングを検出
 */
export function detectEncodingFromHtml(buffer) {
  // バッファの最初の部分を読んでメタタグを探す
  const sample = buffer.slice(0, 2048).toString('ascii');
  
  // meta charset を探す
  const metaCharsetMatch = sample.match(/<meta[^>]+charset=["']?([^"'\s>]+)/i);
  if (metaCharsetMatch) {
    const charset = metaCharsetMatch[1].trim().toUpperCase();
    console.log(`Detected charset from meta tag: ${charset}`);
    return charset;
  }
  
  // meta http-equiv を探す
  const httpEquivMatch = sample.match(/<meta[^>]+content=["'][^"']*charset=([^"'\s;]+)/i);
  if (httpEquivMatch) {
    const charset = httpEquivMatch[1].trim().toUpperCase();
    console.log(`Detected charset from http-equiv: ${charset}`);
    return charset;
  }
  
  return null;
}

/**
 * エンコーディングを自動検出して変換
 */
export function handleEncoding(buffer, response = null) {
  try {
    let encoding = 'EUC-JP'; // netkeiba のデフォルト
    
    // 1. レスポンスヘッダーから検出を試みる
    if (response) {
      const headerEncoding = detectEncodingFromResponse(response);
      if (headerEncoding) {
        encoding = headerEncoding;
      }
    }
    
    // 2. HTMLコンテンツから検出を試みる
    const htmlEncoding = detectEncodingFromHtml(buffer);
    if (htmlEncoding) {
      encoding = htmlEncoding;
    }
    
    // エンコーディング名の正規化
    encoding = normalizeEncoding(encoding);
    
    console.log(`Using encoding: ${encoding}`);
    
    // デコード実行
    const decoded = iconv.decode(buffer, encoding);
    
    // 文字化けチェック
    if (containsMojibake(decoded)) {
      console.warn('Mojibake detected, trying alternative encodings...');
      
      // 代替エンコーディングを試す
      const alternatives = ['EUC-JP', 'SHIFT_JIS', 'ISO-2022-JP', 'UTF-8'];
      for (const alt of alternatives) {
        if (alt !== encoding) {
          try {
            const altDecoded = iconv.decode(buffer, alt);
            if (!containsMojibake(altDecoded)) {
              console.log(`Successfully decoded with ${alt}`);
              return altDecoded;
            }
          } catch (e) {
            // 次の代替エンコーディングを試す
          }
        }
      }
    }
    
    return decoded;
    
  } catch (error) {
    console.error('Encoding conversion failed:', error);
    // 最後の手段として各種エンコーディングを試す
    const fallbackEncodings = ['EUC-JP', 'SHIFT_JIS', 'UTF-8'];
    
    for (const enc of fallbackEncodings) {
      try {
        const decoded = iconv.decode(buffer, enc);
        if (!containsMojibake(decoded)) {
          console.log(`Fallback successful with ${enc}`);
          return decoded;
        }
      } catch (e) {
        continue;
      }
    }
    
    // すべて失敗した場合はUTF-8として処理
    return buffer.toString('utf8');
  }
}

/**
 * エンコーディング名の正規化
 */
function normalizeEncoding(encoding) {
  const normalized = encoding.toUpperCase().replace(/[-_]/g, '');
  
  const encodingMap = {
    'EUCJP': 'EUC-JP',
    'SHIFTJIS': 'SHIFT_JIS',
    'SJIS': 'SHIFT_JIS',
    'ISO2022JP': 'ISO-2022-JP',
    'UTF8': 'UTF-8',
  };
  
  return encodingMap[normalized] || encoding;
}

/**
 * 文字化けの簡易チェック
 */
function containsMojibake(text) {
  // 一般的な文字化けパターンを検出
  const mojibakePatterns = [
    /[\uFFFD]/,        // 置換文字
    /[�]/,             // 置換文字（別表現）
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/, // 制御文字（改行・タブ以外）
  ];
  
  // 日本語が含まれているかチェック
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
  
  // 文字化けパターンが存在し、かつ日本語が少ない場合は文字化けと判定
  const hasMojibake = mojibakePatterns.some(pattern => pattern.test(text));
  const japaneseRatio = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length / text.length;
  
  return hasMojibake || (text.length > 100 && japaneseRatio < 0.05);
}