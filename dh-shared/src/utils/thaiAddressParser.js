/**
 * Parser for raw Thai address and customer information pastes.
 * Accurately extracts customer name, phone, email, postal code, 
 * subdistrict, district, province, courier preference, and shipping notes.
 * 
 * Reconstructed with 100% parity from Production DH Notebook.
 * 
 * @param {string} rawInput - Raw text pasted by cashier or customer
 * @returns {Object} Structured customer and address payload
 */
export const parseCustomerAddress = (rawInput) => {
    if (!rawInput || typeof rawInput !== 'string') {
        return {
            accountName: '',
            contactName: '',
            phone: '',
            formattedPhone: '',
            email: '',
            lineId: '',
            facebook: '',
            addressLine: '',
            subDistrict: '',
            district: '',
            province: '',
            postalCode: '',
            preferredCourier: '',
            shippingNotes: '',
            rawText: ''
        };
    }

    const text = rawInput.trim();
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    let phone = '';
    let email = '';
    let postalCode = '';
    let lineId = '';
    let facebook = '';
    let preferredCourier = '';
    let shippingNotes = '';
    let subDistrict = '';
    let district = '';
    let province = '';
    let workingText = text;

    // 1. Phone extraction (+66 or 0 prefix, 9-10 digits)
    const phoneMatches = text.match(/(?:\+?66|0)[- ]?\d{1,2}[- ]?\d{3,4}[- ]?\d{3,4}/g);
    if (phoneMatches && phoneMatches.length > 0) {
        const rawPhone = phoneMatches[0];
        let cleaned = rawPhone.replace(/\D/g, '');
        if (cleaned.startsWith('66')) {
            cleaned = '0' + cleaned.substring(2);
        }
        if (cleaned.length >= 9 && cleaned.length <= 10) {
            phone = cleaned;
            workingText = workingText.replace(rawPhone, ' ');
            workingText = workingText.replace(/(?:เบอร์โทรศัพท์|เบอร์โทร|เบอร์|โทร|tel|phone|mobile)\s*:?/gi, ' ');
        }
    }

    // Formatted phone (08X-XXX-XXXX or 02-XXX-XXXX)
    let formattedPhone = phone;
    if (phone.length === 10) {
        formattedPhone = `${phone.substring(0, 3)}-${phone.substring(3, 6)}-${phone.substring(6)}`;
    } else if (phone.length === 9) {
        formattedPhone = `${phone.substring(0, 2)}-${phone.substring(2, 5)}-${phone.substring(5)}`;
    }

    // 2. Email extraction
    const emailMatches = workingText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches && emailMatches.length > 0) {
        email = emailMatches[0];
        workingText = workingText.replace(email, ' ');
    }

    // 3. Postal code extraction (5 digits starting with 1-9)
    const postalMatches = workingText.match(/\b[1-9]\d{4}\b/g);
    if (postalMatches && postalMatches.length > 0) {
        postalCode = postalMatches[postalMatches.length - 1];
        workingText = workingText.replace(postalCode, ' ');
    }

    // 4. Line by line parsing for social media and shipping notes
    lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.includes('line:') || lower.includes('line id:') || lower.startsWith('line ') || line.includes('@')) {
            const m = line.match(/(?:line\s*id\s*:?|line\s*:?|@)\s*([^\s,]+)/i);
            if (m && m[1]) lineId = m[1];
        }
        if (lower.includes('facebook') || lower.includes('fb:') || lower.includes('fb page') || lower.includes('facebook.com')) {
            const m = line.match(/(?:facebook\s*:?|fb\s*:?)\s*([^\s,]+)/i);
            if (m && m[1]) facebook = m[1];
        }
        if (lower.includes('หมายเหตุ') || lower.includes('โน้ต') || lower.startsWith('ฝาก') || lower.includes('ห้าม')) {
            shippingNotes = line.replace(/^(หมายเหตุ|โน้ต)\s*:?\s*/i, '').trim();
            workingText = workingText.replace(line, ' ');
        }
    });

    // 5. Preferred courier identification
    const couriers = ['Flash', 'Kerry', 'J&T', 'ไปรษณีย์ไทย', 'ปณ', 'Nim Express', 'Shopee Express', 'KEX'];
    for (const c of couriers) {
        if (new RegExp(c, 'i').test(text)) {
            preferredCourier = c === 'ปณ' ? 'ไปรษณีย์ไทย' : c;
            break;
        }
    }

    // 6. Province, District, SubDistrict extraction
    const provMatch = workingText.match(/(?:จ\.|จังหวัด)\s*([^\s,1-9]+)/);
    if (provMatch && provMatch[1]) {
        province = provMatch[1].trim();
        workingText = workingText.replace(provMatch[0], ' ');
    }

    const distMatch = workingText.match(/(?:อ\.|อำเภอ|เขต)\s*([^\s,1-9]+)/);
    if (distMatch && distMatch[1]) {
        district = distMatch[1].trim();
        workingText = workingText.replace(distMatch[0], ' ');
    }

    const subDistMatch = workingText.match(/(?:ต\.|ตำบล|แขวง)\s*([^\s,1-9]+)/);
    if (subDistMatch && subDistMatch[1]) {
        subDistrict = subDistMatch[1].trim();
        workingText = workingText.replace(subDistMatch[0], ' ');
    }

    // Clean address labels (both inline and newline)
    workingText = workingText.replace(/(?:\s+|^|\n)\s*(?:ที่อยู่|ที่อยู่จัดส่ง|ที่อยู่ส่งสินค้า)\s*:?/gi, '\n');

    // 7. Separation of customer name and address line
    const addressPrefixRegex = /(?:\s+|^)(บ้านเลขที่|เลขที่|\d+\/\d+|ม\.|หมู่|ถ\.|ถนน|ซ\.|ซอย|ต\.|ตำบล|แขวง)/i;
    let accountName = '';
    let addressLine = '';
    const cleanedLines = workingText.split(/\r?\n/)
        .map(l => l.replace(/[,;:]+/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    const firstLine = cleanedLines[0] || '';
    const startsWithAddressIndicator = addressPrefixRegex.test(firstLine);

    if (cleanedLines.length > 1 && !startsWithAddressIndicator && firstLine.length > 0) {
        accountName = firstLine;
        addressLine = cleanedLines.slice(1).join(' ').trim();
    } else {
        const joined = cleanedLines.join('\n');
        const match = joined.match(addressPrefixRegex);
        if (match) {
            if (match.index === 0) {
                accountName = '';
                addressLine = joined.trim();
            } else {
                accountName = joined.substring(0, match.index).trim();
                addressLine = joined.substring(match.index).trim();
            }
        } else if (cleanedLines.length > 1) {
            accountName = cleanedLines[0].trim();
            addressLine = cleanedLines.slice(1).join(' ').trim();
        } else {
            accountName = joined.trim();
            addressLine = '';
        }
    }

    // Clean customer name prefixes
    accountName = accountName.replace(/^(ชื่อ|ผู้รับ|ส่ง|ถึง)\s*:?\s*/i, '').trim();

    // Fallback naming heuristics
    if ((!accountName || accountName === 'ลูกค้าทั่วไป') && addressLine) {
        const parts = addressLine.split(/\s+/).slice(0, 2).join(' ');
        if (parts && !/\d/.test(parts) && !/^(บ้านเลขที่|เลขที่|ที่อยู่|ที่อยู่จัดส่ง)/i.test(parts.trim())) {
            accountName = parts;
        }
    }

    if (!accountName) {
        accountName = 'ลูกค้าใหม่';
    }

    return {
        accountName,
        contactName: accountName,
        phone,
        formattedPhone,
        email,
        lineId,
        facebook,
        addressLine,
        subDistrict,
        district,
        province,
        postalCode,
        preferredCourier,
        shippingNotes,
        rawText: text
    };
};

// Aliases for multi-module compatibility
export const parseThaiAddress = parseCustomerAddress;
export default parseCustomerAddress;
