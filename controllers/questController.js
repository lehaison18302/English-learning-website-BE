const QuestService = require("../services/questService");
const User = require('../models/User');

const QuestController = {
    async createDailyTask(req, res) {
        try {
            const task = await QuestService.createDailyTask(req.body);
            res.status(201).json({ message: "Nhiệm vụ mới đã được tạo", task });
        } catch (error) {
            res.status(400).json({message: error.message });
        }
    }, 
    async updateDailyTask(req, res) {
        try {
            const updatedTask = await QuestService.updateDailyTask(req.params.id, req.body);
            res.status(200).json({ success: true, message: "Nhiệm vụ đã cập nhật", data: updatedTask });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
    async deleteDailyTask(req, res) { 
        try {
            const result = await QuestService.deleteDailyTask(req.params.id);
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
    async getAllDailyTasksForAdmin(req, res) { 
         try {
             const tasks = await QuestService.getAllDailyTasksForAdmin();
             res.status(200).json({ success: true, data: tasks });
         } catch (error) {
             res.status(500).json({ success: false, message: error.message });
         }
    },

    /// USER ///
    async getUserDailyTasks(req, res) {
        try {
            if (!req.firebaseUser || !req.firebaseUser.uid) {
                console.error("Error in getUserDailyTasks: Firebase user data or UID not found after verifyToken. req.firebaseUser:", req.firebaseUser);
                return res.status(401).json({ success: false, message: "Thông tin xác thực người dùng không đầy đủ hoặc không hợp lệ." });
            }
            const firebaseUid = req.firebaseUser.uid;
            const userInDb = await User.findOne({ firebaseUid: firebaseUid });
            const userId = userInDb._id;
             if (!userId) {
                console.error("Error in getUserDailyTasks: userId not found on request object after verifyToken.");
                return res.status(401).json({ success: false, message: "User authentication data missing." });
            }
            const userDailyProgress = await QuestService.getUserDailyTasks(userId);
            res.status(200).json({ success: true, data: userDailyProgress });
        } catch (error) {
            console.error("Error in QuestController.getUserDailyTasks (controller level):", error);
            res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy nhiệm vụ hàng ngày.", detailedError: error.message });
        }
    },
};

module.exports = QuestController;
