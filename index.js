// Simple Express backend for RFP MVP
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const rfpRoutes = require('./routes/rfps');

const app = express();
app.use(bodyParser.json());

app.use('/api/rfps', rfpRoutes);

app.get('/', (req, res) => res.send('RFP Backend running'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
