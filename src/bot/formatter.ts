const TELEGRAM_MAX_LENGTH = 4096;
// Sayfa gostergesi icin yeterli bosluk birak
const SAFE_MAX = TELEGRAM_MAX_LENGTH - 20;

/**
 * Claude ciktisindaki Markdown'i Telegram HTML'e cevir.
 */
export function formatForTelegram(text: string): string {
  // Oncelikle HTML ozel karakterlerini escape et (kod bloklari haric)
  const lines = text.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBuffer: string[] = [];

  for (const line of lines) {
    // Kod blogu baslangici/bitisi
    const codeBlockMatch = line.match(/^```(\w*)$/);
    if (codeBlockMatch) {
      if (inCodeBlock) {
        // Kod blogu kapaniyor
        result.push(`<pre><code${codeBlockLang ? ` class="language-${codeBlockLang}"` : ''}>${codeBuffer.join('\n')}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        // Kod blogu aciliyor
        inCodeBlock = true;
        codeBlockLang = codeBlockMatch[1] || '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(escapeHtml(line));
      continue;
    }

    // Normal satir: inline formatlama
    let formatted = escapeHtml(line);

    // Inline code: `code` -> <code>code</code>
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold: **text** -> <b>text</b>
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

    // Italic: *text* -> <i>text</i> (sadece tek yildiz, bold degilse)
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<i>$1</i>');

    result.push(formatted);
  }

  // Kapanmamis kod blogu varsa kapat
  if (inCodeBlock && codeBuffer.length > 0) {
    result.push(`<pre><code>${codeBuffer.join('\n')}</code></pre>`);
  }

  return result.join('\n');
}

/**
 * Mesaji Telegram 4096 karakter limitine gore bol.
 * Akilli bolme: kod blogu > paragraf > satir > sert kesim.
 */
export function splitMessage(text: string): string[] {
  if (text.length <= SAFE_MAX) {
    return [text];
  }

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= SAFE_MAX) {
      parts.push(remaining);
      break;
    }

    let splitIdx = findSplitPoint(remaining, SAFE_MAX);
    let chunk = remaining.slice(0, splitIdx);

    // Acik <pre> tag'ini kapat
    const openPre = (chunk.match(/<pre>/g) || []).length;
    const closePre = (chunk.match(/<\/pre>/g) || []).length;
    if (openPre > closePre) {
      chunk += '</code></pre>';
    }

    parts.push(chunk);
    remaining = remaining.slice(splitIdx).trimStart();

    // Kapanan pre varsa yeniden ac
    if (openPre > closePre && remaining.length > 0) {
      remaining = '<pre><code>' + remaining;
    }
  }

  return parts;
}

function findSplitPoint(text: string, maxLen: number): number {
  const searchRegion = text.slice(0, maxLen);

  // 1. </pre> sonrasi
  const preEnd = searchRegion.lastIndexOf('</pre>');
  if (preEnd > maxLen * 0.3) {
    return preEnd + 6;
  }

  // 2. Cift yeni satir (paragraf sonu)
  const parEnd = searchRegion.lastIndexOf('\n\n');
  if (parEnd > maxLen * 0.3) {
    return parEnd + 2;
  }

  // 3. Tek yeni satir
  const lineEnd = searchRegion.lastIndexOf('\n');
  if (lineEnd > maxLen * 0.3) {
    return lineEnd + 1;
  }

  // 4. Bosluk
  const spaceEnd = searchRegion.lastIndexOf(' ');
  if (spaceEnd > maxLen * 0.3) {
    return spaceEnd + 1;
  }

  // 5. Sert kesim
  return maxLen;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
