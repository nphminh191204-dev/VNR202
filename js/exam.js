/**
 * VNR202 - Hệ thống thi thử & Phân tích lỗi sai chi tiết (Exam Simulator)
 */

function startExam() {
    const scopeEl = document.getElementById('exam-scope');
    const countEl = document.getElementById('exam-count');
    const durationEl = document.getElementById('exam-duration');

    const scope = scopeEl ? scopeEl.value : 'both';
    const count = countEl ? parseInt(countEl.value, 10) : 40;
    const durationMinutes = durationEl ? parseInt(durationEl.value, 10) : 45;

    let pool = allQuestions.filter(q => {
        if (scope === 'ch1') return q.chapter === 1;
        if (scope === 'ch2') return q.chapter === 2;
        if (scope === 'wrong') return getQuestionMasteryBucket(q.id) === 'wrong';
        return true;
    });

    if (pool.length === 0) {
        if (typeof showToast === 'function') {
            showToast('Không có câu hỏi nào trong phạm vi này (hoặc bạn chưa có câu làm sai)!', 'warning');
        }
        return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    examQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
    examUserSelections = {};
    isExamSubmitted = false;
    examReviewFilter = 'all';

    const setupCard = document.getElementById('exam-setup');
    const activeCard = document.getElementById('exam-active');
    const resultBanner = document.getElementById('exam-result-banner');
    const submitBtn = document.getElementById('btn-submit-exam');

    if (setupCard) setupCard.classList.add('hidden');
    if (activeCard) activeCard.classList.remove('hidden');
    if (resultBanner) resultBanner.classList.add('hidden');
    if (submitBtn) submitBtn.classList.remove('hidden');

    examRemainingSeconds = durationMinutes * 60;
    updateExamTimerDisplay();
    if (examTimerInterval) clearInterval(examTimerInterval);
    examTimerInterval = setInterval(() => {
        examRemainingSeconds--;
        updateExamTimerDisplay();
        if (examRemainingSeconds <= 0) {
            clearInterval(examTimerInterval);
            if (typeof showToast === 'function') {
                showToast('Đã hết giờ làm bài! Hệ thống tự động chấm điểm.', 'warning');
            }
            finalizeExamGrading();
        }
    }, 1000);

    renderExamQuestionsList();
    updateExamProgressLabel();
}

function updateExamTimerDisplay() {
    const mins = Math.floor(examRemainingSeconds / 60);
    const secs = examRemainingSeconds % 60;
    const timerEl = document.getElementById('exam-timer');
    if (timerEl) {
        timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
}

function updateExamProgressLabel() {
    const answeredCount = Object.keys(examUserSelections).length;
    const labelEl = document.getElementById('exam-progress-label');
    if (labelEl) {
        labelEl.textContent = `Đã chọn ${answeredCount} / ${examQuestions.length} câu`;
    }
}

function renderExamQuestionsList() {
    const container = document.getElementById('exam-questions-list');
    if (!container) return;
    container.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const subtopicNames = typeof SUBTOPIC_NAMES !== 'undefined' ? SUBTOPIC_NAMES : {};
    const highlightFn = typeof formatQuestionWithHighlights === 'function' ? formatQuestionWithHighlights : (t => t);

    examQuestions.forEach((q, qIdx) => {
        const selectedAnsId = examUserSelections[q.id];
        const correctAns = (q.answersList || []).find(a => a.is_correct);
        const isUserCorrect = Boolean(correctAns && selectedAnsId === correctAns.id);

        if (isExamSubmitted) {
            if (examReviewFilter === 'wrong' && isUserCorrect) return;
            if (examReviewFilter === 'correct' && !isUserCorrect) return;
        }

        const card = document.createElement('div');
        let borderStyle = 'border-slate-200 dark:border-slate-800';
        if (isExamSubmitted) {
            borderStyle = isUserCorrect ? 'border-emerald-400 dark:border-emerald-700' : 'border-rose-400 dark:border-rose-700';
        }
        card.className = `bg-white dark:bg-slate-900 rounded-2xl border-2 ${borderStyle} shadow-sm p-5`;

        let optionsHtml = '';
        (q.answersList || []).forEach((ans, aIdx) => {
            const letter = letters[aIdx] || String(aIdx + 1);
            const isSelected = selectedAnsId === ans.id;

            let style = isSelected
                ? 'border-party-600 bg-red-50/80 dark:bg-red-950/50 text-slate-900 dark:text-white font-semibold'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-white text-slate-800 dark:text-slate-200';

            let tagHtml = '';
            if (isExamSubmitted) {
                if (ans.is_correct) {
                    style = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-bold';
                    tagHtml = '<span class="ml-auto px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-bold shrink-0">Đáp án đúng</span>';
                } else if (isSelected && !ans.is_correct) {
                    style = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 line-through';
                    tagHtml = '<span class="ml-auto px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold shrink-0">Bạn đã chọn</span>';
                }
            }

            optionsHtml += `
                <button type="button" ${isExamSubmitted ? 'disabled' : ''} onclick="selectExamOption(${q.id}, ${ans.id})"
                    class="w-full text-left p-3.5 rounded-xl border-2 transition flex items-start gap-3 ${style}">
                    <span class="w-6 h-6 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">${letter}</span>
                    <span class="text-sm flex-1">${ans.content}</span>
                    ${tagHtml}
                </button>
            `;
        });

        card.innerHTML = `
            <div class="flex items-center justify-between gap-2 mb-3">
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs">Câu ${qIdx + 1}</span>
                    <span class="text-xs font-semibold text-slate-500">${subtopicNames[q.subtopic] || ''}</span>
                </div>
                ${isExamSubmitted ? (isUserCorrect
                ? '<span class="text-xs font-bold text-emerald-600"><i class="fa-solid fa-check-circle"></i> Đúng</span>'
                : '<span class="text-xs font-bold text-rose-600"><i class="fa-solid fa-times-circle"></i> Sai / Chưa chọn</span>') : ''}
            </div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-4 leading-relaxed">${highlightFn(q.content)}</h4>
            <div class="space-y-2.5">${optionsHtml}</div>
        `;
        container.appendChild(card);
    });
}

function selectExamOption(questionId, answerId) {
    if (isExamSubmitted) return;
    examUserSelections[questionId] = answerId;
    updateExamProgressLabel();
    renderExamQuestionsList();
}

function submitExam() {
    if (isExamSubmitted) return;
    const answeredCount = Object.keys(examUserSelections).length;
    if (answeredCount < examQuestions.length) {
        if (typeof showConfirmModal === 'function') {
            showConfirmModal(
                'Nộp bài sớm?',
                `Bạn mới chọn ${answeredCount}/${examQuestions.length} câu. Những câu bỏ trống sẽ tính là câu sai. Bạn có muốn nộp bài ngay?`,
                finalizeExamGrading
            );
        } else {
            finalizeExamGrading();
        }
    } else {
        finalizeExamGrading();
    }
}

function finalizeExamGrading() {
    if (examTimerInterval) clearInterval(examTimerInterval);
    isExamSubmitted = true;
    const submitBtn = document.getElementById('btn-submit-exam');
    if (submitBtn) submitBtn.classList.add('hidden');

    let correctCount = 0;
    let wrongCount = 0;

    if (!userProgress.answered) userProgress.answered = {};

    examQuestions.forEach(q => {
        const chosenId = examUserSelections[q.id];
        const correctAns = (q.answersList || []).find(a => a.is_correct);
        const isCorrect = Boolean(correctAns && chosenId === correctAns.id);
        if (isCorrect) correctCount++;
        else wrongCount++;

        const prevStreak = userProgress.answered[q.id]?.streak || 0;
        userProgress.answered[q.id] = {
            selectedId: chosenId || -1,
            isCorrect: isCorrect,
            streak: isCorrect ? Math.min(prevStreak + 1, 5) : 0
        };
    });

    if (typeof saveProgressToStorage === 'function') saveProgressToStorage();
    if (typeof updateDashboardStats === 'function') updateDashboardStats();

    const score10 = ((correctCount / examQuestions.length) * 10).toFixed(2);
    const banner = document.getElementById('exam-result-banner');
    if (banner) {
        banner.classList.remove('hidden');
        banner.innerHTML = `
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                    <span class="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase">Báo cáo kết quả bài thi</span>
                    <h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                        Điểm: <span class="text-emerald-600">${score10} / 10</span>
                        <span class="text-base font-bold text-slate-500 ml-2">(Đúng ${correctCount} • Sai ${wrongCount})</span>
                    </h3>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${wrongCount > 0 ? `
                    <button onclick="retestWrongFromExam()" class="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow transition flex items-center gap-2">
                        <i class="fa-solid fa-fire"></i> Luyện lại ngay ${wrongCount} câu vừa sai
                    </button>` : ''}
                    <button onclick="cancelExam()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition">
                        <i class="fa-solid fa-rotate-right mr-1"></i> Đề thi mới
                    </button>
                </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap text-xs">
                <span class="font-bold text-slate-500">Chế độ xem lại:</span>
                <button onclick="setExamReviewFilter('all')" class="px-3 py-1.5 rounded-lg font-bold ${examReviewFilter === 'all' ? 'bg-party-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">Tất cả (${examQuestions.length})</button>
                <button onclick="setExamReviewFilter('wrong')" class="px-3 py-1.5 rounded-lg font-bold ${examReviewFilter === 'wrong' ? 'bg-rose-600 text-white' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'}">Chỉ xem câu sai (${wrongCount})</button>
                <button onclick="setExamReviewFilter('correct')" class="px-3 py-1.5 rounded-lg font-bold ${examReviewFilter === 'correct' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'}">Chỉ xem câu đúng (${correctCount})</button>
            </div>
        `;
    }

    renderExamQuestionsList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setExamReviewFilter(filter) {
    examReviewFilter = filter;
    renderExamQuestionsList();
}

function retestWrongFromExam() {
    cancelExam();
    if (typeof quickFilterByStat === 'function') quickFilterByStat('bucket-wrong');
    if (typeof showToast === 'function') {
        showToast('Đã lọc toàn bộ các câu vừa làm sai để bạn ôn lại!', 'success');
    }
}

function cancelExam() {
    if (examTimerInterval) clearInterval(examTimerInterval);
    const activeEl = document.getElementById('exam-active');
    const setupEl = document.getElementById('exam-setup');
    if (activeEl) activeEl.classList.add('hidden');
    if (setupEl) setupEl.classList.remove('hidden');
}

if (typeof window !== 'undefined') {
    window.startExam = startExam;
    window.updateExamTimerDisplay = updateExamTimerDisplay;
    window.updateExamProgressLabel = updateExamProgressLabel;
    window.renderExamQuestionsList = renderExamQuestionsList;
    window.selectExamOption = selectExamOption;
    window.submitExam = submitExam;
    window.finalizeExamGrading = finalizeExamGrading;
    window.setExamReviewFilter = setExamReviewFilter;
    window.retestWrongFromExam = retestWrongFromExam;
    window.cancelExam = cancelExam;
}

