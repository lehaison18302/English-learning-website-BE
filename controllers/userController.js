const User = require('../models/User'); 
const UserProgress = require('../models/UserProgress');
const UserController = {
    async getUserStats(req, res) {
        try {
            if (!req.firebaseUser || !req.firebaseUser.uid) {
                console.error("Error in getUserStats: Firebase user data or UID not found after verifyToken. req.firebaseUser:", req.firebaseUser);
                return res.status(401).json({ success: false, message: "Thông tin xác thực người dùng không hợp lệ hoặc không tìm thấy." });
            }
            const firebaseUid = req.firebaseUser.uid;
            const userInDb = await User.findOne({ firebaseUid: firebaseUid });
            if (!userInDb) {
                return res.status(404).json({ success: false, message: "Không tìm thấy người dùng trong cơ sở dữ liệu." });
            }
            const authenticatedUserId = userInDb._id;
            const latestProgress = await UserProgress.findOne({ userID: authenticatedUserId })
                .sort({update: -1})
                .lean();
            
            let currentCourseId = null;
            let currentSkillId = null;

            if (latestProgress) {
                currentCourseId = latestProgress.courseID; 
                currentSkillId = latestProgress.currentSkill;
            }

            res.status(200).json({
                success: true,
                data: {
                    userId: userInDb._id.toString(), 
                    name: userInDb.name,   
                    email: userInDb.email,
                    totalXp: userInDb.xp || 0,
                    currentStreak: userInDb.streak ? (userInDb.streak.current || 0) : 0,
                    progress: {
                        currentCourseId: currentCourseId,
                        currentSkillId: currentSkillId,
                    }            
                }
            });
        } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ khi lấy thông tin người dùng.", detailedError: error.message });
        }
    }
};

module.exports = UserController;