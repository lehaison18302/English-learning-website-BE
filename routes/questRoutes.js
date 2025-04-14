const express = require("express");
const router = express.Router();
const QuestController = require("../controllers/questController");

// Admin: Quản lý nhiệm vụ hàng ngày
router.post("/admin", QuestController.createDailyTask);
router.put("/admin/:id", QuestController.updateDailyTask);
router.delete("/admin/:id", QuestController.deleteDailyTask);


module.exports = router;
