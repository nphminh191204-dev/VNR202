/**
 * VNR202 - Quản lý LocalStorage & Giao diện Dark Mode
 */

function loadProgressFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            userProgress.answered = parsed.answered || {};
            userProgress.starred = parsed.starred || [];
            userProgress.darkMode = Boolean(parsed.darkMode);
        }
    } catch (e) {
        console.warn('Lỗi đọc tiến độ từ localStorage:', e);
    }
    applyDarkModeUI();
}

function saveProgressToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
    } catch (e) {
        console.warn('Lỗi lưu tiến độ vào localStorage:', e);
    }
}

function toggleDarkMode() {
    userProgress.darkMode = !userProgress.darkMode;
    applyDarkModeUI();
    saveProgressToStorage();
}

function applyDarkModeUI() {
    const htmlEl = document.documentElement;
    const icon = document.getElementById('dark-mode-icon');
    if (userProgress.darkMode) {
        htmlEl.classList.add('dark');
        if (icon) icon.className = 'fa-solid fa-sun text-amber-300';
    } else {
        htmlEl.classList.remove('dark');
        if (icon) icon.className = 'fa-solid fa-moon text-amber-100';
    }
}

if (typeof window !== 'undefined') {
    window.loadProgressFromStorage = loadProgressFromStorage;
    window.saveProgressToStorage = saveProgressToStorage;
    window.toggleDarkMode = toggleDarkMode;
    window.applyDarkModeUI = applyDarkModeUI;
}

