const LearningService = require('../services/learningService');
const ExerciseService = require('../services/exerciseService'); 
const Lesson = require('../models/Lesson'); 
const Exercise = require('../models/Exercise'); 
const User = require('../models/User');
const UserProgress = require('../models/UserProgress'); 

const LearningController = {
    async submitExerciseAnswer(req, res) {
        try {
            const firebaseUid = req.firebaseUser.uid;
            const userInDb = await User.findOne({ firebaseUid: firebaseUid });
            const userId = userInDb._id;
            const { exerciseId } = req.params;
            const { userAnswer: rawUserAnswer } = req.body;

            if (rawUserAnswer === undefined || rawUserAnswer === null || rawUserAnswer.toString().trim() === "") {
                return res.status(400).json({ success: false, message: "Câu trả lời của người dùng là bắt buộc." });
            }
            const processedUserAnswer = rawUserAnswer.toString().trim().toLowerCase();
            const result = await LearningService.submitAnswer(userId, exerciseId, processedUserAnswer);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error("Lỗi khi nộp bài tập:", error);
            const errorMessage = error.message || "Đã có lỗi xảy ra khi xử lý câu trả lời của bạn.";
            res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: errorMessage });
        }
    },

    async completeLesson(req, res) {
        try {
            const firebaseUid = req.firebaseUser.uid;
            const userInDb = await User.findOne({ firebaseUid: firebaseUid });
            const userId = userInDb._id;            
            const { lessonId } = req.params;
            const result = await LearningService.completeLesson(userId, lessonId);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error("Lỗi khi hoàn thành bài học:", error);
            const errorMessage = error.message || "Đã có lỗi xảy ra khi hoàn thành bài học.";
            res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: errorMessage });
        }
    },

    async getExercisesByLesson(req, res) {
        try {
            const { lessonId } = req.params;
            let lesson = await Lesson.findById(lessonId);
            if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });

            let exercisesForLesson;
            if (!lesson.exercises || lesson.exercises.length === 0) {
                exercisesForLesson = await ExerciseService.generateLessonExercises(lessonId);
                if (exercisesForLesson.length > 0) {
                    exercisesForLesson = await Exercise.find({ _id: { $in: exercisesForLesson.map(e => e._id) } }).populate('vocabularyID');
                }
            } else {
                exercisesForLesson = await Exercise.find({ _id: { $in: lesson.exercises } }).populate('vocabularyID');
            }
            res.status(200).json({ success: true, data: exercisesForLesson });
        } catch (error) {
            console.error('Lỗi khi lấy bài tập theo bài học:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ', error: error.message });
        }
    },

    async getNextLesson(req, res) {
        try {
            const firebaseUid = req.firebaseUser.uid;
            const userInDb = await User.findOne({ firebaseUid: firebaseUid });
            const userId = userInDb._id;
            const { courseId } = req.query;
            if (!courseId) return res.status(400).json({ success: false, message: "courseId là bắt buộc."});

            const nextLesson = await LearningService.getFirstUnlockedLessonInCourse(userId, courseId);
            if (!nextLesson && nextLesson !== null) { 
                 console.warn(`getFirstUnlockedLessonInCourse for user ${userId}, course ${courseId} returned unexpected value:`, nextLesson);
                 return res.status(200).json({ success: true, message: "Không tìm thấy bài học tiếp theo phù hợp.", data: null });
            }
             if (nextLesson === null) { 
                return res.status(200).json({ success: true, message: "Không có bài học tiếp theo hoặc khóa học đã hoàn thành.", data: null });
            }
            res.status(200).json({ success: true, data: nextLesson });
        } catch (error) {
            console.error('Lỗi khi lấy bài học tiếp theo:', error);
            const errorMessage = error.message || "Đã có lỗi xảy ra khi tìm bài học tiếp theo.";
            res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: errorMessage });
        }
    },

    async getCourseStructure(req, res) {
        try {
            const firebaseUid = req.firebaseUser.uid;
            const userInDb = await User.findOne({ firebaseUid });

            if (!userInDb) {
                return res.status(401).json({ 
                    success: false, 
                    message: "User not authenticated" 
                });
            }

            const { courseId } = req.query;
            if (!courseId) {
                return res.status(400).json({ 
                    success: false, 
                    message: "courseId is required" 
                });
            }

            const { skillsWithLessons, userProgress, courseNotFound } = 
                await LearningService.initializeUserCourseProgressAndGetSkills(userInDb._id, courseId);

            if (courseNotFound) {
                return res.status(404).json({ 
                    success: false, 
                    message: `Course not found or has no skills` 
                });
            }
            
            res.status(200).json({
                success: true,
                data: {
                    courseId,
                    skills: skillsWithLessons.map(skill => ({
                        _id: skill._id,
                        title: skill.title,
                        description: skill.description,
                        order: skill.order,
                        lessons: skill.lessons.map(lesson => ({
                            _id: lesson._id,
                            title: lesson.title,
                            description: lesson.description,
                            order: lesson.order,
                            isUnlock: lesson.isUnlock,
                            isCompleted: lesson.isCompleted
                        }))
                    })),
                    userProgress: {
                        currentSkill: userProgress.currentSkill,
                        totalXp: userProgress.totalXp
                    }
                }
            });

        } catch (error) {
            console.error("Error in getCourseStructure:", error);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error",
                error: error.message 
            });
        }
    },
    async getLessonContent(req, res) {
        try {
            const { lessonId } = req.params;
            const lesson = await Lesson.findById(lessonId)
                .select('title description content order skillID courseID isUnlock')
                .lean();

            if (!lesson) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Lesson not found' 
                });
            }

            if (lesson.content && typeof lesson.content === 'object') {
                lesson.content = JSON.parse(JSON.stringify(lesson.content));
            }

            res.status(200).json({
                success: true,
                data: lesson
            });
        } catch (error) {
            console.error("Error in getLessonContent:", error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error',
                error: error.message 
            });
        }
    }
};

module.exports = {
    getNextLesson: LearningController.getNextLesson,
    getExercisesByLesson: LearningController.getExercisesByLesson,
    completeLesson: LearningController.completeLesson,
    submitExerciseAnswer: LearningController.submitExerciseAnswer,
    getCourseStructure: LearningController.getCourseStructure,
    getLessonContent: LearningController.getLessonContent
};
