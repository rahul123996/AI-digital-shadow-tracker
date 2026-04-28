const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const path = require('path');
const fs = require('fs');

const apiRoutes = require('./routes/apiRoutes');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }),
);
app.use(xss());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'AI Shadow Tracker Backend' });
});

app.use('/api', apiRoutes);

// Serve the built React frontend if it exists.
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/(api|health|__).*).*/, (req, res, next) => {
    const indexFile = path.join(frontendDist, 'index.html');
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    return next();
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: { message: err.message || 'Internal Server Error' },
  });
});

module.exports = app;
