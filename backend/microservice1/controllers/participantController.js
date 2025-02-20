const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Participant = require('../models/participant');

const JWT_SECRET = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';

const registerParticipant = async (req, res) => {
  const { username, password, name, age, email, role } = req.body;

  const existingParticipant = await Participant.findOne({ username });
  if (existingParticipant)
    return res.status(400).json({ message: 'Participant already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('hashedPassword: ', hashedPassword);

  const participant = new Participant({
    username,
    password: hashedPassword,
    name,
    age,
    email,
    role,
  });
  await participant.save();
  const token = jwt.sign(
    { userId: participant._id, role: participant.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.status(201).json({
    token,
    message: 'Participant registered successfully',
    participantId: participant._id,
  });
};

const loginParticipant = async (req, res) => {
  const { username, password } = req.body;

  const participant = await Participant.findOne({ username });
  if (!participant)
    return res.status(400).json({ message: 'Invalid username or password' });

  const isPasswordValid = await bcrypt.compare(password, participant.password);
  if (!isPasswordValid)
    return res.status(400).json({ message: 'Invalid username or password' });

  const token = jwt.sign(
    { userId: participant._id, role: participant.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({
    token,
    participantId: participant._id,
    role: participant.role,
    message: 'Login successful',
  });
};

module.exports = { registerParticipant, loginParticipant };
