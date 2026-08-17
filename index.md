---
layout: default
title: "我的部落格首頁"
author_profile: true # 設為 true 即可自動顯示側邊欄個人資料
---

# 歡迎來到我的部落格！

以下是我的最新文章列表：

<ul>
  {% for post in site.posts %}
    <li>
      <span>{{ post.date | date: "%Y-%m-%d" }}</span> — 
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>