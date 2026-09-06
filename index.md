---
layout: default
title: "我的部落格首頁"
---

<section class="home-hero">
  <h1>{{ site.title }}</h1>
  <p class="home-hero__lead">
    這邊是我放一些與大家分享的技術筆記與生活紀錄的地方。<br>
    技術筆記的部分，主要分享 .NET 後端開發以及其相關的內容，比如像使用框架、資料庫、容器等等。
  </p>
</section>

<section class="home-section">
  <h2>這裡有什麼</h2>

  {% comment %}
    分類卡片直接讀 site.categories，篇數與最新文章都會自動更新，
    日後新增文章不需要回來改首頁。順序與 blog.md 保持一致。
  {% endcomment %}
  {% assign ordered = "後端開發,基礎建設,工具與AI,生活" | split: "," %}

  <div class="cat-grid">
    {% for name in ordered %}
      {% assign group = site.categories[name] %}
      {% if group %}
        <a class="cat-card" href="{{ '/blog#' | append: name | relative_url }}">
          <span class="cat-card__head">
            <span class="cat-card__name">{{ name }}</span>
            <span class="cat-card__count">{{ group.size }} 篇</span>
          </span>
          <span class="cat-card__latest">最新：{{ group.first.title }}</span>
        </a>
      {% endif %}
    {% endfor %}
  </div>
</section>

{% comment %}
  精選文章：在想推薦的文章 front matter 加上 featured: true 即會出現在此。
  目前沒有任何文章標記，因此整個區塊不會顯示。
{% endcomment %}
{% assign featured = site.posts | where: "featured", true %}
{% if featured.size > 0 %}
<section class="home-section">
  <h2>精選文章</h2>
  <ul class="home-list">
    {% for post in featured limit: 5 %}
      <li>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <span class="home-list__meta">
          <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
          {% for tag in post.tags %}<span class="tag">{{ tag }}</span>{% endfor %}
        </span>
      </li>
    {% endfor %}
  </ul>
</section>
{% endif %}

<section class="home-section">
  <h2>其他</h2>
  <p class="home-links">
    <a href="{{ '/blog' | relative_url }}">全部文章（{{ site.posts.size }} 篇）</a>
    <a href="{{ '/portfolio' | relative_url }}">專案作品集</a>
  </p>
</section>
