/**
 * useQuickAddCustomer Hook (Feature Controller Layer)
 * 
 * Orchestrates modal state, real-time address parsing, in-memory customer matching,
 * partner ads index enrichment, inline-edit staging, and cashier decision flows.
 * 
 * Strict Clean Architecture: Zero presentation markup, pure controller logic.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { parseCustomerAddress } from 'dh-shared';
import { 
    findBestCustomerMatches, 
    computeSafeGapFilling,
    normalizePhone 
} from '../../../../../../pages/Customers/services/customerMatchingService';
import { 
    fetchCustomerAdsIndex, 
    enrichCustomerWithAdData 
} from '../../../../../../pages/Customers/services/customerSearchService';
import { quickCustomerService } from '../services/quickCustomerService';

export function useQuickAddCustomer({
    isOpen,
    initialText = '',
    existingCustomers = [],
    onCustomerCreated,
    onClose
}) {
    const [modalStep, setModalStep] = useState(1);
    const [rawInputText, setRawInputText] = useState('');
    const [selectedRole, setSelectedRole] = useState('Member / General');
    const [dynamicRoles, setDynamicRoles] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Matching States
    const [matchedCustomer, setMatchedCustomer] = useState(null);
    const [matchedCustomers, setMatchedCustomers] = useState([]);
    const [dismissedMatchedCustomer, setDismissedMatchedCustomer] = useState(null);
    const [adsIndex, setAdsIndex] = useState(null);

    // Inline Staging & Decision States
    const [isTaxRequested, setIsTaxRequested] = useState(false);
    const [stagedLineId, setStagedLineId] = useState('');
    const [isEditingLine, setIsEditingLine] = useState(false);
    const [autoFillMissing, setAutoFillMissing] = useState(true);

    // Duplicate Modal Flow
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [duplicateCandidates, setDuplicateCandidates] = useState([]);
    const [pendingNewCustPayload, setPendingNewCustPayload] = useState(null);
    const [createdCustomerObj, setCreatedCustomerObj] = useState(null);

    // Parsed Fields
    const [parsedData, setParsedData] = useState({
        accountName: '',
        contactName: '',
        storeName: '',
        phone: '',
        phoneNumber: '',
        phones: [],
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
        rawAddress: '',
        rawText: ''
    });

    // Helper: ตรวจสอบความสมบูรณ์ของเบอร์โทรศัพท์ไทย (9-10 หลัก ขึ้นต้นด้วย 0)
    const isPhoneValid = (phone) => {
        if (!phone) return false;
        const normalized = normalizePhone(phone);
        return (normalized.length >= 9 && normalized.length <= 10 && normalized.startsWith('0'));
    };

    // Encapsulated View State: Pure UI ไม่ต้องคำนวณเงื่อนไขซับซ้อนเอง
    const topCandidateId = matchedCustomer?.candidate?.uid || matchedCustomer?.candidate?.id;
    const dismissedId = dismissedMatchedCustomer?.candidate?.uid || dismissedMatchedCustomer?.candidate?.id;
    const isShowingDetected = Boolean(matchedCustomer && (!dismissedMatchedCustomer || topCandidateId !== dismissedId));

    // Dedicated runner for in-memory customer matching (0 Firestore Reads)
    const evaluateCustomerMatching = useCallback((parsed, customersList, adsIdx) => {
        if (!parsed || !Array.isArray(customersList) || customersList.length === 0) {
            setMatchedCustomer(null);
            setMatchedCustomers([]);
            return;
        }

        // 1. Enrich candidates with Partner Ads before matching (attaches adStoreTitle for web partners)
        const candidates = adsIdx 
            ? customersList.map(c => enrichCustomerWithAdData(c, adsIdx))
            : customersList;

        // 2. Deterministic match scoring
        const matches = findBestCustomerMatches(parsed, candidates, 35, 5);
        if (matches && matches.length > 0) {
            const enrichedMatches = matches.map(m => ({
                ...m,
                candidate: enrichCustomerWithAdData(m.candidate, adsIdx)
            }));
            setMatchedCustomers(enrichedMatches);

            // Race Condition Guard: ไม่ overwrite candidate ที่ผู้ใช้เพิ่งกด dismiss
            const topCandidate = enrichedMatches[0];
            const topId = topCandidate?.candidate?.uid || topCandidate?.candidate?.id;
            const currentDismissedId = dismissedMatchedCustomer?.candidate?.uid || dismissedMatchedCustomer?.candidate?.id;
            if (!dismissedMatchedCustomer || topId !== currentDismissedId) {
                setMatchedCustomer(topCandidate);
            }
        } else {
            setMatchedCustomer(null);
            setMatchedCustomers([]);
        }
    }, [dismissedMatchedCustomer]);

    // 1. Initialize or reset modal state
    useEffect(() => {
        if (isOpen) {
            setModalStep(1);
            setCreatedCustomerObj(null);
            setRawInputText(initialText || '');
            setIsDuplicateModalOpen(false);
            setDuplicateCandidates([]);
            setPendingNewCustPayload(null);
            setIsTaxRequested(false);
            setStagedLineId('');
            setIsEditingLine(false);
            setAutoFillMissing(true);
            setDismissedMatchedCustomer(null);

            if (initialText) {
                const parsed = parseCustomerAddress(initialText);
                setParsedData(parsed);
                if (parsed.lineId) setStagedLineId(parsed.lineId);
                evaluateCustomerMatching(parsed, existingCustomers, adsIndex);
            } else {
                setMatchedCustomer(null);
                setMatchedCustomers([]);
                setParsedData({
                    accountName: '',
                    contactName: '',
                    storeName: '',
                    phone: '',
                    phoneNumber: '',
                    phones: [],
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
                    rawAddress: '',
                    rawText: ''
                });
            }
        }
    }, [isOpen, initialText, existingCustomers, adsIndex, evaluateCustomerMatching]);

    // 2. Load Role Tier Config (Warm Cache)
    useEffect(() => {
        if (!isOpen) return;
        quickCustomerService.fetchRoleTierConfig().then(roles => {
            if (roles && roles.length > 0) {
                setDynamicRoles(roles);
                const defaultRole = roles.find(r => 
                    (r.name && (r.name.includes('ร้านช่าง') || r.name.toLowerCase().includes('wholesale') || r.name.toLowerCase().includes('mechanic'))) ||
                    (r.id && (r.id === 'wholesale' || r.id.includes('ช่าง'))) ||
                    (r.description && r.description.includes('ช่าง'))
                ) || roles[0];
                setSelectedRole(defaultRole ? defaultRole.name || defaultRole.id : roles[0]?.name);
            }
        });
    }, [isOpen]);

    // 3. Load Partner Ads Index (SessionStorage cached / 0 Read Warm Cache)
    useEffect(() => {
        if (!isOpen) return;
        fetchCustomerAdsIndex().then(index => {
            if (index) {
                setAdsIndex(index);
            }
        }).catch(err => {
            console.warn('[useQuickAddCustomer] Ads index fetch warning:', err);
        });
    }, [isOpen]);

    // 3.1 Re-evaluate matching when adsIndex or existingCustomers updates
    useEffect(() => {
        if (!isOpen) return;
        const text = rawInputText || initialText;
        if (text && text.trim()) {
            const parsed = parseCustomerAddress(text);
            evaluateCustomerMatching(parsed, existingCustomers, adsIndex);
        }
    }, [isOpen, adsIndex, existingCustomers, rawInputText, initialText, evaluateCustomerMatching]);

    // 4. Real-time text change and in-memory customer matching
    const handleTextChange = useCallback((text) => {
        setRawInputText(text);
        setDismissedMatchedCustomer(null); // Invalidation: เมื่อพิมพ์ใหม่ ล้าง dismissed candidate เสมอ
        if (!text.trim()) {
            setMatchedCustomer(null);
            setMatchedCustomers([]);
            return;
        }

        const parsed = parseCustomerAddress(text);
        setParsedData(parsed);
        if (parsed.lineId && !stagedLineId) {
            setStagedLineId(parsed.lineId);
        }

        evaluateCustomerMatching(parsed, existingCustomers, adsIndex);
    }, [existingCustomers, adsIndex, stagedLineId, evaluateCustomerMatching]);

    // 5. Handle field changes in manual editor
    const handleFieldChange = useCallback((field, value) => {
        setParsedData(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'postalCode') next.zipCode = value;
            if (field === 'zipCode') next.postalCode = value;
            if (field === 'preferredCourier') next.logisticProvider = value;
            if (field === 'logisticProvider') next.preferredCourier = value;
            if (field === 'shippingNotes') next.logisticNote = value;
            if (field === 'logisticNote') next.shippingNotes = value;
            if (field === 'facebook') next.facebookUrl = value;
            if (field === 'facebookUrl') next.facebook = value;
            if (field === 'contactName') next.firstName = value;
            if (field === 'firstName') next.contactName = value;
            return next;
        });
    }, []);

    // 6. Proceed with Matched Candidate (Action 1: Green Button)
    const handleProceedWithCandidate = async (targetCandidate) => {
        const candidate = targetCandidate || matchedCustomer?.candidate;
        if (!candidate) return;

        let payload = null;
        if (autoFillMissing && parsedData) {
            const fillResult = computeSafeGapFilling(candidate, parsedData);
            if (fillResult.hasUpdates) {
                payload = fillResult.payload;
            }
        }

        // Business / Store Name takes HIGHEST precedence for DH B2B system
        const effectiveStoreName = candidate.adStoreTitle || (
            (parsedData.storeName && parsedData.storeName !== 'ลูกค้าใหม่')
                ? parsedData.storeName
                : (candidate.storeName || candidate.accountName || candidate.displayName)
        );

        const effectiveContactName = parsedData.contactName || candidate.contactName || candidate.firstName || candidate.displayName;

        // If candidate doesn't have a distinct storeName in DB, also update it in profile payload
        if (!candidate.storeName && effectiveStoreName && effectiveStoreName !== candidate.displayName) {
            payload = payload || {};
            payload.storeName = effectiveStoreName;
            payload.accountName = effectiveStoreName;
        }

        // Apply staged Line ID if modified
        if (stagedLineId && (!candidate.lineId || candidate.lineId !== stagedLineId)) {
            payload = payload || {};
            payload.lineId = stagedLineId;
        }

        if (payload && Object.keys(payload).length > 0) {
            try {
                const uid = candidate.uid || candidate.id;
                await quickCustomerService.overwriteExistingCustomer(candidate, payload);
                toast.success(`อัปเดตข้อมูลเพิ่มเติมให้ ${effectiveStoreName || candidate.accountId} เรียบร้อยแล้ว`);
            } catch (err) {
                console.warn('[useQuickAddCustomer] Auto-fill update warning:', err);
            }
        }

        // Synthesize final customer object with POS billing shipping address & tax
        const finalCustomer = {
            ...candidate,
            ...(payload || {}),
            uid: candidate.uid || candidate.id,
            id: candidate.uid || candidate.id,
            storeName: effectiveStoreName,
            accountName: effectiveStoreName,
            displayName: effectiveStoreName,
            contactName: effectiveContactName,
            firstName: effectiveContactName,
            shippingAddress: parsedData.addressLine ? {
                addressLine: parsedData.addressLine,
                subDistrict: parsedData.subDistrict,
                district: parsedData.district,
                province: parsedData.province,
                postalCode: parsedData.postalCode || parsedData.zipCode,
                zipCode: parsedData.postalCode || parsedData.zipCode
            } : candidate.address,
            isTaxRequested
        };

        if (onCustomerCreated) {
            onCustomerCreated(finalCustomer);
        }
        toast.success(`เลือกบัญชี ${finalCustomer.storeName || finalCustomer.accountId} สำหรับบิลนี้แล้ว`);
        onClose();
    };

    // 7. Save New Customer to DB or Switch to Manual Form (Action 2: Yellow Button)
    const handleCreateNewCustomer = async () => {
        if (isSaving) return;

        // Smart Transition: หากกำลังแสดงหน้าตรวจพบบัญชีเดิม (isShowingDetected)
        // และข้อมูลจำเป็น (เช่น เบอร์โทรศัพท์ หรือ ชื่อร้าน) ยังไม่ครบถ้วนสมบูรณ์
        // ให้หุบหน้าตรวจจับลง แล้วสลับมาเปิด NewCustomerPreviewSheet ทันที โดยไม่บันทึกลงฐานข้อมูล
        const phone = parsedData.phone || parsedData.phoneNumber || '';
        const hasValidPhone = isPhoneValid(phone);
        const hasValidName = Boolean(parsedData.accountName && parsedData.accountName.trim());

        if (isShowingDetected && (!hasValidPhone || !hasValidName)) {
            // ดึงชื่อร้านจาก matched candidate มาเติมให้อัตโนมัติ หากใน parsedData ยังไม่มีชื่อร้าน
            if (!hasValidName && matchedCustomer?.candidate) {
                const autoName = matchedCustomer.candidate.storeName || 
                                 matchedCustomer.candidate.accountName || 
                                 matchedCustomer.candidate.displayName || '';
                if (autoName) {
                    setParsedData(prev => ({
                        ...prev,
                        accountName: autoName,
                        storeName: autoName
                    }));
                }
            }
            setDismissedMatchedCustomer(matchedCustomer);
            toast('กรุณากรอกเบอร์โทรศัพท์และตรวจทานข้อมูลลูกค้าใหม่', { icon: '📝' });
            return;
        }

        if (!parsedData.accountName || !parsedData.accountName.trim()) {
            toast.error('⚠️ กรุณาระบุชื่อลูกค้าหรือชื่อร้านค้า');
            return;
        }

        setIsSaving(true);
        try {
            // Apply staged Line ID to payload
            const effectiveParsedData = {
                ...parsedData,
                lineId: stagedLineId || parsedData.lineId
            };

            const checkRes = await quickCustomerService.checkDuplicateAndCreate(
                effectiveParsedData, 
                selectedRole, 
                existingCustomers
            );

            if (checkRes.isDuplicate) {
                // กรอง candidate ที่ผู้ใช้เพิ่งกด dismiss ออกจากรายการ duplicates เพื่อไม่ให้เด้งถามซ้ำ
                const currentDismissedId = dismissedMatchedCustomer?.candidate?.uid || dismissedMatchedCustomer?.candidate?.id;
                const filteredDuplicates = currentDismissedId 
                    ? checkRes.duplicates.filter(d => (d.uid || d.id) !== currentDismissedId)
                    : checkRes.duplicates;

                if (filteredDuplicates.length > 0) {
                    setDuplicateCandidates(filteredDuplicates);
                    setPendingNewCustPayload(checkRes.payload);
                    setIsDuplicateModalOpen(true);
                } else {
                    // หากซ้ำเฉพาะ candidate ที่เพิ่ง dismiss ไป ให้บังคับสร้างได้ทันที
                    const newCust = await quickCustomerService.executeCreateCustomer(checkRes.payload);
                    const newCustomerWithTax = { ...newCust, isTaxRequested };
                    setCreatedCustomerObj(newCustomerWithTax);
                    if (onCustomerCreated) onCustomerCreated(newCustomerWithTax);
                    toast.success(`สร้างลูกค้าใหม่ ${newCustomerWithTax.accountName} สำเร็จแล้ว`);
                    onClose();
                }
            } else if (checkRes.newCust) {
                const newCustomerWithTax = {
                    ...checkRes.newCust,
                    isTaxRequested
                };
                setCreatedCustomerObj(newCustomerWithTax);
                if (onCustomerCreated) onCustomerCreated(newCustomerWithTax);
                toast.success(`สร้างลูกค้าใหม่ ${newCustomerWithTax.accountName} สำเร็จแล้ว`);
                onClose();
            }
        } catch (err) {
            console.error('🔥 Error checking quick customer:', err);
            toast.error('ไม่สามารถบันทึกลูกค้าได้ กรุณาตรวจสอบข้อมูลและลองใหม่');
        } finally {
            setIsSaving(false);
        }
    };

    // 8. Duplicate Handlers
    const handleSelectExistingCustomer = (existing) => {
        if (onCustomerCreated && existing) onCustomerCreated({ ...existing, isTaxRequested });
        setIsDuplicateModalOpen(false);
        onClose();
    };

    const handleOverwriteExistingCustomer = async (existing, newPayload) => {
        setIsSaving(true);
        try {
            const updated = await quickCustomerService.overwriteExistingCustomer(existing, newPayload);
            if (onCustomerCreated) onCustomerCreated({ ...updated, isTaxRequested });
            toast.success('✅ อัปเดตและรวมข้อมูลลูกค้าเดิมเรียบร้อยแล้ว');
            setIsDuplicateModalOpen(false);
            onClose();
        } catch (err) {
            console.error('Error overwriting customer:', err);
            toast.error('ไม่สามารถรวมข้อมูลลูกค้าได้');
        } finally {
            setIsSaving(false);
        }
    };

    const handleForceCreateNewCustomer = async () => {
        if (!pendingNewCustPayload) return;
        setIsSaving(true);
        try {
            const newCust = await quickCustomerService.executeCreateCustomer(pendingNewCustPayload);
            const newCustomerWithTax = { ...newCust, isTaxRequested };
            setCreatedCustomerObj(newCustomerWithTax);
            if (onCustomerCreated) onCustomerCreated(newCustomerWithTax);
            toast.success(`สร้างลูกค้าใหม่ ${newCustomerWithTax.accountName} สำเร็จ`);
            setIsDuplicateModalOpen(false);
            onClose();
        } catch (err) {
            console.error('🔥 Error creating customer:', err);
            toast.error('ไม่สามารถบันทึกลูกค้าได้');
        } finally {
            setIsSaving(false);
        }
    };

    return {
        modalStep,
        setModalStep,
        rawInputText,
        handleTextChange,
        selectedRole,
        setSelectedRole,
        dynamicRoles,
        parsedData,
        handleFieldChange,
        isSaving,
        matchedCustomer,
        matchedCustomers,
        dismissedMatchedCustomer,
        setDismissedMatchedCustomer,
        isShowingDetected,
        isTaxRequested,
        setIsTaxRequested,
        stagedLineId,
        setStagedLineId,
        isEditingLine,
        setIsEditingLine,
        autoFillMissing,
        setAutoFillMissing,
        isDuplicateModalOpen,
        setIsDuplicateModalOpen,
        duplicateCandidates,
        pendingNewCustPayload,
        createdCustomerObj,
        handleProceedWithCandidate,
        handleCreateNewCustomer,
        handleSelectExistingCustomer,
        handleOverwriteExistingCustomer,
        handleForceCreateNewCustomer
    };
}

export default useQuickAddCustomer;
