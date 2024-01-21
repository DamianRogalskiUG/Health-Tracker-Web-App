const { MongoClient, Db, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://damianrogalski2002:Project123321@cluster0.8tyycyo.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

module.exports = {
  connect: async () => {
    try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      return client;
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    } 
  }
};
