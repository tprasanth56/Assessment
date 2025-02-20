const amqp = require('amqplib');

let channel, connection;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue('deleteResearchProgramQueue', { durable: true });
    console.log('🐇 Connected to RabbitMQ');
    return channel;
  } catch (error) {
    console.error('RabbitMQ Connection Error:', error);
  }
};

const getChannel = () => channel;

module.exports = { connectRabbitMQ, getChannel };
