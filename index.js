const express = require("express");
var cors = require('cors')

//import Middlerware
const tokenMiddleware = require('./middleware/jwtVerificationMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

//Routes
const authRoute = require("./routes/auth");
const treeRoute = require('./routes/treeRoute');
const searchRoute = require('./routes/searchRoute');

//Global Middleware
app.use(express.json());
app.use(cors())

app.get('/' , (req, res) => {res.send("SMILE :)");})
app.get('/dashboard' , (req, res) => {res.send("dashboard");})

//Route Middlewares
app.use("/api/user", authRoute);
app.use(tokenMiddleware);

//rest routes are the Private Routes
app.use('/api/tree', treeRoute);
app.use('/api/search', searchRoute);

app.listen(PORT, () => console.log("Server is Up and Runnig on port " + PORT));
