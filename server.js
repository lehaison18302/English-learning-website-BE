require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Kết nối với MongoDB
mongoose.connect('mongodb+srv://nttquyen041220:Nttq@learn-eng-cluster.qc2hm.mongodb.net/Learning-English-Web', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.log('MongoDB connection error:', err.message));


app.use(express.json());

// Sử dụng router từ file routes
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;