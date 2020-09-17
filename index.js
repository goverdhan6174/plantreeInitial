const express = require("express");
const app = express();
const tokenMiddleware = require('./middleware/jwtVerificationMiddleware');

//Routes
const authRoute = require("./routes/auth");
const treeRoute = require('./routes/treeRoute');
const searchRoute = require('./routes/searchRoute');


//Global Middleware
app.use(express.json());

//Route Middlewares
app.use("/api/user", authRoute);
app.use(tokenMiddleware);
//rest routes are the Private Routes
app.use('/api/tree', treeRoute);
app.use('/api/search', searchRoute);


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log("Server is Up and Runnig on port " + PORT));
