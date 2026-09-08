# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案性質

個人靜態部落格與作品集：Jekyll + GitHub Pages，內容為 Markdown + Liquid 模板。
**沒有測試、沒有 lint、沒有前端建置工具**（無 npm / webpack / SCSS 編譯）；CSS 與 JS 都是直接手寫的靜態檔。

## 開發指令

本機沒有安裝 Ruby，**所有 Jekyll 操作一律透過 Docker 執行**（需先啟動 Docker Desktop）：

```bash
docker compose up          # 前景執行，Ctrl+C 停止；預覽 http://localhost:4000
```

```bash
docker compose up -d       # 背景執行
```

```bash
docker compose restart jekyll   # 改完 _config.yml 後必須執行
```

- 首次啟動要拉 `ruby:3.3` 並跑 `bundle install`（數分鐘）；結果存在具名 volume `bundle-cache`，之後很快。
- 手機實測用 `http://<本機區網 IP>:4000`（compose 已帶 `--host 0.0.0.0`）。
- 改 Markdown / CSS / layout 會自動重建；**只有 `_config.yml` 不會**，必須重啟容器。
- 驗證 CSS 改動時請在瀏覽器 DevTools 勾選 Network → Disable cache，否則容易誤判。

部署：推送到 `main` 即自動發版。GitHub Pages CDN 快取 `max-age=600`，剛推完會看到舊版，用 cache-buster 驗證：

```bash
curl -sL "https://a5108ww.github.io/?cb=$(date +%s)" -H "Cache-Control: no-cache"
```

## 不可移除的設定

這三處都是踩過坑之後才加上的，改動前務必先確認：

- **`_config.yml` 的 `theme: null`** —— `github-pages` gem 會強制帶入 `jekyll-theme-primer`，其 `assets/css/style.scss` 編譯後與本站 `style.css` 撞到同一輸出路徑並整份覆蓋（線上不受影響，本地會失去所有自訂樣式）。快速檢查：
  `curl -s -o /dev/null -w "%{size_download}" http://localhost:4000/assets/css/style.css` 應等於 `assets/css/style.css` 檔案大小；若約 136000 就是主題又蓋回來了。
- **`docker-compose.yml` 的 `--force_polling`** —— Windows bind mount 不會把檔案變更事件傳進 Linux 容器，少了它存檔不會觸發重建。（Jekyll 啟動時的 Windows 警告可忽略。）
- **`Gemfile` 只鎖 `github-pages` gem** —— 讓本地 Jekyll 版本與線上一致（目前 3.10.x）。要加 plugin 前先確認在 GitHub Pages 支援清單內。
- **`_config.yml` 的 `exclude` 需含 `CLAUDE.md`** —— 根目錄的 `.md` 會被 Jekyll 當成頁面解析，本檔內文的 Liquid 標記（例如未配對的 raw 標籤）會讓整個建置失敗。另外 `exclude` 一經寫出就是「取代」而非「附加」預設清單，所以 `Gemfile`、`vendor/` 等必須一併列出，否則會被複製進 `_site`。

## 架構

版型只有兩個，兩者結構幾乎相同（`.container` > header / `.main-content` / `.sidebar`），差別只在文章頁多包一層 `<article>` 與底部標籤列：

- `_layouts/default.html` —— 首頁與一般頁
- `_layouts/post.html` —— 文章頁

`_includes/header.html`、`_includes/sidebar.html` 為兩個版型共用。**內容大多由 `_data/` 驅動，改資料不必改模板**：`navigation.yml`（導覽列）、`socials.json`（側欄社群連結，需有 `name` + `url`，`external: true` 才開新分頁）、`projects.yml` + `skills.json`（`portfolio.md`）。YAML 與 JSON 皆可，`site.data` 兩種都讀得到。

### 分類系統（改分類時最容易漏掉的一點）

文章以 front matter 的 `categories`（大分類，一篇一類）與 `tags`（細標籤，可多個）分類。現有分類：後端開發 / 基礎建設 / 工具與AI / 生活。

- **分類名稱不可含空白** —— Jekyll 對字串形式的 `categories` 會以空白切分，所以是「工具與AI」而非「工具與 AI」。
- **顯示順序寫死在兩個地方，必須同步更新**：`blog.md` 與 `index.md` 開頭各有一行
  `{% assign ordered = "後端開發,基礎建設,工具與AI,生活" | split: "," %}`。
  `site.categories` 沒有穩定排序，故明確指定；漏改不會出錯——未列入的分類自動補在後方，無分類文章歸入「未分類」，文章不會消失。
- **分類不影響網址** —— permalink 為 `/:year/:month/:day/:title.html`，不含 `:categories`，調整分類不會產生死連結。
- 首頁的分類卡片（篇數、最新文章）由 `site.categories` 自動帶入，新增文章不需回頭改 `index.md`。
- 首頁「精選文章」區塊預設隱藏，文章 front matter 加 `featured: true` 才出現（最多 5 篇）。

### assets/js/site.js

單一 IIFE，最後依序呼叫 `initNav()` → `initTables()` → `initScoreCards()` → `initCategoryNav()`，**前三者順序有相依性**：`initScoreCards` 會把控制列插到 `.table-scroll` 之外，前提是 `initTables` 已先包好容器。

- `initTables()` —— Markdown 產生的 `<table>` 沒有容器，寬表格會撐破版面；純 CSS 解不掉（`min-width` 加在 table 上時捲軸會落在父層），故用 JS 包一層 `.table-scroll`。
- `initCategoryNav()` —— 文章列表頁右下角的浮動分類清單（只在頁面有 `.post-index` 時建立）。清單項目**從 DOM 上的 `.post-index__group h2[id]` 讀出**，刻意不再維護第四份分類表：`blog.md` 與 `index.md` 已各有一份寫死的 `ordered`，從 DOM 讀取可讓未列入 `ordered` 的分類與「未分類」自動出現。跳轉用原生錨點連結（無 JS 時仍可用），平滑捲動與固定頂欄的偏移交給 CSS 的 `scroll-behavior` / `scroll-margin-top`。
- `initScoreCards()` —— 「主觀評分表」的漸進增強。分數維護在文章 Markdown 表格裡（無 JS 時仍讀得到原始評分），滑桿與加權總分列由 JS 動態補上。用法：在 Markdown 表格後加一行 kramdown IAL `{: .score-card}`（範例見 `_posts/2026-09-06-2026年CUV大比拚.md`）。欄位角色**由表頭文字決定、不綁順序**：表頭「權重」= 權重欄（必要）、「說明」/「備註」= 純文字欄、第 1 欄 = 面向名稱、其餘每欄各為一個受評對象。權重欄填 `+` 的列是「加扣分項」，直接加到總分、不參與加權平均。

### 樣式

`assets/css/style.css`（單檔約 790 行），色彩與尺寸走 `:root` CSS 變數。桌機為「固定左側 header + 固定右側 sidebar + 中間內容」三欄式；`@media (max-width: 768px)` 切換手機版：導覽列改漢堡選單、側邊欄改滿版頁尾、表格加橫向捲動容器。標籤樣式 `.tag` 由文章列表（`blog.md`）與文章頁底部（`_layouts/post.html` 的 `.post-tags`）共用。

## 撰寫文章

```yaml
---
layout: post
title: "Swagger"
date: 2026-09-02
categories: [後端開發]
tags: [dotnet, api]
---
```

- 檔名必須是 `YYYY-MM-DD-標題.md`，否則不會被當成文章。
- front matter 不可省略，缺少時標題會由檔名推導。
- **內容含 `{{ }}` 時要用 `{% raw %}` 包起來**（例如 Docker 的 `--format "table {{.Names}}"`），否則 Jekyll 會當成 Liquid 變數解析並輸出空字串。
- 現有文章裡的 ` ```mermaid ` 區塊沒有載入任何 mermaid runtime（兩個 layout 都沒有），會以純程式碼區塊呈現。
