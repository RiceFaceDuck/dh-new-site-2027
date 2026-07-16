import { useState, useEffect } from 'react';
import { productService } from '../../../firebase/productService';

const FreebieDisplayName = ({ freebie, className }) => {
  const [productName, setProductName] = useState(freebie.productName || freebie.title || freebie.itemName);

  useEffect(() => {
    if (freebie.itemName) {
      productService.getProduct(freebie.itemName)
        .then(product => {
          if (product && product.name) {
            setProductName(product.name);
          }
        })
        .catch(err => console.error("Error fetching freebie name", err));
    }
  }, [freebie.itemName]);

  return <span className={className || "truncate"} title={productName}>{productName}</span>;
};

export default FreebieDisplayName;
