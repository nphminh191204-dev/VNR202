# VNR202 - Hệ Thống Ôn Thi & Luyện Quizz Lịch Sử Đảng (Chương 1 & 2)

Ứng dụng web Single Page Application (SPA) hỗ trợ sinh viên ôn tập thông minh môn **Lịch sử Đảng Cộng sản Việt Nam (VNR202)** bám sát đề cương thi trắc nghiệm (Chương 1: 1930 - 1945 & Chương 2: 1945 - 1975).

---

## ✨ Điểm nổi bật & Tính năng chính

1. **Tự động nạp & đồng bộ dữ liệu (Zero Config trên Vercel)**:
   - Dữ liệu câu hỏi chuẩn xác được nhúng và nạp sẵn trong thư mục `data/vnr202.js`.
   - Ứng dụng tự động tải dữ liệu ngay khi mở web, người dùng **không cần tự tải hay nạp file JS thủ công**.

2. **Bộ tự động làm sạch & lọc trùng thông minh (Deduplication & Sanitization Engine)**:
   - Tự động lọc chính xác các câu thuộc Chương 1 (1930-1945) và Chương 2 (1945-1975).
   - **Tự động phát hiện và gộp 68 cụm câu hỏi trùng lặp** (88 câu dư thừa), thu gọn từ 480 câu thô về **392 câu hỏi chuẩn xác, chất lượng cao nhất**.
   - Chuẩn hóa các câu hỏi xung đột đáp án dựa trên Giáo trình chuẩn của Bộ GD&ĐT.
   - Cơ chế **Alias ID Mapping**: Khi luyện tập hoặc thi thử, tiến độ ôn tập (Leitner, dấu sao, số lần đúng/sai) được đồng bộ giữa các ID trùng nhau.
   - Tự động vá các từ bị cụt đuôi (VD: `Mặt trận Việt` ➔ `Mặt trận Việt Minh`, `Trường` ➔ `Trường Chinh`...).
   - Xóa bỏ tiền tố thừa (`B. `, `C. `, `D. `) và loại bỏ phương án ảo `A, B, C, D`.
   - Khắc phục triệt để lỗi tràn thân câu hỏi xuống phương án đầu tiên.

3. **Phương pháp lặp lại ngắt quãng 3 Giỏ nhớ (Leitner Spaced Repetition)**:
   - 🔴 **Hay sai** (streak = 0): Cần ôn lại ngay.
   - 🟡 **Đang nhớ** (streak = 1): Đã trả lời đúng 1 lần.
   - 🟢 **Đã thuộc làu** (streak ≥ 2): Đã nhớ vững.
   - Lưu trữ tự động vào `localStorage`, không mất tiến độ khi đóng trình duyệt.

4. **Chế độ Luyện tập 2 trong 1**:
   - **Trắc nghiệm 4 lựa chọn**: Kiểm tra nhanh, hiển thị phản hồi tức thì, hỗ trợ tự qua câu (Auto-Advance) và đảo đáp án.
   - **Lật thẻ Flashcard 3D**: Luyện phản xạ ghi nhớ câu hỏi - đáp án - giải thích.

5. **Tô sáng thông minh (Smart Keyword Highlighting)**:
   - Làm nổi bật từ bẫy / phủ định (`không phải`, `chưa đúng`, `ngoại trừ`...).
   - Tô màu mốc thời gian lịch sử và các sự kiện, hội nghị, đại hội trọng tâm.

6. **Phòng thi thử (Mock Exam) & Phân tích lỗi sai**:
   - Tùy chỉnh phạm vi (Cả 2 chương, Chương 1, Chương 2, hoặc các câu hay sai).
   - Đếm ngược thời gian thi, chấm điểm thang 10 tự động.
   - Xem lại chi tiết từng câu làm sai và nút bấm "Luyện lại ngay các câu vừa sai".

7. **Tra cứu ngân hàng câu hỏi**:
   - Tìm kiếm nhanh tức thì theo từ khóa, số năm, nghị quyết, tên nhân vật.
   - Bộ lọc tối ưu, trực quan: Lọc theo Chương 1, Chương 2 hoặc các câu đã đánh dấu sao ★.

---

## 📁 Cấu trúc thư mục dự án

```text
VNR202/
├── index.html                 # Giao diện chính (semantic HTML layout)
├── vercel.json                # Cấu hình tối ưu routing & cache khi deploy Vercel
├── package.json               # Cấu hình metadata dự án
├── css/
│   └── style.css              # Custom styling (3D flip card, scrollbar, animations)
├── data/
│   ├── vnr202.js              # Ngân hàng câu hỏi gốc (window.VNR202_DATA)
│   ├── question-ids.js        # Tập hợp Set ID chuẩn của Chương 1 (206) & Chương 2 (254)
│   └── sanitization-rules.js  # Từ điển sửa lỗi cụt từ, regex và tên chuyên đề
└── js/
    ├── state.js               # Quản lý state toàn cục, deduplication & 3 giỏ nhớ Leitner
    ├── storage.js             # Đọc/ghi LocalStorage và chuyển đổi Dark/Light mode
    ├── highlighter.js         # Tô sáng từ khóa, mốc thời gian, bẫy phủ định
    ├── sanitizer.js           # Engine lọc chương, làm sạch, vá lỗi & khử trùng câu hỏi
    ├── ui.js                  # Thông báo Toast, modal xác nhận, chuyển đổi tab
    ├── palette.js             # Bảng danh sách câu hỏi (desktop & drawer mobile)
    ├── modal.js               # Hộp thoại xác nhận đặt lại tiến độ học tập
    ├── practice.js            # Engine luyện tập trắc nghiệm, Flashcard & phím tắt
    ├── exam.js                # Engine phòng thi thử, đồng hồ đếm ngược, chấm điểm
    ├── bank.js                # Engine tra cứu ngân hàng câu hỏi & bộ lọc chuyên đề
    └── app.js                 # Bootstrap ứng dụng, khởi tạo sự kiện & nạp dữ liệu
```

---

## 🚀 Hướng dẫn Triển khai lên Vercel (1-Click Deploy)

Dự án được xây dựng dưới dạng **Static Web Application**, không cần bước build:

### Cách 1: Deploy qua GitHub (Khuyên dùng)
1. Đẩy mã nguồn dự án lên GitHub:
   ```bash
   git add .
   git commit -m "Optimize modular structure and deduplicate question bank for VNR202"
   git push origin main
   ```
2. Truy cập [vercel.com](https://vercel.com) và đăng nhập.
3. Chọn **Add New Project** ➔ Chọn repository GitHub của bạn.
4. Ở mục **Build and Output Settings**, giữ nguyên mặc định (Framework Preset: *Other*, Root Directory: `./`).
5. Bấm **Deploy**. Vercel sẽ cung cấp ngay một tên miền miễn phí dạng `https://ten-du-an.vercel.app`.

### Cách 2: Deploy bằng Vercel CLI
```bash
npm install -g vercel
vercel
```
Làm theo các bước hướng dẫn trên terminal để hoàn tất triển khai.

---

## 💻 Chạy thử nghiệm trên máy cục bộ (Local Development)

Bạn có thể chạy thử nghiệm bằng bất kỳ HTTP static server nào:

- **Sử dụng npx serve:**
  ```bash
  npx serve .
  ```
- **Sử dụng VS Code Live Server:** Nhấp chuột phải vào `index.html` và chọn **Open with Live Server**.
- **Sử dụng Python:**
  ```bash
  python -m http.server 3000
  ```
  Sau đó mở trình duyệt tại `http://localhost:3000`.

---

## ⌨️ Phím tắt tiện lợi khi học
- `→` / `←`: Chuyển sang câu tiếp theo / câu trước đó.
- `Phím cách (Space)`: Lật thẻ Flashcard (khi ở chế độ Flashcard).
- `1`, `2`, `3`, `4` hoặc `A`, `B`, `C`, `D`: Chọn nhanh đáp án trắc nghiệm.
- `S`: Đánh dấu sao ★ câu hỏi để xem lại sau.
