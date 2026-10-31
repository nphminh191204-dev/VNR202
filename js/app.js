/**
 * VNR202 - Bootstrap & Khởi tạo ứng dụng
 */

// Khởi chạy khi trang đã nạp xong DOM
window.addEventListener('DOMContentLoaded', () => {
    if (typeof loadProgressFromStorage === 'function') {
        loadProgressFromStorage();
    }
    if (typeof setupKeyboardShortcuts === 'function') {
        setupKeyboardShortcuts();
    }

    // Tự động nhận diện dữ liệu có sẵn từ data/vnr202.js
    if (window.VNR202_DATA && Array.isArray(window.VNR202_DATA.questionsList)) {
        processRawQuestionsList(window.VNR202_DATA.questionsList, true);
    } else {
        console.warn('Không tìm thấy dữ liệu window.VNR202_DATA từ data/vnr202.js.');
    }
});
