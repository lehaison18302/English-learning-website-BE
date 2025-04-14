const QuestService = require("../services/questService");

//  Admin: Quản lý nhiệm vụ hàng ngày <thêm, sửa, xóa>
exports.createDailyTask = async (req, res) => {
    try {
        const task = await QuestService.createDailyTask(req.body);
        res.status(201).json({ message: "Nhiệm vụ mới đã được tạo", task });
    } catch (error) {
        res.status(400).json({message: error.message });
    }
};

exports.updateDailyTask = async (req, res) => {
    try {
        const updatedTask = await QuestService.updateTask(req.params.id, req.body);
        res.status(200).json({ message: "Nhiệm vụ đã cập nhật", updatedTask });
    } catch (error) {
        res.status(400).json({message: error.message });
    }
};

exports.deleteDailyTask = async (req, res) => {
    try {
        await QuestService.deleteTask(req.params.id);
        res.status(200).json({ message: "Nhiệm vụ đã bị xóa" });
    } catch (error) {
        res.status(400).json({message: error.message });
    }
};
