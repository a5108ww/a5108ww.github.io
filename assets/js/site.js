(function () {
  'use strict';

  /* ------------------------------------------------------------------
     手機版漢堡選單
     ------------------------------------------------------------------ */
  function initNav() {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    if (!header || !toggle) return;

    function setOpen(open) {
      header.classList.toggle('is-nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!header.classList.contains('is-nav-open'));
    });

    // 按 Esc 或點擊選單以外的區域即收合
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     替內文表格加上可橫向捲動的外框

     Markdown 產生的 <table> 沒有容器，寬表格會把整頁撐破。
     單靠 CSS 無法解決：min-width 加在 table 自身時，捲軸會落在父層而非表格上，
     因此改由 JS 包一層 .table-scroll 作為捲動容器。
     ------------------------------------------------------------------ */
  function initTables() {
    var tables = document.querySelectorAll('.main-content table');
    Array.prototype.forEach.call(tables, function (table) {
      var parent = table.parentNode;
      if (parent && parent.classList && parent.classList.contains('table-scroll')) return;

      var wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      parent.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  initNav();
  initTables();
})();
