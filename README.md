# a5108ww.github.io

此專案為個人靜態部落格與作品集，使用 Jekyll + GitHub Pages 部署，內容以 Markdown 與 Liquid 模板管理。

快速導覽
- **框架**：Jekyll（版本由 `github-pages` gem 鎖定，與線上一致）
- **樣板**：Liquid（位於 `_layouts`、`_includes`）
- **內容**：Markdown（文章放在 `_posts/`，其他頁面為 `.md`）
- **樣式**：`assets/css/style.css`
- **腳本**：`assets/js/site.js`（漢堡選單、表格捲動容器）

## 本地開發（預覽）

本機沒有安裝 Ruby，開發環境一律透過 Docker 執行。

1. 啟動 Docker Desktop（等工作列圖示停止轉動）。
2. 在專案目錄執行：

```bash
docker compose up          # 前景執行，Ctrl+C 停止
docker compose up -d       # 背景執行
```

3. 開啟瀏覽器：

| 用途 | 網址 |
|---|---|
| 桌機預覽 | `http://localhost:4000` |
| 手機實測 | `http://<本機區網 IP>:4000` |

首次啟動需拉取 `ruby:3.3` 映像並安裝 `github-pages` 的相依套件，約需數分鐘；套件安裝結果保存在具名 volume `bundle-cache`，之後啟動很快。

### 開發時要記得的三件事

- **改 `_config.yml` 後必須重啟容器**：`docker compose restart jekyll`。自動重建只監看內容檔，不會重載設定檔。改 Markdown、CSS、layout 則會自動重建。
- **瀏覽器請開著 DevTools 並勾選 Network → Disable cache**。否則改了 CSS 卻看到舊樣式，很容易誤判。
- **`docker-compose.yml` 的 `--force_polling` 不可移除**。Windows 的 bind mount 不會把檔案變更事件傳進 Linux 容器，少了它存檔不會觸發重建。（Jekyll 啟動時會印出「Auto-regeneration may not work on some Windows versions」警告，實測有效，可忽略。）

## 部署到 GitHub Pages

推送到 `main` 分支即自動部署。`_config.yml` 已填入 `url`、`baseurl`、`timezone` 與 `permalink`。

驗證線上是否更新時要注意 **GitHub Pages 的 CDN 快取為 `max-age=600`（10 分鐘）**，剛推送完直接開會看到舊版。用 cache-buster 確認：

```bash
curl -sL "https://a5108ww.github.io/?cb=$(date +%s)" -H "Cache-Control: no-cache"
```

瀏覽器則用 Ctrl+Shift+R 強制重載。

## 主要檔案說明

- `_config.yml`：站點設定（作者資訊、title、url、baseurl、timezone 等）
- `Gemfile`：鎖定 `github-pages` gem，使本地與線上的 Jekyll 版本一致
- `docker-compose.yml`：本地預覽環境
- `_layouts/default.html`：網站共用版型（首頁、一般頁）
- `_layouts/post.html`：文章專用版型（文章頁）
- `_includes/header.html`、`_includes/sidebar.html`：可重用片段
- `_data/`：放 navigation、projects、skills、socials 等資料（支援 YAML/JSON）
- `_posts/`：文章檔（使用 Jekyll 的標準檔名格式）
- `assets/`：靜態資源（CSS、JS、images）

## 文章分類與標籤

每篇文章以 front matter 的 `categories`（大分類，一篇一類）與 `tags`（細標籤，可多個）標示：

```yaml
---
layout: post
title: "Swagger"
date: 2026-09-02
categories: [後端開發]
tags: [dotnet, api]
---
```

目前使用的分類：

| 分類 | 收錄主題 |
|---|---|
| 後端開發 | Git、Log、OpenTelemetry、Swagger、Unit Test、資料庫、指令 |
| 基礎建設 | 自架 Server 等部署與環境主題 |
| 工具與AI | Markdown 圖表、AI 工具 |
| 生活 | 非技術主題（不鏽鋼介紹、車款規格對照） |

新增或調整分類時請注意三件事：

- **分類名稱不要含空白。** Jekyll 對字串形式的 `categories` 會以空白切分，因此命名為「工具與AI」而非「工具與 AI」。
- **要同步更新兩個地方的順序。** `site.categories` 本身沒有穩定排序，因此 `blog.md` 與 `index.md` 開頭都各有一行 `ordered` 變數指定顯示順序。忘記更新也不會出錯——未列入的分類會自動補在列表後方，完全沒有分類的文章則歸入「未分類」，文章不會消失。
- **分類不影響網址。** permalink 為 `/:year/:month/:day/:title.html`，不含 `:categories`，因此新增或調整分類不會產生死連結。

標籤會渲染在兩個位置：文章列表（`blog.md`）每篇標題下方，以及文章頁底部（`_layouts/post.html` 的 `.post-tags` 區塊）。兩者共用 `assets/css/style.css` 的 `.tag` 樣式。

首頁的「精選文章」區塊預設不顯示；在想推薦的文章 front matter 加上 `featured: true` 即會出現（最多 5 篇）。

## 撰寫文章時的注意事項

- **內容含 `{{ }}` 時要用 `{% raw %}` 包起來。** 例如 Docker 的 `--format "table {{.Names}}"`，否則 Jekyll 會當成 Liquid 變數解析並輸出成空字串。
- **檔名需符合 `YYYY-MM-DD-標題.md` 格式**，否則不會被視為文章。
- **front matter 不可省略。** 缺少時標題會由檔名自動推導，通常不是你要的樣子。

## 風格與相容性

- 主樣式在 `assets/css/style.css`，使用 CSS 變數管理色彩與尺寸。
- 桌機為「固定左側 header + 固定右側 sidebar + 中間內容」三欄式；`max-width: 768px` 以下切換為手機版：導覽列改漢堡選單、側邊欄改為滿版頁尾、表格加上橫向捲動容器。
- **`_config.yml` 的 `theme: null` 不可移除。** `github-pages` gem 會強制帶入預設的 `jekyll-theme-primer`，該主題的 `assets/css/style.scss` 編譯後會與本站的 `style.css` 撞到同一個輸出路徑並整份覆蓋。線上不受影響，但本地會失去所有自訂樣式。
  快速檢查：`curl -s -o /dev/null -w "%{size_download}" http://localhost:4000/assets/css/style.css` 應與 `assets/css/style.css` 的大小相符，若得到約 136000 就是主題又蓋回來了。

## 注意事項與建議

- `site.data` 可同時讀取 YAML/JSON，專案保留兩種格式是可行的，但建議統一規範何時使用哪一種。
- `_data/socials.json` 需有 `name`、`url` 欄位；`external: true` 才會以新分頁開啟。`_includes/sidebar.html` 已做空值檢查。
- 若要加入外掛（plugins），在 GitHub Pages 上有支援限制，請先確認官方支援的插件清單。

作者：`_config.yml` 中 `author.name`（可修改）
