const Course = require('../models/Course');
const Skill = require('../models/Skill');
const Lesson = require('../models/Lesson'); 

const LearningService = {
    // Lấy bài học tiếp theo trong kỹ năng hiện tại
    async findNextLesson(userProgress) {
        const lastLesson = userProgress.completedLessons.slice(-1)[0]?.lessonId;
        if (!lastLesson) return await this.getFirstLessonOfSkill(userProgress.currentSkill._id);

        const nextOrder = lastLesson.order + 1;
        return await Lesson.findOne({
            skillID: userProgress.currentSkill._id,
            order: nextOrder,
            isUnlocked: true
        });
    },

    // Lấy kỹ năng tiếp theo trong khóa học hiện tại
    async findNextSkill(userProgress) {
        const currentSkill = userProgress.currentSkill;
        const nextOrder = currentSkill.order + 1;
        return await Skill.findOne({
            courseID: currentSkill.courseID,
            order: nextOrder,
            isUnlocked: true
        });
    },

    // Lấy khóa học tiếp theo
    async findNextCourse(userProgress) {
        const currentCourse = await Course.findById(userProgress.currentSkill.courseID);
        const nextOrder = currentCourse.order + 1;
        return await Course.findOne({
            order: nextOrder,
            isUnlocked: true
        });
    },

    // Lấy bài học đầu tiên của kỹ năng
    async getFirstLessonOfSkill(skillID) {
        return await Lesson.findOne({
            skillID,
            order: 1,
            isUnlocked: true
        }).sort({ order: 1 });
    },

    // Lấy bài học đầu tiên của khóa học
    async getFirstLessonOfCourse(courseID) {
        const firstSkill = await Skill.findOne({
            courseID,
            order: 1,
            isUnlocked: true
        }).sort({ order: 1 });
        
        if (!firstSkill) return null;
        return this.getFirstLessonOfSkill(firstSkill._id);
    }

    // lấy bài tập của lesson
    // kiểm tra đúng sai
    // cập nhật điểm số
    // cập nhật bài học đã hoàn thành
};

module.exports = LearningService;