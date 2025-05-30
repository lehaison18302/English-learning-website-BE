const checkAdmin = (req, res, next) => {
  // Đảm bảo đã xác thực và decode token trước đó
  if (req.firebaseUser && req.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Bạn không có quyền truy cập (admin only)" });
};

module.exports = checkAdmin;
