const express = require("express");
const router = express.Router();
const QuestController = require("../controllers/questController");
const verifyToken = require('../middleware/verifyToken');
const ensureDbUser = require('../middleware/ensureDbUser');
const checkAdmin = require('../middleware/checkAdmin');

// Admin: Quản lý nhiệm vụ hàng ngày
router.post('/admin',verifyToken, ensureDbUser, checkAdmin, QuestController.createDailyTask);
router.put('/admin/:id',verifyToken, ensureDbUser, checkAdmin, QuestController.updateDailyTask);
router.delete('/admin/:id',verifyToken, ensureDbUser, checkAdmin, QuestController.deleteDailyTask);
router.get('/admin/all',verifyToken, ensureDbUser, checkAdmin, QuestController.getAllDailyTasksForAdmin);

// user 
router.get('/dailytask',verifyToken, ensureDbUser, QuestController.getUserDailyTasks);
module.exports = router;
