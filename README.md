# 単語例文ビューワー (cn-study-cards)

このリポジトリは、中国語の単語と例文をブラウザで閲覧・学習するための軽量な React アプリケーションです。

目的:
- 例文を中心に表示し、ボタンでピンインや日本語訳を表示
- 各カードに対して 5 段階（覚えた／だいたいOK／微妙／全くダメ／無視）で評価し、サーバーに保存
- タブ（例文／単語／拼音／日本語訳）・並べ替え（json順／ランダム／暗記度順）・検索・フィルタ機能を提供

---

目次
- 概要
- 主要ファイルとディレクトリ構成
- データ形式（`単語例文.json`）
- ローカル開発（手順）
- ビルドとデプロイ（Docker を含む）
- API（サーバー）仕様
- カスタマイズ方法
- トラブルシューティング

---

概要
- フロントエンド: React + Vite
- シンプルな組み込みサーバー（`server.js`）で静的配信と API を提供
- ブラウザから評価データ（暗記度）を POST して `status.json` に保存

主要ファイルとディレクトリ構成
```
/ (プロジェクトルート)
├─ Dockerfile.frontend        # フロントエンドをビルドして静的ファイルを作る Dockerfile
├─ docker-compose.yml        # express + nginx 構成の docker-compose
├─ server.js                 # 簡易 Express サーバー（API: /api/words, /api/status）
├─ index.html                # Vite エントリ HTML
├─ package.json              # npm スクリプト・依存
├─ vite.config.mjs           # Vite 設定（base, proxy など）
├─ .env                      # Vite の環境変数（VITE_API_BASE_URL）
├─ 単語例文.json             # 学習データ（単語・例文の JSON）
├─ status.json               # 保存された暗記度データ（空のオブジェクトが初期値）
├─ src/
│   ├─ main.jsx              # React のエントリ
│   ├─ App.jsx               # アプリのルートコンポーネント
│   └─ WordList.jsx          # UI の大部分（カード表示・フィルタ・保存処理）
├─ docker/
│   ├─ express/Dockerfile    # サーバー用 Dockerfile
│   └─ nginx/
│       ├─ nginx.dev.conf
│       └─ nginx.prod.conf
└─ その他: .gitignore, README.md, スクリーンショット/
```

各ファイルの簡単な説明
- `src/WordList.jsx`:
  - 主要な UI と機能を提供します。例文カードの生成は `単語例文.json` を元に行われます。
  - タブ（例文/単語/拼音/日本語訳）、暗記度ボタン、検索、並び替え (json/random/status)、フィルタを実装。
  - 暗記度の変更は `import.meta.env.VITE_API_BASE_URL + "/status"` に POST され、`status.json` に保存されます（サーバー側が受け取る）。
- `server.js`:
  - `GET /api/words` または `GET /cn-study-words/api/words` で `単語例文.json` を返します。
  - `GET /api/status` で `status.json` を返し、`POST /api/status` で status を上書き保存します。
  - `express.static` 経由で `dist/` を `/cn-study-words` 以下に配信します。
- `vite.config.mjs`:
  - デフォルトの base パスが `/cn-study-words/` に設定されています（GitHub Pages 等でのホスティングを想定）。
  - 開発時は `'/cn-study-words/api'` をプロキシする設定があります（必要に応じて変更してください）。

データ形式（`単語例文.json`）
- ルートは配列で、要素は次のようなオブジェクトです:
  - `単語` (string), `拼音` (string), `品詞` (string), `日本語訳` (string), `登場例文` (配列)
  - `登場例文` の各要素は `中国語`, `拼音`, `日本語訳` を持ちます。
- フロントエンドではこの JSON を受け取り、各 `登場例文` を個別の「例文カード」として表示します。

ローカル開発手順
1. 依存をインストール
   - macOS/zsh の例: `npm ci`
2. 開発サーバー起動（Vite）
   - `npm run dev` でフロントエンドのホットリロード付き開発サーバーが起動します。
3. サーバー（API）を起動
   - 開発用に `node server.js` を別ターミナルで実行すると `http://localhost:3001` で API が立ちます。
   - デフォルトの Vite 環境変数は `.env` に `VITE_API_BASE_URL=/cn-study-words/api` と設定されています。開発時は Vite の proxy 設定と server.js のポート（3001）を合わせてください。

ビルドと Docker
- フロントエンドをビルド: `npm run build` -> 出力が `dist/` に生成されます。
- 提供済み Dockerfile と `docker-compose.yml` を使うと、`express`（静的ファイル・API）と `nginx`（公開）の構成で動かせます。
  - ローカルで試す: `docker-compose up --build`
  - `Dockerfile.frontend` は静的ビルドを作って `dist/` を準備します。

API エンドポイント（server.js）
- GET /api/words  -> `単語例文.json` の配列を返す
- GET /api/status -> `status.json` を返す（存在しなければ空オブジェクト）
- POST /api/status -> 受け取った JSON で `status.json` を上書き保存
- 上記は `/cn-study-words/api/...` でも同じエンドポイントとして動作します（nginx 経由でパスを合わせるため）

カスタマイズのポイント
- UI の変更: `src/WordList.jsx` を編集してください。見た目はインラインスタイルで書かれているため、必要に応じて CSS や Tailwind などに置き換えできます。
- データを差し替える: `単語例文.json` を別の JSON に置き換えればすぐに内容が変わります（形式は上記参照）。
- 保存方法の変更: 現在はローカルの `status.json` に保存します。外部 DB やブラウザの localStorage にしたい場合は `server.js` を置き換えるか、フロントエンド側の `handleStatus` のフェッチ先を変更してください。
- base パス: `vite.config.mjs` の `base` を配布先に合わせて変更してください（GitHub Pages 等）。

トラブルシューティング
- 開発中に API が 404/接続できない場合:
  - `.env` と `vite.config.mjs` の proxy 設定、`server.js` が期待するパス(`/cn-study-words/api` vs `/api`) の整合性を確認してください。
  - `node server.js` を起動した際に `Server running on http://localhost:3001` が出るか確認。
- JSON 読み込みエラー:
  - `単語例文.json` が正しい JSON 形式か確認してください（末尾のカンマ、文字エンコーディングなど）。

最後に
- 簡易ながら学習用途に必要な機能を揃えたプロジェクトです。新しいチャットでプロジェクト全体の把握が必要な場合、README の最初にこの内容があることですぐに参照できます。
- さらに自動生成のファイル一覧や詳細なコードドキュメントを追加したい場合は指示してください。
