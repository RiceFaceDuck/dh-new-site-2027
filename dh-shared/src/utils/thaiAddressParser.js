/**
 * Parser for raw Thai address and customer information pastes.
 * Accurately extracts customer store/account name, contact/recipient person,
 * phone, email, lineId, facebook, postal code/zipcode, subdistrict,
 * district, province, courier preference, and shipping notes.
 * 
 * Single Source of Truth (SSOT) across DH Notebook modules.
 * Dual-Key Output for 100% schema parity across Billing and Customers.
 * 
 * @param {string} rawInput - Raw text pasted by cashier or customer
 * @returns {Object} Structured customer and address payload
 */
export const parseCustomerAddress = (rawInput) => {
    if (!rawInput || typeof rawInput !== 'string') {
        return {
            accountName: '',
            contactName: '',
            storeName: '',
            phone: '',
            formattedPhone: '',
            email: '',
            lineId: '',
            facebook: '',
            facebookUrl: '',
            addressLine: '',
            subDistrict: '',
            district: '',
            province: '',
            postalCode: '',
            zipCode: '',
            preferredCourier: '',
            logisticProvider: '',
            shippingNotes: '',
            logisticNote: '',
            rawText: ''
        };
    }

    const text = rawInput.trim();
    let workingText = text;
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
    let storeName = '';
    let contactName = '';

    // 1. Phone extraction (+66 or 0 prefix, 9-10 digits)
    const phoneMatches = workingText.match(/(?:\+?66|0)[- ]?\d{1,2}[- ]?\d{3,4}[- ]?\d{3,4}/g);
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
        workingText = workingText.replace(/(?:อีเมล|email|e-mail)\s*:?/gi, ' ');
    }

    // 3. Preferred courier identification
    const couriers = [
        { name: 'Flash', regex: /(?:ขนส่ง\s*)?flash(?:\s*express)?/i },
        { name: 'Kerry', regex: /(?:ขนส่ง\s*)?kerry(?:\s*express)?/i },
        { name: 'KEX', regex: /(?:ขนส่ง\s*)?\bkex\b/i },
        { name: 'J&T', regex: /(?:ขนส่ง\s*)?j&t(?:\s*express)?/i },
        { name: 'ไปรษณีย์ไทย', regex: /(?:ขนส่ง\s*)?(?:ไปรษณีย์ไทย|\bปณ\b|ems)/i },
        { name: 'Nim Express', regex: /(?:ขนส่ง\s*)?nim\s*express/i },
        { name: 'Shopee Express', regex: /(?:ขนส่ง\s*)?(?:shopee\s*express|\bspx\b)/i },
        { name: 'Best Express', regex: /(?:ขนส่ง\s*)?best\s*express/i }
    ];
    for (const c of couriers) {
        const match = workingText.match(c.regex);
        if (match) {
            preferredCourier = c.name;
            workingText = workingText.replace(match[0], ' ');
            break;
        }
    }

    // 4. Line by line parsing for explicit labels, social media, shipping notes
    const rawLines = workingText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const retainedLines = [];

    for (const line of rawLines) {
        let currentLine = line;

        // Check explicit Store label
        const storeLabelMatch = currentLine.match(/^(?:ชื่อร้าน|ชื่อบริษัท|ร้านค้า)\s*:?\s*([^\n\r]+)/i);
        if (storeLabelMatch && storeLabelMatch[1]) {
            storeName = storeLabelMatch[1].trim();
            continue;
        }

        // Check explicit Contact / Recipient label
        const contactLabelMatch = currentLine.match(/^(?:ชื่อผู้รับ|ชื่อผู้ติดต่อ|ผู้รับ|ผู้ติดต่อ|ชื่อ-สกุล)\s*:?\s*([^\n\r]+)/i);
        if (contactLabelMatch && contactLabelMatch[1]) {
            contactName = contactLabelMatch[1].trim();
            continue;
        }

        // Social media
        const lower = currentLine.toLowerCase();
        if (lower.includes('line:') || lower.includes('line id:') || lower.startsWith('line ') || (lower.startsWith('@') && !lower.includes(' '))) {
            const m = currentLine.match(/(?:line\s*id\s*:?|line\s*:?|@)\s*([^\s,]+)/i);
            if (m && m[1]) {
                lineId = m[1].startsWith('@') ? m[1] : (currentLine.includes('@') ? `@${m[1]}` : m[1]);
                continue;
            }
        }
        if (lower.includes('facebook') || lower.includes('fb:') || lower.includes('fb page') || lower.includes('facebook.com')) {
            const m = currentLine.match(/(?:facebook\s*:?|fb\s*:?)\s*([^\s,]+)/i);
            if (m && m[1]) {
                facebook = m[1];
                continue;
            }
        }
        if (lower.includes('หมายเหตุ') || lower.includes('โน้ต') || lower.startsWith('ฝาก') || lower.includes('ห้าม')) {
            shippingNotes = currentLine.replace(/^(หมายเหตุ|โน้ต)\s*:?\s*/i, '').trim();
            continue;
        }

        retainedLines.push(currentLine);
    }

    workingText = retainedLines.join('\n');

    // 5. Postal code extraction (5 digits starting with 1-9)
    const postalMatches = workingText.match(/\b[1-9]\d{4}\b/g);
    if (postalMatches && postalMatches.length > 0) {
        postalCode = postalMatches[postalMatches.length - 1];
        workingText = workingText.replace(new RegExp(`\\b${postalCode}\\b`), ' ');
    }

    // 6. Province, District, SubDistrict extraction
    const provMatch = workingText.match(/(?:จ\.|จังหวัด)\s*([^\s,1-9\n\r]+)/);
    if (provMatch && provMatch[1]) {
        province = provMatch[1].trim();
        workingText = workingText.replace(provMatch[0], ' ');
    }

    const distMatch = workingText.match(/(?:อ\.|อำเภอ|เขต)\s*([^\s,1-9\n\r]+)/);
    if (distMatch && distMatch[1]) {
        district = distMatch[1].trim();
        workingText = workingText.replace(distMatch[0], ' ');
    }

    // Multiple subdistrict or adjacent handling
    const subDistRegex = /(?:ต\.|ตำบล|แขวง)\s*([^\s,1-9\n\r]+)/g;
    const subDistMatches = [...workingText.matchAll(subDistRegex)];
    if (subDistMatches.length > 0) {
        // Prefer the last subdistrict if multiple (in Thai addresses, the real one is usually right before district)
        const chosenSubDist = subDistMatches[subDistMatches.length - 1];
        subDistrict = chosenSubDist[1].trim();
        workingText = workingText.replace(chosenSubDist[0], ' ');
    }

    // Clean address labels
    workingText = workingText.replace(/(?:\s+|^|\n)\s*(?:ที่อยู่จัดส่ง|ที่อยู่ส่งสินค้า|ที่อยู่|จัดส่ง|ส่งที่|ส่งถึง)\s*:?/gi, '\n');

    // 7. Separation of Store Name, Contact Person, and Address Line
    const addressPrefixRegex = /(?:^|\s+)(บ้านเลขที่|เลขที่|\d+\/\d+|ม\.|หมู่|ถ\.|ถนน|ซ\.|ซอย|อาคาร|ตึก|ชั้น|โครงการ|ห้อง|\d+\s*(?:ม\.|หมู่))/i;
    const personHonorificRegex = /^(?:นาย|นาง|น\.ส\.|นางสาว|คุณ|ช่าง|อ\.|ดร\.|ทพ\.|พญ\.|นพ\.|พ\.ต\.|ด\.ต\.|ร\.ต\.|ร\.อ\.|ว่าที่ร้อยตรี|ม\.ล\.|ม\.ร\.ว\.)/i;
    const storePrefixRegex = /^(?:ร้าน|บจก\.|บริษัท|หจก\.|ห้างหุ้นส่วนจำกัด|คลินิก|อู่|ฟาร์ม|ศูนย์|สำนักงาน|เพจ|กลุ่ม|สตูดิโอ|บมจ\.)/i;
    const personHonorificInTextRegex = /(?:^|\s+)(?:นาย|นาง|น\.ส\.|นางสาว|คุณ|ช่าง|อ\.|ดร\.|ทพ\.|พญ\.|นพ\.|พ\.ต\.|ด\.ต\.|ร\.ต\.|ร\.อ\.|ว่าที่ร้อยตรี|ม\.ล\.|ม\.ร\.ว\.)(?:\s+|$)/i;
    const storePrefixInTextRegex = /(?:^|\s+)(?:ร้าน|บจก\.|บริษัท|หจก\.|ห้างหุ้นส่วนจำกัด|คลินิก|อู่|ฟาร์ม|ศูนย์|สำนักงาน|เพจ|กลุ่ม|สตูดิโอ|บมจ\.)(?:\s+|$)/i;

    const splitCompoundName = (text) => {
        if (!text) return null;
        const s = storePrefixInTextRegex.exec(text);
        const p = personHonorificInTextRegex.exec(text);
        if (s && p) {
            if (s.index < p.index) {
                return {
                    store: text.substring(s.index, p.index).trim(),
                    contact: text.substring(p.index).trim()
                };
            } else {
                return {
                    contact: text.substring(p.index, s.index).trim(),
                    store: text.substring(s.index).trim()
                };
            }
        }
        return null;
    };

    const linesAfterGeog = workingText.split(/\r?\n/)
        .map(l => l.replace(/[,;:]+/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    let addressLines = [];

    for (let i = 0; i < linesAfterGeog.length; i++) {
        let line = linesAfterGeog[i];

        // Check if line contains an address indicator
        const addrMatch = line.match(addressPrefixRegex);

        if (addrMatch) {
            const splitIdx = addrMatch.index;
            const beforeAddr = line.substring(0, splitIdx).trim();
            const fromAddr = line.substring(splitIdx).trim();

            if (beforeAddr) {
                const compound = splitCompoundName(beforeAddr);
                if (compound) {
                    if (!storeName) storeName = compound.store;
                    if (!contactName) contactName = compound.contact;
                    if (fromAddr) addressLines.push(fromAddr);
                } else if (storePrefixRegex.test(beforeAddr) && !storeName) {
                    storeName = beforeAddr;
                    if (fromAddr) addressLines.push(fromAddr);
                } else if (personHonorificRegex.test(beforeAddr) && !contactName) {
                    contactName = beforeAddr;
                    if (fromAddr) addressLines.push(fromAddr);
                } else if (!storeName && !contactName && !/\d/.test(beforeAddr)) {
                    contactName = beforeAddr;
                    if (fromAddr) addressLines.push(fromAddr);
                } else {
                    // It's part of the address (e.g. house number "88" before "ซ.รามคำแหง")
                    addressLines.push(line);
                }
            } else {
                if (fromAddr) addressLines.push(fromAddr);
            }
        } else {
            // Line does NOT contain explicit address prefix
            const compound = splitCompoundName(line);
            if (compound) {
                if (!storeName) storeName = compound.store;
                if (!contactName) contactName = compound.contact;
            } else if (storePrefixRegex.test(line) && !storeName) {
                storeName = line;
            } else if (personHonorificRegex.test(line) && !contactName) {
                contactName = line;
            } else if (!contactName && linesAfterGeog.length > 1 && i === 0 && !storeName) {
                // First line with no address prefix is likely contact or store
                contactName = line;
            } else if (storeName && !contactName) {
                contactName = line;
            } else if (contactName && !storeName && storePrefixRegex.test(line)) {
                storeName = line;
            } else {
                addressLines.push(line);
            }
        }
    }

    // Clean prefixes from names
    if (storeName) {
        storeName = storeName.replace(/^(?:ชื่อร้าน|ชื่อบริษัท|ร้านค้า)\s*:?\s*/i, '').trim();
    }
    if (contactName) {
        contactName = contactName.replace(/^(?:ชื่อผู้รับ|ชื่อผู้ติดต่อ|ผู้รับ|ผู้ติดต่อ|ชื่อ-สกุล|ชื่อ)\s*:?\s*/i, '').trim();
    }

    // Resolve accountName vs contactName
    let finalAccountName = '';
    let finalContactName = '';

    if (storeName && contactName) {
        finalAccountName = storeName;
        finalContactName = contactName;
    } else if (storeName && !contactName) {
        finalAccountName = storeName;
        finalContactName = storeName;
    } else if (!storeName && contactName) {
        finalAccountName = contactName;
        finalContactName = contactName;
    } else {
        if (addressLines.length > 1 && !addressPrefixRegex.test(addressLines[0])) {
            const potentialName = addressLines.shift();
            finalAccountName = potentialName;
            finalContactName = potentialName;
        } else {
            finalAccountName = 'ลูกค้าใหม่';
            finalContactName = 'ลูกค้าใหม่';
        }
    }

    // Clean address line
    let cleanAddress = addressLines.join(' ')
        .replace(/\s+/g, ' ')
        .replace(/[.,\s]+$/, '')
        .trim();

    if (!cleanAddress && addressLines.length > 0) {
        cleanAddress = addressLines.join(' ').trim();
    }

    return {
        accountName: finalAccountName,
        contactName: finalContactName,
        storeName: storeName || finalAccountName,
        phone,
        formattedPhone,
        email,
        lineId,
        facebook,
        facebookUrl: facebook,
        addressLine: cleanAddress,
        subDistrict,
        district,
        province,
        postalCode,
        zipCode: postalCode,
        preferredCourier,
        logisticProvider: preferredCourier,
        shippingNotes,
        logisticNote: shippingNotes,
        rawText: text
    };
};

// Aliases for multi-module compatibility
export const parseThaiAddress = parseCustomerAddress;
export default parseCustomerAddress;
