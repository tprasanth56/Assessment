const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const participantRoutes = require('./routes/participantRoutes');
const researchProgramRoutes = require('./routes/researchProgramRoutes');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/medicalResearch', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(participantRoutes);
app.use(researchProgramRoutes);

app.listen(port, () => {
  console.log(`Microservice1 running on http://localhost:${port}`);
});
