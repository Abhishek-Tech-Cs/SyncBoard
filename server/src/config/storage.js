import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../../', ENV.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize Cloudinary if credentials are provided
const isCloudinaryConfigured = Boolean(
  ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('[Storage] Cloudinary configured successfully');
}

export const StorageService = {
  getUploadDir: () => uploadDir,

  /**
   * Process uploaded file:
   * Uploads to Cloudinary when configured (or when STORAGE_PROVIDER === 'cloudinary')
   * Falls back gracefully to local disk storage
   */
  processUpload: async (file) => {
    if (!file) throw new Error('No file provided');

    // Use Cloudinary if configured or explicitly requested
    if (isCloudinaryConfigured || ENV.STORAGE_PROVIDER === 'cloudinary') {
      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'syncboard/attachments',
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        });

        // Clean up temporary local upload file after Cloudinary upload
        if (fs.existsSync(file.path)) {
          await fs.promises.unlink(file.path).catch(() => {});
        }

        return {
          fileName: file.originalname,
          storedName: uploadResult.public_id,
          filePath: uploadResult.secure_url,
          fileSize: uploadResult.bytes || file.size,
          mimeType: file.mimetype,
          url: uploadResult.secure_url,
          provider: 'cloudinary',
          publicId: uploadResult.public_id,
        };
      } catch (cloudErr) {
        console.warn(`[Storage] Cloudinary upload failed (${cloudErr.message}). Falling back to local storage.`);
      }
    }

    // Local file storage
    const publicUrl = `/uploads/${file.filename}`;
    return {
      fileName: file.originalname,
      storedName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      url: publicUrl,
      provider: 'local',
      publicId: '',
    };
  },

  /**
   * Delete file from Cloudinary or local storage
   */
  deleteFile: async (filePath, publicId, provider = 'local') => {
    try {
      if (provider === 'cloudinary' && publicId) {
        await cloudinary.uploader.destroy(publicId);
        return;
      }

      if (filePath && fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.warn(`[Storage] Failed to delete file (${err.message})`);
    }
  },
};
