// middleware/verifyToken.js
const admin = require("../config/firebase"); // import firebase admin SDK

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ message: "Không có token" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decoded;

    // In thông tin user sau khi decode để test
    console.log("Decoded Firebase User:", decoded);

    // Lấy custom claim isAdmin từ decoded (nếu có)
    req.isAdmin = decoded.isAdmin === 1;

    next();
  } catch (err) {
    console.error("Lỗi xác thực Firebase:", err);
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};

module.exports = verifyToken;
