export const cropImageToCenter = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const size = 512;
          canvas.width = size;
          canvas.height = size;
  
          if (ctx) {
            let sx, sy, sWidth, sHeight;
            if (img.width > img.height) {
              sHeight = img.height;
              sWidth = sHeight;
              sx = (img.width - sWidth) / 2;
              sy = 0;
            } else {
              sWidth = img.width;
              sHeight = sWidth;
              sx = 0;
              sy = (img.height - sHeight) / 2;
            }
  
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to crop image'));
              }
            }, file.type);
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };  