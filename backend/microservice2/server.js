const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const amqp = require('amqplib');

const port = 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/auditLogs', { useNewUrlParser: true, useUnifiedTopology: true });


const AuditSchema = new mongoose.Schema({
  deletedRecord: Object,
  deletedAt: { type: Date, default: Date.now },
});
 
const AuditLog = mongoose.model('Audit', AuditSchema);
 

// Route to log deletes
// app.post('/audit', async (req, res) => {
//   const log = new AuditLog(req.body);
//   await log.save();
//   res.status(201).send(log);
// });

async function startAuditService() {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue('auditQueue');
 
  channel.consume('auditQueue', async (msg) => {
    if (msg !== null) {
      console.log('Message Received:____________ ', msg);
      const deletedRecord = JSON.parse(msg.content.toString('utf-8'));
      console.log('deleteRecord:________', deletedRecord);
      const audit = new AuditLog({ deletedRecord });
      await audit.save();
      channel.ack(msg);
    }
  });
}
 
startAuditService();

// Start Server
app.listen(port, () => {
  console.log(`Microservice2 running on http://localhost:${port}`);
});