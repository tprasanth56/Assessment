const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
});

module.exports = mongoose.model('Participant', ParticipantSchema);
