/*
const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

const getRandomItems = (items, excludeItem, count) => {
  const excludeValue = excludeItem ? excludeItem.toString() : null;
  const filtered = items.filter(item => item && item.toString() !== excludeValue);
  return shuffleArray(filtered).slice(0, Math.min(count, filtered.length));
};

const generateExercises = (vocabList, lessonId, skillId, courseId) => {
  if (!vocabList || vocabList.length === 0) return [];
    if (!lessonId || !skillId || !courseId) {
        console.error("generateExercises: Missing lessonId, skillId, or courseId.");
        return [];
    }

  return vocabList.flatMap(vocab => {
    if (!vocab || !vocab._id || !vocab.word || !vocab.meaning) {
        console.warn("generateExercises: Skipping vocabulary item due to missing essential fields:", vocab);
        return [];
    }
    const exercises = [];
    const allVocabWords = vocabList.map(v => v.word).filter(Boolean);
        const allVocabMeanings = vocabList.map(v => v.meaning).filter(Boolean);
    
    // Translate Exercise
    exercises.push({
      type: 'translate',
      question: `Translate: ${vocab.word}`,
      correctAnswer: vocab.meaning,
      options: shuffleArray([
        vocab.meaning,
        ...getRandomItems(allVocabMeanings, vocab.meaning, 3)]),
      vocabularyID: vocab._id,
      lessonID: vocab.lessonID,
      skillID: skillId, courseID: courseId, xpReward: 10
    });

    // Listening Exercise
    if (vocab.audioUrl) {
      exercises.push({
        type: 'listen',
        question: 'Identify the spoken word',
        audioUrl: vocab.audioUrl,
        correctAnswer: vocab.word,
        options: shuffleArray([
          vocab.word,
          ...getRandomItems(allVocabWords, vocab.word, 3)]),
        vocabularyID: vocab._id,
        lessonID: vocab.lessonID, skillID: skillId, courseID: courseId, xpReward: 15
      });
    }

    // Multiple Choice
    exercises.push({
      type: 'multiple-choice',
      question: `Choose correct meaning for: ${vocab.word}`,
      correctAnswer: vocab.meaning,
      options: shuffleArray([
        vocab.meaning,
        ...getRandomItems(allVocabMeanings, vocab.meaning, 3)]),
      vocabularyID: vocab._id,
      lessonID: vocab.lessonID, skillID: skillId, courseID: courseId, xpReward: 10
    });

    return exercises;
  });
};

module.exports = { generateExercises, shuffleArray, getRandomItems };
*/
const shuffleArray = (array) => {
    // console.log('[EX_GEN] shuffleArray input:', array);
    const newArray = [...array].sort(() => Math.random() - 0.5);
    // console.log('[EX_GEN] shuffleArray output:', newArray);
    return newArray;
};

const getRandomItems = (items, excludeItem, count) => {
    // console.log('[EX_GEN] getRandomItems input - items:', items, 'excludeItem:', excludeItem, 'count:', count);
    const excludeValue = excludeItem ? excludeItem.toString() : null;
    const filtered = items.filter(item => item && item.toString() !== excludeValue);
    const result = shuffleArray(filtered).slice(0, Math.min(count, filtered.length));
    // console.log('[EX_GEN] getRandomItems output:', result);
    return result;
};

const generateExercises = (vocabList, lessonId, skillId, courseId) => {
  console.log('[EX_GEN] === generateExercises called ===');
  console.log('[EX_GEN] lessonId:', lessonId, 'skillId:', skillId, 'courseId:', courseId);
  console.log('[EX_GEN] Received vocabList count:', vocabList ? vocabList.length : 0);
  // Log chi tiết hơn một chút về vocabList, chỉ vài item đầu để tránh quá dài
  if (vocabList && vocabList.length > 0) {
    console.log('[EX_GEN] vocabList sample (first 2 items):', JSON.stringify(vocabList.slice(0,2).map(v => ({_id:v._id, word:v.word, meaning:v.meaning, lessonID:v.lessonID, audioUrl:v.audioUrl})), null, 2));
  }


  if (!vocabList || vocabList.length === 0) {
    console.warn("[EX_GEN] vocabList rỗng hoặc không tồn tại. Không thể tạo bài tập.");
    return [];
  }
  if (!lessonId || !skillId || !courseId) {
      console.error("[EX_GEN] Lỗi: Thiếu lessonId, skillId, hoặc courseId. Không thể gán đúng cho bài tập.");
      return [];
  }

  const allGeneratedExercises = vocabList.flatMap((vocab, index) => {
    console.log(`[EX_GEN] Processing vocab item #${index + 1}:`, JSON.stringify(vocab, null, 2));
    if (!vocab || !vocab._id || !vocab.word || !vocab.meaning) {
        console.warn("[EX_GEN] Bỏ qua từ vựng do thiếu trường quan trọng (_id, word, meaning):", vocab);
        return []; // Trả về mảng rỗng để flatMap loại bỏ
    }

    // QUAN TRỌNG: Xác định lessonID cho bài tập này.
    // Nếu mỗi vocab trong vocabList đều thuộc về lessonId được truyền vào, thì dùng lessonId.
    // Nếu vocab có trường lessonID riêng (ví dụ vocab từ nhiều lesson khác nhau), thì ưu tiên nó.
    const currentLessonIdForExercise = lessonId; // Mặc định dùng lessonId chung của hàm
    // Nếu bạn muốn logic phức tạp hơn: const currentLessonIdForExercise = vocab.lessonID || lessonId;
    // Nhưng phải đảm bảo vocab.lessonID có ý nghĩa trong ngữ cảnh này.
    // Hiện tại, an toàn nhất là gán tất cả exercises được tạo cho lessonId đầu vào.

    if (!currentLessonIdForExercise) {
        console.error(`[EX_GEN] Không thể xác định lessonID cho bài tập từ vocab: ${vocab._id}. Dùng lessonId chung: ${lessonId}`);
        // Không nên return [] ở đây nếu lessonId chung là hợp lệ
    }


    const exercises = [];
    const allVocabWords = vocabList.map(v => v.word).filter(Boolean);
    const allVocabMeanings = vocabList.map(v => v.meaning).filter(Boolean);
    
    // Translate Exercise
    const translateOptions = shuffleArray([
        vocab.meaning,
        ...getRandomItems(allVocabMeanings, vocab.meaning, 3)
    ]);
    exercises.push({
      type: 'translate',
      question: `Dịch từ: "${vocab.word}"`,
      correctAnswer: vocab.meaning,
      options: translateOptions,
      vocabularyID: vocab._id, // ID của từ vựng gốc
      lessonID: currentLessonIdForExercise,
      skillID: skillId, 
      courseID: courseId, 
      xpReward: 10
    });
    console.log(`[EX_GEN] Created 'translate' exercise for vocab: ${vocab.word}, options: ${translateOptions.length}`);

    // Listening Exercise
    if (vocab.audioUrl) {
      const listenOptions = shuffleArray([
          vocab.word,
          ...getRandomItems(allVocabWords, vocab.word, 3)
      ]);
      exercises.push({
        type: 'listen',
        question: 'Nghe và chọn từ đúng',
        audioUrl: vocab.audioUrl,
        correctAnswer: vocab.word,
        options: listenOptions,
        vocabularyID: vocab._id,
        lessonID: currentLessonIdForExercise, 
        skillID: skillId, 
        courseID: courseId, 
        xpReward: 15
      });
      console.log(`[EX_GEN] Created 'listen' exercise for vocab: ${vocab.word}, options: ${listenOptions.length}`);
    } else {
        console.log(`[EX_GEN] Skipping 'listen' exercise for vocab (no audioUrl): ${vocab.word}`);
    }

    // Multiple Choice (Meaning for Word)
    const mcMeaningOptions = shuffleArray([
        vocab.meaning,
        ...getRandomItems(allVocabMeanings, vocab.meaning, 3)
    ]);
    exercises.push({
      type: 'multiple-choice',
      question: `Chọn nghĩa đúng cho từ: "${vocab.word}"`,
      correctAnswer: vocab.meaning,
      options: mcMeaningOptions,
      vocabularyID: vocab._id,
      lessonID: currentLessonIdForExercise, 
      skillID: skillId, 
      courseID: courseId, 
      xpReward: 10
    });
    console.log(`[EX_GEN] Created 'multiple-choice' (meaning) exercise for vocab: ${vocab.word}, options: ${mcMeaningOptions.length}`);

    // (Tùy chọn) Multiple Choice (Word for Meaning)
    const mcWordOptions = shuffleArray([
        vocab.word,
        ...getRandomItems(allVocabWords, vocab.word, 3)
    ]);
     exercises.push({
      type: 'multiple-choice', // Có thể cần một type khác để phân biệt nếu logic xử lý khác
      question: `Từ nào có nghĩa là: "${vocab.meaning}"?`,
      correctAnswer: vocab.word,
      options: mcWordOptions,
      vocabularyID: vocab._id,
      lessonID: currentLessonIdForExercise,
      skillID: skillId,
      courseID: courseId,
      xpReward: 10
    });
    console.log(`[EX_GEN] Created 'multiple-choice' (word) exercise for vocab: ${vocab.meaning}, options: ${mcWordOptions.length}`);


    return exercises;
  });

  console.log('[EX_GEN] Tổng số bài tập được tạo bởi generateExercises:', allGeneratedExercises.length);
  return allGeneratedExercises;
};

module.exports = { generateExercises, shuffleArray, getRandomItems };