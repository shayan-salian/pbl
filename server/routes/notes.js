import { Router } from 'express';
import multer from 'multer';
import { upload } from '../config/gridfs.js'; 
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb'; // Use the native driver's GridFSBucket

const notesRouter = Router();

// Initialize Multer with the GridFsStorage
const uploadHandler = multer({ storage: upload });

// --- MIDDLEWARE: Check connection state before processing files ---
const checkDbConnection = (req, res, next) => {
    // Mongoose readyState 1 means 'connected'
    if (mongoose.connection.readyState !== 1) {
        // Block the request if the connection is not open
        return res.status(503).send({ 
            message: 'Database connection is temporarily unavailable. Please try again in a moment.' 
        });
    }
    next();
};


// --- POST route for file upload (/api/notes/upload) ---
notesRouter.post('/upload', 
    checkDbConnection, // <<< FIX: Ensure connection is open
    uploadHandler.single('file'), // 'file' is the name of the form field
    (req, res) => {
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded.' });
        }
        res.status(201).send({ 
            message: 'File uploaded successfully.',
            fileId: req.file.id,
            filename: req.file.filename
        });
    }
);

// --- GET route to retrieve a list of files (/api/notes) ---
notesRouter.get('/', checkDbConnection, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'notes' });
        
        // Find all files in the 'notes' bucket and return metadata
        const files = await bucket.find({}).toArray(); 
        
        if (!files || files.length === 0) {
            return res.status(404).send({ message: 'No files found.' });
        }
        res.send(files);
    } catch (err) {
        res.status(500).send({ error: 'Failed to retrieve files.' });
    }
});

// --- GET route to download a file by ID (/api/notes/:fileId) ---
notesRouter.get('/:fileId', checkDbConnection, (req, res) => {
    try {
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'notes' });

        // Stream the file from MongoDB to the response
        bucket.openDownloadStream(new mongoose.Types.ObjectId(req.params.fileId))
            .on('error', (err) => {
                console.error("Error downloading file:", err);
                return res.status(404).send({ message: 'File not found.' });
            })
            .pipe(res);
            
    } catch (err) {
        res.status(500).send({ error: 'Invalid File ID or server error.' });
    }
});

export default notesRouter;