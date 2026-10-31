/**
 * VNR202 - Bộ tự động làm sạch & vá lỗi dữ liệu gốc (Data Sanitization & Deduplication Engine)
 */

// Danh sách ID câu hỏi được chỉ định ưu tiên chọn trong các nhóm có sự khác biệt nhỏ về đáp án
const PREFERRED_QUESTION_IDS = new Map([
    [3016, 3406], // Đường lối "Dựa vào sức mình là chính" -> 3406 ("tự lực cánh sinh, tranh thủ quốc tế") chuẩn xác hơn
    [3332, 3108], // Cương lĩnh chính trị đầu tiên 2/1930 -> 3108 chuẩn xác (3332 nhầm sang Luận cương)
    [3171, 3388], // Thời cơ Tổng khởi nghĩa tháng 8 -> 3388 chuẩn xác (3171 dính chữ Hán quần群众 và chọn sai)
]);

/**
 * Xử lý chuỗi văn bản bị cụt hoặc dính tiền tố đáp án A-D
 */
function repairTextFragment(str) {
    if (!str) return { text: '', changed: false };
    let s = str.trim();
    let changed = false;

    // Xóa tiền tố "B. ", "C. ", "D. " bị dính thừa ở đầu phương án
    if (/^[A-D]\.\s+/i.test(s)) {
        s = s.replace(/^[A-D]\.\s+/i, '').trim();
        changed = true;
    }

    // Sửa các từ bị cụt ở cuối câu
    const fixes = typeof TRUNCATED_WORD_FIXES !== 'undefined' ? TRUNCATED_WORD_FIXES : [];
    for (const [regex, replacement] of fixes) {
        if (regex.test(s)) {
            s = s.replace(regex, replacement);
            changed = true;
        }
    }
    return { text: s, changed };
}

/**
 * Tạo chữ ký chuẩn hóa (canonical stem) của câu hỏi để nhận diện các câu trùng lặp
 */
function getCanonicalStem(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/^\(kiểu hỏi khác:\s*/i, '') // Xóa tiền tố "(Kiểu hỏi khác:"
        .replace(/[\s\u200B-\u200D\uFEFF]+/g, ' ')
        .replace(/[.,?:;!\"'“”‘’\(\)\[\]\-–—]/g, '')
        // Lược bỏ các từ kết thúc câu hỏi thông dụng để ghép nối các biến thể hỏi giống nhau
        .replace(/\b(là gì|là ai|là|là lực lượng nào|là thời gian nào|là ngày nào|được tổ chức tại|được triệu tập bởi|ở đâu)\s*$/g, '')
        .trim();
}

/**
 * Chọn câu hỏi đại diện chất lượng cao nhất trong một nhóm câu trùng lặp
 */
function pickBestQuestion(group) {
    if (group.length === 1) return group[0];

    // Ưu tiên câu theo bảng PREFERRED_QUESTION_IDS nếu có
    for (const q of group) {
        for (const [rejectedId, preferredId] of PREFERRED_QUESTION_IDS.entries()) {
            if (q.id === preferredId) return q;
        }
    }

    // Đánh giá điểm chất lượng cho từng ứng viên
    const scored = group.map(q => {
        let score = 0;
        // Ưu tiên ID dương (thuộc bộ ID chính thức) hơn ID âm
        if (q.id > 0) score += 20;
        // Trừ điểm nếu có tiền tố "(Kiểu hỏi khác:"
        if (q.content.startsWith('(Kiểu hỏi khác')) score -= 30;
        // Trừ điểm nặng nếu dính ký tự chữ Hán lạ (VD: 群众)
        if (/[\u4e00-\u9fa5]/.test(q.content)) score -= 50;
        // Ưu tiên câu có dấu chấm hoặc hỏi ở cuối
        if (/[.?]$/.test(q.content.trim())) score += 5;
        // Ưu tiên câu có explanation rõ ràng
        if (q.explanation && q.explanation.length > 5) score += 5;
        // Ưu tiên câu có gắn cờ is_correct chuẩn
        if (q.answersList && q.answersList.some(a => a.is_correct)) score += 10;
        // Ưu tiên câu có đúng 4 phương án
        if (q.answersList && q.answersList.length === 4) score += 5;

        return { q, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].q;
}

/**
 * Thuật toán lọc bỏ các câu hỏi trùng lặp & tạo bản đồ ID alias
 */
function deduplicateQuestions(list) {
    const stemGroups = new Map();

    for (const q of list) {
        const key = getCanonicalStem(q.content);
        if (!stemGroups.has(key)) {
            stemGroups.set(key, []);
        }
        stemGroups.get(key).push(q);
    }

    const uniqueQuestions = [];
    const groupsMap = new Map(); // canonicalId -> [otherDuplicateQuestions...]
    const aliasMap = {};         // duplicateId -> canonicalId
    let duplicateCount = 0;

    for (const [key, group] of stemGroups.entries()) {
        const best = pickBestQuestion(group);
        uniqueQuestions.push(best);

        if (group.length > 1) {
            const others = group.filter(x => x.id !== best.id);
            groupsMap.set(best.id, others);
            others.forEach(dupQ => {
                aliasMap[dupQ.id] = best.id;
                duplicateCount++;
            });
            best.hasDuplicates = true;
            best.duplicateCount = others.length;
        } else {
            best.hasDuplicates = false;
            best.duplicateCount = 0;
        }
    }

    return {
        uniqueQuestions,
        duplicateGroupsMap: groupsMap,
        aliasIdMap: aliasMap,
        duplicateCount
    };
}

/**
 * Phân loại câu hỏi vào 6 chuyên đề bám sát giáo trình
 */
function classifySubtopic(q, chapter) {
    const text = (q.content + ' ' + (q.answersList || []).map(a => a.content).join(' ')).toLowerCase();
    if (chapter === 1) {
        if (/1936|1938|1939|1940|1941|1945|tân trào|nhật|việt minh|bắc sơn|tháng tám|pác bó|tw 8|trung ương 8|trung ương viii/i.test(text)) {
            return 't3'; // 1936-1945
        }
        if (/1930\s*-\s*1931|1930-1931|luận cương|trần phú|xô viết|nghệ\s*-\s*tĩnh|nghệ tĩnh|10\/1930|10-1930|1932|1935|lê hồng phong|ma cao|phản đế đồng minh/i.test(text)) {
            return 't2'; // 1930-1935
        }
        return 't1'; // Trước 1930 & Thành lập Đảng
    } else {
        if (/1954\s*-\s*1975|mỹ|diệm|10\/59|đồng khởi|đại hội iii|đại hội lần thứ iii|1960|1961|1965|1967|1968|mậu thân|1973|pari|1975|hồ chí minh|tây nguyên|phước long|nguyễn hữu thọ|cục bộ|đặc biệt|việt nam hóa/i.test(text)) {
            return 't6'; // 1954-1975 Chống Mỹ & CNXH miền Bắc
        }
        if (/1945\s*-\s*1946|tưởng|sơ bộ|6\/3\/1946|6-3-1946|tạm ước|14\/9|bình dân học vụ|ngàn cân treo sợi tóc|kháng chiến kiến quốc|25\/11\/1945|hoa - việt|nam tiến/i.test(text)) {
            return 't4'; // 1945-1946 Bảo vệ chính quyền
        }
        return 't5'; // 1946-1954 Kháng chiến chống Pháp
    }
}

/**
 * Chuẩn hóa, lọc bỏ đáp án rỗng/ảo, sửa tràn câu hỏi và vá lỗi từng câu
 */
function sanitizeAndRepairQuestion(rawQ, chapter) {
    let wasRepaired = false;
    let stem = (rawQ.content || '').trim();
    const stemFix = repairTextFragment(stem);
    if (stemFix.changed) {
        stem = stemFix.text;
        wasRepaired = true;
    }

    let rawAnswers = Array.isArray(rawQ.answersList) ? [...rawQ.answersList] : [];

    // Bước 1: Kiểm tra đáp án ảo kiểu "A", "B", "C", "D" ở cuối danh sách (VD: câu 3200, 3337, 3372)
    let forcedCorrectIndex = -1;
    const filteredRaw = [];

    for (const ans of rawAnswers) {
        const c = (ans && typeof ans.content === 'string') ? ans.content.trim() : '';
        if (!c || c === '..' || c === '...') {
            wasRepaired = true;
            continue;
        }
        if (/^[A-D]$/i.test(c)) {
            wasRepaired = true;
            if (ans.is_correct) {
                forcedCorrectIndex = c.toUpperCase().charCodeAt(0) - 65; // 'A'->0, 'B'->1, 'C'->2, 'D'->3
            }
            continue;
        }
        filteredRaw.push({ ...ans, content: c });
    }

    // Bước 2: Kiểm tra lỗi tràn phần đuôi câu hỏi xuống phương án 1 (khi có 5 phương án hoặc câu đặc thù)
    const spillSet = typeof SPILL_IDS !== 'undefined' ? SPILL_IDS : new Set([3106, 3184, 3207, 3209, 3335]);
    if (filteredRaw.length === 5 && (spillSet.has(rawQ.id) || /[:?]$/.test(filteredRaw[0].content))) {
        const spilledText = filteredRaw[0].content;
        if (rawQ.id === 3106) {
            stem = 'Ai là người ban hành mệnh lệnh: "Thần tốc, thần tốc hơn nữa; táo bạo, táo bạo hơn nữa; tranh thủ từng phút, từng giờ, xốc tới mặt trận, giải phóng miền Nam. Quyết chiến và toàn thắng"?';
        } else if (rawQ.id === 3335) {
            stem = 'Đại hội lần thứ III của Đảng họp tại thủ đô Hà Nội (5 - 10/9/1960) đã hoàn chỉnh đường lối chiến lược chung của cách mạng Việt Nam trong giai đoạn mới và vạch ra hai nhiệm vụ chiến lược đó là:';
        } else {
            stem = `${stem} ${spilledText}`;
        }
        filteredRaw.shift(); // Bỏ phương án 1 bị tràn
        wasRepaired = true;
    }

    // Bước 3: Áp dụng sửa từ cụt cho từng phương án và đồng bộ cờ is_correct
    const cleanedAnswers = filteredRaw.map((a, idx) => {
        const fixed = repairTextFragment(a.content);
        if (fixed.changed) wasRepaired = true;
        return {
            id: a.id !== undefined ? a.id : idx + 1,
            content: fixed.text,
            is_correct: Boolean(a.is_correct),
            index_order: idx + 1,
            question_target_id: rawQ.id
        };
    });

    if (forcedCorrectIndex >= 0 && forcedCorrectIndex < cleanedAnswers.length) {
        cleanedAnswers.forEach((a, i) => { a.is_correct = (i === forcedCorrectIndex); });
    }

    // Nếu vẫn chưa có đáp án nào is_correct=true, đối chiếu từ explanation ("Đáp án: C")
    if (!cleanedAnswers.some(a => a.is_correct) && rawQ.explanation) {
        const m = rawQ.explanation.match(/Đáp án:\s*([A-D])/i);
        if (m) {
            const idx = m[1].toUpperCase().charCodeAt(0) - 65;
            if (cleanedAnswers[idx]) {
                cleanedAnswers[idx].is_correct = true;
                wasRepaired = true;
            }
        }
    }

    const qObj = {
        id: rawQ.id,
        content: stem,
        explanation: (rawQ.explanation || '').trim(),
        quizTargetId: rawQ.quizTargetId || 11,
        chapter: chapter,
        answersList: cleanedAnswers,
        wasRepaired
    };
    qObj.subtopic = classifySubtopic(qObj, chapter);
    return qObj;
}

/**
 * Phân loại câu hỏi thuộc Chương 1, Chương 2 hay Chương 3
 */
function classifyQuestionChapter(q) {
    const ch1 = typeof CH1_IDS !== 'undefined' ? CH1_IDS : new Set();
    const ch2 = typeof CH2_IDS !== 'undefined' ? CH2_IDS : new Set();

    if (ch1.has(q.id)) return 1;
    if (ch2.has(q.id)) return 2;

    const text = (q.content || '').toLowerCase();
    if (/đại hội\s*(iv|v|vi|vii|viii|ix|x|xi|xii|xiii|4|5|6|7|8|9|10|11|12|13)\b/i.test(text) ||
        /1976|1979|1982|1986|1991|1996|2001|2006|2011|2016|2021|wto|asean|apec|đổi mới|công nghiệp hóa, hiện đại hóa|kinh tế thị trường định hướng/i.test(text)) {
        return 3;
    }
    if (/1930|1931|1935|1936|1939|1940|1941|cương lĩnh đầu tiên|luận cương|xô viết nghệ|hội việt nam cách mạng thanh niên|nguyễn ái quốc|tân trào|khởi nghĩa tháng tám|khai thác thuộc địa/i.test(text)) {
        return 1;
    }
    if (/1946|1947|1950|1951|1953|1954|1959|1960|1965|1968|1973|1975|điện biên phủ|giơ-ne-vơ|giơnevơ|mỹ - diệm|đồng khởi|chiến tranh đặc biệt|chiến tranh cục bộ|mậu thân|hiệp định sơ bộ|tạm ước|bình dân học vụ|ngàn cân treo sợi tóc/i.test(text)) {
        return 2;
    }
    return 0;
}

/**
 * Xử lý danh sách thô: Lọc bỏ Chương 3, làm sạch, vá lỗi và tự động loại bỏ trùng lặp
 */
function processRawQuestionsList(rawList, isFromUserFile = false) {
    const processed = [];
    let repairedCount = 0;

    for (const item of rawList) {
        if (!item || !item.content) continue;
        const chap = classifyQuestionChapter(item);
        if (chap === 1 || chap === 2) {
            const cleanQ = sanitizeAndRepairQuestion(item, chap);
            if (cleanQ.answersList.length >= 2) {
                if (cleanQ.wasRepaired) repairedCount++;
                processed.push(cleanQ);
            }
        }
    }

    allRawQuestions = processed;

    // Tiến hành lọc bỏ câu trùng lặp tự động
    const dedupResult = deduplicateQuestions(processed);
    allQuestions = dedupResult.uniqueQuestions;
    duplicateGroupsMap = dedupResult.duplicateGroupsMap;
    aliasIdMap = dedupResult.aliasIdMap;

    if (typeof window !== 'undefined') {
        window.allRawQuestions = allRawQuestions;
        window.allQuestions = allQuestions;
        window.duplicateGroupsMap = duplicateGroupsMap;
        window.aliasIdMap = aliasIdMap;
    }

    const statusText = document.getElementById('dataset-status-text');
    const repairedNote = document.getElementById('stat-repaired-note');

    if (statusText) {
        statusText.textContent = `Đã nạp ${allQuestions.length} câu hỏi Chương 1 & 2`;
    }

    if (repairedNote) {
        repairedNote.textContent = `Bộ dữ liệu đã chuẩn hóa (${allQuestions.length} câu)`;
    }

    if (typeof updateDashboardStats === 'function') updateDashboardStats();
    if (typeof applyPracticeFilter === 'function') applyPracticeFilter();
    if (typeof renderBankList === 'function') renderBankList();
}

if (typeof window !== 'undefined') {
    window.repairTextFragment = repairTextFragment;
    window.getCanonicalStem = getCanonicalStem;
    window.pickBestQuestion = pickBestQuestion;
    window.deduplicateQuestions = deduplicateQuestions;
    window.classifySubtopic = classifySubtopic;
    window.sanitizeAndRepairQuestion = sanitizeAndRepairQuestion;
    window.classifyQuestionChapter = classifyQuestionChapter;
    window.processRawQuestionsList = processRawQuestionsList;
}
