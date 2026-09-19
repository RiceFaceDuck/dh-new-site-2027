/**
 * 🧾 Thai Bank Slip Smart OCR Parser (Strict & Clean - CommonJS for Cloud Functions)
 */

const BANK_PATTERNS = [
  { code: 'BAY', name: 'กรุงศรีอยุธยา', regex: /กรุงศรี|krungsri|bay\b|bank of ayudhya/i },
  { code: 'KBANK', name: 'กสิกรไทย', regex: /กสิกร|kasikorn|kbank\b/i },
  { code: 'SCB', name: 'ไทยพาณิชย์', regex: /ไทยพาณิชย์|siam commercial|scb\b/i },
  { code: 'BBL', name: 'กรุงเทพ', regex: /กรุงเทพ|bangkok bank|bbl\b/i },
  { code: 'KTB', name: 'กรุงไทย', regex: /กรุงไทย|krungthai|ktb\b/i },
  { code: 'TTB', name: 'ทหารไทยธนชาต', regex: /ทหารไทย|ttb\b|tmb\b|thanachart/i },
  { code: 'GSB', name: 'ออมสิน', regex: /ออมสิน|gsb\b|government savings/i },
  { code: 'PROMPTPAY', name: 'พร้อมเพย์', regex: /พร้อมเพย์|promptpay\b/i }
];

const THAI_MONTHS_REGEX = '(?:ม\\.?ค\\.?|ก\\.?พ\\.?|มี\\.?ค\\.?|เม\\.?ย\\.?|พ\\.?ค\\.?|มิ\\.?ย\\.?|ก\\.?ค\\.?|ส\\.?ค\\.?|ก\\.?ย\\.?|ต\\.?ค\\.?|พ\\.?ย\\.?|ธ\\.?ค\\.?)';

function cleanSenderName(sender = '') {

  if (!sender) return '';

  const clean = sender.replace(/[0-9๒๓๔๕๖๗๘๙A-Za-z|\[\]"'{}\(\)\-=+*\/_\\]/g, ' ').replace(/\s+/g, ' ').trim();

  const thaiCharCount = (clean.match(/[\u0E00-\u0E7F]/g) || []).length;

  return (thaiCharCount >= 3 && clean.length <= 40) ? clean : '';

}

function extractDestinationName(fullText = '', detectedBank = 'BAY') {

  if (!fullText) return 'n/a';

  const orgMatch = fullText.match(/(?:บริษัท\s+[^\n\r0-9]{2,30}|บจก\.\s*[^\n\r0-9]{2,30}|กรุงศรี\s*ออโต้[^\n\r]*)/i);

  if (orgMatch && orgMatch[0]) {

    const cleanOrg = orgMatch[0].replace(/[0-9|\[\]"'{}\(\)\-=+*\/_\\]/g, '').trim();

    if (cleanOrg.length >= 4) return `รับเข้าบัญชี: ${cleanOrg}`;

  }

  const destMatch = fullText.match(/(?:ไปยัง|เข้าบัญชี|ผู้รับเงิน|ผู้รับโอน)\s*[:：]?\s*([^\n\r]{3,35})/i);

  if (destMatch && destMatch[1]) {

    const clean = destMatch[1].replace(/^[^\u0E00-\u0E7Fa-zA-Z]+/, '').replace(/[|\[\]"'{}\(\)\-=+*\/_\\]/g, '').trim();

    if (clean.length >= 3 && !/^\d+$/.test(clean)) return `รับเข้าบัญชี: ${clean}`;

  }

  const bankNames = {

    'BAY': 'ธนาคารกรุงศรีอยุธยา',

    'KBANK': 'ธนาคารกสิกรไทย',

    'SCB': 'ธนาคารไทยพาณิชย์',

    'BBL': 'ธนาคารกรุงเทพ',

    'KTB': 'ธนาคารกรุงไทย',

    'TTB': 'ธนาคารทหารไทยธนชาต',

    'GSB': 'ธนาคารออมสิน',

    'PROMPTPAY': 'พร้อมเพย์'

  };

  return bankNames[detectedBank] ? `รับเข้าบัญชี: ${bankNames[detectedBank]}` : 'n/a';

}

function extractTransactionRef(text = '') {

  if (!text) return 'n/a';

  const txMatch = text.match(/(?:เลขที่รายการ|รหัสอ้างอิง|หมายเลขอ้างอิง|เลขที่อ้างอิง|transaction\s*(?:no|id)?\.?)\s*[:：]?\s*[\r\n\s]*([0-9a-zA-Z]{12,35})/i);

  if (txMatch && txMatch[1]) {

    return txMatch[1].trim();

  }

  const detailMatch = text.match(/(?:รายละเอียด|ref(?:\s*no)?\.?)\s*[:：]?\s*[\r\n\s]*([0-9a-zA-Z]{10,35})/i);

  if (detailMatch && detailMatch[1]) {

    return detailMatch[1].trim();

  }

  const rawRef = text.match(/\b(01\d{14,22})\b/) || text.match(/\b([A-Z0-9]{2}20\d{14,20})\b/i);

  if (rawRef) {

    return rawRef[1];

  }

  return 'n/a';

}

function extractTransferDateTime(text = '', txRef = '') {

  if (!text && !txRef) return 'n/a';

  const strictDateRegex = new RegExp(`\\b(\\d{1,2})\\s*(${THAI_MONTHS_REGEX})\\s*(\\d{2,4})\\s*(\\d{1,2})[:.](\\d{2})(?:\\s*น\\.?)?`, 'i');

  const lines = text.split('\n');

  for (const line of lines) {

    const match = line.match(strictDateRegex);

    if (match) {

      const day = match[1];

      const month = match[2].replace(/\s+/g, '');

      const year = match[3];

      const hour = match[4].padStart(2, '0');

      const min = match[5].padStart(2, '0');

      return `${day} ${month} ${year} ${hour}:${min} น.`;

    }

  }

  for (const line of lines) {

    const datePart = line.match(new RegExp(`(\\d{1,2})\\s*(${THAI_MONTHS_REGEX})\\s*(\\d{2,4})`, 'i'));

    const timePart = line.match(/\b([012]?\d)[:.]([0-5]\d)(?:\s*น\.)?/);

    if (datePart && timePart) {

      const day = datePart[1];

      const month = datePart[2].replace(/\s+/g, '');

      const year = datePart[3];

      const hour = timePart[1].padStart(2, '0');

      const min = timePart[2].padStart(2, '0');

      return `${day} ${month} ${year} ${hour}:${min} น.`;

    }

  }

  const fullRefMatch = (text + ' ' + (txRef || '')).match(/\b(?:260|202)(\d{2})(\d{2})(\d{2})(\d{2})\b/);

  if (fullRefMatch) {

    const [_, m, d, hh, mm] = fullRefMatch;

    const mNum = parseInt(m, 10);

    if (mNum >= 1 && mNum <= 12) {

      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

      const thaiYear = new Date().getFullYear() + 543;

      return `${parseInt(d, 10)} ${thaiMonths[mNum - 1]} ${thaiYear.toString().slice(-2)} ${hh}:${mm} น.`;

    }

  }

  return 'n/a';

}

function extractSenderName(fullText = '') {

  if (!fullText) return 'n/a';

  const senderSectionMatch = fullText.match(/\[SENDER_SECTION\]([\s\S]*)/i);

  const targetText = senderSectionMatch ? senderSectionMatch[1] : fullText;

  const titleMatch = targetText.match(/(?:^|\n|\s*)(นาย|นาง|น\.ส\.|คุณ)\s*([^\n\r0-9]{2,25})/i);

  if (titleMatch) {

    const clean = cleanSenderName(`${titleMatch[1]} ${titleMatch[2]}`);

    if (clean && clean.length >= 4) return clean;

  }

  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {

    if (/ธ\.กสิกรไทย|กสิกรไทย|scb|กรุงศรี/i.test(lines[i]) && i > 0) {

      const prevLine = lines[i - 1];

      if (prevLine && !/เติมเงิน|จ่ายบิล|โอนเงิน|สำเร็จ|ธนาคาร|\d{2}:\d{2}/i.test(prevLine)) {

        const clean = cleanSenderName(prevLine);

        if (clean && clean.length >= 4) return clean;

      }

    }

  }

  return 'n/a';

}

function parseSlipText(fullText = '') {

  if (!fullText) return null;

  let detectedBank = 'BAY';

  const toSection = fullText.match(/(?:ไปยัง|เข้าบัญชี|to|ผู้รับโอน)[\s\S]*?(กรุงศรี|กสิกร|ไทยพาณิชย์|กรุงเทพ|กรุงไทย|ทหารไทย|ออมสิน|ทรู|krungsri|kbank|scb|bbl|ktb|ttb|gsb|truemoney)/i);

  if (toSection && toSection[1]) {

    for (const b of BANK_PATTERNS) {

      if (b.regex.test(toSection[1])) {

        detectedBank = b.code;

        break;

      }

    }

  } else {

    for (const b of BANK_PATTERNS) {

      if (b.regex.test(fullText)) {

        detectedBank = b.code;

        break;

      }

    }

  }

  const receivingAccount = extractDestinationName(fullText, detectedBank);

  const transactionRef = extractTransactionRef(fullText);

  const transferDateTime = extractTransferDateTime(fullText, transactionRef);

  const senderName = extractSenderName(fullText);

  const note = (senderName && senderName !== 'n/a')

    ? `โอนโดย: ${senderName}` 

    : 'n/a';

  let amount = 0;

  const amountMatch = fullText.match(/(?:จำนวนเงิน|ยอดเงิน|โอนสำเร็จ|จำนวน)\s*[:：]?\s*(?:THB|฿)?\s*([\d,]+\.\d{2})/i) ||

                      fullText.match(/\b([\d,]+\.\d{2})\s*(?:บาท|THB|฿)/i);

  if (amountMatch && amountMatch[1]) {

    amount = parseFloat(amountMatch[1].replace(/,/g, '')) || 0;

  }

  return {

    bankAccount: detectedBank,

    receivingAccount: receivingAccount || 'n/a',

    transactionRef: transactionRef || 'n/a',

    transferDateTime: transferDateTime || 'n/a',

    transferNote: note,

    senderName: senderName || 'n/a',

    amount,

    rawTextPreview: fullText.substring(0, 300)

  };

}

module.exports = {

  parseSlipText,

  extractTransactionRef,

  extractTransferDateTime,

  extractDestinationName,

  extractSenderName,

  cleanSenderName,

  BANK_PATTERNS

};
