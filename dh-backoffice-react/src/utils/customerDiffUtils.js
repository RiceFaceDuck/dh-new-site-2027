export const computeCustomerChanges = (oldData, newData) => {
    const fieldLabels = {
        accountName: 'ชื่อร้าน/บริษัท',
        contactName: 'ชื่อผู้ติดต่อ',
        phone: 'เบอร์โทรศัพท์',
        email: 'อีเมล',
        address: 'ที่อยู่',
        logisticProvider: 'ขนส่งที่ใช้งาน',
        logisticNote: 'หมายเหตุขนส่ง',
        rank: 'ระดับบัญชี',
        accountRank: 'ป้ายกำกับ',
        role: 'สิทธิ์การใช้งาน',
        isActive: 'สถานะเปิดใช้งาน',
        status: 'สถานะบัญชี'
    };

    const changes = {};
    let changeSummary = [];
    
    Object.keys(newData).forEach(key => {
        if (['updatedAt', 'createdAt', 'metadata'].includes(key)) return;
        
        // เปรียบเทียบเฉพาะค่าที่ถูกแก้ไขและส่งมาใหม่จริงๆ
        if (newData[key] !== undefined && oldData[key] !== newData[key]) {
            const label = fieldLabels[key] || key;
            changes[key] = {
                old: oldData[key] || '-',
                new: newData[key] || '-',
                label: label
            };
            changeSummary.push(label);
        }
    });

    return { changes, changeSummary };
};
