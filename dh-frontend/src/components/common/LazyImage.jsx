import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyImage Component
 * Loads an image only when it enters the viewport using IntersectionObserver.
 * Displays a nice pulse placeholder while loading.
 */
const LazyImage = ({ src, alt, className = "", placeholderClassName = "bg-slate-200 animate-pulse", ...props }) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Fallback if IntersectionObserver is not supported (rare in modern browsers)
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
      { rootMargin: '100px 0px' } // Start loading 100px before it enters the viewport
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder / Skeleton */}
      {!isLoaded && (
        <div className={`absolute inset-0 w-full h-full ${placeholderClassName}`}></div>
      )}

      {/* Actual Image */}
      {isIntersecting && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)} // Prevent endless skeleton on error
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
