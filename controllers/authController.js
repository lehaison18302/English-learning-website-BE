const admin = require('../config/firebase'); 
const ensureDbUser =  require('../middleware/ensureDbUser'); 

exports.setupUserAfterFirebaseRegistration = async (req, res) => {
    if (!req.dbUser) {
        return res.status(500).json({ success: false, message: "Lỗi: Không tìm thấy thông tin người dùng sau khi xử lý." });
    }
    const userInDb = req.dbUser;
    console.log(`Profile setup/sync complete for MongoDB user _id: ${userInDb._id}`);
    res.status(200).json({
        success: true,
        message: 'Hồ sơ người dùng đã được thiết lập/cập nhật trong cơ sở dữ liệu.',
        user: {
            id: userInDb._id, firebaseUid: userInDb.firebaseUid, name: userInDb.name,
            email: userInDb.email, avatar: userInDb.avatar, role: userInDb.role,
            xp: userInDb.xp, streak: userInDb.streak,
        }
    });
};

exports.getCurrentUserFromDb = async (req, res) => {
    if (!req.dbUser) {
        return res.status(500).json({ success: false, message: "Lỗi lấy thông tin người dùng." });
    }
    const user = req.dbUser;
    res.status(200).json({
        success: true,
        user: {
            id: user._id, firebaseUid: user.firebaseUid, name: user.name, email: user.email,
            avatar: user.avatar, role: user.role, xp: user.xp, streak: user.streak,
            currentCourseId: user.currentCourseId, currentSkillId: user.currentSkillId,
        }
    });
};