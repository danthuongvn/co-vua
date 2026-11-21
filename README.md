# ♞ Cờ Vua Cùng Khủng Long

Web chơi và luyện cờ vua bằng tiếng Việt cho trẻ em. Bạn Khủng Long Xanh hướng dẫn, nhận xét và đọc to lời khuyên.

**Chơi ngay:** https://danthuongvn.github.io/co-vua/

## Tính năng
- **Câu đố hôm nay**: 5 câu mỗi ngày (2 chiếu hết 1 nước, 2 thắng quân, 1 chiếu hết 2 nước).
- **Luyện câu đố**: 250 câu chia theo chủ đề: Chiếu hết 1 nước, Ăn quân miễn phí, Đòn đôi, Chiếu hết 2 nước. Có gợi ý 2 bước, chấm 1–3 sao.
- **Chơi với máy**: 5 mức (Dễ, Vừa, Khá, Giỏi, Cao thủ). Ba mức trên dùng Stockfish. Thắng 2 lần thì Cú gợi ý lên mức.
- **Xem lại ván**: sau mỗi ván, máy chấm từng nước của bé (Tuyệt vời / Tốt / Chưa chuẩn / Sai lầm) và chỉ nước tốt hơn ngay trên bàn cờ.
- **Thói quen suy nghĩ**: nhắc 3 câu hỏi trước mỗi nước; có thể tắt lời nhắc quân bị dọa để bé tự nghĩ.
- **Học từng quân cờ**, **Hai người chơi**, giọng đọc tiếng Việt, lưu tiến độ trên trình duyệt. Không quảng cáo, không đăng nhập.

## Cấu trúc
- `index.html` – web hoàn chỉnh (đã ghép sẵn chess.js).
- `src/app.html` – mã nguồn giao diện và logic.
- `puzzles.js` – dữ liệu câu đố.
- `engine/` – Stockfish 19 lite (WebAssembly).
- `tools/` – script build và sinh/kiểm tra câu đố.

```
npm install
npm run build      # tạo lại index.html sau khi sửa src/app.html
npm run puzzles    # sinh thêm câu đố (Stockfish tự đấu, kiểm tra lời giải)
```

## Giấy phép bên thứ ba
- [Stockfish](https://github.com/official-stockfish/Stockfish) qua [stockfish.js](https://github.com/nmrugg/stockfish.js) – GPLv3, xem `engine/COPYING.txt`. Mã nguồn có tại các liên kết trên.
- [chess.js](https://github.com/jhlywa/chess.js) – BSD 2-Clause, xem `licenses/chess.js-LICENSE`.
