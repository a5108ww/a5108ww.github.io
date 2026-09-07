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

  /* ------------------------------------------------------------------
     主觀評分表：權重試算

     Markdown 只寫出「面向 / 預設權重 / 各對象分數」的表格（class 為
     .score-card），權重滑桿與加權總分列都在這裡動態補上。
     分數因此仍維護在文章本文，未啟用 JS 時也讀得到原始評分。

     欄位角色由表頭文字決定，不綁死順序：
       「權重」→ 權重欄（必要）；「說明」/「備註」→ 純文字欄；
       第 1 欄 → 面向名稱；其餘每一欄各代表一個受評對象。

     權重欄填 `+` 的列代表「加扣分項」：分數不是 0~5 的評分，而是直接加到
     總分上的調整值（例如市場驗證的加減分），因此不參與加權平均。
     ------------------------------------------------------------------ */
  var MAX_SCORE = 5;
  var BONUS_MARK = '+';

  function initScoreCards() {
    var tables = document.querySelectorAll('table.score-card');
    Array.prototype.forEach.call(tables, initScoreCard);
  }

  function initScoreCard(table) {
    var head = table.tHead && table.tHead.rows[0];
    var body = table.tBodies[0];
    if (!head || !body) return;

    var roles = [];
    var subjects = []; // 受評對象所在的欄索引
    var weightIndex = -1;

    Array.prototype.forEach.call(head.cells, function (cell, index) {
      var title = cell.textContent.trim();
      if (title === '權重') {
        roles[index] = 'weight';
        weightIndex = index;
      } else if (title === '說明' || title === '備註') {
        roles[index] = 'note';
      } else if (index === 0) {
        roles[index] = 'label';
      } else {
        roles[index] = 'subject';
        subjects.push(index);
      }
    });

    if (weightIndex < 0 || !subjects.length) return;

    // 逐列讀出分數，並把權重欄換成滑桿
    var items = [];
    Array.prototype.forEach.call(body.rows, function (row) {
      if (row.cells.length !== head.cells.length) return;

      var weightCell = row.cells[weightIndex];
      var raw = weightCell.textContent.trim();
      var isBonus = raw === BONUS_MARK;
      var weight = parseFloat(raw);

      // 權重沒填數字也不是加扣分標記的列（例如原本手寫的總分列）直接略過
      if (!isBonus && isNaN(weight)) return;

      var scores = subjects.map(function (column) {
        return parseFloat(row.cells[column].textContent) || 0;
      });

      if (isBonus) {
        weightCell.textContent = '直接加總';
        weightCell.className = 'score-card__bonus-mark';
        items.push({ bonus: true, scores: scores });
        return;
      }

      var input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = String(MAX_SCORE);
      input.step = '1';
      input.value = String(weight);
      input.setAttribute('aria-label', row.cells[0].textContent.trim() + ' 的權重');

      var readout = document.createElement('output');
      readout.textContent = String(weight);

      var control = document.createElement('span');
      control.className = 'score-card__weight';
      control.appendChild(input);
      control.appendChild(readout);

      weightCell.textContent = '';
      weightCell.appendChild(control);

      input.addEventListener('input', function () {
        readout.textContent = input.value;
        update();
      });

      items.push({ bonus: false, input: input, readout: readout, weight: weight, scores: scores });
    });

    if (!items.length) return;

    // 加權總分列：逐欄產生，說明欄留白才不會讓列寬對不齊
    var footRow = table.createTFoot().insertRow();
    var totalCells = [];

    roles.forEach(function (role) {
      if (role === 'label') {
        var labelCell = document.createElement('th');
        labelCell.scope = 'row';
        labelCell.textContent = '加權總分';
        footRow.appendChild(labelCell);
        return;
      }

      var cell = footRow.insertCell();
      if (role !== 'subject') return;

      var value = document.createElement('span');
      value.className = 'score-card__total';
      var bar = document.createElement('span');
      bar.className = 'score-card__bar';
      var fill = document.createElement('i');

      bar.appendChild(fill);
      cell.appendChild(value);
      cell.appendChild(bar);
      totalCells.push({ cell: cell, value: value, fill: fill });
    });

    function update() {
      var weightSum = 0;
      items.forEach(function (item) {
        if (!item.bonus) weightSum += Number(item.input.value);
      });

      // 權重全歸零時沒有可比較的基準，直接顯示破折號
      var totals = [];
      for (var s = 0; s < subjects.length; s++) {
        if (weightSum === 0) {
          totals.push(null);
          continue;
        }

        var weighted = 0;
        var bonus = 0;
        for (var r = 0; r < items.length; r++) {
          if (items[r].bonus) bonus += items[r].scores[s];
          else weighted += items[r].scores[s] * Number(items[r].input.value);
        }
        totals.push(weighted / weightSum + bonus);
      }

      var best = Math.max.apply(null, totals.map(function (total) {
        return total === null ? -Infinity : total;
      }));

      // 加扣分可能把總分推過滿分，長條圖的基準要跟著放大才不會全部頂到 100%
      var scale = Math.max(MAX_SCORE, best);

      totals.forEach(function (total, index) {
        var target = totalCells[index];
        var ratio = total === null ? 0 : Math.max(0, Math.min(1, total / scale));

        target.value.textContent = total === null ? '—' : total.toFixed(2);
        target.fill.style.width = ratio * 100 + '%';
        target.cell.classList.toggle('is-best', total !== null && total === best);
      });
    }

    var hint = document.createElement('p');
    hint.className = 'score-card-actions__hint';
    hint.textContent = '拖動「權重」欄的滑桿（0 = 不在意，' + MAX_SCORE +
      ' = 最在意），加權總分即時重算；標示「直接加總」的列不受權重影響。';

    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'score-card-actions__reset';
    reset.textContent = '回復預設權重';
    reset.addEventListener('click', function () {
      items.forEach(function (item) {
        if (item.bonus) return; // 加扣分列沒有滑桿
        item.input.value = String(item.weight);
        item.readout.textContent = String(item.weight);
      });
      update();
    });

    var actions = document.createElement('div');
    actions.className = 'score-card-actions';
    actions.appendChild(hint);
    actions.appendChild(reset);

    // initTables 已把表格包進 .table-scroll，控制列要放在捲動容器之外
    var host = table.parentNode.classList.contains('table-scroll') ? table.parentNode : table;
    host.parentNode.insertBefore(actions, host.nextSibling);

    update();
  }

  initNav();
  initTables();
  initScoreCards();
})();
