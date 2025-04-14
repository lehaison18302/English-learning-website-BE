const express = require('express');
const router = express.Router();
const questRoutes = require('./questRoutes');

router.get('/', (req, res) => {
    res.send('Hello from Express.js!');
});

router.use('/quests', questRoutes);

module.exports = router;