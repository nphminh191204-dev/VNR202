/**
 * VNR202 - Tra cứu & Tìm kiếm ngân hàng câu hỏi (Question Bank Viewer)
 */

function renderBankList() {
    const searchInput = document.getElementById('bank-search-input');
    const chapFilterEl = document.getElementById('bank-chapter-filter');
    const container = document.getElementById('bank-list-container');
    const countLabel = document.getElementById('bank-count-label');

    if (!container) return;

    const keyword = ((searchInput && searchInput.value) || '').trim().toLowerCase();
    const chapFilter = (chapFilterEl && chapFilterEl.value) || 'all';
    const starredSet = new Set(userProgress.starred || []);

    const matches = allQuestions.filter(q => {
        if (chapFilter === '1' && q.chapter !== 1) return false;
        if (chapFilter === '2' && q.chapter !== 2) return false;
        if (chapFilter === 'starred' && !starredSet.has(q.id)) return false;
        if (!keyword) return true;
        const inQ = (q.content || '').toLowerCase().includes(keyword);
        const inA = (q.answersList || []).some(a => (a.content || '').toLowerCase().includes(keyword));
        return inQ || inA || String(q.id).includes(keyword);
    });

    if (countLabel) {
        countLabel.textContent = `Tìm thấy ${matches.length} câu`;
    }
    container.innerHTML = '';

    const displaySlice = matches.slice(0, 120);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const subtopicNames = typeof SUBTOPIC_NAMES !== 'undefined' ? SUBTOPIC_NAMES : {};
    const highlightFn = typeof formatQuestionWithHighlights === 'function' ? formatQuestionWithHighlights : (t => t);

    displaySlice.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm';

        const answersHtml = (q.answersList || []).map((a, aIdx) => {
            const letter = letters[aIdx] || String(aIdx + 1);
            if (a.is_correct) {
                return `<div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <span class="w-5 h-5 rounded bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">${letter}</span>
                    <span>${a.content}</span>
                    <i class="fa-solid fa-check text-emerald-600 ml-auto"></i>
                </div>`;
            }
            return `<div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs sm:text-sm flex items-center gap-2">
                <span class="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center shrink-0">${letter}</span>
                <span>${a.content}</span>
            </div>`;
        }).join('');

        item.innerHTML = `
            <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span class="text-xs font-bold text-slate-400">#${idx + 1} (ID: ${q.id})</span>
                <span class="px-2.5 py-0.5 rounded-md text-xs font-semibold ${q.chapter === 1 ? 'bg-red-50 dark:bg-red-950 text-party-700 dark:text-red-300' : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}">
                    Chương ${q.chapter} • ${subtopicNames[q.subtopic] || ''}
                </span>
            </div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-3 leading-relaxed">${highlightFn(q.content)}</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${answersHtml}</div>
        `;
        container.appendChild(item);
    });
}

if (typeof window !== 'undefined') {
    window.renderBankList = renderBankList;
}
