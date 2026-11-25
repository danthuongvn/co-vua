# ♞ Cờ Vua Cùng Khủng Long

Web chơi và luyện cờ vua bằng tiếng Việt cho trẻ em. Bạn Khủng Long Xanh hướng dẫn, nhận xét và đọc to lời khuyên.

**Chơi ngay:** https://danthuongvn.github.io/co-vua/

## Tính năng
- **Câu đố hôm nay**: 5 câu mỗi ngày (2 chiếu hết 1 nước, 2 thắng quân, 1 chiếu hết 2 nước).
- **Luyện câu đố**: 250 câu chia theo chủ đề: Chiếu hết 1 nước, Ăn quân miễn phí, Đòn đôi, Chiếu hết 2 nước. Có gợi ý 2 bước, chấm 1–3 sao.
- **Đồng hồ cờ** cho cả hai bên (5, 10, 15 phút, có cộng giây mỗi nước) khi chơi với máy, hai người và online. Quân của mình luôn ở phía dưới; chơi với máy chọn được cầm Trắng, Đen hoặc ngẫu nhiên.
- **Chơi với máy**: 5 mức (Dễ, Vừa, Khá, Giỏi, Cao thủ). Ba mức trên dùng Stockfish. Thắng 2 lần thì Cú gợi ý lên mức.
- **Xem lại ván**: sau mỗi ván, máy chấm từng nước của bé (Tuyệt vời / Tốt / Chưa chuẩn / Sai lầm) và chỉ nước tốt hơn ngay trên bàn cờ.
- **Thói quen suy nghĩ**: nhắc 3 câu hỏi trước mỗi nước; có thể tắt lời nhắc quân bị dọa để bé tự nghĩ.
- **Chơi online với bạn bè**: đăng ký bằng email + mật khẩu, mỗi tài khoản có ID 6 ký tự. Chỉ kết bạn khi bên kia đồng ý; chỉ bạn bè mới mời chơi và nhắn tin được. Chat tự che từ tục, link, email, số điện thoại; có nút Báo cáo và Chặn.
- **Tài khoản phụ huynh quản lý tài khoản con** (🌐 → 👨‍👩‍👦 Quản lý tài khoản con): tạo tài khoản cho con bằng tên đăng nhập (không cần email) hoặc liên kết tài khoản có sẵn; xem Elo, thắng/thua, trạng thái online; bật/tắt nhắn tin; xem tin nhắn, bạn bè, lời mời kết bạn, báo cáo; hủy kết bạn, chặn.
- **Elo + biểu đồ tiến bộ**: điểm ước tính riêng cho ván đấu, câu đố và online; biểu đồ 30 ngày (📈 Tiến bộ).
- **Trang phụ huynh** (khóa bằng phép tính): giới hạn thời gian chơi mỗi ngày cho từng bé, nhắc nghỉ mắt mỗi 25 phút, xem tiến độ; với tài khoản online: bật/tắt nhắn tin, hủy kết bạn/chặn, xem báo cáo bé đã gửi.
- **Cài như ứng dụng, chơi không cần mạng**: nút 📲 Cài vào máy; khi mất mạng vẫn chơi với máy (cả Stockfish), câu đố và bài học.
- **Nhiều người chơi trên một máy**: mỗi người có tên, hình đại diện và tiến độ riêng; khi vào chỉ cần bấm chọn tên.
- **Học từng quân cờ**, **Hai người chơi**, giọng đọc tiếng Việt, lưu tiến độ trên trình duyệt. Không quảng cáo, không cần mật khẩu.

## Cấu trúc
- `index.html` – web hoàn chỉnh (đã ghép sẵn chess.js).
- `src/app.html` – mã nguồn giao diện và logic.
- `puzzles.js` – dữ liệu câu đố.
- `engine/` – Stockfish 19 lite (WebAssembly).
- `tools/` – script build và sinh/kiểm tra câu đố.
- `src/online.part.js` – phần tài khoản, bạn bè, chat, chơi online (Firebase Auth + Realtime Database).
- `firebase-config.js` – cấu hình Firebase của dự án. `firebase/database.rules.json` – quy tắc bảo mật, dán vào Realtime Database → Rules.
- `vendor/` – Firebase JS SDK 13.2 (bản compat).
- `src/extras.part.js` – Elo, trang phụ huynh, giới hạn thời gian, cài ứng dụng.
- `sw.js`, `manifest.webmanifest`, `icons/` – cài như ứng dụng và chơi không cần mạng.

```
npm install
npm run build      # tạo lại index.html sau khi sửa src/app.html
npm run puzzles    # sinh thêm câu đố (Stockfish tự đấu, kiểm tra lời giải)
```

## Cài đặt phần online
1. Tạo dự án ở console.firebase.google.com, thêm Web app, chép `firebaseConfig` vào `firebase-config.js` (`window.FIREBASE_CONFIG = {...}`).
2. Authentication → bật Email/Password; Settings → Authorized domains → thêm `danthuongvn.github.io`.
3. Realtime Database → tạo (asia-southeast1) → tab Rules → dán nội dung `firebase/database.rules.json` → Publish.
4. Báo cáo của trẻ nằm ở nhánh `reports` trong Realtime Database (chỉ xem được trong console).

## Giấy phép bên thứ ba
- [Firebase JS SDK](https://github.com/firebase/firebase-js-sdk) – Apache 2.0.
- [Stockfish](https://github.com/official-stockfish/Stockfish) qua [stockfish.js](https://github.com/nmrugg/stockfish.js) – GPLv3, xem `engine/COPYING.txt`. Mã nguồn có tại các liên kết trên.
- [chess.js](https://github.com/jhlywa/chess.js) – BSD 2-Clause, xem `licenses/chess.js-LICENSE`.
