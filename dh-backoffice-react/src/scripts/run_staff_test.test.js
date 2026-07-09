import { describe, it, expect } from 'vitest';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { gasHistoryService } from '../firebase/gasHistoryService';
import { billingTransactionService } from '../firebase/billingTransactionService';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

describe('Staff Workflow Simulation', () => {
    it('should login, trigger log, and complete a transaction as staff', async () => {
        console.log('🔥 [STEP 1] Login as Staff...');
        const userCred = await signInWithEmailAndPassword(auth, 'ai.manager@dhnotebook.com', 'Password123!');
        const user = userCred.user;
        console.log('✅ Logged in:', user.email);

        console.log('🔥 [STEP 2] Simulating UI AuthFlow History Log...');
        gasHistoryService.setProfile({ firstName: 'AI', role: 'manager' });
        gasHistoryService.log({
            level: 'INFO',
            module: 'AUTH',
            action: 'LOGIN',
            target: { id: user.uid, name: user.email },
            details: { method: 'Email', test: 'Real Situation Simulation' },
            actorOverride: { uid: user.uid, email: user.email, name: 'AI Manager' }
        });
        
        await gasHistoryService._flush();
        console.log('✅ History Log sent via GAS.');

        console.log('🔥 [STEP 3] Preparing POS Transaction...');
        const customerRef = doc(db, getCollectionPath('users'), 'y2rGbkQNZugOcSebVUx5xdYNpjs1');
        const customerSnap = await getDoc(customerRef);
        const customerData = customerSnap.data();

        const invQuery = query(collection(db, 'inventory'), where('stockQuantity', '>', 5), limit(1));
        const invSnap = await getDocs(invQuery);
        const product = { id: invSnap.docs[0].id, ...invSnap.docs[0].data() };

        const today = new Date();
        const mmStr = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const baseDocRef = doc(db, getCollectionPath('sales_stats'), yyyy + '-' + mmStr);
        const statSnap = await getDoc(baseDocRef);
        const count = (statSnap.exists() ? (statSnap.data().orderCount || 0) : 0) + 1;
        const countStr = String(count).padStart(4, '0');
        const billId = 'DH-' + yyyy + '-' + mmStr + '-' + countStr;

        const mockItem = {
            id: product.id,
            sku: product.sku,
            name: product.name,
            price: Number(product.retailPrice),
            retailPrice: Number(product.retailPrice),
            priceAtPurchase: Number(product.retailPrice),
            quantity: 1,
            isFreebie: false,
            image: product.imageUrls?.[0] || '',
            category: product.category || ''
        };
        
        const freebieItem = {
            ...mockItem,
            price: 0,
            priceAtPurchase: 0,
            isFreebie: true,
            promotionsApplied: [{ id: 'TEST-PROMO', name: 'Freebie Promo' }]
        };

        const totalItems = [mockItem, freebieItem];

        const orderData = {
            id: billId,
            userId: customerRef.id,
            customerId: customerData.customerCode || '',
            customerName: customerData.firstName + ' ' + customerData.lastName,
            staffId: user.uid,
            staffName: 'AI Manager',
            items: totalItems,
            status: 'COMPLETED',
            paymentMethod: 'TRANSFER',
            totals: {
                subtotal: mockItem.price,
                discountAmount: 0,
                shippingCost: 0,
                otherFeeAmount: 0,
                netTotal: mockItem.price
            },
            appliedPromotions: [
                { id: 'TEST-PROMO', name: 'Freebie TEST', discountType: 'FREE_ITEM' }
            ],
            createdAt: new Date().toISOString()
        };

        const inventoryUpdates = [
            { sku: mockItem.sku, newQty: product.stockQuantity - 1, soldInc: 1 }
        ];

        console.log('🔥 [STEP 4] Executing Checkout via Real Service...');
        const result = await billingTransactionService.checkout(orderData, inventoryUpdates);
        console.log('✅ Transaction Result:', result);

        expect(result.success).toBe(true);
    }, 30000);
});
