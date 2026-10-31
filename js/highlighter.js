/**
 * VNR202 - Smart Keyword Highlighting (Tô sáng từ khóa & bẫy trắc nghiệm)
 */

function formatQuestionWithHighlights(rawText) {
    if (!rawText) return '';
    // Escape HTML an toàn
    let safe = rawText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 1. Tô đỏ nổi bật các cụm từ phủ định / bẫy câu hỏi
    safe = safe.replace(
        /\b(không phải|không thuộc|không có|không phản ánh|không đúng|chưa phù hợp|ngoại trừ|sai|hạn chế lớn nhất|hạn chế)\b/gi,
        '<span class="px-1.5 py-0.5 mx-0.5 rounded-md bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-200 font-extrabold underline decoration-rose-500 decoration-2">$1</span>'
    );

    // 2. Tô màu mốc thời gian (VD: 1930-1931, 2/9/1945, tháng 10/1930, 1954...)
    safe = safe.replace(
        /\b((?:ngày\s+\d{1,2}[\/-]\d{1,2}[\/-]\d{4})|(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{4})|(?:tháng\s+\d{1,2}[\/-]\d{4})|(?:\d{4}\s*-\s*\d{4})|(?:18\d{2}|19\d{2}))\b/gi,
        '<span class="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold">$1</span>'
    );

    // 3. Tô màu các Văn kiện / Hội nghị / Đại hội quan trọng
    safe = safe.replace(
        /(Cương lĩnh chính trị đầu tiên|Cương lĩnh đầu tiên|Luận cương chính trị|Chính cương|Hội nghị[^\.,?]+|Đại hội[^\.,?]+|Hiệp định Giơ-ne-vơ|Hiệp định Giơnevơ|Hiệp định Sơ bộ|Hiệp định Pari|Hiệp định Paris|Tạm ước|Chỉ thị[^\.,?]+|Luật 10\/59)/gi,
        '<span class="text-party-700 dark:text-red-300 font-extrabold">$1</span>'
    );

    return safe;
}

if (typeof window !== 'undefined') {
    window.formatQuestionWithHighlights = formatQuestionWithHighlights;
}

