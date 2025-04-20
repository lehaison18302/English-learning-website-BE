// routes/pronounceRoutes.js
const express = require('express');
const pronounceRouter = express.Router();
const Pronunciation = require('../models/Pronunciation');

// GET /api/pronounce — Trả về danh sách pronunciation từ MongoDB
pronounceRouter.get('/pronounce', async (req, res) => {
  try {
    const list = await Pronunciation.find().sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Error fetching pronunciation:', err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = pronounceRouter;
