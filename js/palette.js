/**
 * VNR202 - Bảng điều hướng câu hỏi (Desktop & Mobile Drawer Palette)
 */

function toggleMobilePaletteSheet(show) {
    const sheet = document.getElementById('mobile-palette-sheet');
    if (!sheet) return;
    if (show) {
        sheet.classList.remove('hidden');
        sheet.classList.add('flex');
    } else {
        sheet.classList.add('hidden');
        sheet.classList.remove('flex');
    }
}

function renderQuestionPalette() {
    const desktopPalette = document.getElementById('question-palette');
    const mobilePalette = document.getElementById('mobile-question-palette');
    const progressText = document.getElementById('palette-progress-text');

    if (desktopPalette) desktopPalette.innerHTML = '';
    if (mobilePalette) mobilePalette.innerHTML = '';

    let doneInFilter = 0;
    const starredSet = new Set(userProgress.starred || []);

    filteredQuestions.forEach((q, idx) => {
        const bucket = getQuestionMasteryBucket(q.id);
        if (bucket !== 'unanswered') doneInFilter++;

        let colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
        if (bucket === 'wrong') {
            colorClass = 'bg-rose-500 text-white font-bold border-rose-600';
        } else if (bucket === 'learning') {
            colorClass = 'bg-amber-500 text-white font-bold border-amber-600';
        } else if (bucket === 'mastered') {
            colorClass = 'bg-emerald-500 text-white font-bold border-emerald-600';
        }

        const starRing = starredSet.has(q.id) ? 'ring-2 ring-amber-400' : '';
        const activeRing = idx === currentIndex ? 'ring-2 ring-slate-900 dark:ring-white scale-105' : '';

        const createBtn = (isMobile) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `h-9 rounded-lg text-xs font-semibold transition flex items-center justify-center ${colorClass} ${starRing} ${activeRing}`;
            btn.textContent = idx + 1;
            btn.onclick = () => {
                currentIndex = idx;
                if (typeof renderCurrentPracticeQuestion === 'function') renderCurrentPracticeQuestion();
                if (isMobile) toggleMobilePaletteSheet(false);
            };
            return btn;
        };

        if (desktopPalette) desktopPalette.appendChild(createBtn(false));
        if (mobilePalette) mobilePalette.appendChild(createBtn(true));
    });

    if (progressText) {
        progressText.textContent = `${doneInFilter}/${filteredQuestions.length} đã làm`;
    }
}

function highlightCurrentInPalette() {
    const updateBtns = (selector) => {
        document.querySelectorAll(selector).forEach((b, idx) => {
            if (idx === currentIndex) {
                b.classList.add('ring-2', 'ring-slate-900', 'dark:ring-white', 'scale-105');
            } else {
                b.classList.remove('ring-2', 'ring-slate-900', 'dark:ring-white', 'scale-105');
            }
        });
    };
    updateBtns('#question-palette button');
    updateBtns('#mobile-question-palette button');
}

if (typeof window !== 'undefined') {
    window.toggleMobilePaletteSheet = toggleMobilePaletteSheet;
    window.renderQuestionPalette = renderQuestionPalette;
    window.highlightCurrentInPalette = highlightCurrentInPalette;
}

