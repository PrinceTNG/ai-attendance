const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get('/', authorizeRoles('admin'), getAllUsers);
router.post('/', authorizeRoles('admin'), createUser);
router.get('/:id', getUserById);
router.put('/:id', authorizeRoles('admin'), updateUser);
router.delete('/:id', authorizeRoles('admin'), deleteUser);
router.get('/:id/stats', getUserStats);

module.exports = router;
