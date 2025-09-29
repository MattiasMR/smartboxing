// Progressive background image loader component
import { useState, useEffect } from 'react';
import { preloadImage, getCachedImage } from '../utils/imageCache';

export const useProgressiveImage = (src, placeholder) => {
  const [imgSrc, setImgSrc] = useState(placeholder || null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Try to get cached image first
        const cachedSrc = await getCachedImage(src);
        
        // Preload the image
        await preloadImage(cachedSrc);
        
        if (!isCancelled) {
          setImgSrc(cachedSrc);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load image:', error);
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isCancelled = true;
    };
  }, [src]);

  return { imgSrc, isLoading, hasError };
};

export default useProgressiveImage;
