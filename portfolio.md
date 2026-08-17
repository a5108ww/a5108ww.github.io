---
layout: default
title: "我的專案作品集"
---

# 我的專案作品集

以下是我近期開發的專案清單：

<div class="project-list">
  {% for project in site.data.projects %}
    <div class="project-card">
      <h3>
        <a href="{{ project.link }}" target="_blank">{{ project.name }}</a>
        {% if project.featured %}
          <span style="color: gold;">★ 精選專案</span>
        {% endif %}
      </h3>
      <p>{{ project.description }}</p>
      <p><strong>使用技術：</strong> {{ project.tech | join: ", " }}</p>
    </div>
    <hr>
  {% endfor %}
</div>

# 技能清單

{% for skill in site.data.skills %}
  ### {{ skill.category }}
  <ul>
    {% for item in skill.items %}
      <li>{{ item }}</li>
    {% endfor %}
  </ul>
{% endfor %}