const Course = require('../models/Course');
const Skill = require('../models/Skill');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Exercise = require('../models/Exercise');
const QuestService = require('./questService'); 
const UserProgressService = require('./userProgressService'); 

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const LearningService = {
    async submitAnswer(userId, exerciseId, userAnswer) {
        console.log(`[LS] === submitAnswer (Service) ===`);
        console.log(`[LS] userId: ${userId}, exerciseId: ${exerciseId}`);
        console.log(`[LS] userAnswerFromController (đã xử lý ở controller):'${userAnswer}'`);
        const exercise = await Exercise.findById(exerciseId).populate('vocabularyID');
        if (!exercise) { 
            throw new Error('Exercise not found');
        }
        if (!exercise.vocabularyID) { 
             throw new Error('Exercise is missing vocabulary information');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        let userProgress = await UserProgress.findOne({ userID: userId, courseID: exercise.courseID });
        if (!userProgress) {
            userProgress = new UserProgress({
                userID: userId,
                courseID: exercise.courseID,
                currentSkill: exercise.skillID, 
                totalXp: 0,
                learnedVocabulary: [],
                completedLessons: []
            });
        }

        const correctAnswerFromDB_Raw = exercise.correctAnswer.toString();
        const correctAnswerFromDB_Processed = correctAnswerFromDB_Raw.trim().toLowerCase();

        const isCorrect = correctAnswerFromDB_Processed === userAnswer;
        console.log(`[LS] Kết quả so sánh (isCorrect): ${isCorrect}`);
        console.log(`[LS] ------------------------`);
        let xpGained = 0;

        // Gọi UserProgressService.updateReviewProgress bất kể đúng hay sai
        // để cập nhật trạng thái SRS
        const srsResult = await UserProgressService.updateReviewProgress(
            userId,
            exercise.courseID,
            exercise.vocabularyID._id,
            exercise.lessonID,
            isCorrect,
            exercise.vocabularyID 
        );

        if (isCorrect) {
            xpGained = exercise.xpReward || 10;
            user.xp = (user.xp || 0) + xpGained;
            userProgress.totalXp = (userProgress.totalXp || 0) + xpGained;

            if (srsResult && srsResult.isNew) { 
                if (QuestService && QuestService.handleEvent) await QuestService.handleEvent(userId, 'VOCABULARY_LEARNED_NEW', { count: 1 });
            }

            if (QuestService && QuestService.handleEvent) {
                await QuestService.handleEvent(userId, 'XP_GAINED', { xp: xpGained });
            }
            if (QuestService && QuestService.updateStreak) await QuestService.updateStreak(user, true);
        }
        

        await user.save();
        await userProgress.save();

        return {
            isCorrect,
            correctAnswer: exercise.correctAnswer,
            xpGained,
            userTotalXp: user.xp,
            courseTotalXp: userProgress.totalXp,
            srsDetails: srsResult 
        };
    },

    async completeLesson(userId, lessonId) {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) throw new Error('Lesson not found');

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        let userProgress = await UserProgress.findOne({ userID: userId, courseID: lesson.courseID });
        if (!userProgress) {
            userProgress = new UserProgress({
                userID: userId,
                courseID: lesson.courseID,
                currentSkill: lesson.skillID,
                totalXp: 0,
                learnedVocabulary: [],
                completedLessons: []
            });
        }

        const alreadyCompletedInCourse = userProgress.completedLessons.some(cl => cl.lessonId.toString() === lessonId.toString());
        if (alreadyCompletedInCourse) {
            return { message: "Lesson already completed", userProgress, xpGained: 0 };
        }

        const score = getRandomInt(75, 100);
        const lessonCompletionBonusXp = lesson.reward || 25;

        userProgress.completedLessons.push({ lessonId: lesson._id, score, completedAt: new Date() });
        userProgress.totalXp = (userProgress.totalXp || 0) + lessonCompletionBonusXp;

        const alreadyCompletedGlobal = user.completedLessons.some(cl => cl.lessonID.toString() === lessonId.toString());
        if (!alreadyCompletedGlobal) {
            user.completedLessons.push({ lessonID: lesson._id, score, completedAt: new Date() });
        }
        user.xp = (user.xp || 0) + lessonCompletionBonusXp;

        const nextLesson = await Lesson.findOne({
            skillID: lesson.skillID,
            order: { $gt: lesson.order }
        }).sort({ order: 1 });
    
        // Tự động mở khóa lesson tiếp theo
        if (nextLesson && !nextLesson.isUnlock) {
            nextLesson.isUnlock = true;
            await nextLesson.save();
            console.log(`[AUTO-UNLOCK] Lesson ${nextLesson.title} unlocked`);
        }

        await this.checkAndUnlockNextSkill(user, userProgress, lesson.skillID);

        await userProgress.save();
        await user.save();

        if (QuestService && QuestService.handleEvent) {
             await QuestService.handleEvent(userId, 'LESSON_COMPLETED', { lessonId: lesson._id });
            if (lessonCompletionBonusXp > 0) {
                await QuestService.handleEvent(userId, 'XP_GAINED', { xp: lessonCompletionBonusXp });
            }
        }
       if (QuestService && QuestService.updateStreak) await QuestService.updateStreak(user, true);

        return { message: "Lesson completed successfully", userProgress, xpGained: lessonCompletionBonusXp };
    },

    async checkAndUnlockNextSkill(user, userProgress, completedSkillId) {
        const completedSkill = await Skill.findById(completedSkillId).populate('lessons');
        if (!completedSkill) return;

        const lessonIdsInCompletedSkill = completedSkill.lessons.map(l => l._id.toString());
        const userCompletedLessonIdsForThisSkill = userProgress.completedLessons
            .filter(cl => lessonIdsInCompletedSkill.includes(cl.lessonId.toString()))
            .map(cl => cl.lessonId.toString());

        // Kiểm tra xem tất cả bài học trong skill này đã được user hoàn thành chưa
        const allLessonsInSkillCompleted = lessonIdsInCompletedSkill.length > 0 &&
            lessonIdsInCompletedSkill.every(id => userCompletedLessonIdsForThisSkill.includes(id));

        if (allLessonsInSkillCompleted) {
            console.log(`User ${user.username || user._id} completed all lessons in skill ${completedSkill.title}`);
            const nextSkillInOrder = await Skill.findOne({
                courseID: completedSkill.courseID,
                order: { $gt: completedSkill.order || 0 } // Tìm skill có order lớn hơn
            }).sort({ order: 1 }); // Lấy skill có order nhỏ nhất trong số đó

            if (nextSkillInOrder) {
                let canUnlock = true;
                // Kiểm tra dependencies
                if (nextSkillInOrder.dependencies && nextSkillInOrder.dependencies.length > 0) {
                    const userUnlockedSkillIds = (user.unlockedSkills || []).map(id => id.toString());
                    canUnlock = nextSkillInOrder.dependencies.every(depId => userUnlockedSkillIds.includes(depId.toString()));
                }
                // Kiểm tra XP required
                if (canUnlock && (nextSkillInOrder.xpRequired || 0) > 0) { // Thêm || 0 để tránh lỗi nếu xpRequired undefined
                    canUnlock = (user.xp || 0) >= nextSkillInOrder.xpRequired;
                }

                const isAlreadyUnlockedForUser = (user.unlockedSkills || []).some(id => id.toString() === nextSkillInOrder._id.toString()); // Dùng some cho hiệu quả hơn
                const isGloballyUnlocked = nextSkillInOrder.isUnlock; // Giả sử isUnlock là boolean

                // Mở khóa skill cho user nếu đủ điều kiện và chưa được mở khóa
                if (canUnlock && !isAlreadyUnlockedForUser && !isGloballyUnlocked) {
                    if (!user.unlockedSkills) user.unlockedSkills = [];
                    user.unlockedSkills.push(nextSkillInOrder._id);
                    console.log(`User ${user.username || user._id} unlocked skill: ${nextSkillInOrder.title}`);
                }

                if (canUnlock || isAlreadyUnlockedForUser || isGloballyUnlocked) {
                    // Tìm lesson đầu tiên trong skill mới
                    const firstLessonInNewSkill = await Lesson.findOne({
                        skillID: nextSkillInOrder._id
                    }).sort({ order: 1 });
                    
                    // Tự động mở khóa lesson đầu tiên
                    if (firstLessonInNewSkill && !firstLessonInNewSkill.isUnlock) {
                        firstLessonInNewSkill.isUnlock = true;
                        await firstLessonInNewSkill.save();
                        console.log(`[AUTO-UNLOCK] First lesson in new skill unlocked: ${firstLessonInNewSkill.title}`);
                    }
                }

                if ((canUnlock || isAlreadyUnlockedForUser || isGloballyUnlocked) && userProgress.currentSkill.toString() !== nextSkillInOrder._id.toString()) {
                    userProgress.currentSkill = nextSkillInOrder._id;
                    console.log(`User ${user.username || user._id} current skill set to: ${nextSkillInOrder.title}`);
                }

            } else {
                console.log(`No next skill found in course ${completedSkill.courseID} for user ${user.username || user._id}. Course might be completed.`);
            }
        }
    },

    async getFirstUnlockedLessonInCourse(userId, courseId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        let userProgress = await UserProgress.findOne({ userID: userId, courseID: courseId });
        const skillsInCourse = await Skill.find({ courseID: courseId }).sort({ order: 1 });

        if (skillsInCourse.length === 0) {
            console.log(`Course ${courseId} has no skills.`);
            return null;
        }

        if (!userProgress) {
            let firstAccessibleSkill = null;
            for (const skill of skillsInCourse) {
                const dependenciesMet = (skill.dependencies || []).length === 0 ||
                    (skill.dependencies || []).every(depId => (user.unlockedSkills || []).some(id => id.toString() === depId.toString()));
                const xpMet = (user.xp || 0) >= (skill.xpRequired || 0);
                const canAccessThisSkill = skill.isUnlock || ((user.unlockedSkills || []).some(id => id.toString() === skill._id.toString())) || (dependenciesMet && xpMet);

                if (canAccessThisSkill) {
                    firstAccessibleSkill = skill;
                    break;
                }
            }

            if (!firstAccessibleSkill) {
                console.log(`User ${userId} cannot access any skill in course ${courseId} yet to create progress.`);
                return null;
            }

            userProgress = await UserProgress.create({
                userID: userId,
                courseID: courseId,
                currentSkill: firstAccessibleSkill._id,
                totalXp: 0,
                learnedVocabulary: [],
                completedLessons: []
            });

            if (!firstAccessibleSkill.isUnlock && !(user.unlockedSkills || []).some(id => id.toString() === firstAccessibleSkill._id.toString())) {
                if (!user.unlockedSkills) user.unlockedSkills = [];
                user.unlockedSkills.push(firstAccessibleSkill._id);
                await user.save();
                console.log(`User ${userId} unlocked initial skill ${firstAccessibleSkill.title} for course ${courseId}`);
            }
        }

        let startingSkillIndex = skillsInCourse.findIndex(s => s._id.toString() === userProgress.currentSkill.toString());
        if (startingSkillIndex === -1) startingSkillIndex = 0; 

        for (let i = startingSkillIndex; i < skillsInCourse.length; i++) {
            const skillToCheck = skillsInCourse[i];

            const dependenciesMet = (skillToCheck.dependencies || []).length === 0 ||
                (skillToCheck.dependencies || []).every(depId => (user.unlockedSkills || []).some(id => id.toString() === depId.toString()));
            const xpMet = (user.xp || 0) >= (skillToCheck.xpRequired || 0);
            const canAccessThisSkill = skillToCheck.isUnlock || ((user.unlockedSkills || []).some(id => id.toString() === skillToCheck._id.toString())) || (dependenciesMet && xpMet);

            if (!canAccessThisSkill) {
                continue; 
            }

            if (userProgress.currentSkill.toString() !== skillToCheck._id.toString()) {
                userProgress.currentSkill = skillToCheck._id;
                await userProgress.save();
            }

            const completedLessonIdsInThisSkill = (userProgress.completedLessons || [])
                .filter(cl => {
                    return cl.lessonId ? cl.lessonId.toString() : null;
                })
                .map(cl => cl.lessonId.toString()); 

            const lessonsInThisSkill = await Lesson.find({ skillID: skillToCheck._id }).select('_id').lean();
            const lessonIdsInThisSkill = lessonsInThisSkill.map(l => l._id.toString());

            const userCompletedLessonsForThisSkill = (userProgress.completedLessons || [])
                                                    .filter(cl => lessonIdsInThisSkill.includes(cl.lessonId.toString()))
                                                    .map(cl => cl.lessonId.toString());


            const nextLessonInThisSkill = await Lesson.findOne({
                skillID: skillToCheck._id,
                _id: { $nin: userCompletedLessonsForThisSkill }
            }).sort({ order: 1 });

            if (nextLessonInThisSkill) {
                return nextLessonInThisSkill; 
            }
        }

        console.log(`User ${userId} has completed all accessible lessons or no suitable next lesson in course ${courseId}.`);
        return null; 
    },
    
    async initializeUserCourseProgressAndGetSkills(userId, courseId) {
        console.log(`[LS-initProgress] Initializing progress for User: ${userId}, Course: ${courseId}`);
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found for progress initialization');

        let userProgress = await UserProgress.findOne({ userID: userId, courseID: courseId });
        let isNewProgress = false;

        const skillsInCourse = await Skill.find({ courseID: courseId })
            .populate({
                path: 'lessons',
                options: { sort: { order: 1 } }, // Sắp xếp lessons theo order
                select: '_id title order isUnlock reward description courseID skillID' // Chọn các trường cần thiết
            })
            .sort({ order: 1 }) // Sắp xếp skills theo order
            .lean(); // Dùng lean cho hiệu quả và dễ thêm thuộc tính

        if (skillsInCourse.length === 0) {
            console.log(`[LS-initProgress] Course ${courseId} has no skills.`);
            return { skillsWithLessons: [], userProgress: null, courseNotFound: true };
        }
        
        const firstSkill = skillsInCourse.length > 0 ? skillsInCourse[0] : null;
        const firstLessonInFirstSkill = (firstSkill && firstSkill.lessons && firstSkill.lessons.length > 0)
            ? firstSkill.lessons[0]
            : null;

        if (!userProgress) {
            isNewProgress = true;
            if (!firstSkill) {
                 console.warn(`[LS-initProgress] Course ${courseId} has skills but firstSkill is null. This shouldn't happen.`);
                 // Xử lý trường hợp không có skill nào (đã check ở trên, nhưng để an toàn)
                 return { skillsWithLessons: [], userProgress: null, courseNotFound: !skillsInCourse.length };
            }
            userProgress = new UserProgress({
                userID: userId,
                courseID: courseId,
                currentSkill: firstSkill._id, // Mặc định là skill đầu tiên
                totalXp: 0,
                learnedVocabulary: [],
                completedLessons: []
            });
            await userProgress.save();
            console.log(`[LS-initProgress] Created new UserProgress for User: ${userId}, Course: ${courseId}`);
        }

        // Mở khóa lesson đầu tiên của skill đầu tiên nếu là người dùng mới VÀ lesson đó chưa được mở khóa global
        if (isNewProgress && firstLessonInFirstSkill && !firstLessonInFirstSkill.isUnlock) {
            const lessonToUnlock = await Lesson.findById(firstLessonInFirstSkill._id);
            if (lessonToUnlock && !lessonToUnlock.isUnlock) { // Kiểm tra lại trước khi save
                lessonToUnlock.isUnlock = true;
                await lessonToUnlock.save();
                console.log(`[LS-initProgress] [AUTO-UNLOCK] Unlocked first lesson '${lessonToUnlock.title}' for new user/course.`);
                // Cập nhật trạng thái isUnlock trong mảng skillsInCourse để trả về client
                firstLessonInFirstSkill.isUnlock = true;
            }
        }


        // Lấy danh sách ID các lesson đã hoàn thành của user
        const completedLessonIds = (userProgress.completedLessons || []).map(cl => cl.lessonId.toString());

        // Gắn trạng thái isCompleted và isUnlock (cập nhật sau khi có thể đã unlock ở trên) cho từng lesson
        const skillsWithLessonStatus = skillsInCourse.map(skill => ({
            ...skill,
            lessons: skill.lessons.map(lesson => {
                // isUnlock của lesson có thể đã được set bởi logic auto-unlock ở trên
                // hoặc từ DB nếu nó đã được mở khóa trước đó (ví dụ: admin set)
                // hoặc bởi logic unlock của skill (xem xét sau)
                let finalIsUnlock = lesson.isUnlock;
                const skillIsAccessible = skill.isUnlock ||
                                          (user.unlockedSkills || []).some(unlockedSkillId => unlockedSkillId.toString() === skill._id.toString()) ||
                                          (firstSkill && skill._id.toString() === firstSkill._id.toString());


                if (skillIsAccessible) {
                } else {
                    if(!lesson.isUnlock) finalIsUnlock = false;
                }

                return {
                    ...lesson,
                    isCompleted: completedLessonIds.includes(lesson._id.toString()),
                    isUnlock: finalIsUnlock 
                };
            })
        }));

        return { skillsWithLessons: skillsWithLessonStatus, userProgress, isNewProgress };
    },

    async getFirstUnlockedLessonInCourse(userId, courseId) {
        console.log(`[LS-getFirstUnlocked] User: ${userId}, Course: ${courseId}`);
        const user = await User.findById(userId);
        if (!user) {
            console.error("[LS-getFirstUnlocked] User not found:", userId);
            throw new Error('User not found');
        }

        const { skillsWithLessons, userProgress } = await this.initializeUserCourseProgressAndGetSkills(userId, courseId);

        if (!userProgress || skillsWithLessons.length === 0) {
            console.log(`[LS-getFirstUnlocked] No progress or no skills for User: ${userId}, Course: ${courseId}.`);
            return null;
        }

        for (const skill of skillsWithLessons) {
             const skillIsAccessible = skill.isUnlock ||
                                      (user.unlockedSkills || []).some(unlockedSkillId => unlockedSkillId.toString() === skill._id.toString()) ||
                                      (skillsWithLessons.length > 0 && skill._id.toString() === skillsWithLessons[0]._id.toString()); // Skill đầu tiên luôn accessible ban đầu


            if (!skillIsAccessible) {
                console.log(`[LS-getFirstUnlocked] Skill '${skill.title}' is not accessible for user.`);
                continue; 
            }

            for (const lesson of skill.lessons) { 
                if (lesson.isUnlock && !lesson.isCompleted) {
                    console.log(`[LS-getFirstUnlocked] Found next unlocked, uncompleted lesson: '${lesson.title}' in skill '${skill.title}'`);
                    return lesson;
                }
            }
        }

        console.log(`[LS-getFirstUnlocked] No suitable next unlocked lesson found for User: ${userId}, Course: ${courseId}. All accessible lessons might be completed.`);
        return null; // Tất cả lesson có thể truy cập đã hoàn thành hoặc không có lesson nào được mở khóa
    }
};

module.exports = LearningService;
