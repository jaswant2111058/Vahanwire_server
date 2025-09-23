const express = require('express');
const router = express.Router();
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');

router.post('/', createUser);
router.get('/', getUsers);
router.get('/:userId', getUserById);
router.put('/:userId', updateUser);
router.delete('/:userId', deleteUser);

module.exports = router;