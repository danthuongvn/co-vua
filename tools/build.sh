#!/bin/sh
# Ghép src/app.html + chess.js thành index.html, chép Stockfish vào engine/.
# Chuẩn bị: npm i chess.js@1 stockfish@19
set -e
cd "$(dirname "$0")/.."
python3 - <<'PY'
import re
src=open('src/app.html',encoding='utf8').read()
lib=open('node_modules/chess.js/dist/esm/chess.js',encoding='utf8').read()
lib=re.sub(r'\nexport \{[^}]*\};?','\n',lib);lib=re.sub(r'//# sourceMappingURL=.*','',lib)
online=open('src/online.part.js',encoding='utf8').read()
open('index.html','w',encoding='utf8').write(src.replace('/*CHESSJS*/',lib).replace('/*ONLINE*/',online))
PY
mkdir -p engine
cp node_modules/stockfish/bin/stockfish-19-lite-single.js node_modules/stockfish/bin/stockfish-19-lite-single.wasm engine/
cp node_modules/stockfish/Copying.txt engine/COPYING.txt
echo "Đã tạo index.html"
