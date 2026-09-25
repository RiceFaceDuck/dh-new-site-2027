import { useState, useEffect, useRef } from 'react';
import { getRenderableImageUrl } from '../../utils/imageUtils';

/**
 * LazyImage Component
 * Loads an image only when it enters the viewport using IntersectionObserver.
 * Displays a nice pulse placeholder while loading.
 * Automatically handles Google Drive links and fallback images on error.
 */
const LazyImage = ({ src, alt, className = "", placeholderClassName = "bg-slate-200 animate-pulse", onLoad, onError, fallbackSrc = "/logo.png", ...rest }) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Reset state if src changes
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  useEffect(() => {
    // Fallback if IntersectionObserver is not supported
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect(); // Stop observing once it's in view
        }
      },
      { rootMargin: '100px 0px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const finalSrc = (hasError || !src) ? fallbackSrc : getRenderableImageUrl(src);
  
  // Prevent object-contain from overriding if user passes object-contain or similar
  const imgObjectFit = className.includes('object-') ? '' : 'object-contain';

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder / Skeleton */}
      {!isLoaded && (
        <div className={`absolute inset-0 w-full h-full ${placeholderClassName}`}></div>
      )}

      {/* Actual Image */}
      {isIntersecting && finalSrc && (
        <img 
          src={finalSrc}
          alt={alt}
          className={`w-full h-full transition-all duration-500 ${imgObjectFit} ${isLoaded ? 'opacity-100 blur-none scale-100' : 'opacity-0 blur-xs scale-105'} ${className} ${hasError ? 'p-4 opacity-40' : ''}`}
          onLoad={(e) => {
            setIsLoaded(true);
            if (onLoad) onLoad(e);
          }}
          onError={(e) => {
             if (!hasError && fallbackSrc) {
               setHasError(true);
             } else {
               setIsLoaded(true); 
               if (onError) onError(e);
             }
          }}
          referrerPolicy="no-referrer"
          {...rest}
          loading="lazy" 
        />
      )}
    </div>
  );
};

export default LazyImage;
