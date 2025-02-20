const mongoose = require('mongoose');

const ResearchProgramSchema = new mongoose.Schema({
  programName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: { type: Number, required: true },
  attachment: { type: String },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
});

module.exports = mongoose.model('ResearchProgram', ResearchProgramSchema);
