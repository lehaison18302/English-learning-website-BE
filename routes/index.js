const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello from Express.js!');
});

module.exports = router;