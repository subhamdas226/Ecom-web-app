const express = require('express');
const app = express();
const morgan = require('morgan');
require('dotenv/config');
//npm i dotenv
const mongoose = require('mongoose');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler')

const url = `mongodb+srv://ecomdb:1435051051@cluster0.uhtfs.mongodb.net/eshop-db?retryWrites=true&w=majority`;

app.use(cors());
app.options('*' , cors() )

//middleware
app.use(express.urlencoded({extended: true}))
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))
app.use(errorHandler)

   
// Routes
const productRoutes = require('./routes/products')
const categoriesRoutes = require('./routes/categories')
const usersRoutes = require('./routes/users')
const orderstRoutes = require('./routes/orders')

const api = process.env.API_URL;

app.use(`${api}+/products`, productRoutes);
app.use(`${api}+/categories`, categoriesRoutes);
app.use(`${api}+/users`, usersRoutes);
app.use(`${api}+/orders`, orderstRoutes);

//DB connection
mongoose.connect(process.env.CONNECTION_STRING,{ useNewUrlParser: true, useUnifiedTopology: true },).then(()=>{
    console.log('DB connection is ready...');
}).catch((err)=>{
    console.log(err)
})

// server listening
app.listen(3300,()=>{
    console.log(`http://localhost:3300/`);
    console.log(`server is running 3300 port`);
})
