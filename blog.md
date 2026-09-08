---
layout: default
title: "我的文章列表"
description: "依分類整理的全部文章，涵蓋後端開發、基礎建設、工具與AI，以及生活紀錄。"
---

# 我的文章

{% comment %}
  分類的顯示順序。site.categories 本身沒有穩定排序，
  因此在此明確指定；未列於此的分類會在下方自動補上，不會遺漏。
{% endcomment %}
{% assign ordered = "後端開發,基礎建設,工具與AI,生活" | split: "," %}

<div class="post-index">

  {% for name in ordered %}
    {% assign group = site.categories[name] %}
    {% if group %}
      <section class="post-index__group">
        <h2 id="{{ name }}">{{ name }}<span class="post-index__count">-{{ group.size }}篇</span></h2>
        <ul>
          {% for post in group %}
            <li>
              <a class="post-index__link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
              <span class="post-index__meta">
                <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
                {% for tag in post.tags %}<span class="tag">{{ tag }}</span>{% endfor %}
              </span>
            </li>
          {% endfor %}
        </ul>
      </section>
    {% endif %}
  {% endfor %}

  {% comment %} 未列入上方順序的分類 {% endcomment %}
  {% for entry in site.categories %}
    {% unless ordered contains entry[0] %}
      <section class="post-index__group">
        <h2 id="{{ entry[0] }}">{{ entry[0] }}<span class="post-index__count">-{{ entry[1].size }}篇</span></h2>
        <ul>
          {% for post in entry[1] %}
            <li>
              <a class="post-index__link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
              <span class="post-index__meta">
                <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
                {% for tag in post.tags %}<span class="tag">{{ tag }}</span>{% endfor %}
              </span>
            </li>
          {% endfor %}
        </ul>
      </section>
    {% endunless %}
  {% endfor %}

  {% comment %} 安全網：沒有任何分類的文章仍會列出，不會憑空消失 {% endcomment %}
  {% assign uncategorized = site.posts | where_exp: "p", "p.categories.size == 0" %}
  {% if uncategorized.size > 0 %}
    <section class="post-index__group">
      <h2 id="未分類">未分類<span class="post-index__count">-{{ uncategorized.size }}篇</span></h2>
      <ul>
        {% for post in uncategorized %}
          <li>
            <a class="post-index__link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
            <span class="post-index__meta">
              <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
            </span>
          </li>
        {% endfor %}
      </ul>
    </section>
  {% endif %}

</div>
