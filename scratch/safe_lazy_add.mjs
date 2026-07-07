import fs from 'fs';
import path from 'path';

const files = [
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\components\\billing\\dashboard\\OrderDetailModal.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\components\\billing\\pos\\receipt\\ReceiptHeader.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\components\\inventory\\modal\\ProductImageUpload.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\components\\inventory\\ProductTableRow.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\pages\\managers\\components\\partners\\PartnerCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\components\\cart\\CartFreebieProgress.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\components\\cart\\CartItemCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\components\\CategoryList.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\components\\common\\LazyImage.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\components\\Navbar.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\components\\product\\ProductImageSection.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\pages\\StoreProfile\\StoreProfilePage.jsx'
];

let modifiedCount = 0;

for (const filePath of files) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let newContent = '';
    
    let i = 0;
    while (i < content.length) {
      const imgIdx = content.indexOf('<img', i);
      if (imgIdx === -1) {
        newContent += content.substring(i);
        break;
      }
      
      newContent += content.substring(i, imgIdx);
      
      let j = imgIdx + 4;
      let bracketCount = 0;
      let inString = false;
      let stringChar = '';
      
      // State machine to find the actual closing >
      while (j < content.length) {
        const c = content[j];
        
        if (inString) {
          if (c === stringChar) {
            inString = false;
          }
        } else {
          if (c === '"' || c === "'") {
            inString = true;
            stringChar = c;
          } else if (c === '{') {
            bracketCount++;
          } else if (c === '}') {
            bracketCount--;
          } else if (c === '>' && bracketCount === 0) {
            // Found the end of the img tag!
            break;
          }
        }
        j++;
      }
      
      if (j < content.length) {
        // Tag boundaries: content.substring(imgIdx, j + 1)
        const tag = content.substring(imgIdx, j + 1);
        if (!tag.includes('loading="lazy"') && !tag.includes("loading='lazy'")) {
          // Check if it ends with />
          if (content[j - 1] === '/') {
            newContent += content.substring(imgIdx, j - 1) + ' loading="lazy" />';
          } else {
            newContent += content.substring(imgIdx, j) + ' loading="lazy">';
          }
        } else {
          newContent += tag;
        }
        i = j + 1;
      } else {
        // Malformed or reached end
        newContent += content.substring(imgIdx);
        break;
      }
    }
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`Added lazy loading to: ${filePath}`);
      modifiedCount++;
    } else {
      console.log(`Already lazy loaded or no img found: ${filePath}`);
    }
  }
}
console.log(`Total fixed: ${modifiedCount}`);
