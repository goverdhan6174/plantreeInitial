const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const DB_CONNECT_URI = process.env.DB_CONNECT_URI;

async function connectDB() {

    try {
        const client = new MongoClient(DB_CONNECT_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Connect to the MongoDB cluster
        await client.connect();

        // Make the appropriate DB calls
        const db = client.db('dbPlantree');

        // Call To Users Collection
        let UsersCollection = db.collection("Users");
        let TreesCollection = db.collection("Trees");
        let AuthCollection = db.collection("Auth");

        console.log("connected to database..." + db.databaseName);

        return { AuthCollection, UsersCollection, TreesCollection, client };

    } catch (e) {
        if (client !== undefined) {
            client.close();
            console.error("closed the db connection")
        }
        console.error("something bad happened" + e);
    } finally {
        //Its important too close the TCP connection
        // console.log("database connection is not closed")
        // await client.close();
    }
}

module.exports = connectDB;
