import { parseCustomerAddress } from '../../dh-shared/src/utils/thaiAddressParser.js';
import { findBestCustomerMatches } from '../../dh-backoffice-react/src/pages/Customers/services/customerMatchingService.js';

const enrichCustomerWithAdData = (customer, adsIndex) => {
  if (!customer) return customer;
  const uid = customer.uid || customer.id;
  const accountId = (customer.accountId || customer.customerCode || '').trim().toUpperCase();

  const adEntry = (uid && adsIndex?.byUid?.[uid]) ||
                  (accountId && adsIndex?.byAccountId?.[accountId]) ||
                  null;

  if (!adEntry) return customer;

  return {
    ...customer,
    adStoreTitle: adEntry.adStoreTitle || customer.adStoreTitle || '',
    adSearchBlob: adEntry.adSearchBlob || customer.adSearchBlob || '',
    ads: adEntry.ads || customer.ads || []
  };
};

const raw = `ร้าน Aor.ACC คุณภาสกร โตสาลี
เลขที่ 83/9 ตึกท็อปไอทีชั้น2 ถ.บรมไตรโลกนารถ ต.ในเมือง อ.เมือง จ.พิษณุโลก 65000
โทร 0634962935`;

const parsed = parseCustomerAddress(raw);

// Exactly what customers_directory has:
const directoryCustomer = {
    id: 'XqEJXLes2rPdZaRy9oSa2sQSqG03',
    uid: 'XqEJXLes2rPdZaRy9oSa2sQSqG03',
    accountId: 'XQEJXLES',
    displayName: 'Aor Phatsakon',
    accountName: 'Aor Phatsakon',
    storeName: 'Aor Phatsakon', // Notice storeName is the person's name in directory!
    phone: '-',
    role: 'Member / General',
    tier: 'SILVER',
    creditPoints: 1000
};

// Exactly what adsIndex has:
const mockAdsIndex = {
    byUid: {
        'XqEJXLes2rPdZaRy9oSa2sQSqG03': {
            ownerId: 'XqEJXLes2rPdZaRy9oSa2sQSqG03',
            adStoreTitle: 'Aor.ACC',
            adSearchBlob: 'aor.acc ซ่อมอุปกรณ์ it จำหน่ายและรับซ่อมอุปกรณ์ it ทุกชนิด'
        }
    },
    byAccountId: {
        'XQEJXLES': {
            ownerId: 'XqEJXLes2rPdZaRy9oSa2sQSqG03',
            adStoreTitle: 'Aor.ACC',
            adSearchBlob: 'aor.acc ซ่อมอุปกรณ์ it จำหน่ายและรับซ่อมอุปกรณ์ it ทุกชนิด'
        }
    }
};

const enrichedCustomer = enrichCustomerWithAdData(directoryCustomer, mockAdsIndex);

console.log('--- TEST MATCHING WITH ENRICHED CUSTOMER ---');
const matches = findBestCustomerMatches(parsed, [enrichedCustomer], 35, 5);
console.log('Matches found:', matches.length);
if (matches.length > 0) {
    console.log('Match details:', {
        id: matches[0].candidate.id,
        store: matches[0].candidate.adStoreTitle || matches[0].candidate.storeName,
        score: matches[0].score,
        reasons: matches[0].matchReasons
    });
}
