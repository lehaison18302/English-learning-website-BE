const User = require('../models/User');

async function ensureDbUser(req, res, next) {
    // Middleware này phải chạy SAU verifyToken, nên req.firebaseUser đã tồn tại
    if (!req.firebaseUser || !req.firebaseUser.uid) {
        console.error("ensureDbUser: req.firebaseUser.uid is missing. verifyToken might have failed or not run.");
        return res.status(401).json({ success: false, message: 'Thông tin xác thực người dùng không đầy đủ.' });
    }

    const firebaseUid = req.firebaseUser.uid;
    const email = req.firebaseUser.email;
    const nameFromBody = req.body.name;
    const name = nameFromBody || req.firebaseUser.displayName || req.firebaseUser.name || email.split('@')[0] || 'New User';
    const avatar = req.firebaseUser.picture || null;

    try {
        let userInDb = await User.findOne({ firebaseUid: firebaseUid });

        if (!userInDb) {
            console.log(`User (Firebase UID: ${firebaseUid}) not found in MongoDB. Creating...`);
            const existingUserWithEmail = await User.findOne({ email: email });
            if (existingUserWithEmail && existingUserWithEmail.firebaseUid !== firebaseUid) {
                console.error(`CRITICAL: Email ${email} already exists with firebaseUid ${existingUserWithEmail.firebaseUid} while creating for ${firebaseUid}.`);
                return res.status(409).json({
                    success: false,
                    message: `Email ${email} đã được liên kết với một tài khoản khác.`
                });
            }

            userInDb = new User({
                firebaseUid: firebaseUid,
                email: email,
                name: name,
                avatar: avatar,
            });
            await userInDb.save();
            console.log(`User ${firebaseUid} created in MongoDB (_id: ${userInDb._id}).`);
        } else {
            let needsSave = false;
            if (nameFromBody && userInDb.name !== nameFromBody) {
                userInDb.name = nameFromBody;
                needsSave = true;
            }
            if (avatar && userInDb.avatar !== avatar) { // So sánh với avatar từ firebase token
                 userInDb.avatar = avatar;
                 needsSave = true;
            }
            if (needsSave) {
                await userInDb.save();
                console.log(`User ${firebaseUid} info updated in MongoDB.`);
            }
        }
        req.dbUser = userInDb;
        next();
    } catch (error) {
        console.error('Error in ensureDbUser middleware:', error);
        if (error.code === 11000) {
            const recoveredUser = await User.findOne({ firebaseUid: firebaseUid });
            if (recoveredUser) {
                req.dbUser = recoveredUser;
                console.warn(`Recovered from potential duplicate key error: User ${firebaseUid} found.`);
                return next();
            }
            return res.status(409).json({ success: false, message: 'Lỗi tạo/đồng bộ người dùng: Thông tin có thể đã tồn tại.' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server khi xử lý dữ liệu người dùng.' });
    }
}

module.exports = ensureDbUser;