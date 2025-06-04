import iconv from 'iconv-lite';

/**
 * EUC-JP から UTF-8 への変換処理
 */
export function handleEncoding(buffer) {
  try {
    // まずEUC-JPとして解釈を試行
    let decoded = iconv.decode(buffer, 'EUC-JP');
    
    // 文字化けチェック（簡易）
    if (decoded.includes('�') || decoded.includes('?')) {
      // UTF-8として再試行
      decoded = iconv.decode(buffer, 'UTF-8');
    }
    
    return decoded;
  } catch (error) {
    console.error('Encoding conversion failed:', error);
    // フォールバック: バイナリをそのまま文字列に変換
    return buffer.toString('utf8');
  }
}

/**
 * 文字エンコーディングの自動検出
 */
export function detectEncoding(buffer) {
  const sample = buffer.slice(0, 1024).toString();
  
  if (sample.includes('charset=EUC-JP') || sample.includes('charset=euc-jp')) {
    return 'EUC-JP';
  } else if (sample.includes('charset=UTF-8') || sample.includes('charset=utf-8')) {
    return 'UTF-8';
  } else if (sample.includes('charset=Shift_JIS') || sample.includes('charset=shift_jis')) {
    return 'Shift_JIS';
  }
  
  return 'EUC-JP'; // netkeiba default
}