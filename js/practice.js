/**
 * VNR202 - Chế độ Luyện tập trắc nghiệm & Flashcard 3D (Practice Engine)
 */

let practiceMultiSelections = new Set();

function selectSubtopic(topic) {
    currentSubtopic = topic;
    practiceMultiSelections.clear();
    updateSubtopicPillsUI();
    applyPracticeFilter();
}

function updateSubtopicPillsUI() {
    let activeBtn = null;
    document.querySelectorAll('#subtopic-pills .topic-pill').forEach(btn => {
        const t = btn.getAttribute('data-topic');
        if (t === currentSubtopic) {
            btn.className = 'topic-pill shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-party-600 text-white shadow-sm transition';
            activeBtn = btn;
        } else {
            btn.className = 'topic-pill shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-slate-700 transition';
        }
    });

    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
        try {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } catch (e) {
            // Fallback for older browsers
        }
    }
    updateSubtopicScrollButtons();
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
    practiceMultiSelections.clear();

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
            if (typeof showToast === 'function') showToast('Đã BẬT tự động chuyển câu tiếp theo khi chọn đúng');
        } else {
            btn.classList.remove('bg-emerald-50', 'dark:bg-emerald-950/60', 'border-emerald-500', 'text-emerald-700', 'dark:text-emerald-300');
            if (typeof showToast === 'function') showToast('Đã TẮT tự động chuyển câu');
        }
    }
}

function toggleShuffleAnswers() {
    shuffleAnswers = !shuffleAnswers;
    const btn = document.getElementById('btn-shuffle-a');
    if (btn) {
        if (shuffleAnswers) {
            btn.classList.add('bg-amber-50', 'dark:bg-amber-950/60', 'border-amber-500', 'text-amber-700', 'dark:text-amber-300');
            if (typeof showToast === 'function') showToast('Đã BẬT đảo vị trí các phương án A-D');
        } else {
            btn.classList.remove('bg-amber-50', 'dark:bg-amber-950/60', 'border-amber-500', 'text-amber-700', 'dark:text-amber-300');
            if (typeof showToast === 'function') showToast('Đã TẮT đảo đáp án');
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
    const typeBadge = document.getElementById('q-type-badge');
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
        if (typeBadge) typeBadge.classList.add('hidden');
        return;
    }

    const q = filteredQuestions[currentIndex];
    if (indexBadge) indexBadge.textContent = `Câu ${currentIndex + 1} / ${filteredQuestions.length}`;
    if (mobileCounter) mobileCounter.textContent = `${currentIndex + 1}/${filteredQuestions.length}`;
    if (chapterBadge) chapterBadge.textContent = q.chapter === 1 ? 'Chương 1 (1930-1945)' : 'Chương 2 (1945-1975)';
    const subtopicNames = typeof SUBTOPIC_NAMES !== 'undefined' ? SUBTOPIC_NAMES : {};
    if (topicBadge) topicBadge.textContent = subtopicNames[q.subtopic] || 'Chuyên đề';
    if (idBadge) idBadge.textContent = `ID: #${q.id}`;

    // Hiển thị huy hiệu dạng câu hỏi (chọn nhiều đáp án)
    if (typeBadge) {
        if (q.isMultiChoice) {
            typeBadge.textContent = `☑️ Chọn ${q.correctCount} đáp án`;
            typeBadge.classList.remove('hidden');
        } else {
            typeBadge.classList.add('hidden');
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
    const fcFrontBadge = document.getElementById('fc-front-badge');
    const fcQuestionText = document.getElementById('fc-question-text');
    const fcAnswerText = document.getElementById('fc-answer-text');
    const fcExplanationText = document.getElementById('fc-explanation-text');
    const fcInner = document.getElementById('flashcard-inner');

    if (fcFrontBadge) fcFrontBadge.textContent = `Câu ${currentIndex + 1} / ${filteredQuestions.length} • ${subtopicNames[q.subtopic] || ''}`;
    if (fcQuestionText) fcQuestionText.innerHTML = highlightFn(q.content);

    if (fcAnswerText) {
        if (q.isMultiChoice) {
            const correctList = (q.answersList || []).filter(a => a.is_correct);
            fcAnswerText.innerHTML = `
                <div class="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-2">Gồm ${correctList.length} đáp án đúng:</div>
                <div class="space-y-1.5 text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-100 text-left max-w-lg mx-auto">
                    ${correctList.map(a => `<div class="flex items-start gap-2"><i class="fa-solid fa-circle-check text-emerald-600 mt-1 shrink-0"></i> <span>${a.content}</span></div>`).join('')}
                </div>
            `;
        } else {
            const correctAnsObj = (q.answersList || []).find(a => a.is_correct) || (q.answersList && q.answersList[0]);
            fcAnswerText.textContent = correctAnsObj ? correctAnsObj.content : '';
        }
    }

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

    if (q.isMultiChoice) {
        // ==================== CÂU HỎI CHỌN NHIỀU ĐÁP ÁN (MULTI-CHOICE) ====================
        const chosenSet = existingRecord ? new Set(existingRecord.selectedIds || [existingRecord.selectedId]) : null;

        answers.forEach((ans, idx) => {
            const letter = labels[idx] || String(idx + 1);
            const btn = document.createElement('button');
            btn.type = 'button';

            let baseStyle = '';
            let badgeStyle = '';
            let checkIcon = '';

            if (existingRecord) {
                // Đã nộp bài / trả lời
                if (ans.is_correct) {
                    baseStyle = 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-semibold shadow-sm';
                    badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                    checkIcon = '<i class="fa-solid fa-square-check text-emerald-600 dark:text-emerald-400 text-xl ml-auto shrink-0"></i>';
                } else if (chosenSet.has(ans.id) && !ans.is_correct) {
                    baseStyle = 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100';
                    badgeStyle = 'bg-rose-600 text-white border-rose-600';
                    checkIcon = '<i class="fa-solid fa-square-xmark text-rose-600 dark:text-rose-400 text-xl ml-auto shrink-0"></i>';
                } else {
                    baseStyle = 'border-slate-200 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 opacity-75';
                    badgeStyle = 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-400';
                    checkIcon = '<i class="fa-regular fa-square text-slate-300 dark:text-slate-700 text-xl ml-auto shrink-0"></i>';
                }
            } else {
                // Đang chọn (chưa nộp)
                const isSelected = practiceMultiSelections.has(ans.id);
                if (isSelected) {
                    baseStyle = 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 text-slate-900 dark:text-white font-semibold ring-2 ring-indigo-400/40';
                    badgeStyle = 'bg-indigo-600 text-white border-indigo-600';
                    checkIcon = '<i class="fa-solid fa-square-check text-indigo-600 dark:text-indigo-400 text-xl ml-auto shrink-0"></i>';
                } else {
                    baseStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-500 text-slate-800 dark:text-slate-100';
                    badgeStyle = 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                    checkIcon = '<i class="fa-regular fa-square text-slate-400 text-xl ml-auto shrink-0"></i>';
                }
                btn.onclick = () => togglePracticeMultiChoice(q, ans);
            }

            btn.className = `answer-option w-full text-left p-3.5 sm:p-4 rounded-xl border-2 flex items-start gap-3.5 transition ${baseStyle}`;
            btn.innerHTML = `
                <span class="w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}">${letter}</span>
                <span class="text-sm sm:text-base leading-relaxed flex-1">${ans.content}</span>
                ${checkIcon}
            `;
            answersEl.appendChild(btn);
        });

        // Nút bấm xác nhận câu trả lời chọn nhiều
        if (!existingRecord) {
            const submitBar = document.createElement('div');
            submitBar.className = 'pt-2 flex items-center justify-end';
            submitBar.innerHTML = `
                <button id="btn-submit-practice-multi" onclick="submitPracticeMultiChoice(filteredQuestions[currentIndex])"
                    ${practiceMultiSelections.size === 0 ? 'disabled' : ''}
                    class="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-circle-check"></i> Xác nhận đáp án (${practiceMultiSelections.size}/${q.correctCount} đã chọn)
                </button>
            `;
            answersEl.appendChild(submitBar);
        }
    } else {
        // ==================== CÂU HỎI ĐƠN LỰA CHỌN (SINGLE-CHOICE) ====================
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

            btn.className = `answer-option w-full text-left p-3.5 sm:p-4 rounded-xl border-2 flex items-start gap-3.5 transition ${baseStyle}`;
            btn.innerHTML = `
                <span class="w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}">${letter}</span>
                <span class="text-sm sm:text-base leading-relaxed flex-1">${ans.content}</span>
                ${statusIcon}
            `;

            btn.onclick = () => selectPracticeAnswer(q, ans);
            answersEl.appendChild(btn);
        });
    }

    // Hiển thị phản hồi chi tiết & giải thích
    if (feedbackEl) {
        if (existingRecord) {
            feedbackEl.classList.remove('hidden');
            if (q.isMultiChoice) {
                const correctAnswers = (q.answersList || []).filter(a => a.is_correct);
                if (existingRecord.isCorrect) {
                    feedbackEl.className = 'mt-5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm';
                    feedbackEl.innerHTML = `
                        <div class="font-bold flex items-center gap-2"><i class="fa-solid fa-check-double text-emerald-600"></i> Chính xác! Bạn đã chọn đúng cả ${q.correctCount} đáp án. (Chuỗi nhớ liên tiếp: ${existingRecord.streak || 1})</div>
                        <div class="mt-2 space-y-1 font-semibold text-emerald-800 dark:text-emerald-300">
                            ${correctAnswers.map(a => `<div>✓ ${a.content}</div>`).join('')}
                        </div>
                        ${q.explanation ? `<div class="mt-2 text-xs text-slate-600 dark:text-slate-400 italic">${q.explanation}</div>` : ''}
                    `;
                } else {
                    feedbackEl.className = 'mt-5 p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs sm:text-sm';
                    feedbackEl.innerHTML = `
                        <div class="font-bold flex items-center gap-2"><i class="fa-solid fa-circle-exclamation text-rose-600"></i> Chưa chính xác — Câu hỏi đã được đưa vào giỏ 🔴 Hay sai!</div>
                        <div class="mt-2 space-y-1 font-semibold text-rose-800 dark:text-rose-300">
                            Các đáp án đúng gồm:
                            ${correctAnswers.map(a => `<div>✓ ${a.content}</div>`).join('')}
                        </div>
                        ${q.explanation ? `<div class="mt-2 text-xs text-slate-600 dark:text-slate-400 italic">${q.explanation}</div>` : ''}
                    `;
                }
            } else {
                const correctAns = (q.answersList || []).find(a => a.is_correct);
                if (existingRecord.isCorrect) {
                    feedbackEl.className = 'mt-5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm';
                    feedbackEl.innerHTML = `
                        <div class="font-bold flex items-center gap-2"><i class="fa-solid fa-check-double text-emerald-600"></i> Chính xác! (Chuỗi nhớ liên tiếp: ${existingRecord.streak || 1})</div>
                        <div class="mt-1">Đáp án đúng: <strong>${correctAns ? correctAns.content : ''}</strong></div>
                        ${q.explanation ? `<div class="mt-1.5 text-xs text-slate-600 dark:text-slate-400 italic">${q.explanation}</div>` : ''}
                    `;
                } else {
                    feedbackEl.className = 'mt-5 p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs sm:text-sm';
                    feedbackEl.innerHTML = `
                        <div class="font-bold flex items-center gap-2"><i class="fa-solid fa-circle-exclamation text-rose-600"></i> Chưa chính xác — Câu hỏi đã được đưa vào giỏ 🔴 Hay sai!</div>
                        <div class="mt-1">Đáp án đúng phải là: <strong>${correctAns ? correctAns.content : ''}</strong></div>
                        ${q.explanation ? `<div class="mt-1.5 text-xs text-slate-600 dark:text-slate-400 italic">${q.explanation}</div>` : ''}
                    `;
                }
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

function togglePracticeMultiChoice(question, ans) {
    if (practiceMultiSelections.has(ans.id)) {
        practiceMultiSelections.delete(ans.id);
    } else {
        practiceMultiSelections.add(ans.id);
    }
    renderCurrentPracticeQuestion();
}

function submitPracticeMultiChoice(question) {
    if (!question || practiceMultiSelections.size === 0) return;

    const correctIds = (question.answersList || []).filter(a => a.is_correct).map(a => a.id);
    const selectedIds = Array.from(practiceMultiSelections);

    const isCorrect = selectedIds.length === correctIds.length && correctIds.every(id => practiceMultiSelections.has(id));

    const prevRec = userProgress.answered ? userProgress.answered[question.id] : null;
    const prevStreak = prevRec && prevRec.streak ? prevRec.streak : 0;

    if (!userProgress.answered) userProgress.answered = {};
    userProgress.answered[question.id] = {
        selectedIds: selectedIds,
        selectedId: selectedIds[0] || -1,
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
            }, 900);
        }
    }
}

function selectPracticeAnswer(question, selectedAns) {
    const hasCorrectFlag = (question.answersList || []).some(a => a.is_correct);
    const isCorrect = hasCorrectFlag ? Boolean(selectedAns.is_correct) : true;
    const prevRec = userProgress.answered ? userProgress.answered[question.id] : null;
    const prevStreak = prevRec && prevRec.streak ? prevRec.streak : 0;

    if (!userProgress.answered) userProgress.answered = {};
    userProgress.answered[question.id] = {
        selectedId: selectedAns.id,
        selectedIds: [selectedAns.id],
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
        selectedIds: (q.answersList || []).filter(a => a.is_correct).map(a => a.id),
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
        practiceMultiSelections.clear();
        renderCurrentPracticeQuestion();
    }
}

function nextQuestion() {
    if (currentIndex < filteredQuestions.length - 1) {
        currentIndex++;
        practiceMultiSelections.clear();
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


// ==================== SUBTOPIC PILLS SCROLL & DRAG INTERACTIONS ====================

function scrollSubtopics(direction) {
    const container = document.getElementById('subtopic-pills');
    if (!container) return;
    const scrollAmount = 280;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    setTimeout(updateSubtopicScrollButtons, 300);
}

function updateSubtopicScrollButtons() {
    const container = document.getElementById('subtopic-pills');
    const leftBtn = document.getElementById('subtopic-scroll-left');
    const rightBtn = document.getElementById('subtopic-scroll-right');
    if (!container || !leftBtn || !rightBtn) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    const currentScroll = container.scrollLeft;

    if (currentScroll <= 6) {
        leftBtn.classList.add('opacity-0', 'pointer-events-none');
        leftBtn.classList.remove('opacity-100', 'pointer-events-auto');
    } else {
        leftBtn.classList.remove('opacity-0', 'pointer-events-none');
        leftBtn.classList.add('opacity-100', 'pointer-events-auto');
    }

    if (maxScroll <= 0 || currentScroll >= maxScroll - 6) {
        rightBtn.classList.add('opacity-0', 'pointer-events-none');
        rightBtn.classList.remove('opacity-100', 'pointer-events-auto');
    } else {
        rightBtn.classList.remove('opacity-0', 'pointer-events-none');
        rightBtn.classList.add('opacity-100', 'pointer-events-auto');
    }
}

function setupSubtopicScrollInteractions() {
    const container = document.getElementById('subtopic-pills');
    if (!container) return;

    // 1. Chuyển thao tác lăn chuột dọc (Mouse Wheel Vertical) thành cuộn ngang
    container.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            container.scrollLeft += e.deltaY;
            updateSubtopicScrollButtons();
        }
    }, { passive: false });

    // 2. Kéo thả chuột ngang (Mouse Drag-to-Scroll)
    let isMouseDown = false;
    let startX = 0;
    let initialScrollLeft = 0;
    let hasDragged = false;

    container.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        hasDragged = false;
        startX = e.pageX - container.offsetLeft;
        initialScrollLeft = container.scrollLeft;
        container.classList.add('cursor-grabbing');
    });

    window.addEventListener('mouseup', () => {
        if (isMouseDown) {
            isMouseDown = false;
            container.classList.remove('cursor-grabbing');
        }
    });

    container.addEventListener('mouseleave', () => {
        if (isMouseDown) {
            isMouseDown = false;
            container.classList.remove('cursor-grabbing');
        }
    });

    container.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        e.preventDefault();
        const currentX = e.pageX - container.offsetLeft;
        const walk = (currentX - startX) * 1.5;
        if (Math.abs(walk) > 4) {
            hasDragged = true;
        }
        container.scrollLeft = initialScrollLeft - walk;
        updateSubtopicScrollButtons();
    });

    // Ngăn chặn sự kiện click nhầm vào pill khi người dùng vừa thực hiện kéo chuột
    container.addEventListener('click', (e) => {
        if (hasDragged) {
            e.preventDefault();
            e.stopPropagation();
            hasDragged = false;
        }
    }, true);

    // 3. Lắng nghe sự kiện scroll và resize để cập nhật mũi tên
    container.addEventListener('scroll', () => {
        updateSubtopicScrollButtons();
    }, { passive: true });

    window.addEventListener('resize', () => {
        updateSubtopicScrollButtons();
    }, { passive: true });

    // Cập nhật trạng thái nút cuộn ban đầu
    updateSubtopicScrollButtons();
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
        } else if (e.key === 'Enter') {
            const submitMultiBtn = document.getElementById('btn-submit-practice-multi');
            if (submitMultiBtn && !submitMultiBtn.disabled) {
                e.preventDefault();
                submitMultiBtn.click();
            }
        } else if (studyMode === 'quiz' && ['1', '2', '3', '4', 'a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
            const map = { '1': 0, 'a': 0, '2': 1, 'b': 1, '3': 2, 'c': 2, '4': 3, 'd': 3 };
            const idx = map[e.key.toLowerCase()];
            const optionButtons = document.querySelectorAll('#q-answers button.answer-option');
            if (optionButtons[idx]) optionButtons[idx].click();
        }
    });
}

if (typeof window !== 'undefined') {
    window.practiceMultiSelections = practiceMultiSelections;
    window.selectSubtopic = selectSubtopic;
    window.updateSubtopicPillsUI = updateSubtopicPillsUI;
    window.setStudyMode = setStudyMode;
    window.toggleStudyModeQuick = toggleStudyModeQuick;
    window.applyPracticeFilter = applyPracticeFilter;
    window.toggleAutoAdvance = toggleAutoAdvance;
    window.toggleShuffleAnswers = toggleShuffleAnswers;
    window.toggleShuffleQuestions = toggleShuffleQuestions;
    window.renderCurrentPracticeQuestion = renderCurrentPracticeQuestion;
    window.togglePracticeMultiChoice = togglePracticeMultiChoice;
    window.submitPracticeMultiChoice = submitPracticeMultiChoice;
    window.selectPracticeAnswer = selectPracticeAnswer;
    window.flipFlashcard = flipFlashcard;
    window.rateFlashcard = rateFlashcard;
    window.prevQuestion = prevQuestion;
    window.nextQuestion = nextQuestion;
    window.toggleStarCurrent = toggleStarCurrent;
    window.scrollSubtopics = scrollSubtopics;
    window.updateSubtopicScrollButtons = updateSubtopicScrollButtons;
    window.setupSubtopicScrollInteractions = setupSubtopicScrollInteractions;
    window.setupKeyboardShortcuts = setupKeyboardShortcuts;
}
