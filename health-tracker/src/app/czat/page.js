'use client'
import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [client, setClient] = useState(null);

  useEffect(() => {
    const mqttClient = mqtt.connect('ws://localhost:1883'); // Adres serwera MQTT

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      setClient(mqttClient);

      // Subskrybuj kanał czatu
      mqttClient.subscribe('chat');
    });

    mqttClient.on('message', (topic, message) => {
      const newMessages = [...messages, message.toString()];
      setMessages(newMessages);
    });

    return () => {
      if (client) {
        client.end();
      }
    };
  }, [messages, client]);

  const sendMessage = () => {
    if (client) {
      client.publish('chat', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
