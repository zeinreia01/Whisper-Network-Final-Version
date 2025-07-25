// Image compression utility function
export async function compressImage(file: File, isBackground: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Validate file type first
      if (!file.type.startsWith('image/')) {
        reject(new Error('Invalid file type. Please select an image file.'));
        return;
      }

      // Validate file size (10MB limit before processing)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('File too large. Please select an image smaller than 10MB.'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas not supported in this browser.'));
        return;
      }

      const img = new Image();

      img.onload = () => {
        try {
          // Set dimensions based on type
          const maxWidth = isBackground ? 1920 : 400;
          const maxHeight = isBackground ? 1080 : 400;
          
          let { width, height } = img;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = Math.min(width, maxWidth);
              height = width / aspectRatio;
              
              if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
              }
            } else {
              height = Math.min(height, maxHeight);
              width = height * aspectRatio;
              
              if (width > maxWidth) {
                width = maxWidth;
                height = width / aspectRatio;
              }
            }
          }

          // Ensure dimensions are valid
          width = Math.floor(width);
          height = Math.floor(height);

          if (width <= 0 || height <= 0) {
            reject(new Error('Invalid image dimensions.'));
            return;
          }

          canvas.width = width;
          canvas.height = height;

          // Clear canvas and draw image
          ctx.clearRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const quality = isBackground ? 0.8 : 0.7;
          
          // Try JPEG first, fallback to PNG if needed
          let compressedDataUrl;
          try {
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          } catch (jpegError) {
            try {
              compressedDataUrl = canvas.toDataURL('image/png');
            } catch (pngError) {
              reject(new Error('Failed to compress image. Please try a different image.'));
              return;
            }
          }

          // Validate result size (5MB limit for final base64)
          const resultSize = (compressedDataUrl.length * 3) / 4; // Approximate byte size
          if (resultSize > 5 * 1024 * 1024) {
            reject(new Error('Compressed image is still too large. Please try a smaller image.'));
            return;
          }

          // Clean up
          URL.revokeObjectURL(img.src);
          resolve(compressedDataUrl);
        } catch (processingError) {
          reject(new Error(`Image processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image. Please check the file and try again.'));
      };

      // Create object URL and load image
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      // Timeout after 30 seconds
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image processing timed out. Please try a smaller image.'));
      }, 30000);

    } catch (error) {
      reject(new Error(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}