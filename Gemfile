source "https://rubygems.org"

# GitHub Pages 官方 gem。
# 它會鎖定 GitHub Pages 線上實際使用的 Jekyll 版本（目前為 3.10.x）與所有相依套件，
# 確保本地預覽的輸出結果與發版後完全一致，避免「本地好好的、發版後跑掉」。
gem "github-pages", group: :jekyll_plugins

# Ruby 3.0 起 webrick 已從標準函式庫移除，
# 但 github-pages 鎖定的 Jekyll 3.x 仍依賴它來啟動本機伺服器，因此必須明確引入。
gem "webrick", "~> 1.8"

# Windows 與 JRuby 沒有內建 zoneinfo 資料庫，
# 需要這個 gem 才能正確解析 _config.yml 中的 timezone: Asia/Taipei。
# （在 Linux 容器內執行時會自動略過。）
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]

# Windows 原生執行時的檔案監看效能修正（在容器內會自動略過）。
gem "wdm", "~> 0.1", platforms: [:mingw, :mswin, :x64_mingw]
