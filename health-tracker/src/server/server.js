const express = require('express');
const { connect } = require('./db/conn')
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

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
  
      // Assuming the users collection has fields 'email' and 'password'
      const { email, password } = req.body;
  
      // Check if the email is already registered
      const existingUser = await db.collection('users').findOne({ email: email });
  
      if (existingUser) {
        // Email is already in use
        return res.status(400).json({ error: 'Email is already registered' });
      }
  
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user object
      const newUser = {
        email: email,
        password: hashedPassword,
      };
  
      // Insert the new user into the database
      const result = await db.collection('users').insertOne(newUser);
  
      if (result.insertedCount === 1) {
        // User registration successful
        res.status(201).json({ success: true, user: newUser });
      } else {
        // Failed to insert user
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
  
      // Assuming the users collection has fields 'email' and 'password'
      const { email, password } = req.body;
      
      // Fetch user from the database based on the provided email
      const user = await db.collection('users').findOne({ email });
  
      if (!user) {
        // User not found
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Compare the provided password with the hashed password from the database
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        // Passwords do not match
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Successfully authenticated
      res.json({ success: true, user });
      
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
    } 
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