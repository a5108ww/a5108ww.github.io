# a5108ww.github.io

此專案為個人靜態部落格與作品集，使用 Jekyll + GitHub Pages 部署，內容以 Markdown 與 Liquid 模板管理。

快速導覽
- **框架**：Jekyll（版本由 `github-pages` gem 鎖定，與線上一致）
- **樣板**：Liquid（位於 `_layouts`、`_includes`）
- **內容**：Markdown（文章放在 `_posts/`，其他頁面為 `.md`）
- **樣式**：`assets/css/style.css`
- **腳本**：`assets/js/site.js`（漢堡選單、表格捲動容器、評分表、警示框、分類清單、文章目錄）

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
  （`_includes/head.html` 會用建置時間 `site.time` 替 CSS/JS 網址加上 `?v=` 版本參數，所以線上訪客在每次發版後都會拿到新檔；但本機開發時頁面不一定會重新建置，仍建議關掉快取。）
- **`docker-compose.yml` 的 `--force_polling` 不可移除**。Windows 的 bind mount 不會把檔案變更事件傳進 Linux 容器，少了它存檔不會觸發重建。（Jekyll 啟動時會印出「Auto-regeneration may not work on some Windows versions」警告，實測有效，可忽略。）

## 部署到 GitHub Pages

推送到 `main` 分支即自動部署。`_config.yml` 已填入 `url`、`baseurl`、`timezone` 與 `permalink`。

驗證線上是否更新時要注意 **GitHub Pages 的 CDN 快取為 `max-age=600`（10 分鐘）**，剛推送完直接開會看到舊版。用 cache-buster 確認：

```bash
curl -sL "https://myblog.shilvain.com/?cb=$(date +%s)" -H "Cache-Control: no-cache"
```

瀏覽器則用 Ctrl+Shift+R 強制重載。

## 主要檔案說明

- `_config.yml`：站點設定（作者資訊、title、url、baseurl、timezone 等）
- `Gemfile`：鎖定 `github-pages` gem，使本地與線上的 Jekyll 版本一致
- `docker-compose.yml`：本地預覽環境
- `_layouts/default.html`：網站共用版型（首頁、一般頁）
- `_layouts/post.html`：文章專用版型（文章頁）
- `_includes/head.html`：兩個版型共用的 `<head>`（title、分享預覽的 meta、favicon、CSS/JS 引入）
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
description: "在 .NET 專案導入 Swagger 的設定步驟，含 csproj 與 Program.cs 的調整。"
---
```

`description` 是分享連結時顯示的摘要，寫法見下方「分享預覽」一節。

目前使用的分類：

| 分類 | 收錄主題 |
|---|---|
| 後端開發 | Git、Log、OpenTelemetry、Swagger、Unit Test、資料庫、指令、.NET、區塊鏈 |
| 基礎建設 | 自架 Server 等部署與環境主題 |
| 工具與AI | Markdown 語法大全、AI 工具 |
| 生活 | 非技術主題（旅遊、購車與汽車保養、食譜、不鏽鋼介紹） |

新增或調整分類時請注意三件事：

- **分類名稱不要含空白。** Jekyll 對字串形式的 `categories` 會以空白切分，因此命名為「工具與AI」而非「工具與 AI」。
- **要同步更新兩個地方的順序。** `site.categories` 本身沒有穩定排序，因此 `blog.md` 與 `index.md` 開頭都各有一行 `ordered` 變數指定顯示順序。忘記更新也不會出錯——未列入的分類會自動補在列表後方，完全沒有分類的文章則歸入「未分類」，文章不會消失。
- **分類不影響網址。** permalink 為 `/:year/:month/:day/:title.html`，不含 `:categories`，因此新增或調整分類不會產生死連結。

標籤會渲染在兩個位置：文章列表（`blog.md`）每篇標題下方，以及文章頁底部（`_layouts/post.html` 的 `.post-tags` 區塊）。兩者共用 `assets/css/style.css` 的 `.tag` 樣式。

首頁的「精選文章」區塊預設不顯示；在想推薦的文章 front matter 加上 `featured: true` 即會出現（最多 5 篇）。

## 撰寫文章時的注意事項

- **任何程式碼、指令、設定檔一律用 ` ``` ` 包起來，沒有例外。** 這是這個專案踩過最大的坑：
  2026-09 以前的技術文章都把指令當成一般段落寫，結果 12 篇裡有 8 篇的內容在網頁上是壞的。
  裸寫會同時發生四件事，而且**在原始檔看起來完全正常，只有渲染後才看得出來**：

  | 你寫的 | 網頁上變成 | 後果 |
  |---|---|---|
  | `<PropertyGroup>`、`<targets>`、`ILogger<Program>` | （整段消失） | 被當成 HTML 標籤，瀏覽器直接吃掉 |
  | `git config --global` | `git config –global` | 雙減號變 en dash，指令無法執行 |
  | `'你的名字'` | `‘你的名字’` | 直引號變彎引號，複製後語法錯誤 |
  | `D:\shilvain\repo`、`\s+`、`\033[30m` | `D:shilvainrepo`、`s+`、`033[30m` | 反斜線被當跳脫字元吃掉 |

  最麻煩的是第一項和第四項：內容是**真的不見了**，不是顯示問題。NLog 那篇曾經整份 34 行的
  `NLog.config` 在頁面上只剩一行。放進程式碼區塊後這四件事都不會發生。

  順手標上語言（` ```bash `、` ```csharp `、` ```xml `、` ```yaml `、` ```json `、
  ` ```powershell `、` ```text `），純文字輸出或目錄樹用 ` ```text `。
- **一般文字也有排版陷阱，同樣是原始檔正常、渲染後才壞。** 改完務必看渲染結果：

  | 你寫的 | 網頁上變成 | 正確寫法 |
  |---|---|---|
  | 兩行文字之間沒有空行 | 合併成同一段 | 段落之間空一行 |
  | 表格的前一行是文字 | 不會變成表格，`\|` 直接顯示 | 表格前空一行 |
  | `1.文字`（點後面沒空格） | 不會變成清單 | `1. 文字` |
  | `•` 開頭 | 不是清單符號，整段黏在一起 | `- 文字` |
  | 警示框（`> [!NOTE]`）裡的多行文字 | 一樣會合併成一行 | 行與行之間加一行只有 `>` 的空行，或改用 `> - ` 清單 |
  | 表頭欄數比分隔線多 | 每列多出一欄空白 | 表頭、分隔線、內容的欄數一致 |
- **一定要有描述，而且是兩個地方都要。** 新增或修改文章時一併檢查：
  1. front matter 要寫 `description`（分享連結時顯示的摘要）
  2. 正文的標題之後要先有一段說明文字，再進入程式碼、指令或表格

  第 2 點常被忽略。「標題 → 直接上程式碼」的文章，讀者點進來要自己拼湊這篇在講什麼，
  搜尋引擎抓到的摘要也會是一段指令。寫一兩句話交代這篇解決什麼問題就夠了。
- **內容含 `{{ }}` 時要用 `{% raw %}` 包起來。** 例如 Docker 的 `--format "table {{.Names}}"`，否則 Jekyll 會當成 Liquid 變數解析並輸出成空字串。
- **檔名需符合 `YYYY-MM-DD-標題.md` 格式**，否則不會被視為文章。
- **front matter 不可省略。** 缺少時標題會由檔名自動推導，通常不是你要的樣子。
- **別把含真實路徑、密鑰、內網位址的指令放在文章開頭。** 沒寫 `description` 時，
  摘要會自動取正文開頭，那些內容會被送進 `<meta>` 並被搜尋引擎索引，
  能見度比擺在文章中間高得多。

## 進階寫作功能

### Front matter 選用欄位

除了 `layout`、`title`、`date`、`categories`、`tags`、`description` 之外，以下欄位需要時再加：

| 欄位 | 作用 |
|---|---|
| `image: "/assets/images/xxx.jpg"` | 換掉這篇的分享縮圖（見「分享預覽」） |
| `featured: true` | 列入首頁「精選文章」（最多 5 篇） |
| `mermaid: true` | 載入 Mermaid，` ```mermaid ` 區塊才會畫成圖表 |
| `math: true` | 載入 KaTeX，`$$…$$` 才會渲染成公式 |
| `series: car2026` + `series_order: 3` | 文末顯示系列文章導覽（見下方「系列文章」） |
| `published: false` | 草稿：不會出現在網站上，但檔案仍會推進 repo |

**Mermaid 與 KaTeX 是逐篇開啟的。** 兩個函式庫都不小（Mermaid 約 1 MB），所以只有寫了旗標的文章才會從 jsDelivr 載入，沒寫的頁面只會看到原始程式碼或純文字。公式的寫法是 kramdown 的 `$$…$$`（行內與獨立區塊都是兩個錢字號），跟 GitHub 的單個 `$` 不同。

**同一天發兩篇時，`date` 要帶時間。** 只寫日期的話，Jekyll 會用檔名排序，前後篇的順序不一定是你要的：

```yaml
date: 2026-10-21 08:30:00 +0800
```

日期設在未來的文章預設不會發佈（`future: false`），等到那天之後下一次推送才會出現。

### 警示框

沿用 GitHub 的寫法，`assets/js/site.js` 的 `initAlerts()` 會轉成帶標題與顏色的提示框：

```markdown
> [!TIP]
> 第一段
>
> 第二段（段落之間要有只寫 > 的空行，否則會併成一行）
```

可用的類型：`[!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`、`[!CAUTION]`。

### 文章目錄

文章裡的 `##`（h2）與 `###`（h3）合計 3 個以上時，右下角會自動出現「目錄」按鈕，點開可以跳到各段落，捲動時會標示目前位置。不需要任何設定。

**`####`（h4）不會列入目錄。** 像「步驟」這種每段都會重複的小標，用 `####` 才不會塞滿目錄。

文章列表頁（`/blog`）右下角的「分類」按鈕是同一個元件，清單直接從頁面上的分類標題產生。

### 系列文章

front matter 寫了 `series` 與 `series_order` 的文章，文末會出現同系列的文章清單（`_includes/series-nav.html`），本篇會標示「（本篇）」。系列只有一篇時不顯示。

系列的顯示名稱寫在 `_data/series.yml`，新增系列時在那裡加一行：

```yaml
japan2026: "日本蜜月行"
car2026: "2026 購車紀錄"
```

### 照片

```liquid
{% include photo.html src="2026_Japan_Travel/day1/day1_lunch1.jpg" caption="炸豬排飯" %}
```

`src` 是 `assets/images/` 底下的相對路徑，`caption` 同時當圖說與替代文字。兩張並排時外層包 `<div class="photo-pair">`。

**新增、壓縮或替換照片後，要重新產生 `_data/photo_sizes.yml`。** 這份清單提供每張照片的寬高，瀏覽器才能在圖片載入前先保留空間；查不到的照片仍能顯示，但捲動時版面會跳動。重新產生的指令寫在該檔開頭。

### 主觀評分表

在 Markdown 表格的下一行加上 `{: .score-card}`，JS 會補上權重滑桿與加權總分列（範例見 `_posts/2026-09-06-2026年CUV大比拚.md`）。分數仍寫在表格裡，沒有 JS 時一樣讀得到。

欄位角色由**表頭文字**決定，與順序無關：

| 表頭 | 角色 |
|---|---|
| 第 1 欄 | 面向名稱 |
| 「權重」 | 權重欄（必要）；填 `+` 的列是加扣分項，直接加到總分，不參與加權平均 |
| 「說明」或「備註」 | 純文字欄 |
| 其他欄 | 每欄各為一個受評對象 |

### 同時呈現原始寫法與渲染結果

教學類文章（例如 Markdown 語法大全）要讓讀者對照時，在程式碼區塊後面接一個 `md-result` 框，框裡的 Markdown 會正常解析：

```html
<div class="md-result" markdown="1">
**這段會被渲染成粗體**
</div>
```

示範標題大小時不要放真的 `#` 標題（會多出 h1、也會混進目錄），改用 `<p class="md-demo-h1">`～`md-demo-h6`。

## 分享預覽（Open Graph）

把網址貼到 Slack、LINE、Facebook 時顯示的標題、描述與縮圖，由 `_includes/head.html`
統一產生，兩個版型共用，不需要也不應該改到個別 layout。

描述有三層 fallback，由上往下找到第一個有值的就用：

| 順序 | 來源 | 說明 |
|---|---|---|
| 1 | `page.description` | 文章 front matter 自己寫的，**建議一律填寫** |
| 2 | `page.excerpt` | Jekyll 自動取的正文開頭 |
| 3 | `site.description` | `_config.yml` 的站台預設 |

**為什麼建議一律填寫**：第 2 層是「有總比沒有好」的保險，不是好結果。文章若是標題後
直接接程式碼，抓出來的摘要就會像這樣：

> 一、流程圖 語法 \`\`\`mermaid flowchart LR A --&gt; B C--&gt; B \`\`\` 圖表…

縮圖預設用 `_config.yml` 的 `image`（目前是 `/assets/images/avatar2.jpg`）。某篇文章想
換一張，在 front matter 加 `image: "/assets/images/xxx.jpg"` 即可覆寫。

兩件容易踩的事：

- **縮圖只能是 jpg / png。** 各平台的分享卡片不吃 `.ico`，favicon 用的
  `avatar.ico` 不能拿來當 `image`，填了會變成無圖卡片。
- **`_config.yml` 的 `url` 必須是實際網域**（目前為 `https://myblog.shilvain.com`）。
  `og:url`、`og:image`、`canonical` 都是由它組出的絕對網址，填錯會指到不存在的位址。
  本機預覽時看到 `http://0.0.0.0:4000/...` 是正常的，`jekyll serve` 會覆寫這個值。

## 風格與相容性

- 主樣式在 `assets/css/style.css`，使用 CSS 變數管理色彩與尺寸。
- 桌機為「固定左側 header + 固定右側 sidebar + 中間內容」三欄式；`max-width: 768px` 以下切換為手機版：導覽列改漢堡選單、側邊欄改為滿版頁尾、表格加上橫向捲動容器。
- **`_config.yml` 的 `theme: null` 不可移除。** `github-pages` gem 會強制帶入預設的 `jekyll-theme-primer`，該主題的 `assets/css/style.scss` 編譯後會與本站的 `style.css` 撞到同一個輸出路徑並整份覆蓋。線上不受影響，但本地會失去所有自訂樣式。
  快速檢查：`curl -s -o /dev/null -w "%{size_download}" http://localhost:4000/assets/css/style.css` 應與 `assets/css/style.css` 的大小相符，若得到約 136000 就是主題又蓋回來了。

## 注意事項與建議

- `site.data` 可同時讀取 YAML/JSON，專案保留兩種格式是可行的，但建議統一規範何時使用哪一種。
- `_data/socials.json` 需有 `name`、`url` 欄位；`external: true` 才會以新分頁開啟。`_includes/sidebar.html` 已做空值檢查。
- 若要加入外掛（plugins），在 GitHub Pages 上有支援限制，請先確認官方支援的插件清單。目前使用 `jekyll-sitemap`（產生 `/sitemap.xml`）與 `jekyll-feed`（產生 `/feed.xml`）。
- `robots.txt` 刻意不加 front matter：加了之後 Jekyll 會渲染它並自動套上 default 版型，整份被包進 HTML 而失效。
- **改 Liquid 模板時，`comment` 區塊裡也不能寫出字面的 Liquid 標籤。** Liquid 連註解內部都會解析，在說明文字裡寫一個標籤語法就會讓整個建置失敗（訊息形如 `Tag '...' was not properly terminated`）。要在註解裡提到某個標籤，改用文字描述。

作者：`_config.yml` 中 `author.name`（可修改）
