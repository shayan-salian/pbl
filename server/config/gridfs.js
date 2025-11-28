import { GridFsStorage } from 'multer-gridfs-storage';
import dotenv from 'dotenv';

dotenv.config();

const storage = new GridFsStorage({
  url: process.env.MONGO_URI, // direct URI
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      filename: `${Date.now()}_${file.originalname}`,
      bucketName: 'notes',
      metadata: {
        uploaderId: req.user ? req.user._id : 'anonymous',
        originalName: file.originalname,
        mimeType: file.mimetype
      }
    };
  }
});

export const upload = storage;
