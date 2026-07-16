const fs = require('fs');
const files = [
  'dh-backoffice-react/src/components/inventory/InventoryExportModal.jsx',
  'dh-backoffice-react/src/components/inventory/modal/ProductImageUpload.jsx',
  'dh-backoffice-react/src/components/managers/featured/FeaturedSettings.jsx',
  'dh-backoffice-react/src/components/managers/squad/SquadHighlightSettings.jsx',
  'dh-backoffice-react/src/pages/Customers/components/forms/CustomerModal.jsx'
];

files.forEach(f => {
  const txt = fs.readFileSync(f, 'utf8');
  if (!txt.includes("import { toast }")) {
     fs.writeFileSync(f, "import { toast } from 'react-hot-toast';\n" + txt);
     console.log('Fixed:', f);
  }
});
