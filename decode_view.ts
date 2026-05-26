import fetch from 'node-fetch';
import * as fs from 'fs';

async function main() {
  const res = await fetch('https://script.google.com/macros/s/AKfycbw0LUBO5vwR4qRtTANrcyWwJ3vJue71ZUAD_PeIQecEFqHcq0O0nwCcydODr3zydRnC8w/exec');
  const text = await res.text();
  const startKeyword = 'goog.script.init(';
  const idx = text.indexOf(startKeyword);
  if (idx === -1) return;
  let startQuoteIdx = text.indexOf('"', idx + startKeyword.length);
  if (startQuoteIdx === -1) return;
  let inEscape = false;
  let rawContent = '';
  for (let i = startQuoteIdx + 1; i < text.length; i++) {
    const char = text[i];
    if (inEscape) {
      if (char === 'x') {
        const hex = text.substring(i + 1, i + 3);
        rawContent += String.fromCharCode(parseInt(hex, 16));
        i += 2;
      } else if (char === 'u') {
        const hex = text.substring(i + 1, i + 5);
        rawContent += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else if (char === 'n') {
        rawContent += '\n';
      } else if (char === 'r') {
        rawContent += '\r';
      } else if (char === 't') {
        rawContent += '\t';
      } else {
        rawContent += char;
      }
      inEscape = false;
    } else {
      if (char === '\\') {
        inEscape = true;
      } else if (char === '"') {
        break;
      } else {
        rawContent += char;
      }
    }
  }
  const parsed = JSON.parse(rawContent);
  fs.writeFileSync('userHtml_org.html', parsed.userHtml);
  console.log('Original userHtml written to userHtml_org.html');
}
main();
