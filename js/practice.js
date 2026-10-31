/**
 * VNR202 - Chế độ học trắc nghiệm & Lật thẻ Flashcard (Practice Engine)
 */

function selectSubtopic(topicCode) {
    currentSubtopic = topicCode;
    updateSubtopicPillsUI();
    applyPracticeFilter();
}

function updateSubtopicPillsUI() {
    const buttons = document.querySelectorAll('#subtopic-pills .topic-pill');
    buttons.forEach(btn => {
        if (btn.dataset.topic === currentSubtopic) {
            btn.className = 'topic-pill px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-party-600 text-white shadow-sm transition';
        } else {
            btn.className = 'topic-pill px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-slate-700 transition';
        }
    });
}

function setStudyMode(mode) {
    studyMode = mode;
    const quizBtn = document.getElementById('mode-btn-quiz');
    const fcBtn = document.getElementById('mode-btn-flashcard');
    const quizCard = document.getElementById('practice-card');
    const fcContainer = document.getElementById('flashcard-container');

    if (mode === 'quiz') {
        if (quizBtn) quizBtn.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-party-700 dark:text-amber-400 shadow-sm transition';
        if (fcBtn) fcBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 transition';
        if (quizCard) quizCard.classList.remove('hidden');
        if (fcContainer) fcContainer.classList.add('hidden');
    } else {
        if (fcBtn) fcBtn.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-party-700 dark:text-amber-400 shadow-sm transition';
        if (quizBtn) quizBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 transition';
        if (quizCard) quizCard.classList.add('hidden');
        if (fcContainer) fcContainer.classList.remove('hidden');
    }
    renderCurrentPracticeQuestion();
}

function toggleStudyModeQuick() {
    setStudyMode(studyMode === 'quiz' ? 'flashcard' : 'quiz');
    if (typeof showToast === 'function') {
        showToast(studyMode === 'flashcard' ? 'Đã chuyển sang chế độ Lật thẻ Flashcard' : 'Đã chuyển sang chế độ Trắc nghiệm');
    }
}

function applyPracticeFilter() {
    const filterEl = document.getElementById('practice-filter');
    const filterValue = filterEl ? filterEl.value : 'all';
    const starredSet = new Set(userProgress.starred || []);

    let list = allQuestions.filter(q => {
        if (currentSubtopic !== 'all' && q.subtopic !== currentSubtopic) return false;

        const bucket = getQuestionMasteryBucket(q.id);
        if (filterValue === 'ch1') return q.chapter === 1;
        if (filterValue === 'ch2') return q.chapter === 2;
        if (filterValue === 'unanswered') return bucket === 'unanswered';
        if (filterValue === 'bucket-wrong') return bucket === 'wrong';
        if (filterValue === 'bucket-learning') return bucket === 'learning';
        if (filterValue === 'bucket-mastered') return bucket === 'mastered';
        if (filterValue === 'starred') return starredSet.has(q.id);
        return true;
    });

    if (shuffleQuestions) {
        list = [...list].sort(() => Math.random() - 0.5);
    }

    filteredQuestions = list;
    currentIndex = 0;

    const countLabel = document.getElementById('subtopic-active-count');
    if (countLabel) countLabel.textContent = `${filteredQuestions.length} câu hỏi`;

    renderCurrentPracticeQuestion();
    if (typeof renderQuestionPalette === 'function') renderQuestionPalette();
}

function toggleAutoAdvance() {
    autoAdvance = !autoAdvance;
    const btn = document.getElementById('btn-auto-advance');
    if (btn) {
        if (autoAdvance) {
            btn.classList.add('bg-emerald-50', 'dark:bg-emerald-950/60', 'border-emerald-500', 'text-emerald-700', 'dark:text-emerald-300');
            if (typeof showToast === 'function') showToast('Đã bật Tự qua câu sau 0.8s khi chọn đúng!');
        } else {
            btn.classList.remove('bg-emerald-50', 'dark:bg-emerald-950/60', 'border-emerald-500', 'text-emerald-700', 'dark:text-emerald-300');
            if (typeof showToast === 'function') showToast('Đã tắt Tự qua câu');
        }
    }
}

function toggleShuffleAnswers() {
    shuffleAnswers = !shuffleAnswers;
    const btn = document.getElementById('btn-shuffle-a');
    if (btn) {
        if (shuffleAnswers) {
            btn.classList.add('bg-party-50', 'dark:bg-red-950/60', 'border-party-600', 'text-party-700', 'dark:text-red-300');
            if (typeof showToast === 'function') showToast('Đã bật Đảo vị trí đáp án A-B-C-D');
        } else {
            btn.classList.remove('bg-party-50', 'dark:bg-red-950/60', 'border-party-600', 'text-party-700', 'dark:text-red-300');
            if (typeof showToast === 'function') showToast('Đã giữ nguyên thứ tự đáp án gốc');
        }
    }
    renderCurrentPracticeQuestion();
}

function toggleShuffleQuestions() {
    shuffleQuestions = !shuffleQuestions;
    const btn = document.getElementById('btn-shuffle-q');
    if (btn) {
        if (shuffleQuestions) {
            btn.classList.add('bg-party-50', 'dark:bg-red-950/60', 'border-party-600', 'text-party-700', 'dark:text-red-300');
            if (typeof showToast === 'function') showToast('Đã xáo trộn ngẫu nhiên danh sách câu hỏi');
        } else {
            btn.classList.remove('bg-party-50', 'dark:bg-red-950/60', 'border-party-600', 'text-party-700', 'dark:text-red-300');
            if (typeof showToast === 'function') showToast('Đã sắp xếp lại thứ tự câu hỏi mặc định');
        }
    }
    applyPracticeFilter();
}

function renderCurrentPracticeQuestion() {
    if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
        const barWrap = document.getElementById('auto-advance-bar-wrap');
        if (barWrap) barWrap.classList.add('hidden');
    }

    const contentEl = document.getElementById('q-content');
    const answersEl = document.getElementById('q-answers');
    const feedbackEl = document.getElementById('q-feedback');
    const indexBadge = document.getElementById('q-index-badge');
    const chapterBadge = document.getElementById('q-chapter-badge');
    const topicBadge = document.getElementById('q-topic-badge');
    const repairedBadge = document.getElementById('q-repaired-badge');
    const idBadge = document.getElementById('q-id-badge');
    const masteryPill = document.getElementById('q-mastery-pill');
    const starBtn = document.getElementById('btn-star-current');
    const mobileCounter = document.getElementById('mobile-nav-counter');

    if (!contentEl || !answersEl) return;

    if (filteredQuestions.length === 0) {
        if (indexBadge) indexBadge.textContent = '0 / 0';
        if (mobileCounter) mobileCounter.textContent = '0/0';
        contentEl.textContent = 'Không có câu hỏi nào trong bộ lọc hiện tại. Hãy chọn chuyên đề hoặc trạng thái khác!';
        answersEl.innerHTML = '';
        if (feedbackEl) feedbackEl.classList.add('hidden');
        return;
    }

    const q = filteredQuestions[currentIndex];
    if (indexBadge) indexBadge.textContent = `Câu ${currentIndex + 1} / ${filteredQuestions.length}`;
    if (mobileCounter) mobileCounter.textContent = `${currentIndex + 1}/${filteredQuestions.length}`;
    if (chapterBadge) chapterBadge.textContent = q.chapter === 1 ? 'Chương 1 (1930-1945)' : 'Chương 2 (1945-1975)';
    const subtopicNames = typeof SUBTOPIC_NAMES !== 'undefined' ? SUBTOPIC_NAMES : {};
    if (topicBadge) topicBadge.textContent = subtopicNames[q.subtopic] || 'Chuyên đề';
    if (idBadge) idBadge.textContent = `ID: #${q.id}`;

    if (repairedBadge) {
        if (q.wasRepaired) repairedBadge.classList.remove('hidden');
        else repairedBadge.classList.add('hidden');
    }

    const dupBadge = document.getElementById('q-duplicate-badge');
    if (dupBadge) {
        if (q.hasDuplicates || (duplicateGroupsMap && duplicateGroupsMap.has(q.id))) {
            const dupList = duplicateGroupsMap && duplicateGroupsMap.has(q.id) ? duplicateGroupsMap.get(q.id) : [];
            const dupCount = dupList.length || q.duplicateCount || 1;
            dupBadge.textContent = `🔁 Gộp ${dupCount} câu trùng`;
            dupBadge.title = `Câu này xuất hiện ${dupCount + 1} lần trong đề thi gốc (ID: #${q.id}${dupList.length ? ', ' + dupList.map(d => '#' + d.id).join(', ') : ''}), hệ thống đã tự động gộp lại.`;
            dupBadge.classList.remove('hidden');
        } else {
            dupBadge.classList.add('hidden');
        }
    }

    // Hiển thị mức độ nhớ (3 Giỏ nhớ Leitner)
    const bucket = getQuestionMasteryBucket(q.id);
    if (masteryPill) {
        if (bucket === 'wrong') {
            masteryPill.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300';
            masteryPill.textContent = '🔴 Hay sai';
        } else if (bucket === 'learning') {
            masteryPill.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
            masteryPill.textContent = '🟡 Đang nhớ (1/2)';
        } else if (bucket === 'mastered') {
            masteryPill.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
            masteryPill.textContent = '🟢 Đã thuộc làu';
        } else {
            masteryPill.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500';
            masteryPill.textContent = '⚪ Chưa làm';
        }
    }

    const isStarred = (userProgress.starred || []).includes(q.id);
    if (starBtn) {
        starBtn.innerHTML = isStarred
            ? '<i class="fa-solid fa-star text-amber-400"></i>'
            : '<i class="fa-regular fa-star"></i>';
    }

    // Áp dụng Smart Keyword Highlighting
    const highlightFn = typeof formatQuestionWithHighlights === 'function' ? formatQuestionWithHighlights : (t => t);
    contentEl.innerHTML = highlightFn(q.content);

    // Đồng bộ nội dung cho Flashcard
    const correctAnsObj = (q.answersList || []).find(a => a.is_correct) || (q.answersList && q.answersList[0]);
    const fcFrontBadge = document.getElementById('fc-front-badge');
    const fcQuestionText = document.getElementById('fc-question-text');
    const fcAnswerText = document.getElementById('fc-answer-text');
    const fcExplanationText = document.getElementById('fc-explanation-text');
    const fcInner = document.getElementById('flashcard-inner');

    if (fcFrontBadge) fcFrontBadge.textContent = `Câu ${currentIndex + 1} / ${filteredQuestions.length} • ${subtopicNames[q.subtopic] || ''}`;
    if (fcQuestionText) fcQuestionText.innerHTML = highlightFn(q.content);
    if (fcAnswerText) fcAnswerText.textContent = correctAnsObj ? correctAnsObj.content : '';
    if (fcExplanationText) fcExplanationText.textContent = q.explanation || '';
    if (fcInner) fcInner.classList.remove('flipped');

    // Render các lựa chọn trả lời
    let answers = [...(q.answersList || [])];
    if (shuffleAnswers) {
        answers.sort((a, b) => ((a.id * 37 + q.id * 13) % 11) - ((b.id * 37 + q.id * 13) % 11));
    }

    const existingRecord = userProgress.answered ? userProgress.answered[q.id] : null;
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

    answersEl.innerHTML = '';
    answers.forEach((ans, idx) => {
        const letter = labels[idx] || String(idx + 1);
        const btn = document.createElement('button');
        btn.type = 'button';

        let baseStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-party-600 text-slate-800 dark:text-slate-100';
        let badgeStyle = 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';
        let statusIcon = '';

        if (existingRecord) {
            if (ans.is_correct) {
                baseStyle = 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-semibold shadow-sm';
                badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                statusIcon = '<i class="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400 text-lg ml-auto shrink-0"></i>';
            } else if (existingRecord.selectedId === ans.id && !ans.is_correct) {
                baseStyle = 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100';
                badgeStyle = 'bg-rose-600 text-white border-rose-600';
                statusIcon = '<i class="fa-solid fa-circle-xmark text-rose-600 dark:text-rose-400 text-lg ml-auto shrink-0"></i>';
            } else {
                baseStyle = 'border-slate-200 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 opacity-75';
            }
        }

        btn.className = `answer-option w-full text-left p-3.5 sm:p-4 rounded-xl border-2 flex items-start gap-3.5 ${baseStyle}`;
        btn.innerHTML = `
            <span class="w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}">${letter}</span>
            <span class="text-sm sm:text-base leading-relaxed flex-1">${ans.content}</span>
            ${statusIcon}
        `;

        btn.onclick = () => selectPracticeAnswer(q, ans);
        answersEl.appendChild(btn);
    });

    if (feedbackEl) {
        if (existingRecord) {
            const correctAns = (q.answersList || []).find(a => a.is_correct);
            feedbackEl.classList.remove('hidden');
            if (existingRecord.isCorrect) {
                feedbackEl.className = 'mt-5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm';
                feedbackEl.innerHTML = `<div class="font-bold flex items-center gap-2"><i class="fa-solid fa-check-double text-emerald-600"></i> Chính xác! (Chuỗi nhớ liên tiếp: ${existingRecord.streak || 1})</div>
                    <div class="mt-1">Đáp án đúng: <strong>${correctAns ? correctAns.content : ''}</strong></div>`;
            } else {
                feedbackEl.className = 'mt-5 p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs sm:text-sm';
                feedbackEl.innerHTML = `<div class="font-bold flex items-center gap-2"><i class="fa-solid fa-circle-exclamation text-rose-600"></i> Chưa chính xác — Câu hỏi đã được đưa vào giỏ 🔴 Hay sai!</div>
                    <div class="mt-1">Đáp án đúng phải là: <strong>${correctAns ? correctAns.content : ''}</strong></div>`;
            }
        } else {
            feedbackEl.classList.add('hidden');
        }
    }

    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= filteredQuestions.length - 1;

    if (typeof highlightCurrentInPalette === 'function') highlightCurrentInPalette();
}

function selectPracticeAnswer(question, selectedAns) {
    const hasCorrectFlag = (question.answersList || []).some(a => a.is_correct);
    const isCorrect = hasCorrectFlag ? Boolean(selectedAns.is_correct) : true;
    const prevRec = userProgress.answered ? userProgress.answered[question.id] : null;
    const prevStreak = prevRec && prevRec.streak ? prevRec.streak : 0;

    if (!userProgress.answered) userProgress.answered = {};
    userProgress.answered[question.id] = {
        selectedId: selectedAns.id,
        isCorrect: isCorrect,
        streak: isCorrect ? Math.min(prevStreak + 1, 5) : 0
    };

    if (typeof saveProgressToStorage === 'function') saveProgressToStorage();
    if (typeof updateDashboardStats === 'function') updateDashboardStats();
    renderCurrentPracticeQuestion();
    if (typeof renderQuestionPalette === 'function') renderQuestionPalette();

    // Tự động qua câu nếu bật Auto-Advance và trả lời ĐÚNG
    if (autoAdvance && isCorrect && currentIndex < filteredQuestions.length - 1) {
        const barWrap = document.getElementById('auto-advance-bar-wrap');
        const bar = document.getElementById('auto-advance-bar');
        if (barWrap && bar) {
            barWrap.classList.remove('hidden');
            bar.classList.remove('animate-auto-advance');
            void bar.offsetWidth; // Force reflow
            bar.classList.add('animate-auto-advance');

            autoAdvanceTimeout = setTimeout(() => {
                barWrap.classList.add('hidden');
                nextQuestion();
            }, 850);
        }
    }
}

function flipFlashcard() {
    const inner = document.getElementById('flashcard-inner');
    if (inner) inner.classList.toggle('flipped');
}

function rateFlashcard(level) {
    if (filteredQuestions.length === 0) return;
    const q = filteredQuestions[currentIndex];
    const correctAns = (q.answersList || []).find(a => a.is_correct) || (q.answersList && q.answersList[0]);

    if (!userProgress.answered) userProgress.answered = {};
    userProgress.answered[q.id] = {
        selectedId: correctAns ? correctAns.id : 1,
        isCorrect: level > 0,
        streak: level
    };

    if (typeof saveProgressToStorage === 'function') saveProgressToStorage();
    if (typeof updateDashboardStats === 'function') updateDashboardStats();
    if (typeof renderQuestionPalette === 'function') renderQuestionPalette();

    if (currentIndex < filteredQuestions.length - 1) {
        nextQuestion();
    } else {
        renderCurrentPracticeQuestion();
        if (typeof showToast === 'function') showToast('Đã hoàn thành thẻ cuối cùng trong danh sách!');
    }
}

function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        renderCurrentPracticeQuestion();
    }
}

function nextQuestion() {
    if (currentIndex < filteredQuestions.length - 1) {
        currentIndex++;
        renderCurrentPracticeQuestion();
    }
}

function toggleStarCurrent() {
    if (filteredQuestions.length === 0) return;
    const q = filteredQuestions[currentIndex];
    if (!userProgress.starred) userProgress.starred = [];
    const idx = userProgress.starred.indexOf(q.id);
    if (idx === -1) {
        userProgress.starred.push(q.id);
        if (typeof showToast === 'function') showToast('Đã đánh dấu sao ★ câu hỏi này');
    } else {
        userProgress.starred.splice(idx, 1);
        if (typeof showToast === 'function') showToast('Đã bỏ đánh dấu sao');
    }
    if (typeof saveProgressToStorage === 'function') saveProgressToStorage();
    if (typeof updateDashboardStats === 'function') updateDashboardStats();
    renderCurrentPracticeQuestion();
    if (typeof renderQuestionPalette === 'function') renderQuestionPalette();
}

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        const practiceEl = document.getElementById('view-practice');
        if (!practiceEl || practiceEl.classList.contains('hidden')) return;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextQuestion();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevQuestion();
        } else if (e.key === ' ') {
            if (studyMode === 'flashcard') {
                e.preventDefault();
                flipFlashcard();
            }
        } else if (e.key.toLowerCase() === 's') {
            e.preventDefault();
            toggleStarCurrent();
        } else if (studyMode === 'quiz' && ['1', '2', '3', '4', 'a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
            const map = { '1': 0, 'a': 0, '2': 1, 'b': 1, '3': 2, 'c': 2, '4': 3, 'd': 3 };
            const idx = map[e.key.toLowerCase()];
            const optionButtons = document.querySelectorAll('#q-answers button');
            if (optionButtons[idx]) optionButtons[idx].click();
        }
    });
}

if (typeof window !== 'undefined') {
    window.selectSubtopic = selectSubtopic;
    window.updateSubtopicPillsUI = updateSubtopicPillsUI;
    window.setStudyMode = setStudyMode;
    window.toggleStudyModeQuick = toggleStudyModeQuick;
    window.applyPracticeFilter = applyPracticeFilter;
    window.toggleAutoAdvance = toggleAutoAdvance;
    window.toggleShuffleAnswers = toggleShuffleAnswers;
    window.toggleShuffleQuestions = toggleShuffleQuestions;
    window.renderCurrentPracticeQuestion = renderCurrentPracticeQuestion;
    window.selectPracticeAnswer = selectPracticeAnswer;
    window.flipFlashcard = flipFlashcard;
    window.rateFlashcard = rateFlashcard;
    window.prevQuestion = prevQuestion;
    window.nextQuestion = nextQuestion;
    window.toggleStarCurrent = toggleStarCurrent;
    window.setupKeyboardShortcuts = setupKeyboardShortcuts;
}

