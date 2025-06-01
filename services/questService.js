const DailyTask = require('../models/DailyTask');
const UserDailyProgress = require('../models/UserDailyProgress');
const User = require('../models/User');
const Lesson = require('../models/Lesson'); 
const Exercise = require('../models/Exercise');
const UserProgress = require('../models/UserProgress'); // Assuming you have a UserProgress model

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const QuestService ={
    async createDailyTask(data){
        const { title, type, target, xpReward, isActive } = data;
        const allowedTypes = ["learn", "review", "streak", "earn_xp"];
        if (!allowedTypes.includes(type)) {
            throw new Error(`Invalid task type: ${type}. Allowed types are: ${allowedTypes.join(', ')}`);
        }
        const newTask = new DailyTask({ title, type, target, xpReward, isActive});
        return await newTask.save();
    },

    async updateDailyTask(taskId, data) {
        if (data.type) {
            const allowedTypes = ["learn", "review", "streak", "earn_xp"];
            if (!allowedTypes.includes(data.type)) {
                throw new Error(`Invalid task type: ${data.type}. Allowed types are: ${allowedTypes.join(', ')}`);
            }
        }
        const updatedTask = await DailyTask.findByIdAndUpdate(taskId, data, { new: true });
        if (!updatedTask) throw new Error('DailyTask not found for update');
        return updatedTask;
    },

    async deleteDailyTask(taskId) {
        const deletedTask = await DailyTask.findByIdAndDelete(taskId);
        if (!deletedTask) throw new Error('DailyTask not found for deletion');
        return { message: 'DailyTask deleted successfully', deletedTask }; // Trả về cả task đã xóa
    },

    async getAllDailyTasksForAdmin() {
        return await DailyTask.find({});
    },

    /// USER ////
    async assignDailyTasksToUser(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let userDailyProgress = await UserDailyProgress.findOne({ userID: userId, date: { $gte: today } });

        if (userDailyProgress && userDailyProgress.tasks && userDailyProgress.tasks.length > 0) {
            return await userDailyProgress.populate('tasks.taskID');
        }

        const allActiveTasks = await DailyTask.find({ isActive: true });

        if (allActiveTasks.length === 0) {
            if (!userDailyProgress) {
                userDailyProgress = new UserDailyProgress({ userID: userId, date: today, tasks: [] });
                await userDailyProgress.save();
            }
            return userDailyProgress;
        }

        const shuffledTasks = shuffleArray([...allActiveTasks]);
        const numberOfTasksToAssign = Math.min(Math.floor(Math.random() * 3) + 1, shuffledTasks.length);
        const selectedTasks = shuffledTasks.slice(0, numberOfTasksToAssign);

        const tasksForUser = selectedTasks.map(task => ({
            taskID: task._id,
            progress: 0,
            isCompleted: false,
        }));

        if (userDailyProgress) {
            userDailyProgress.tasks = tasksForUser;
        } else {
            userDailyProgress = new UserDailyProgress({
                userID: userId,
                date: today,
                tasks: tasksForUser,
            });
        }
        await userDailyProgress.save();
        return await UserDailyProgress.findById(userDailyProgress._id).populate('tasks.taskID');
    },

    async getUserDailyTasks(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let progress = await UserDailyProgress.findOne({
            userID: userId,
            date: { $gte: today },
        }).populate('tasks.taskID');

        if (!progress || !progress.tasks || progress.tasks.length === 0) {
            progress = await this.assignDailyTasksToUser(userId);
        }
        return progress;
    },

    async handleEvent(userId, eventType, data = {}) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const userDailyProgress = await UserDailyProgress.findOne({ userID: userId, date: { $gte: today } }).populate('tasks.taskID');

        if (!userDailyProgress || !userDailyProgress.tasks || userDailyProgress.tasks.length === 0) {
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            console.error(`User ${userId} not found for handling quest event.`);
            return;
        }

        let tasksUpdated = false;
        let totalXpFromTasksToday = 0;

        for (const userTask of userDailyProgress.tasks) {
            if (userTask.isCompleted || !userTask.taskID || !userTask.taskID.isActive) continue;

            const taskDefinition = userTask.taskID;
            let progressIncrement = 0;

            switch (taskDefinition.type) {
                case 'learn':
                    if (eventType === 'LESSON_COMPLETED' && data.lessonId && taskDefinition.target === 1) {
                        progressIncrement = 1;
                    }
                    break;
                case 'streak':
                    if ((eventType === 'USER_ACTIVE_TODAY' || (eventType === 'XP_GAINED' && data.xp > 0)) &&
                        taskDefinition.target === 1 && (userTask.progress || 0) < 1) {
                        progressIncrement = 1;
                    }
                    break;
                case 'review':
                    if (eventType === 'VOCABULARY_REVIEWED') {
                        progressIncrement = data.count || 1;
                    }
                    break;
                case 'earn_xp':
                    if (eventType === 'XP_GAINED' && data.xp > 0) {
                        progressIncrement = data.xp;
                    }
                    break;
            }

            if (progressIncrement > 0) {
                const currentProgress = userTask.progress || 0;
                userTask.progress = taskDefinition.target > 0 ? Math.min(currentProgress + progressIncrement, taskDefinition.target) : currentProgress + progressIncrement;
                tasksUpdated = true;
            }

            if (taskDefinition.target > 0 && userTask.progress >= taskDefinition.target && !userTask.isCompleted) {
                userTask.isCompleted = true;
                userTask.completedAt = new Date();
                totalXpFromTasksToday += taskDefinition.xpReward;
                tasksUpdated = true;
                console.log(`Task "${taskDefinition.title}" COMPLETED by user ${userId}. XP Gained: ${taskDefinition.xpReward}`);
                if (taskDefinition.type === 'streak') {
                    await this.updateStreak(user, true);
                }
            }
        }

        if (totalXpFromTasksToday > 0) {
            user.xp = (user.xp || 0) + totalXpFromTasksToday;
        }

        if (tasksUpdated) {
            await user.save();
            await userDailyProgress.save();
        }
    },

    async updateStreak(user, wasActiveToday = false) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const userStreak = (user.streak && typeof user.streak === 'object') ? { ...user.streak } : { current: 0, lastActive: null };
        if (typeof userStreak.current !== 'number') userStreak.current = 0;


        let lastActiveDate = userStreak.lastActive ? new Date(userStreak.lastActive) : null;
        if (lastActiveDate) {
            lastActiveDate.setHours(0, 0, 0, 0);
        }

        let streakNeedsSave = false;

        if (wasActiveToday) {
            if (!lastActiveDate || lastActiveDate.getTime() < today.getTime()) {
                if (lastActiveDate && (today.getTime() - lastActiveDate.getTime() === 24 * 60 * 60 * 1000)) {
                    userStreak.current = (userStreak.current || 0) + 1;
                } else if (!lastActiveDate || (today.getTime() - lastActiveDate.getTime() > 24 * 60 * 60 * 1000)) {
                    userStreak.current = 1;
                }
                userStreak.lastActive = new Date();
                streakNeedsSave = true;
            }
        } else {
            if (lastActiveDate && (today.getTime() - lastActiveDate.getTime() > 24 * 60 * 60 * 1000)) { // Lớn hơn 1 ngày
                if (userStreak.current !== 0) {
                    userStreak.current = 0;
                    streakNeedsSave = true;
                }
            }
        }

        if (streakNeedsSave) {
            user.streak = userStreak;
            await user.save();
        }
    }
};
module.exports = QuestService;