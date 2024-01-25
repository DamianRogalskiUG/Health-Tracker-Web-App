const express = require('express');
const { connect } = require('./db/conn')
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const mqtt = require('mqtt');
const jwt = require('jsonwebtoken');


const app = express();
const port = 4000;
const JWT_SECRET = 'secret_password';


app.use(cors());
app.use(cookieParser());
app.use(express.json());

const createToken = (user) => {
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return token;
};

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};
  
  const mqttUrl = 'mqtt://localhost:1883';

  const mqttClient = mqtt.connect(mqttUrl);

  mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('user-registered', (err) => {
        if (!err) {
          console.log('Subscribed to topic: user-registered');
        }
      });
  });
  
  mqttClient.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });
  


  mqttClient.on('message', (topic, message) => {
    if (topic === 'user-registered') {
      const newUser = JSON.parse(message.toString());
      console.log('New user registered:', newUser);
    }
  });


app.get('/', async (req, res) => {
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
      res.json({ success: true, user, token });

    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
    } 
  });
  app.post('/logout', (req, res) => {

  });

app.patch('/users', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('users').updateOne(req.body);
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
        const result = await db.collection('users').deleteOne(req.body);
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.get('/measurements', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('measurements').find({}).toArray();
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.post('/measurements', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('measurements').findOne(req.body);
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.delete('/measurements', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('measurements').deleteOne(req.body);
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.patch('/measurements', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('measurements').updateOne(req.body);
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.get('/targets', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('targets').find({}).toArray();
        console.log(result);
        res.json(result);
        
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
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('targets').deleteOne(req.body);
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.patch('/targets', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('targets').updateOne(req.body);
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.get('/activities', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('activities').find({}).toArray();
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.post('/activities', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('activities').findOne(req.body);
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.delete('/activities', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('activities').deleteOne(req.body);
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.patch('/activities', async (req, res) => {
    try {
        const client = await connect();
        const db = client.db("health_tracker");
        const result = await db.collection('activities').updateOne(req.body);
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error)
    } 
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});