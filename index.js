const express = require("express");
const app = express();
var cors = require('cors')
const tokenMiddleware = require('./middleware/jwtVerificationMiddleware');

//Routes
const authRoute = require("./routes/auth");
const treeRoute = require('./routes/treeRoute');
const searchRoute = require('./routes/searchRoute');


//Global Middleware
app.use(express.json());
app.use(cors())

//Route Middlewares
app.use("/api/user", authRoute);
app.use(tokenMiddleware);
//rest routes are the Private Routes
app.use('/api/tree', treeRoute);
app.use('/api/search', searchRoute);

app.get('/' , (req, res) => {res.send("Hello");})
app.get('/dashboard' , (req, res) => {res.send("dashboard");})



const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log("Server is Up and Runnig on port " + PORT));
