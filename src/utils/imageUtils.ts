export const processImageToWebP = (
  file: File, 
  maxWidth: number = 1200, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (f) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Canvas context not available');
          return;
        }
        
        ctx.drawImage(img, 0, 0, w, h);
        const webpUrl = canvas.toDataURL('image/webp', quality);
        resolve(webpUrl);
      };
      img.onerror = () => reject('Failed to load image');
      if (f.target?.result) {
        img.src = f.target.result as string;
      } else {
        reject('FileReader result is null');
      }
    };
    reader.onerror = () => reject('FileReader error');
    reader.readAsDataURL(file);
  });
};
