const express = require("express");
const router = express.Router();
const QuestController = require("../controllers/questController");
const verifyToken = require("../middleware/verifyToken");
const checkAdmin = require("../middleware/checkAdmin");

// Admin: Quản lý nhiệm vụ hàng ngày
router.post("/admin", verifyToken, checkAdmin, QuestController.createDailyTask);
router.put("/admin/:id", verifyToken, checkAdmin, QuestController.updateDailyTask);
router.delete("/admin/:id", verifyToken, checkAdmin, QuestController.deleteDailyTask);


module.exports = router;
