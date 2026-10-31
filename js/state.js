/**
 * VNR202 - Quản lý trạng thái ứng dụng (Application State)
 */

const STORAGE_KEY = 'vnr202_progress_v2';

// Danh sách câu hỏi
let allQuestions = [];       // Danh sách câu hỏi đang hiển thị (mặc định là bộ đã lọc trùng)
let allRawQuestions = [];    // Danh sách toàn bộ câu hỏi gốc (gồm cả các câu trùng lặp)
let duplicateGroupsMap = new Map(); // canonicalId -> [otherDuplicateQuestions...]
let aliasIdMap = {};         // duplicateId -> canonicalId
let deduplicationEnabled = true;

let filteredQuestions = [];
let currentIndex = 0;
let currentSubtopic = 'all';
let studyMode = 'quiz'; // 'quiz' | 'flashcard'

// Tùy chọn học tập
let autoAdvance = false;
let autoAdvanceTimeout = null;
let shuffleQuestions = false;
let shuffleAnswers = false;

// Tiến độ người dùng (3 Giỏ nhớ Leitner, Đánh dấu sao)
let userProgress = {
    answered: {},     // { [qId]: { selectedId, isCorrect, streak } }
    starred: [],      // [qId, ...]
    darkMode: false
};

// Trạng thái phòng thi thử
let examQuestions = [];
let examUserSelections = {};
let examRemainingSeconds = 0;
let examTimerInterval = null;
let isExamSubmitted = false;
let examReviewFilter = 'all'; // 'all' | 'wrong' | 'correct'

/**
 * Xác định giỏ nhớ theo phương pháp Spaced Repetition (Leitner)
 * - 'unanswered': Chưa làm
 * - 'wrong': Hay sai (streak === 0 hoặc trả lời sai)
 * - 'learning': Đang nhớ (streak === 1)
 * - 'mastered': Đã thuộc làu (streak >= 2)
 */
function getQuestionMasteryBucket(qId) {
    // 1. Kiểm tra trực tiếp theo qId
    let rec = userProgress.answered ? userProgress.answered[qId] : null;

    // 2. Nếu không có, kiểm tra qua aliasIdMap (nếu câu này là câu trùng)
    if (!rec && aliasIdMap[qId] && userProgress.answered) {
        rec = userProgress.answered[aliasIdMap[qId]];
    }

    // 3. Nếu vẫn không có, kiểm tra xem các câu trùng của qId đã từng được làm chưa
    if (!rec && duplicateGroupsMap && duplicateGroupsMap.has(qId) && userProgress.answered) {
        const dups = duplicateGroupsMap.get(qId);
        for (const d of dups) {
            if (userProgress.answered[d.id]) {
                rec = userProgress.answered[d.id];
                break;
            }
        }
    }

    if (!rec) return 'unanswered';
    if (!rec.isCorrect || rec.streak === 0) return 'wrong';
    if (rec.streak === 1) return 'learning';
    return 'mastered';
}

/**
 * Cập nhật bảng thống kê trên giao diện
 */
function updateDashboardStats() {
    const total = allQuestions.length;
    const ch1Count = allQuestions.filter(q => q.chapter === 1).length;
    const ch2Count = allQuestions.filter(q => q.chapter === 2).length;

    let wrongCount = 0;
    let learningCount = 0;
    let masteredCount = 0;
    let answeredTotal = 0;

    allQuestions.forEach(q => {
        const bucket = getQuestionMasteryBucket(q.id);
        if (bucket === 'wrong') { wrongCount++; answeredTotal++; }
        else if (bucket === 'learning') { learningCount++; answeredTotal++; }
        else if (bucket === 'mastered') { masteredCount++; answeredTotal++; }
    });

    const correctTotal = learningCount + masteredCount;
    const accuracy = answeredTotal > 0 ? Math.round((correctTotal / answeredTotal) * 100) : 0;

    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setEl('stat-total', total);
    setEl('stat-ch1', ch1Count);
    setEl('stat-ch2', ch2Count);
    setEl('stat-wrong', wrongCount);
    setEl('stat-learning', learningCount);
    setEl('stat-mastered', masteredCount);
    setEl('stat-accuracy', `Độ chính xác: ${accuracy}%`);
}

/**
 * Nhấp vào thẻ thống kê để lọc nhanh
 */
function quickFilterByStat(filterType) {
    if (typeof switchTab === 'function') switchTab('practice');
    currentSubtopic = 'all';
    if (typeof updateSubtopicPillsUI === 'function') updateSubtopicPillsUI();
    const filterEl = document.getElementById('practice-filter');
    if (filterEl) filterEl.value = filterType;
    if (typeof applyPracticeFilter === 'function') applyPracticeFilter();
}

if (typeof window !== 'undefined') {
    window.STORAGE_KEY = STORAGE_KEY;
    window.allQuestions = allQuestions;
    window.allRawQuestions = allRawQuestions;
    window.duplicateGroupsMap = duplicateGroupsMap;
    window.aliasIdMap = aliasIdMap;
    window.deduplicationEnabled = deduplicationEnabled;
    window.filteredQuestions = filteredQuestions;
    window.currentIndex = currentIndex;
    window.currentSubtopic = currentSubtopic;
    window.studyMode = studyMode;
    window.autoAdvance = autoAdvance;
    window.autoAdvanceTimeout = autoAdvanceTimeout;
    window.shuffleQuestions = shuffleQuestions;
    window.shuffleAnswers = shuffleAnswers;
    window.userProgress = userProgress;
    window.examQuestions = examQuestions;
    window.examUserSelections = examUserSelections;
    window.examRemainingSeconds = examRemainingSeconds;
    window.examTimerInterval = examTimerInterval;
    window.isExamSubmitted = isExamSubmitted;
    window.examReviewFilter = examReviewFilter;
    window.getQuestionMasteryBucket = getQuestionMasteryBucket;
    window.updateDashboardStats = updateDashboardStats;
    window.quickFilterByStat = quickFilterByStat;
}
