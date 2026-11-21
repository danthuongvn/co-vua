# ♞ Cờ Vua Cùng Cú Mèo

Web chơi và học cờ vua bằng tiếng Việt cho trẻ khoảng 8 tuổi. Chú Cú Mèo hướng dẫn bé từng nước đi.

## Tính năng
- **Học từng quân cờ**: Xe, Tượng, Hậu, Vua, Mã, Tốt. Mỗi quân 2 màn "ăn hết ngôi sao".
- **Chơi với máy** (Dễ / Vừa): Cú Mèo giải thích quân cờ, nhận xét nước đi, cảnh báo quân sắp bị ăn, có nút Gợi ý và Đi lại.
- **Hai người chơi** trên cùng một máy.
- Đọc to lời hướng dẫn bằng giọng tiếng Việt của thiết bị (bật/tắt bằng nút 🔊).
- Lưu sao và số ván thắng trên trình duyệt. Không quảng cáo, không đăng nhập, không chat.

## Cấu trúc
- `index.html`: file web hoàn chỉnh (GitHub Pages chạy thẳng file này).
- `src/app.html`: mã nguồn giao diện và logic.
- `scripts/build.py`: ghép `src/app.html` với thư viện [chess.js](https://github.com/jhlywa/chess.js) thành `index.html`.

Sửa code xong thì chạy:
```
npm i chess.js@1
python3 scripts/build.py
```

## Đăng web
Settings → Pages → Source: **Deploy from a branch**, Branch: `main`, thư mục `/ (root)`.
Web sẽ chạy tại `https://danthuongvn.github.io/co-vua/`.
