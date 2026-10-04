const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes'); 
const errorHandler = require('./middleware/errorHandler');
const colorRoutes = require('./routes/colorRoutes');
const patternRoutes = require('./routes/patternRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'WallCanva API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/colors', colorRoutes);
app.use('/api/patterns', patternRoutes);
app.use(errorHandler);
app.use('/api/projects', projectRoutes);

module.exports = app;
