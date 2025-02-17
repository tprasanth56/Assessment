const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const amqp = require('amqplib');

const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/medicalResearch', { useNewUrlParser: true, useUnifiedTopology: true });

// Models
const ResearchProgramSchema = new mongoose.Schema({
  programName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: { type: Number, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true }]
});

const ParticipantSchema = new mongoose.Schema({
  participantName: String,
  dateOfBirth: Date,
  email: String,
  password: String,
  contactNumber: String,
  attachment: String // File path for attachment
});

const ResearchProgram = mongoose.model('ResearchProgram', ResearchProgramSchema);
const Participant = mongoose.model('Participant', ParticipantSchema);

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

async function connectRabbitMQ() {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue('auditQueue');
  return channel;
}
 
let channel;
connectRabbitMQ().then((ch) => (channel = ch));

// Routes
app.post('/programs', async (req, res) => {
  console.log('body: ', req.body);
  const program = new ResearchProgram(req.body);

  await program.save();
  res.status(201).send(program);
});

app.get('/programs', async (req, res) => {
  const programs = await ResearchProgram.find().populate('participants');
  res.send(programs);
});

app.put('/programs/:id', async (req, res) => {
  const program = await ResearchProgram.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.send(program);
});

app.delete('/programs/:id', async (req, res) => {
  const program = await ResearchProgram.findByIdAndDelete(req.params.id);
  // Notify Microservice2 for audit
  // fetch('http://localhost:3002/audit', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ action: 'delete', record: program })
  // });
  if (program) {
    channel.sendToQueue('auditQueue', Buffer.from(JSON.stringify(program)));
  }
  res.json({ message: 'Deleted successfully' });
  res.send(program);
});
 

app.post('/participants', upload.single('attachment'), async (req, res) => {
  const participant = new Participant({ ...req.body, attachment: req.file.path });
  await participant.save();
  res.status(201).send(participant);
});

app.get('/participants', async (req, res) => {
  const programs = await Participant.find().populate('participants');
  res.send(programs);
});

const JWT_SECRET = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';

const users = [
  {
    username: 'tprasanth56',
    // password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    password: '12345678',
    role: 'admin'
  }
];

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Check if user already exists
  if (users.find(user => user.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save the user
  const user = { username, password: hashedPassword };
  users.push(user);

  res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Find the user
  const user = users.find(user => user.username === username);
  if (!user) {
    return res.status(400).json({ message: '1Invalid username or password' });
  }

  // Compare passwords
  // const isPasswordValid = await bcrypt.compare(password, user.password);
  const isPasswordValid = password == user.password;
  if (!isPasswordValid) {
    return res.status(400).json({ message: '2Invalid username or password' });
  }

  // Generate a JWT token
  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});

// Protected route example
app.get('/protected', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: 'You have access to protected data', user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Microservice1 running on http://localhost:${port}`);
});