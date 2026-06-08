const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const resumeDir = path.join(uploadDir, 'resumes');
const logoDir = path.join(uploadDir, 'logos');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      cb(null, resumeDir);
    } else if (file.fieldname === 'logo') {
      cb(null, logoDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Prefix filenames with timestamp to prevent duplicate collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File Format Validators
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    // Only PDF allowed
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF resume files are allowed!'), false);
    }
  } else if (file.fieldname === 'logo') {
    // JPG/JPEG/PNG allowed
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG company logo files are allowed!'), false);
    }
  } else {
    cb(null, true);
  }
};

// Define individual Multer uploads
const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single('resume');

const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
}).single('logo');

module.exports = {
  uploadResume,
  uploadLogo,
};
