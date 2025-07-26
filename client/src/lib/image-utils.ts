
// Image compression utility function with improved error handling and auto-cropping
export async function compressImage(file: File, isBackground: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Validate file type first
      if (!file.type.startsWith('image/')) {
        reject(new Error('Invalid file type. Please select an image file (JPEG, PNG, GIF, WebP).'));
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
          // Set target dimensions based on type with proper aspect ratios
          let targetWidth, targetHeight;
          
          if (isBackground) {
            // Background photo - 16:9 aspect ratio, optimized for cover
            targetWidth = 1200;
            targetHeight = 675;
          } else {
            // Profile picture - 1:1 aspect ratio (square)
            targetWidth = 300;
            targetHeight = 300;
          }

          // Calculate crop dimensions to maintain aspect ratio
          const sourceAspectRatio = img.width / img.height;
          const targetAspectRatio = targetWidth / targetHeight;
          
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;

          if (sourceAspectRatio > targetAspectRatio) {
            // Image is wider than target - crop horizontally (center crop)
            sourceWidth = img.height * targetAspectRatio;
            sourceX = (img.width - sourceWidth) / 2;
          } else if (sourceAspectRatio < targetAspectRatio) {
            // Image is taller than target - crop vertically (center crop)
            sourceHeight = img.width / targetAspectRatio;
            sourceY = (img.height - sourceHeight) / 2;
          }

          // Set canvas dimensions
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Clear canvas and enable high-quality rendering
          ctx.clearRect(0, 0, targetWidth, targetHeight);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw cropped and resized image
          ctx.drawImage(
            img,
            Math.floor(sourceX), Math.floor(sourceY),
            Math.floor(sourceWidth), Math.floor(sourceHeight),
            0, 0,
            targetWidth, targetHeight
          );
          
          // Convert to base64 with appropriate compression
          const quality = isBackground ? 0.85 : 0.8;
          let compressedDataUrl;
          
          try {
            // Try JPEG compression first for better file size
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            
            // If JPEG results in larger file than PNG, use PNG (rare but possible for simple images)
            const pngDataUrl = canvas.toDataURL('image/png');
            if (pngDataUrl.length < compressedDataUrl.length) {
              compressedDataUrl = pngDataUrl;
            }
          } catch (compressionError) {
            // Fallback to PNG if JPEG fails
            try {
              compressedDataUrl = canvas.toDataURL('image/png');
            } catch (pngError) {
              reject(new Error('Failed to compress image. Your browser may not support this image format.'));
              return;
            }
          }

          // Validate result size (3MB limit for final base64)
          const resultSize = (compressedDataUrl.length * 3) / 4;
          if (resultSize > 3 * 1024 * 1024) {
            reject(new Error('Image is still too large after compression. Please try a smaller image.'));
            return;
          }

          // Clean up and resolve
          URL.revokeObjectURL(img.src);
          resolve(compressedDataUrl);
        } catch (processingError) {
          console.error('Image processing error:', processingError);
          reject(new Error(`Image processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`));
        }
      };

      img.onerror = (error) => {
        console.error('Image load error:', error);
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image. The file may be corrupted or in an unsupported format.'));
      };

      // Create object URL and load image with timeout
      try {
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;

        // Timeout after 15 seconds
        setTimeout(() => {
          if (!img.complete) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image loading timed out. Please try a smaller image.'));
          }
        }, 15000);
      } catch (urlError) {
        reject(new Error('Failed to process file. Please try again.'));
      }

    } catch (error) {
      console.error('Setup error:', error);
      reject(new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}
