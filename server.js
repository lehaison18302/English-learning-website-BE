const express = require('express');
const indexRouter = require('./routes/index');
const app = express();
const port = 3000;

// Sử dụng router từ file routes
const indexRouter = require('../routes/index');
app.use('/', indexRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
