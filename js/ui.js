/**
 * VNR202 - Điều hướng giao diện & Thông báo (UI & Navigation)
 */

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600' : (type === 'warning' ? 'bg-amber-600' : 'bg-rose-600');
    const iconClass = type === 'success' ? 'fa-circle-check' : (type === 'warning' ? 'fa-circle-exclamation' : 'fa-triangle-exclamation');

    toast.className = `${bgClass} text-white px-4 py-3 rounded-xl shadow-lg text-xs sm:text-sm font-semibold flex items-center gap-2.5 pointer-events-auto transition-all duration-300`;
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('custom-modal');
    if (!modal) return;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const close = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };
    document.getElementById('modal-cancel').onclick = close;
    document.getElementById('modal-confirm').onclick = () => {
        close();
        if (typeof onConfirm === 'function') onConfirm();
    };
}

function switchTab(tabName) {
    const tabs = ['practice', 'exam', 'bank'];
    tabs.forEach(t => {
        const view = document.getElementById(`view-${t}`);
        const btn = document.getElementById(`tab-${t}`);
        if (!view || !btn) return;
        if (t === tabName) {
            view.classList.remove('hidden');
            btn.className = 'nav-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap bg-white text-party-800 shadow-sm';
        } else {
            view.classList.add('hidden');
            btn.className = 'nav-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap text-red-100 hover:bg-white/10';
        }
    });
}

if (typeof window !== 'undefined') {
    window.showToast = showToast;
    window.showConfirmModal = showConfirmModal;
    window.switchTab = switchTab;
}

