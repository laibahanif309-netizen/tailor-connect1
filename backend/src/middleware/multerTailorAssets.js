const fs = require('fs');
const path = require('path');
const multer = require('multer');

function makeUpload(subfolder) {
  const dir = path.join(process.cwd(), 'uploads', subfolder);
  fs.mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '') || '.jpg';
        const safe = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
        cb(null, safe);
      },
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image uploads are allowed'));
        return;
      }
      cb(null, true);
    },
  });
}

const portfolio = makeUpload('portfolio');
const fabrics = makeUpload('fabrics');
const profiles = makeUpload('profiles');

module.exports = {
  uploadPortfolioImage: portfolio.single('image'),
  uploadFabricImage: fabrics.single('image'),
  uploadProfileImage: profiles.single('image'),
};
