require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
connectDB();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// serve static frontend
app.use('/', express.static(path.join(__dirname, '../../frontend/public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

const port = process.env.PORT || 4000;
app.listen(port, ()=> console.log(`JusticeConnect running at http://localhost:${port}`));
