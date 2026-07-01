const express = require('express');
const {
  listTailors,
  getTailorById,
  getPortfolioByTailorId,
} = require('../controllers/tailorController');
const tailorSelf = require('../controllers/tailorSelfController');
const tailorDashboard = require('../controllers/tailorDashboardController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const {
  uploadPortfolioImage,
  uploadFabricImage,
  uploadProfileImage,
} = require('../middleware/multerTailorAssets');
const { sendError } = require('../utils/response');

const router = express.Router();

function runMulter(mw) {
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (err) {
        return sendError(res, err.message || 'Upload failed', 400);
      }
      return next();
    });
  };
}

// --- Authenticated tailor "me" routes (must be registered before /:id) ---
router.get('/me/dashboard', requireAuth, requireRole('tailor'), tailorDashboard.getDashboardAnalytics);
router.get('/me', requireAuth, requireRole('tailor'), tailorSelf.getMe);
router.patch('/me', requireAuth, requireRole('tailor'), tailorSelf.patchMe);
router.post(
  '/me/profile-image',
  requireAuth,
  requireRole('tailor'),
  runMulter(uploadProfileImage),
  tailorSelf.uploadProfileImage
);

router.get('/me/fabrics', requireAuth, requireRole('tailor'), tailorSelf.listFabrics);
router.post(
  '/me/fabrics',
  requireAuth,
  requireRole('tailor'),
  runMulter(uploadFabricImage),
  tailorSelf.createFabric
);
router.post(
  '/me/fabrics/:fabricId/image',
  requireAuth,
  requireRole('tailor'),
  runMulter(uploadFabricImage),
  tailorSelf.uploadFabricPhoto
);
router.patch('/me/fabrics/:fabricId', requireAuth, requireRole('tailor'), tailorSelf.patchFabric);
router.delete('/me/fabrics/:fabricId', requireAuth, requireRole('tailor'), tailorSelf.deleteFabric);

router.post(
  '/me/portfolio',
  requireAuth,
  requireRole('tailor'),
  runMulter(uploadPortfolioImage),
  tailorSelf.addPortfolio
);
router.delete('/me/portfolio/:itemId', requireAuth, requireRole('tailor'), tailorSelf.deletePortfolioItem);

// --- Public ---
router.get('/', listTailors);
router.get('/:id/portfolio', getPortfolioByTailorId);
router.get('/:id', getTailorById);

module.exports = router;
