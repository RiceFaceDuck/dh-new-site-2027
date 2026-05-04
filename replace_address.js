const fs = require('fs');

let content = fs.readFileSync('dh-frontend/src/components/checkout/AddressSelector.jsx', 'utf8');

// เพิ่ม useEffect เพื่อ sync formData กลับไปที่ checkoutState
const useEffectCode = `  useEffect(() => {
    updateCheckoutConfig({ addressInfo: formData });
  }, [formData]);

  const handleChange = (e) => {`;

content = content.replace("  const handleChange = (e) => {", useEffectCode);

fs.writeFileSync('dh-frontend/src/components/checkout/AddressSelector.jsx', content);
