const express = require('express');
const router = express.Router();
const { getSettings, updateSetting, updateSettings } = require('../controllers/settingsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All settings routes require admin authentication
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/', getSettings);
router.put('/:key', updateSetting);
router.put('/', updateSettings);

module.exports = router;
