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

`_includes/head.html`、`_includes/header.html`、`_includes/sidebar.html` 為兩個版型共用。**`<head>` 的內容一律改 `_includes/head.html`，不要改回個別 layout** —— meta 標籤散在兩份 layout 時，加標籤要同步改兩處，漏掉一邊不會報錯、只會有一種頁面少了分享預覽。裡面包含 title、description、Open Graph / Twitter Card、canonical、favicon 與 CSS/JS 引入。

`head.html` 有三個不明顯的地方：

- **標題會去重** —— 首頁的 `page.title` 與 `site.title` 相同（都是站名），直接串接會輸出「站名 | 站名」，因此先比對再決定要不要串。
- **描述是三層 fallback** —— `page.description` → `page.excerpt` → `site.description`。第二層是保險而非好結果，詳見下方「撰寫文章」。
- **描述用 `escape_once` 而非 `escape`** —— `page.excerpt` 是 HTML，裡面的 `>` 已經是 `&gt;`，再套 `escape` 會變成 `&amp;gt;` 而在卡片上顯示出字面的 `&gt;`。

改任何 Liquid 模板時共通的一個陷阱：**`comment` 區塊裡也不能寫出字面的 Liquid 標籤**。Liquid 連註解內部都會 tokenize，在說明文字裡寫一個標籤語法就會讓整份建置失敗（訊息形如 `Tag '...' was not properly terminated`）。要在註解裡提到某個標籤，改用文字描述它。
**內容大多由 `_data/` 驅動，改資料不必改模板**：`navigation.yml`（導覽列）、`socials.json`（側欄社群連結，需有 `name` + `url`，`external: true` 才開新分頁）、`projects.yml` + `skills.json`（`portfolio.md`）。YAML 與 JSON 皆可，`site.data` 兩種都讀得到。

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
description: "在 .NET 專案導入 Swagger 的設定步驟，含 csproj 與 Program.cs 的調整。"
---
```

- **任何程式碼、指令、XML/YAML/JSON 一律放進 ` ``` ` 圍籬，沒有例外**，並標上語言（`bash` / `csharp` / `xml` / `yaml` / `json` / `powershell` / `text`）。這是本專案踩過最大的坑：2026-09 以前的文章把指令當一般段落寫，12 篇有 8 篇的內容在網頁上是壞的。裸寫會同時觸發四種破壞，而且**原始檔看起來完全正常，只有渲染後才看得出來**：
  - `<PropertyGroup>`、`<targets>`、`ILogger<Program>` 被當 HTML 標籤**整段吃掉**（NLog 那篇曾整份 34 行設定檔只剩一行）
  - `--global` → `–global`（kramdown 把雙減號轉成 en dash，指令無法執行）
  - `'字串'` → `‘字串’`（直引號轉彎引號，複製後語法錯誤）
  - `D:\path`、`\s+`、`\033[30m` 的反斜線被當跳脫字元**吃掉**
  
  前後兩項是內容真的遺失，不是顯示問題。檢查方式：改完後看渲染結果，不能只看原始碼。
- **新增或修改文章時，一定要檢查描述存在，而且是兩個地方**：front matter 的 `description`，以及正文標題之後要先有一段說明文字才進入程式碼／指令／表格。省略 `description` 不會讓建置失敗，摘要會 fallback 到 `page.excerpt`，但這個專案的技術筆記多半是「標題 → 直接上程式碼」，抓出來的摘要會是一段指令或 mermaid 語法。
- 別把含真實路徑、密鑰、內網位址的指令放在文章開頭 —— 沒寫 `description` 時那段會被送進 `<meta name="description">` 並被搜尋引擎索引。
- 想換某篇的分享縮圖，在 front matter 加 `image:`；縮圖只能是 jpg/png，`.ico` 不能用（那是 favicon 的格式）。
- 檔名必須是 `YYYY-MM-DD-標題.md`，否則不會被當成文章。
- front matter 不可省略，缺少時標題會由檔名推導。
- **內容含 `{{ }}` 時要用 `{% raw %}` 包起來**（例如 Docker 的 `--format "table {{.Names}}"`），否則 Jekyll 會當成 Liquid 變數解析並輸出空字串。
- 現有文章裡的 ` ```mermaid ` 區塊沒有載入任何 mermaid runtime（兩個 layout 都沒有），會以純程式碼區塊呈現。
