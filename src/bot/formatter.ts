const TELEGRAM_MAX_LENGTH = 4096;
// Leave room for pagination indicator
const SAFE_MAX = TELEGRAM_MAX_LENGTH - 20;

/**
 * Convert Markdown from Claude output to Telegram HTML.
 */
export function formatForTelegram(text: string): string {
  // Escape HTML special chars first (except inside code blocks)
  const lines = text.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBuffer: string[] = [];

  for (const line of lines) {
    // Code block start/end
    const codeBlockMatch = line.match(/^```(\w*)$/);
    if (codeBlockMatch) {
      if (inCodeBlock) {
        // Close code block
        result.push(`<pre><code${codeBlockLang ? ` class="language-${codeBlockLang}"` : ''}>${codeBuffer.join('\n')}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        // Open code block
        inCodeBlock = true;
        codeBlockLang = codeBlockMatch[1] || '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(escapeHtml(line));
      continue;
    }

    // Normal line: inline formatting
    let formatted = escapeHtml(line);

    // Inline code: `code` -> <code>code</code>
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold: **text** -> <b>text</b>
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

    // Italic: *text* -> <i>text</i> (single asterisk only, not bold)
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<i>$1</i>');

    result.push(formatted);
  }

  // Close unclosed code block
  if (inCodeBlock && codeBuffer.length > 0) {
    result.push(`<pre><code>${codeBuffer.join('\n')}</code></pre>`);
  }

  return result.join('\n');
}

/**
 * Split message at Telegram's 4096 char limit.
 * Smart splitting: code block > paragraph > line > hard cut.
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

    // Close open <pre> tag
    const openPre = (chunk.match(/<pre>/g) || []).length;
    const closePre = (chunk.match(/<\/pre>/g) || []).length;
    if (openPre > closePre) {
      chunk += '</code></pre>';
    }

    parts.push(chunk);
    remaining = remaining.slice(splitIdx).trimStart();

    // Reopen <pre> if it was closed mid-block
    if (openPre > closePre && remaining.length > 0) {
      remaining = '<pre><code>' + remaining;
    }
  }

  return parts;
}

function findSplitPoint(text: string, maxLen: number): number {
  const searchRegion = text.slice(0, maxLen);

  // 1. After </pre>
  const preEnd = searchRegion.lastIndexOf('</pre>');
  if (preEnd > maxLen * 0.3) {
    return preEnd + 6;
  }

  // 2. Double newline (paragraph end)
  const parEnd = searchRegion.lastIndexOf('\n\n');
  if (parEnd > maxLen * 0.3) {
    return parEnd + 2;
  }

  // 3. Single newline
  const lineEnd = searchRegion.lastIndexOf('\n');
  if (lineEnd > maxLen * 0.3) {
    return lineEnd + 1;
  }

  // 4. Space
  const spaceEnd = searchRegion.lastIndexOf(' ');
  if (spaceEnd > maxLen * 0.3) {
    return spaceEnd + 1;
  }

  // 5. Hard cut
  return maxLen;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
