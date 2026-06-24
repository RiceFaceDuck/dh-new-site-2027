import React from 'react';
import { Cpu, Package, Truck, ShoppingCart, Heart, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function ProductPricingSection({
  product,
  brand,
  model,
  name,
  shortDescription,
  price,
  salePrice,
  isOutOfStock,
  isLowStock,
  creditConfig,
  isAdding,
  addSuccess,
  handleAddToCart,
  calculateEarnedPoints,
  shopeeUrl,
  lazadaUrl,
  lineAddFriendUrl,
  variantOptions,
  variants,
  selectedVariant,
  setSelectedVariant,
  children
}) {
  const handleVariantSelect = (optName, val) => {
    setSelectedVariant(prev => ({
      ...prev,
      [optName]: val
    }));
  };
  return (
    <div className="p-6 md:p-10 flex flex-col">
      <div className="mb-2 flex items-center justify-start">
        <span className="text-sm font-tech text-slate-500 font-bold flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-md">
          <Cpu size={14} className="text-slate-400" /> DH-SKU: {model}
        </span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight mb-3">
        {name}
      </h1>

      {/* Short Description Section */}
      {shortDescription && (
        <p className="text-lg font-medium text-slate-600 mb-5 border-l-[3px] border-cyber-blue pl-4 py-0.5">
          {shortDescription}
        </p>
      )}

      {/* Pricing */}
      <div className="mb-6 flex items-end gap-3">
        {salePrice ? (
          <>
            <span className="text-3xl md:text-4xl font-bold text-cyber-emerald">฿{salePrice.toLocaleString()}</span>
            <span className="text-lg text-slate-400 line-through mb-1">฿{price.toLocaleString()}</span>
          </>
        ) : (
          <span className="text-3xl md:text-4xl font-bold text-slate-800">฿{price.toLocaleString()}</span>
        )}
      </div>
      
      {/* Earn Points Alert */}
      {!isOutOfStock && creditConfig && calculateEarnedPoints && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
          <span className="text-blue-500 text-lg">✨</span>
          <span className="text-sm font-medium text-blue-800">
            ซื้อสินค้านี้รับ <span className="font-bold">{calculateEarnedPoints(salePrice || price, creditConfig, [{ sku: model }]).toLocaleString()}</span> แต้ม
          </span>
        </div>
      )}

      {/* Variant Selectors */}
      {variantOptions && variantOptions.length > 0 && (
        <div className="mb-6 space-y-4">
          {variantOptions.map((opt, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-700">{opt.name}:</span>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((val, vIdx) => {
                  const isSelected = selectedVariant && selectedVariant[opt.name] === val;
                  // ตรวจสอบว่ามี Variant นี้เปิดขายหรือไม่
                  const isAvailable = variants && variants.some(v => 
                    v.isActive && v.attributes[opt.name] === val
                  );

                  return (
                    <button
                      key={vIdx}
                      onClick={() => handleVariantSelect(opt.name, val)}
                      disabled={!isAvailable}
                      className={`px-4 py-2 text-sm font-medium border rounded-md transition-all ${
                        isSelected 
                          ? 'border-cyber-blue bg-blue-50 text-cyber-blue shadow-sm' 
                          : isAvailable 
                            ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300' 
                            : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status & Shipping */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Package className={isOutOfStock ? "text-red-400" : isLowStock ? "text-amber-500" : "text-cyber-emerald"} size={20} />
          <div>
            <div className="text-xs text-slate-500">Status</div>
            <div className={`font-bold text-sm ${isOutOfStock ? "text-red-500" : isLowStock ? "text-amber-600" : "text-slate-800"}`}>
              {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK (ใกล้หมด)' : 'IN STOCK'}
            </div>
          </div>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Truck className="text-cyber-blue" size={20} />
          <div>
            <div className="text-xs text-slate-500">Shipping</div>
            <div className="font-bold text-sm text-slate-800">Ready to Ship</div>
          </div>
        </div>
      </div>

      {/* 💬 LINE Add Friend Button (Official Original Image with Premium UX) */}
      <div className="mb-5 flex justify-start">
        <a 
          href={lineAddFriendUrl || "https://line.me/ti/p/"} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="relative inline-block group hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 rounded-lg"
        >
          {/* Subtle pulse glow effect behind the button */}
          <div className="absolute inset-0 bg-[#00B900] opacity-20 group-hover:opacity-40 blur-md rounded-full transition-opacity duration-300 animate-pulse"></div>
          
          <img 
            src="https://scdn.line-apps.com/n/line_add_friends/btn/en.png" 
            alt="LINE Add Friends" 
            className="h-[44px] object-contain drop-shadow-md relative z-10" 
          />
        </a>
      </div>

      {/* Insert children here (Knowledge & Full Description) */}
      <div className="mb-4">
        {children}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex items-center gap-3">
        <button 
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding || addSuccess}
          className={`flex-1 h-12 md:h-14 rounded-sm font-bold text-sm md:text-base tracking-wide flex items-center justify-center gap-2 transition-all duration-300 shadow-sm ${
            isOutOfStock 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : addSuccess
                ? 'bg-emerald-50 text-cyber-emerald border border-cyber-emerald'
                : 'bg-slate-800 text-white hover:bg-slate-900 hover:shadow-md'
          }`}
        >
          {isAdding ? (
            <><div className="w-4 h-4 border-2 border-cyber-emerald border-t-transparent rounded-full animate-spin"></div> PROCESSING</>
          ) : addSuccess ? (
            <><CheckCircle2 size={18} strokeWidth={2.5} /> ADDED TO CART</>
          ) : isOutOfStock ? (
            <>OUT OF STOCK</>
          ) : (
            <><ShoppingCart size={18} /> ADD TO CART</>
          )}
        </button>
        <button className="w-12 h-12 md:w-14 md:h-14 bg-white border border-slate-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50 text-slate-400 rounded-sm flex items-center justify-center transition-colors shadow-sm">
          <Heart size={20} />
        </button>
      </div>

      {/* 🛍️ Marketplace Buttons (Modern UI) */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {shopeeUrl ? (
          <a href={shopeeUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#ee4d2d] hover:bg-[#d74325] text-white font-bold text-lg py-3.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <svg className="w-6 h-6 fill-current drop-shadow-sm" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.9414 17.9633c.229-1.879-.981-3.077-4.1758-4.0969-1.548-.528-2.277-1.22-2.26-2.1719.065-1.056 1.048-1.825 2.352-1.85a5.2898 5.2898 0 0 1 2.8838.89c.116.072.197.06.263-.039.09-.145.315-.494.39-.62.051-.081.061-.187-.068-.281-.185-.1369-.704-.4149-.983-.5319a6.4697 6.4697 0 0 0-2.5118-.514c-1.909.008-3.4129 1.215-3.5389 2.826-.082 1.1629.494 2.1078 1.73 2.8278.262.152 1.6799.716 2.2438.892 1.774.552 2.695 1.5419 2.478 2.6969-.197 1.047-1.299 1.7239-2.818 1.7439-1.2039-.046-2.2878-.537-3.1278-1.19l-.141-.11c-.104-.08-.218-.075-.287.03-.05.077-.376.547-.458.67-.077.108-.035.168.045.234.35.293.817.613 1.134.775a6.7097 6.7097 0 0 0 2.8289.727 4.9048 4.9048 0 0 0 2.0759-.354c1.095-.465 1.8029-1.394 1.9449-2.554zM11.9986 1.4009c-2.068 0-3.7539 1.95-3.8329 4.3899h7.6657c-.08-2.44-1.765-4.3899-3.8328-4.3899zm7.8516 22.5981-.08.001-15.7843-.002c-1.074-.04-1.863-.91-1.971-1.991l-.01-.195L1.298 6.2858a.459.459 0 0 1 .45-.494h4.9748C6.8448 2.568 9.1607 0 11.9996 0c2.8388 0 5.1537 2.5689 5.2757 5.7898h4.9678a.459.459 0 0 1 .458.483l-.773 15.5883-.007.131c-.094 1.094-.979 1.9769-2.0709 2.0059z"/>
            </svg>
            <span className="tracking-wide drop-shadow-sm">Shopee</span>
          </a>
        ) : (
          <button disabled className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-400 font-bold text-lg py-3.5 rounded-xl cursor-not-allowed transition-all duration-300">
            <svg className="w-6 h-6 fill-current drop-shadow-sm" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.9414 17.9633c.229-1.879-.981-3.077-4.1758-4.0969-1.548-.528-2.277-1.22-2.26-2.1719.065-1.056 1.048-1.825 2.352-1.85a5.2898 5.2898 0 0 1 2.8838.89c.116.072.197.06.263-.039.09-.145.315-.494.39-.62.051-.081.061-.187-.068-.281-.185-.1369-.704-.4149-.983-.5319a6.4697 6.4697 0 0 0-2.5118-.514c-1.909.008-3.4129 1.215-3.5389 2.826-.082 1.1629.494 2.1078 1.73 2.8278.262.152 1.6799.716 2.2438.892 1.774.552 2.695 1.5419 2.478 2.6969-.197 1.047-1.299 1.7239-2.818 1.7439-1.2039-.046-2.2878-.537-3.1278-1.19l-.141-.11c-.104-.08-.218-.075-.287.03-.05.077-.376.547-.458.67-.077.108-.035.168.045.234.35.293.817.613 1.134.775a6.7097 6.7097 0 0 0 2.8289.727 4.9048 4.9048 0 0 0 2.0759-.354c1.095-.465 1.8029-1.394 1.9449-2.554zM11.9986 1.4009c-2.068 0-3.7539 1.95-3.8329 4.3899h7.6657c-.08-2.44-1.765-4.3899-3.8328-4.3899zm7.8516 22.5981-.08.001-15.7843-.002c-1.074-.04-1.863-.91-1.971-1.991l-.01-.195L1.298 6.2858a.459.459 0 0 1 .45-.494h4.9748C6.8448 2.568 9.1607 0 11.9996 0c2.8388 0 5.1537 2.5689 5.2757 5.7898h4.9678a.459.459 0 0 1 .458.483l-.773 15.5883-.007.131c-.094 1.094-.979 1.9769-2.0709 2.0059z"/>
            </svg>
            <span className="tracking-wide drop-shadow-sm">Shopee</span>
          </button>
        )}
        
        {lazadaUrl ? (
          <a href={lazadaUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#0f146d] hover:bg-[#0c105c] text-white font-bold text-lg py-3.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <svg className="w-6 h-6 fill-current drop-shadow-sm" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="tracking-wide drop-shadow-sm">Lazada</span>
          </a>
        ) : (
          <button disabled className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-400 font-bold text-lg py-3.5 rounded-xl cursor-not-allowed transition-all duration-300">
            <svg className="w-6 h-6 fill-current drop-shadow-sm" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="tracking-wide drop-shadow-sm">Lazada</span>
          </button>
        )}
      </div>
    </div>
  );
}
