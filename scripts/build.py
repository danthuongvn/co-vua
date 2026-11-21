"""Ghép src/app.html với thư viện chess.js thành index.html (một file duy nhất).
Cách dùng: npm i chess.js@1 && python3 scripts/build.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'src/app.html').read_text(encoding='utf8')
lib = (root / 'node_modules/chess.js/dist/esm/chess.js').read_text(encoding='utf8')
lib = re.sub(r'\nexport \{[^}]*\};?', '\n', lib)
lib = re.sub(r'//# sourceMappingURL=.*', '', lib)
(root / 'index.html').write_text(src.replace('/*CHESSJS*/', lib), encoding='utf8')
print('Đã tạo index.html')
