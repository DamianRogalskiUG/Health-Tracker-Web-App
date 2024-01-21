// Inside my-express-app/app.js or index.js
const express = require('express');
const mosca = require('mosca');
const http = require('http');
const app = express();

// Set up HTTP server (needed for WebSocket support)
const server = http.createServer(app);

// Set up MQTT broker
const mqttServer = new mosca.Server({});

mqttServer.attachHttpServer(server);

mqttServer.on('clientConnected', (client) => {
  console.log('MQTT client connected:', client.id);
});

mqttServer.on('published', (packet, client) => {
  if (client) {
    console.log('MQTT message sent from:', client.id);
  }
});

mqttServer.on('subscribed', (topic, client) => {
  console.log('MQTT client subscribed to:', topic);
});

mqttServer.on('unsubscribed', (topic, client) => {
  console.log('MQTT client unsubscribed from:', topic);
});

mqttServer.on('clientDisconnected', (client) => {
  console.log('MQTT client disconnected:', client.id);
});

// Listen for MQTT connections on port 1883
server.listen(1883, () => {
  console.log('MQTT server listening on port 1883');
});

// Additional Express.js setup code...
