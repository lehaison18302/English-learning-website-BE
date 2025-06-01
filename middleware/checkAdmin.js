/*
const checkAdmin = (req, res, next) => {
  // Đảm bảo đã xác thực và decode token trước đó
  if (req.firebaseUser && req.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Bạn không có quyền truy cập (admin only)" });
};

module.exports = checkAdmin;
*/

const checkAdmin = (req, res, next) => {
  // Middleware này PHẢI chạy SAU verifyToken và ensureDbUser
  if (req.firebaseUser && req.dbUser && req.dbUser.role === 'admin') {
    return next();
  }
  console.log('Admin check failed. firebaseUser:', !!req.firebaseUser, 'dbUser:', !!req.dbUser, 'dbUser.role:', req.dbUser?.role);
  return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập tài nguyên này (yêu cầu quyền admin)." });
};

module.exports = checkAdmin;