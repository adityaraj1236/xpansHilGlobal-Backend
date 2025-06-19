const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created uploads directory at: ${uploadDir}`);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// POST /api/boq/upload
router.post('/upload', upload.single('boqFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  if (!fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'Uploaded file not found on server' });
  }

  try {
    const pdfBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(pdfBuffer); // ✅ correct function
    const text = data.text;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const entries = [];

    for (const line of lines) {
      // Match format: Description    Quantity    Unit    Unit Price    Total Price
      const match = line.match(/^(.+?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\w+)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\d+(?:\.\d+)?)/);
      if (match) {
        const [, description, quantity, unit, unitPrice, totalPrice] = match;
        entries.push({
          description: description.trim(),
          quantity: parseFloat(quantity),
          unit: unit.trim(),
          unitPrice: parseFloat(unitPrice),
          totalPrice: parseFloat(totalPrice),
        });
      }
    }

    res.json({
      entries,
      fileUrl: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    console.error('Error parsing PDF:', err);
    res.status(500).json({ error: 'Failed to parse BOQ file' });
  }
});

module.exports = router;
