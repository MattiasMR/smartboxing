// Image preloader and cache utility
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const cacheImage = async (src, cacheName = 'hospital-images-v1') => {
  if ('caches' in window) {
    try {
      const cache = await caches.open(cacheName);
      const response = await fetch(src);
      await cache.put(src, response);
      console.log(`Image cached: ${src}`);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }
};

export const getCachedImage = async (src, cacheName = 'hospital-images-v1') => {
  if ('caches' in window) {
    try {
      const cache = await caches.open(cacheName);
      const response = await cache.match(src);
      if (response) {
        console.log(`Image loaded from cache: ${src}`);
        return response.url;
      }
    } catch (error) {
      console.error('Failed to get cached image:', error);
    }
  }
  return src; // Fallback to original src
};

export const initImageCache = async () => {
  // Import images to get the correct URLs with Vite
  const hospitalBgUrl = new URL('../assets/hospital-bg-optimized.jpg', import.meta.url).href;
  const hospitalLogoUrl = new URL('../assets/hospital-logo.png', import.meta.url).href;
  
  const criticalImages = [hospitalBgUrl, hospitalLogoUrl];

  for (const imageSrc of criticalImages) {
    try {
      await cacheImage(imageSrc);
    } catch (error) {
      console.warn(`Failed to preload image: ${imageSrc}`, error);
    }
  }
};
