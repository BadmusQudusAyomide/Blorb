// Type definitions for Cloudinary response
interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  error?: {
    message: string;
  };
}

/**
 * Uploads an image to Cloudinary using the Upload API
 * @param file The file to upload
 * @returns Promise that resolves with the secure URL of the uploaded image
 */
export const uploadImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    
    fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then((data: CloudinaryResponse) => {
        if (data.error) {
          throw new Error(data.error.message);
        }
        if (data.secure_url) {
          resolve(data.secure_url);
        } else {
          throw new Error('Upload failed: No secure URL received');
        }
      })
      .catch(error => {
        console.error('Error uploading to Cloudinary:', error);
        reject(error);
      });
  });
}; 