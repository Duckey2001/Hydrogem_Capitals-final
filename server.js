require('dotenv').config();
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const csrf = require('csurf');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const userController = require('./js/userController');
const withdrawRouter = require('./js/withdraw');

const app = express();

// Database connection (admin accounts)
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Database connection error:', err));

// Admin model
const Admin = mongoose.model('Admin', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
}));

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// CSRF protection (token delivered to the browser via /api/csrf-token)
const csrfProtection = csrf({ cookie: true });

// Rate limiting for authentication attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 attempts per windowMs
  message: 'Too many attempts, please try again later'
});

// HTTPS redirection in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Expose a CSRF token for browser clients
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ---------------------------------------------------------------------------
// User authentication (PostgreSQL via js/userController.js)
// ---------------------------------------------------------------------------
const userValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
];

function runValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

app.post(
  '/api/users/register',
  loginLimiter,
  csrfProtection,
  userValidation,
  runValidation,
  userController.register
);

app.post(
  '/api/users/login',
  loginLimiter,
  csrfProtection,
  userValidation,
  runValidation,
  userController.login
);

// ---------------------------------------------------------------------------
// Withdrawals
// ---------------------------------------------------------------------------
app.use('/api', withdrawRouter);

// ---------------------------------------------------------------------------
// Admin authentication (MongoDB)
// ---------------------------------------------------------------------------
app.post('/api/admin/login',
  loginLimiter,
  csrfProtection,
  [
    body('username').trim().escape(),
    body('password').isLength({ min: 12 })
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Find admin
      const admin = await Admin.findOne({ username });

      if (!admin || !admin.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, admin.passwordHash);

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Create JWT token
      const token = jwt.sign(
        { adminId: admin._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Set secure cookie
      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      });

      res.json({ success: true });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
  const token = req.cookies.adminToken;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Protected admin route example
app.get('/api/admin/dashboard', authenticateAdmin, (req, res) => {
  res.json({ message: 'Welcome to the admin dashboard' });
});

// Serve the static front-end (login.html, register.html, dashboards, ...)
app.use(express.static(path.join(__dirname)));

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next(err);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
