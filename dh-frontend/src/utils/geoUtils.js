/**
 * 🧮 สูตรคำนวณระยะทาง (Haversine Formula) 
 * เพื่อหาความห่างระหว่าง 2 พิกัด บนพื้นผิวโลก (หน่วยเป็นกิโลเมตร)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // รัศมีของโลก (กิโลเมตร)
  const l1 = Number(lat1);
  const l2 = Number(lon1);
  const l3 = Number(lat2);
  const l4 = Number(lon2);

  if (isNaN(l1) || isNaN(l2) || isNaN(l3) || isNaN(l4)) return Infinity;

  const dLat = (l3 - l1) * (Math.PI / 180);
  const dLon = (l4 - l2) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(l1 * (Math.PI / 180)) * Math.cos(l3 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c; 
  return distance; 
};
