/**
 * VNR202 - Hộp thoại xác nhận đặt lại tiến độ học tập (Modals)
 */

function confirmResetProgress() {
    if (typeof showConfirmModal !== 'function') return;
    showConfirmModal(
        'Đặt lại tiến độ học tập?',
        'Toàn bộ lịch sử trong 3 giỏ nhớ Leitner sẽ được đặt lại từ đầu (các câu đánh dấu sao ★ vẫn được giữ nguyên).',
        () => {
            userProgress.answered = {};
            if (typeof saveProgressToStorage === 'function') saveProgressToStorage();
            if (typeof updateDashboardStats === 'function') updateDashboardStats();
            if (typeof applyPracticeFilter === 'function') applyPracticeFilter();
            if (typeof showToast === 'function') showToast('Đã đặt lại tiến độ học tập!', 'warning');
        }
    );
}

if (typeof window !== 'undefined') {
    window.confirmResetProgress = confirmResetProgress;
}
