const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getDashboard,
  updateDashboard,
  saveSelectedTrader,
  processPaymentProof
} = require('../controllers/financial.controller');

// Apply authentication middleware to all routes
router.use(protect);

// Financial dashboard routes
router.get('/dashboard', getDashboard);
router.put('/dashboard', updateDashboard);

// Trader selection route
router.post('/trader', saveSelectedTrader);

// Payment routes
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for storing payment screenshots
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../../uploads/payment-proofs');
        fs.mkdirSync(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: payment-type-timestamp-userId-uuid.extension
        const userId = req.user ? req.user.id : 'guest';
        const timestamp = Date.now();
        const fileExt = path.extname(file.originalname);
        const paymentType = req.body.paymentType || 'unknown';
        
        const filename = `payment-${paymentType}-${timestamp}-${userId}-${uuidv4().substring(0, 8)}${fileExt}`;
        cb(null, filename);
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

// Initialize multer with configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// POST endpoint for uploading payment proof
router.post('/proof-upload', upload.single('screenshot'), processPaymentProof);

module.exports = router;
