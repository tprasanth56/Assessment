const express = require('express');
const {
  registerParticipant,
  loginParticipant,
} = require('../controllers/participantController');
const router = express.Router();

// Register route for participants
router.post('/register/participant', registerParticipant);

// Login route for participants
router.post('/login/participant', loginParticipant);

module.exports = router;
