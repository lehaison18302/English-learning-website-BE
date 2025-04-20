// middleware/verifyToken.js
const admin = require("../firebase");
const User = require("../models/User"); // model mongoose của bạn

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ message: "Không có token" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decoded;

    // Kiểm tra và lưu user vào DB nếu chưa có
    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      });
    }

    req.user = user; // gán user từ DB
    next();
  } catch (err) {
    console.error("Lỗi xác thực Firebase:", err);
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};

module.exports = verifyToken;
