const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
app.use(cors());

require('./db');

const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(express.json());
console.log("Running Node version:", process.version);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
