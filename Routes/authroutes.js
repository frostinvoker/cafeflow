const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Optional: test route to confirm it's working
router.get('/', (req, res) => {
  res.send('Auth route working!');
});

module.exports = router;
