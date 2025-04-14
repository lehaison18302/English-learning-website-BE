const DailyTask = require('../models/DailyTask');
const UserDailyProgress = require('../models/UserDailyProgress');
const User = require('../models/User');
const Lesson = require('../models/Lesson'); 
const Exercise = require('../models/Exercise');
const UserProgress = require('../models/UserProgress'); // Assuming you have a UserProgress model

//admin tạo nhiệm vụ hàng ngày
exports.createDailyTask = async (data) => {
    const { title, type, target, xpReward } = data;
    const newTask = new DailyTask({ title, type, target, xpReward});
    return await newTask.save();
};

//admin cập nhật nhiệm vụ
exports.updateTask = async (id, data) => {
    const updatedTask = await DailyTask.findByIdAndUpdate(id, data, { new: true });
    if (!updatedTask) throw new Error('Task not found');
    return updatedTask;
};

// Admin: Xóa nhiệm vụ
exports.deleteTask = async (id) => {
    const deletedTask = await DailyTask.findByIdAndDelete(id);
    if (!deletedTask) throw new Error('Task not found');
    return deletedTask;
};

// User: Lấy danh sách nhiệm vụ hàng ngày
exports.getUserTasks = async (userID) => {
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const progress = await UserDailyProgress.findOne({
        userID,
        date: { $gte: startOfDay},
    }).populate('tasks.taskID');
    if (!progress) throw new Error('No daily tasks found for this user');
    return progress.tasks;
};

// User: Nhận nhiệm vụ hàng ngày mới
exports.assignDailyTasks = async (userID) => {
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const existingProgress = await UserDailyProgress.findOne({
        userID,
        date: { $gte: startOfDay }
    });
    if (existingProgress) {
        return existingProgress;
    }

    const tasks = await DailyTask.find({});
    const userTasks = tasks.map((task) => ({
        taskID: task._id,
        progress: 0,
        isCompleted: false,
    }));
    const newProgress = new UserDailyProgress({
        userID,
        tasks: userTasks,
        date: startOfDay,
    });
    return await newProgress.save();
};

// User: Cập nhật tiến độ nhiệm vụ
exports.updateTaskProgress = async (userID, taskId, progress) => {
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const userProgress = await UserDailyProgress.findOne({
        userID,
        date: { $gte: startOfDay }
    });
    
    if (!userProgress) throw new Error('No daily tasks found for this user');

    const task = userProgress.tasks.find(t => 
        t.taskID.toString() === taskId && !t.isCompleted
    );
    if (!task) throw new Error('Task not found or already completed');

    const dailyTask = await DailyTask.findById(taskId);
    task.progress = Math.min(progress, dailyTask.target);
    task.isCompleted = task.progress >= dailyTask.target;

    await userProgress.save();
    return userProgress;
};

// User: Hoàn thành nhiệm vụ (học bài mới, ôn tập)
exports.completeTask = async (userID, taskId) => {
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const userProgress = await UserDailyProgress.findOne({
        userID,
        date: { $gte: startOfDay }
    });
    
    const task = userProgress.tasks.find(t => 
        t.taskID.toString() === taskId && !t.isCompleted
    );
    if (!task) throw new Error('Nhiệm vụ không tồn tại hoặc đã hoàn thành');

    const dailyTask = await DailyTask.findById(taskId);
    const user = await User.findById(userID);

    // Cập nhật tiến độ
    task.progress = dailyTask.target;
    task.isCompleted = true;

    // Cập nhật XP
    user.xp += dailyTask.xpReward;

    // Cập nhật streak
    const lastActiveDate = user.streak.lastActive || new Date(0);
    const isConsecutive = new Date().getDate() - lastActiveDate.getDate() === 1;
    
    user.streak.current = isConsecutive ? user.streak.current + 1 : 1;
    user.streak.lastActive = new Date();

    await user.save();
    await userProgress.save();
    
    return { 
        xpEarned: dailyTask.xpReward,
        newStreak: user.streak.current 
    };
};

// Lấy bài học mới cho nhiệm vụ
exports.getNewLesson = async (userID) => {
    const userProgress = await UserProgress.findOne({ userID: userID }).populate('currentSkill');
    if (!userProgress) throw new Error('User progress not found');

    const currentSkill = userProgress.currentSkill;
    if (!currentSkill) throw new Error('Current skill not found');

    const lastCompletedLesson = userProgress.completedLessons[userProgress.completedLessons.length - 1];
    const nextLessonOrder = lastCompletedLesson ? lastCompletedLesson.lessonId.order + 1 : 1;

    const nextLesson = await Lesson.findOne({ skillID: currentSkill._id, order: nextLessonOrder });
    if (!nextLesson) throw new Error('Next lesson not found');
    return nextLesson;
};

// Lấy câu hỏi ôn tập từ bài đã học
exports.getReviewQuestions = async (userID) => {
    const userProgress = await UserProgress.findOne({ userID: userID }).populate('completedLessons.lessonId');
    if (!userProgress) throw new Error('User progress not found');

    const completedLessons = userProgress.completedLessons.map(completedLesson => completedLesson.lessonId);
    const exercises = await Exercise.find({ lessonID: { $in: completedLessons } }).limit(10);
    
    return exercises;
};
