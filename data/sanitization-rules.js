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

// Bộ vá lỗi chính xác cho các câu hỏi bị lỗi phương án / thiếu đáp án đúng / câu hỏi chọn nhiều đáp án
const QUESTION_SPECIFIC_PATCHES = {
    [-421]: {
        content: "Động lực cách mạng trong Cương lĩnh chính trị đầu tiên của Đảng ta xác định bao gồm những lực lượng nào? (Chọn 2 đáp án)",
        explanation: "Đáp án đúng gồm 2 phương án: Giai cấp công nhân và Giai cấp nông dân (Cương lĩnh 2/1930 xác định công - nông là hai động lực chính của cách mạng).",
        correctAnswerIds: new Set([-1664, -1667])
    },
    [-359]: {
        content: "Đại hội lần thứ II Đảng Cộng sản Đông Dương (1951) đã quyết định: (Chọn các đáp án đúng)",
        explanation: "Đại hội II (1951) quyết định đổi tên Đảng thành Đảng Lao động Việt Nam và thành lập chính đảng cách mạng riêng ở Lào và Campuchia.",
        correctAnswerIds: new Set([-1424, -1425])
    },
    [-426]: {
        content: "Sau Hiệp định Giơnevo (7/1954) cách mạng Việt Nam có những thuận lợi gì? (Chọn các đáp án đúng)",
        explanation: "Hệ thống XHCN lớn mạnh, Phong trào GPDT thế giới lên cao và Miền Bắc hoàn toàn giải phóng là các điều kiện thuận lợi cơ bản sau Hiệp định Giơnevơ.",
        correctAnswerIds: new Set([-1684, -1685, -1686])
    },
    [-246]: {
        content: "Lực lượng tạo nên động lực cho cách mạng Việt Nam được nêu ra trong Chính cương của Đảng Lao động Việt Nam là:",
        explanation: "Đáp án: Công nhân, nông dân, lao động trí thức (Chính cương 1951 xác định đây là nền tảng của động lực cách mạng).",
        correctAnswerIds: new Set([-978])
    },
    [-376]: {
        content: "Chính sách cai trị thời chiến được Pháp thi hành vào giai đoạn nào?",
        explanation: "Đáp án: 1939 - 1945 (Thời kỳ Chiến tranh thế giới thứ hai 1939-1945).",
        answersList: [
            { id: -14861, content: "1936 - 1939", is_correct: false, index_order: 1 },
            { id: -14862, content: "1939 - 1945", is_correct: true, index_order: 2 },
            { id: -1486, content: "1945 - 1954", is_correct: false, index_order: 3 },
            { id: -1487, content: "1930 - 1935", is_correct: false, index_order: 4 }
        ]
    },
    [-373]: {
        content: "Bản Hiến pháp đầu tiên của nước Việt Nam Dân chủ cộng hòa được thông qua vào thời gian nào sau đây?",
        explanation: "Đáp án: 9/11/1946 (Kỳ họp thứ 2 Quốc hội khóa I thông qua).",
        answersList: [
            { id: -14781, content: "9/11/1945", is_correct: false, index_order: 1 },
            { id: -14782, content: "2/9/1945", is_correct: false, index_order: 2 },
            { id: -1478, content: "12/12/1946", is_correct: false, index_order: 3 },
            { id: -1479, content: "9/11/1946", is_correct: true, index_order: 4 }
        ]
    },
    [-375]: {
        content: "Hiệp định Pa-ri về chấm dứt chiến tranh lập lại hòa bình ở Việt Nam được ký kết vào thời gian nào sau đây?",
        explanation: "Đáp án: 27/1/1973 (Hiệp định Pa-ri về Việt Nam).",
        answersList: [
            { id: -14841, content: "20/7/1954", is_correct: false, index_order: 1 },
            { id: -14842, content: "22/12/1954", is_correct: false, index_order: 2 },
            { id: -1484, content: "27/7/1973", is_correct: false, index_order: 3 },
            { id: -1485, content: "27/1/1973", is_correct: true, index_order: 4 }
        ]
    }
};

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
    window.QUESTION_SPECIFIC_PATCHES = QUESTION_SPECIFIC_PATCHES;
    window.SUBTOPIC_NAMES = SUBTOPIC_NAMES;
}
