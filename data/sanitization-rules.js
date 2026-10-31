/**
 * VNR202 - Bộ quy tắc làm sạch dữ liệu và phân loại chuyên đề
 */

// Danh sách từ bị cắt cụt đuôi trong file gốc và từ thay thế chuẩn
const TRUNCATED_WORD_FIXES = [
    [/^Mặt trận Việt$/i, 'Mặt trận Việt Minh'],
    [/^D\.\s*Tổng bộ Việt$/i, 'Tổng bộ Việt Minh'],
    [/^Tổng bộ Việt$/i, 'Tổng bộ Việt Minh'],
    [/^Hội Phản đế Đồng$/i, 'Hội Phản đế Đồng minh'],
    [/^Tuyên$/i, 'Tuyên Quang'],
    [/^Bến$/i, 'Bến Tre'],
    [/^B\.\s*Tây$/i, 'Tây Ninh'],
    [/^Tây$/i, 'Tây Ninh'],
    [/^Trường$/i, 'Trường Chinh'],
    [/^B\.\s*Trường$/i, 'Trường Chinh'],
    [/^Hồ Chí$/i, 'Hồ Chí Minh'],
    [/^Lãnh tụ Hồ Chí$/i, 'Lãnh tụ Hồ Chí Minh'],
    [/^Cao Bằng,\s*Việt$/i, 'Cao Bằng, Việt Nam'],
    [/Đảng Cộng sản Việt$/i, 'Đảng Cộng sản Việt Nam'],
    [/giai cấp công nhân Việt$/i, 'giai cấp công nhân Việt Nam'],
    [/nhanh chó$/i, 'nhanh chóng.'],
    [/chính trị - xã hội khác$/i, 'chính trị - xã hội khác nhau.'],
    [/Chủ tịch Hồ Chí$/i, 'Chủ tịch Hồ Chí Minh'],
    [/Tổng Bí thư Trường$/i, 'Tổng Bí thư Trường Chinh']
];

// Danh sách ID câu hỏi có phần đuôi câu hỏi bị tràn xuống phương án A
const SPILL_IDS = new Set([3106, 3184, 3207, 3209, 3335]);

// Tên hiển thị các chuyên đề lịch sử
const SUBTOPIC_NAMES = {
    t1: 'Chuyên đề 1: Thành lập Đảng',
    t2: 'Chuyên đề 2: Cao trào 1930-1935',
    t3: 'Chuyên đề 3: Giải phóng dân tộc 36-45',
    t4: 'Chuyên đề 4: Bảo vệ chính quyền 45-46',
    t5: 'Chuyên đề 5: Kháng chiến chống Pháp',
    t6: 'Chuyên đề 6: Chống Mỹ & CNXH miền Bắc'
};

if (typeof window !== 'undefined') {
    window.TRUNCATED_WORD_FIXES = TRUNCATED_WORD_FIXES;
    window.SPILL_IDS = SPILL_IDS;
    window.SUBTOPIC_NAMES = SUBTOPIC_NAMES;
}

