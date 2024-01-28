const express = require('express');
const { connect } = require('./db/conn')
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const mqtt = require('mqtt');
const jwt = require('jsonwebtoken');
const http = require("http");
const WebSocket = require("ws");
const sse = require('server-sent-events');
const SseChannel = require('sse-channel');
const https = require('node:https');
const fs = require('node:fs');

const options = {
    key: fs.readFileSync('file.key'),
    cert: fs.readFileSync('cert.crt')
};

const app = express();
const port = 4000;
const JWT_SECRET = 'secret_password';
const server = https.createServer(options, app);

const mqttUrl = 'mqtt://localhost:1883';

const mqttClient = mqtt.connect(mqttUrl);

app.use(cors());
app.use(cookieParser());
app.use(express.json());

const createToken = (user) => {
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return token;
};

const logToFile = (message) => {
    fs.appendFileSync('logs.txt', `${new Date().toISOString()} - ${message}\n`);
  };
  
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog(...args);
    logToFile(args.join(' '));
  };

const dateChanel = new SseChannel();
setInterval(() => {
    dateChanel.send({ date: new Date().toISOString() });
}, 1000);

app.get('/events', sse, (req, res) => {
    const interval = setInterval(() => {
        res.sse('message', { message: 'Keep up the good work!' });
    }, 1000);

    res.on('close', () => {
        clearInterval(interval);
    });
});

app.get('/users', async (req, res) => {
    try {

        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('users').find({}).toArray();
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.post('/register', async (req, res) => {
    try {
      const client = await connect();
      const db = client.db("health_tracker");
      const { email, password } = req.body;
      const existingUser = await db.collection('users').findOne({ email: email });
  
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already registered' });
      }
        const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = {
        email: email,
        password: hashedPassword,
      };
  
      const result = await db.collection('users').insertOne(newUser);
      if (result) {
        console.log("user registered " + result);
        mqttClient.publish('user-registered', JSON.stringify(newUser));
        res.status(201).json({ success: true, user: newUser });

      } else {
        res.status(500).json({ error: 'Failed to register user' });
      }
  
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
    } 
  });

  app.post('/login', async (req, res) => {
    try {
      const client = await connect();
      const db = client.db("health_tracker");
      const { email, password } = req.body;
    
      const user = await db.collection('users').findOne({ email: email });
  
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = createToken(user);
      console.log("user logged " + user);

      res.json({ success: true, user, token });

    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
    } 
  });
  app.post('/logout', (req, res) => {
    try {
        console.log("user logged out");
      res.clearCookie('token');
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
    } 
  });

app.patch('/users', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const result = await db.collection('users').updateOne(
            { email: req.body.email },
            { $set: { password: hashedPassword } }
        );
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.delete('/users', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('users').deleteOne({
            email: req.body.email
        });
        if (result) {
            console.log("user deleted " + result);
            res.json(result);
        }
    } catch (error) {
        console.error(error)
    } 
});

app.get('/measurements', async (req, res) => {
    try {
      const client = await connect();
      const db = client.db('health_tracker');
      
      const email = req.query.email;
  
      if (!email) {
        return res.status(400).json({ error: 'Email is required in the query parameters' });
      }
        const result = await db.collection('measurements').find({ email }).toArray();
      
      console.log(result);
      res.json(result);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.post('/measurements', async (req, res) => {
    try {
        const { email, weight, height } = req.body;
        const client = await connect();
        const db = client.db("health_tracker");
        const existingUser = await db.collection('measurements').findOne(
            { email: email }

        );
        if (existingUser) {
            return res.status(400).json({ error: 'Email has already measurements' });
        } else {
            const result = await db.collection('measurements').insertOne(
                { email: email, weight: weight, height: height }
            );
            res.json(result);
        }
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.delete('/measurements', async (req, res) => {
    try {
        const { email } = req.body;
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('measurements').deleteOne(
            { email: email }
        );
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.patch('/measurements', async (req, res) => {
    try {
        const { email, weight, height } = req.body;
        const client = await connect();
        const db = client.db("health_tracker");
        const existingUser = await db.collection('measurements').findOne(
            { email: email }

        );
        if (!existingUser) {
            return res.status(400).json({ error: 'Email has no measurements' });
        } else {
            const result = await db.collection('measurements').updateOne({
                email: email
            },
                { $set: { weight: weight, height: height } }
            );
            console.log(result);
            res.json(result);
        }

        
    } catch (error) {
        console.log(error)
    } 
});

app.get('/targets', async (req, res) => {
    try {
        const name = req.query.name;
        const client = await connect();
        const db = client.db("health_tracker");
        if (!name) {
            const result = await db.collection('targets').find({}).toArray();
            console.log(result);
            res.json(result);
        } else {
            const result = await db.collection('targets').find({
                name: { $regex: new RegExp(name), $options: 'i'}
            }).toArray();
            console.log(result);
            res.json(result);
        }
        
    } catch (error) {
        console.log(error)
    } 
});

app.post('/targets', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('targets').findOne(req.body);
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.delete('/targets', async (req, res) => {
    try {
        const { name } = req.body;
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('targets').deleteOne(
            { name: name }
        );
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.patch('/targets', async (req, res) => {
    try {
        const { name, newName, desc } = req.body;
        const client = await connect();
        const db = client.db("health_tracker");
        if (newName) {
            const result = await db.collection('targets').updateOne(
                { name: name },
                { $set: { name: newName, desc: desc } }
            );
            console.log(result);
            res.json(result);
        } else {
            const result = await db.collection('targets').updateOne(
                { name: name },
                { $set: { desc: desc } }
            );
            console.log(result);
            res.json(result);
        }
        
    } catch (error) {
        console.log(error)
    } 
});

app.get('/activities', async (req, res) => {
    try {
        const name = req.query.name;
        const client = await connect();
        const db = client.db("health_tracker");
        if (!name) {
            const result = await db.collection('activities').find({}).toArray();
            console.log(result);
            res.json(result);
        } else {
            const result = await db.collection('activities').find({
                name: { $regex: new RegExp(name), $options: 'i'}
            }).toArray();
            console.log(result);
            res.json(result);
        }
        
    } catch (error) {
        console.log(error)
    } 
});

app.post('/activities', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('activities').insertOne(
            { 
                name: req.body.name,
                desc: req.body.desc,
            }
        );
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.delete('/activities', async (req, res) => {
    try {
        const { name } = req.body;
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('activities').deleteOne(
            { name: name }
        );
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.patch('/activities', async (req, res) => {
    try {
        const { name, newName, desc } = req.body;
        const client = await connect();
        const db = client.db("health_tracker");
        if (newName) {
            const result = await db.collection('activities').updateOne(
                { name: name },
                { $set: { name: newName, desc: desc } }
            );
            console.log(result);
            res.json(result);
        } else {
            const result = await db.collection('activities').updateOne(
                { name: name },
                { $set: { desc: desc } }
            );
            console.log(result);
            res.json(result);
        }
        
    } catch (error) {
        console.log(error)
    } 
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});