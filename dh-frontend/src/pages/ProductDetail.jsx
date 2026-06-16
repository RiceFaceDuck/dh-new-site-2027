import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth'; 
import { cartService } from '../firebase/cartService'; 
import { getCreditSettings, calculateEarnedPoints } from '../firebase/creditService';
import { productService } from '../firebase/productService';
import { footerClientService } from '../firebase/footerClientService';
import { ChevronLeft, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';

import PartnerSupportBox from '../components/partner/PartnerSupportBox';
import ProductImageSection from '../components/product/ProductImageSection';
import ProductPricingSection from '../components/product/ProductPricingSection';
import ProductKnowledgeSection from '../components/product/ProductKnowledgeSection';
import ProductSpecsSection from '../components/product/ProductSpecsSection';
import ProductCommunitySection from '../components/product/ProductCommunitySection';
import ProductDescriptionSection from '../components/product/ProductDescriptionSection';
import ProductVideoSection from '../components/product/ProductVideoSection';

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🧠 SMART FETCH
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);

  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [creditConfig, setCreditConfig] = useState(null); 
  const [footerConfig, setFooterConfig] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getCreditSettings();
        if (config) setCreditConfig(config);

        const fConfig = await footerClientService.getFooterConfig();
        if (fConfig) setFooterConfig(fConfig);
      } catch (err) {
        console.error("Error loading config in ProductDetail", err);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setError(null);
        const prod = await productService.getProduct(id);
        if (prod) {
          setProduct(prod);
        } else {
          setError("ไม่พบข้อมูลสินค้านี้");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setAlertMessage({ type: 'error', text: 'กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    setIsAdding(true);
    try {
      await cartService.addToCart(user.uid, product._raw || product, 1);
      setAddSuccess(true);
      setAlertMessage({ type: 'success', text: 'เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว!' });
      
      setTimeout(() => {
        setAddSuccess(false);
        setAlertMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Add to cart failed:', err);
      setAlertMessage({ type: 'error', text: 'ไม่สามารถเพิ่มสินค้าได้ กรุณาลองใหม่' });
      setTimeout(() => setAlertMessage(null), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={48} className="animate-spin mb-4 text-cyber-blue" />
        <p className="font-tech tracking-wider uppercase">Loading Product Data...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <ShieldAlert size={48} className="mb-4 text-red-400" />
        <p className="font-tech tracking-wider">{error || "PRODUCT NOT FOUND"}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors">
          GO BACK
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full animate-fade-in pb-10">
      
      {/* 🌟 Toast Notification */}
      {alertMessage && (
        <div className={`fixed top-20 right-4 md:right-8 z-[100] px-6 py-3 rounded-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 border ${
          alertMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {alertMessage.type === 'success' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
          <span className="font-medium text-sm">{alertMessage.text}</span>
        </div>
      )}

      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
      >
        <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform" /> BACK TO PRODUCTS
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="flex flex-col bg-white">
            <ProductImageSection product={product._raw || product} imageUrl={product.imageUrl} name={product.name} />
            <div className="hidden md:block flex-1">
              <ProductCommunitySection />
            </div>
          </div>

          <div className="flex flex-col bg-white">
            <ProductPricingSection 
              product={product._raw || product}
              brand={product.brand}
              model={product.model}
              name={product.name}
              shortDescription={product.shortDescription}
              price={product.price}
              salePrice={product.salePrice}
              isOutOfStock={product.isOutOfStock}
              creditConfig={creditConfig}
              isAdding={isAdding}
              addSuccess={addSuccess}
              handleAddToCart={handleAddToCart}
              calculateEarnedPoints={calculateEarnedPoints}
              shopeeUrl={product.shopeeUrl}
              lazadaUrl={product.lazadaUrl}
              lineAddFriendUrl={footerConfig?.company?.lineAddFriendUrl}
            >
              <ProductKnowledgeSection 
                product={product} 
                compatibleModels={product.compatibleModels} 
                compatiblePartNumbers={product.compatiblePartNumbers} 
              />

              <ProductDescriptionSection description={product.fullDescription} />
            </ProductPricingSection>

            {/* 🌟 INTEGRATION ZONE: Partner & Youtube */}
            <div className="bg-slate-50 w-full border-t-2 border-slate-200 shadow-inner overflow-hidden">
              <div className="px-6 md:px-10 pt-4 md:pt-6">
                <PartnerSupportBox />
              </div>
              {product.videoId && (
                <div className="px-6 md:px-10 pb-6 md:pb-8 pt-6 border-t border-slate-200 mt-6">
                  <ProductVideoSection videoId={product.videoId} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📱 MOBILE ONLY: Community Section at the bottom */}
        <div className="block md:hidden border-t border-slate-200 bg-white">
          <ProductCommunitySection />
        </div>

        <ProductSpecsSection 
          specs={product.specs} 
        />

      </div>
    </div>
  );
};

export default ProductDetail;