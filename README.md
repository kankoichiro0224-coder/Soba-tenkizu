# 相場天気図 (Soba-tenkizu)

日経VI × CNN Fear & Greed を「天気図」で見せる静的Webアプリ。

- `index.html` … 画面本体(`data.json` を読むだけ。APIキー不要)
- `scripts/update.mjs` … 指標を取得して `data.json` を生成
- `.github/workflows/update.yml` … 30分ごとに自動更新してコミット

## 公開手順
1. この変更を `main` にマージ
2. Settings → Pages → Source: `Deploy from a branch` / `main` / `/ (root)`
3. Actions タブで "Update market data" を手動実行(Run workflow)
4. `https://<user>.github.io/<repo>/` で誰でも閲覧可能
