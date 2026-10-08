import { useState, useEffect, useRef } from 'react';
import { getRenderableImageUrl, extractDriveId } from '../../utils/imageUtils';

/**
 * LazyImage Component
 * Loads an image only when it enters the viewport using IntersectionObserver.
 * Displays a nice pulse placeholder while loading.
 * Automatically handles Google Drive links and fallback images with multi-tier retry.
 */
const LazyImage = ({ 
  src, 
  alt, 
  className = "", 
  imgClassName = "",
  placeholderClassName = "bg-slate-200 animate-pulse", 
  onLoad, 
  onError, 
  fallbackSrc = "/logo.png", 
  ...rest 
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const [errorStep, setErrorStep] = useState(0);
  const imgRef = useRef(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setErrorStep(0);
    const initial = getRenderableImageUrl(src) || fallbackSrc;
    setCurrentSrc(initial);
  }, [src, fallbackSrc]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    // 🛡️ Safety Fallback: ถ้าอยู่ใน Virtualized Grid หรือ initial render นานเกิน 350ms ให้ปลดล็อคทันที ป้องกันกล่องสีเทาค้าง
    const timer = setTimeout(() => {
      setIsIntersecting(true);
    }, 350);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const handleImgError = (e) => {
    const driveId = extractDriveId(src || currentSrc);

    if (driveId && errorStep === 0) {
      setErrorStep(1);
      setCurrentSrc(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`);
      return;
    }

    if (driveId && errorStep === 1) {
      setErrorStep(2);
      setCurrentSrc(`https://drive.google.com/uc?export=view&id=${driveId}`);
      return;
    }

    // Final fallback
    if (!hasError && currentSrc !== fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
      setIsLoaded(true); // Ensure fallback is rendered and not hidden
    } else {
      setIsLoaded(true);
      setHasError(true);
      if (onError) onError(e);
    }
  };

  const handleImgLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  // Extract object-fit class from imgClassName or className, defaulting to object-contain
  const extractObjectFit = (classes) => {
    const match = (classes || '').match(/\bobject-(contain|cover|fill|none|scale-down)\b/);
    return match ? match[0] : '';
  };

  const imgObjectFit = extractObjectFit(imgClassName) || extractObjectFit(className) || 'object-contain';

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder / Skeleton */}
      {!isLoaded && (
        <div className={`absolute inset-0 w-full h-full ${placeholderClassName}`}></div>
      )}

      {/* Actual Image */}
      {isIntersecting && currentSrc && (
        <img 
          ref={(node) => {
            if (node && node.complete && node.naturalWidth > 0 && !isLoaded) {
              setIsLoaded(true);
            }
          }}
          loading="lazy"
          src={currentSrc}
          alt={alt || ''}
          className={`w-full h-full transition-all duration-300 ${imgObjectFit} ${isLoaded ? 'opacity-100 blur-none scale-100' : 'opacity-0 blur-xs scale-105'} ${imgClassName} ${hasError ? 'p-2 opacity-50' : ''}`}
          onLoad={handleImgLoad}
          onError={handleImgError}
          referrerPolicy="no-referrer"
          {...rest}
        />
      )}
    </div>
  );
};

export default LazyImage;
