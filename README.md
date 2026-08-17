# a5108ww.github.io

此專案為個人靜態部落格與作品集，使用 Jekyll + GitHub Pages 部署，內容以 Markdown 與 Liquid 模板管理。

快速導覽
- **框架**：Jekyll
- **樣板**：Liquid（位於 `_layouts`、`_includes`）
- **內容**：Markdown（文章放在 `_posts/`，其他頁面為 `.md`）
- **樣式**：`assets/css/style.css`

本地開發（預覽）
1. 在本機安裝 Ruby、Bundler 與 Jekyll（若尚未安裝）：

```bash
gem install bundler jekyll
```

2. 在專案目錄啟動本機伺服器：

```bash
bundle exec jekyll serve --incremental
```

3. 開啟瀏覽器並前往 `http://127.0.0.1:4000` 預覽網站。

部署到 GitHub Pages
- 若使用 GitHub Pages（user/organization page），將 `url` 設為 `https://<username>.github.io` 並把專案推到 `main` 分支（或 gh-pages，視你的 GitHub Pages 設定）。
- 我在 `_config.yml` 已經填入 `url`、`baseurl`、`timezone` 與 `permalink`，請依實際情況調整 `url` 與 `baseurl`。

主要檔案說明
- `_config.yml`：站點設定（作者資訊、title、url、baseurl、timezone 等）
- `_layouts/default.html`：網站共用版型（首頁、一般頁）
- `_layouts/post.html`：文章專用版型（文章頁）
- `_includes/header.html`、`_includes/sidebar.html`：可重用片段
- `_data/`：放 navigation、projects、skills、socials 等資料（支援 YAML/JSON）
- `_posts/`：文章檔（使用 Jekyll 的標準檔名格式）
- `assets/`：靜態資源（CSS、images）

風格與相容性
- 主樣式在 `assets/css/style.css`，已加入 CSS 變數與 mobile 響應式調整，固定側欄與頂部導覽已做遮擋保護。

注意事項與建議
- `site.data` 可同時讀取 YAML/JSON，專案保留兩種格式是可行的，但建議在協作時於 `README` 或團隊規範說明何時使用 JSON/何時使用 YAML。
- 確認 `_data/socials.json` 或 `_data/socials.yml` 有正確欄位（`name`、`url`），`_includes/sidebar.html` 已做空值檢查。
- 若要加入外掛（plugins），在 GitHub Pages 上會有支援限制，請先確認官方支援插件清單。

想要我幫忙的下一步（選一）：
- 幫你把 `_posts/*.md` 的 `layout` 統一回 `post`（如果需要）
- 補一個 `CONTRIBUTING.md` 或更詳細的 `README` 使用說明
- 在 `README` 中加入常見問題（FAQ）或 CI/CD（如 GitHub Actions）自動部署範例

作者：`_config.yml` 中 `author.name`（可修改）

