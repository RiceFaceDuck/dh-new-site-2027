/**
 * Quick Customer Service (Feature Domain Service)
 * 
 * Handles payload construction, in-memory duplicate pre-flight validation,
 * profile updates, and role configurations for POS Smart Quick Paste.
 * 
 * Quota Invariant: All duplicate checks run against in-memory directory cache
 * to ensure STRICT ZERO READS during cashier operations.
 */
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../../../../firebase/config';
import { getCollectionPath } from 'dh-shared';
import { userService } from '../../../../../../firebase/userService';
import { settingsService } from '../../../../../../firebase/settingsService';
import { 
    findBestCustomerMatches, 
    normalizePhone, 
    normalizeThaiText 
} from '../../../../../../pages/Customers/services/customerMatchingService';

export const quickCustomerService = {
    /**
     * Builds structured customer payload with Dual-Key Parity and Multi-Phone support.
     */
    buildCustomerPayload: (parsedData = {}, selectedRole = 'Member / General') => {
        const zip = (parsedData.postalCode || parsedData.zipCode || '').trim();
        const fullAddress = [
            parsedData.addressLine,
            parsedData.subDistrict ? (parsedData.province?.includes('กรุงเทพ') ? `แขวง${parsedData.subDistrict}` : `ต.${parsedData.subDistrict}`) : '',
            parsedData.district ? (parsedData.province?.includes('กรุงเทพ') ? `เขต${parsedData.district}` : `อ.${parsedData.district}`) : '',
            parsedData.province ? (parsedData.province.startsWith('จ.') ? parsedData.province : `จ.${parsedData.province}`) : '',
            zip
        ].filter(Boolean).join(' ');

        const name = (parsedData.accountName || '').trim();
        const contact = (parsedData.contactName || '').trim();
        const courier = (parsedData.preferredCourier || parsedData.logisticProvider || '').trim();
        const notes = (parsedData.shippingNotes || parsedData.logisticNote || '').trim();
        const fb = (parsedData.facebookUrl || parsedData.facebook || '').trim();
        const primaryPhone = parsedData.phone || parsedData.phoneNumber || '';
        const phoneList = Array.isArray(parsedData.phones) && parsedData.phones.length > 0
            ? parsedData.phones
            : (primaryPhone ? [primaryPhone] : []);

        return {
            accountName: name,
            displayName: name,
            storeName: name,
            name: name,
            contactName: contact || name,
            firstName: contact || name,
            phone: primaryPhone,
            phoneNumber: primaryPhone,
            phones: phoneList,
            email: (parsedData.email || '').trim().toLowerCase(),
            lineId: (parsedData.lineId || '').trim(),
            facebook: fb,
            facebookUrl: fb,
            role: selectedRole,
            rank: selectedRole,
            address: {
                addressLine: parsedData.addressLine || '',
                subDistrict: parsedData.subDistrict || '',
                district: parsedData.district || '',
                province: parsedData.province || '',
                postalCode: zip,
                zipCode: zip,
                fullAddress: fullAddress
            },
            shippingAddress: {
                addressLine: parsedData.addressLine || '',
                subDistrict: parsedData.subDistrict || '',
                district: parsedData.district || '',
                province: parsedData.province || '',
                postalCode: zip,
                zipCode: zip,
                fullAddress: fullAddress
            },
            legacyAddress: fullAddress,
            rawAddress: parsedData.rawAddress || parsedData.addressLine || '',
            preferredCourier: courier,
            logisticProvider: courier,
            shippingNotes: notes,
            logisticNote: notes,
            customerType: 'ทั่วไป',
            source: 'POS Quick Smart Add'
        };
    },

    /**
     * Executes customer creation in Firestore with atomic sync triggers.
     */
    executeCreateCustomer: async (payload) => {
        const createdId = await userService.createManualCustomer(payload);
        const uid = typeof createdId === 'string' ? createdId : (createdId?.uid || createdId?.id || `cust_${Date.now()}`);
        return {
            uid,
            id: uid,
            ...payload,
            storeName: payload.accountName
        };
    },

    /**
     * In-memory pre-flight duplicate verification (0 Firestore Reads).
     * Eliminates redundant Firestore scans by checking cached directory list.
     */
    checkDuplicateAndCreate: async (parsedData, selectedRole, existingCustomers = []) => {
        const payload = quickCustomerService.buildCustomerPayload(parsedData, selectedRole);
        let duplicates = [];

        // 🛡️ Quota Zero-Leak: In-memory evaluation on cached customers
        if (Array.isArray(existingCustomers) && existingCustomers.length > 0) {
            const matches = findBestCustomerMatches(parsedData, existingCustomers, 35, 5);
            if (matches && matches.length > 0) {
                duplicates = matches.map(m => ({
                    ...m.candidate,
                    matchScore: m.score,
                    matchReasons: m.matchReasons
                }));
            }
        }

        if (duplicates && duplicates.length > 0) {
            return { isDuplicate: true, duplicates, payload };
        }

        const newCust = await quickCustomerService.executeCreateCustomer(payload);
        return { isDuplicate: false, newCust, payload };
    },

    /**
     * Overwrites or updates existing customer with sanitized new payload.
     */
    overwriteExistingCustomer: async (existingCustomer, newFields) => {
        const uid = existingCustomer.uid || existingCustomer.id;
        await userService.updateCustomerProfile(uid, newFields);
        return { ...existingCustomer, ...newFields };
    },

    /**
     * Loads role tier config from settings.
     */
    fetchRoleTierConfig: async () => {
        try {
            const config = await settingsService.getRoleTierConfig();
            if (config && config.roles?.length > 0) {
                return config.roles;
            }
        } catch (e) {
            console.warn('[quickCustomerService] Could not fetch role_tier_config:', e);
        }
        return [
            { id: 'wholesale', name: 'ร้านช่าง', description: 'ช่างซ่อม / ราคาส่งทั่วไป' },
            { id: 'member', name: 'Member / General', description: 'ลูกค้าทั่วไป / สมาชิกเริ่มต้น' },
            { id: 'partner', name: 'VIP / Retail Partner', description: 'ร้านค้าพันธมิตร / VIP' },
            { id: 'enterprise', name: 'Enterprise Partner', description: 'คู่ค้าใหญ่ระดับองค์กร / สัญญารายปี' }
        ];
    },

    /**
     * Look up web account by exact email.
     */
    lookupWebAccountByEmail: async (email) => {
        if (!email || !email.includes('@')) return null;
        try {
            const usersRef = collection(db, getCollectionPath('users'));
            const q = query(usersRef, where('email', '==', email.trim().toLowerCase()), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const docSnap = snap.docs[0];
                return { uid: docSnap.id, id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (e) {
            console.error('[quickCustomerService] Error looking up web account by email:', e);
            throw e;
        }
    }
};

export default quickCustomerService;
