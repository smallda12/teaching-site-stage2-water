/* ==========================================================
   側邊工具列：🖊️ 畫筆　⏱️ 計時器
   兩者全站可用，浮在所有內容之上。
   ========================================================== */
window.工具 = (function () {
  /* ---------------- 儲存小工具 ---------------- */
  const 存 = {
    讀(k, d) {
      try {
        const v = localStorage.getItem("水魔法師:" + k);
        return v === null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    寫(k, v) {
      try {
        localStorage.setItem("水魔法師:" + k, JSON.stringify(v));
      } catch (e) {}
    },
  };

  /* ================= 畫筆 ================= */
  const 畫筆 = (function () {
    let canvas, ctx, 啟用 = false, 畫中 = false;
    let 顏色 = "#e6194b", 粗細 = 6, 橡皮 = false;

    function 建立() {
      canvas = document.getElementById("畫布");
      ctx = canvas.getContext("2d");
      調整尺寸();
      window.addEventListener("resize", 調整尺寸);

      canvas.addEventListener("pointerdown", (e) => {
        if (!啟用) return;
        畫中 = true;
        canvas.setPointerCapture(e.pointerId);
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!啟用 || !畫中) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 橡皮 ? 粗細 * 4 : 粗細;
        ctx.globalCompositeOperation = 橡皮 ? "destination-out" : "source-over";
        ctx.strokeStyle = 顏色;
        ctx.stroke();
      });
      const 收筆 = () => { 畫中 = false; };
      canvas.addEventListener("pointerup", 收筆);
      canvas.addEventListener("pointercancel", 收筆);
      canvas.addEventListener("pointerleave", 收筆);
    }

    /* 視窗縮放時保留既有筆跡 */
    function 調整尺寸() {
      const 舊 = canvas.width ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (舊) ctx.putImageData(舊, 0, 0);
    }

    function 切換(on) {
      啟用 = on === undefined ? !啟用 : on;
      canvas.classList.toggle("啟用", 啟用);
      document.getElementById("畫筆面板").classList.toggle("開", 啟用);
      document.getElementById("鈕畫筆").classList.toggle("作用中", 啟用);
      return 啟用;
    }

    const 設色 = (c) => { 顏色 = c; 橡皮 = false; 同步按鈕(); };
    const 設粗 = (w) => { 粗細 = +w; };
    const 切橡皮 = () => { 橡皮 = !橡皮; 同步按鈕(); return 橡皮; };
    const 清除 = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

    function 同步按鈕() {
      document.querySelectorAll("#畫筆面板 .色塊").forEach((b) => {
        b.classList.toggle("選中", !橡皮 && b.dataset.色 === 顏色);
      });
      document.getElementById("鈕橡皮").classList.toggle("選中", 橡皮);
    }

    return { 建立, 切換, 設色, 設粗, 切橡皮, 清除, get 啟用() { return 啟用; } };
  })();

  /* ================= 計時器（三個，各自獨立運作） ================= */
  const 計時器群 = (function () {
    const 數量 = 3;
    const 預設說明 = [
      "時間到，請把東西收好，我們繼續上課。",
      "時間到了。",
      "時間到了。",
    ];
    const 實例 = [];

    function 建立單一(n) {
      const key = (名) => `計時${n}${名}`;
      const el = (名) => document.getElementById(`計時${名}${n}`);
      let 剩餘 = 0, 控制 = null, 執行中 = false;

      function 更新顯示(t) {
        const m = String(Math.floor(t / 60)).padStart(2, "0");
        const s = String(t % 60).padStart(2, "0");
        el("顯示").textContent = `${m}:${s}`;
        el("顯示").classList.toggle("快到了", 執行中 && t <= 10);
        el("顯示").classList.toggle("跑動中", 執行中);
      }

      function 讀設定() {
        const 分 = Math.max(0, +el("分").value || 0);
        const 秒 = Math.min(59, Math.max(0, +el("秒").value || 0));
        存.寫(key("分"), 分);
        存.寫(key("秒"), 秒);
        存.寫(key("說明"), el("說明").value.trim());
        return 分 * 60 + 秒;
      }

      function 設按鈕(跑) {
        el("鈕開始").textContent = 跑 ? "⏸ 暫停" : "▶ 開始";
      }

      function 開始() {
        if (執行中) return;
        if (剩餘 <= 0) 剩餘 = 讀設定();
        if (剩餘 <= 0) return;
        執行中 = true;
        設按鈕(true);
        控制 = setInterval(() => {
          剩餘--;
          更新顯示(剩餘);
          if (剩餘 <= 0) 結束();
        }, 1000);
        更新顯示(剩餘);
      }

      function 暫停() {
        執行中 = false;
        clearInterval(控制);
        設按鈕(false);
        更新顯示(剩餘);
      }

      function 重設() {
        暫停();
        剩餘 = 讀設定();
        更新顯示(剩餘);
      }

      async function 結束() {
        clearInterval(控制);
        執行中 = false;
        設按鈕(false);
        剩餘 = 0;
        更新顯示(0);
        const 盒 = el("盒");
        盒.classList.add("時間到");
        setTimeout(() => 盒.classList.remove("時間到"), 8000);
        /* 先響一聲「時間到」，再唸這個計時器自己設定的說明文字 */
        await 語音.提示("ui_timeup");
        const t = el("說明").value.trim();
        if (t) await 語音.唸(t, { 打斷: false });
      }

      /* 掛上事件並套用存檔設定 */
      el("分").value = 存.讀(key("分"), n === 1 ? 5 : n === 2 ? 10 : 1);
      el("秒").value = 存.讀(key("秒"), 0);
      el("說明").value = 存.讀(key("說明"), 預設說明[n - 1]);
      el("鈕開始").onclick = () => (執行中 ? 暫停() : 開始());
      el("鈕重設").onclick = 重設;
      el("鈕試聽").onclick = () => 語音.唸(el("說明").value.trim());
      更新顯示(剩餘 = 讀設定());

      return { 重設 };
    }

    function 建立() {
      const wrap = document.getElementById("計時器清單");
      wrap.innerHTML = "";
      for (let n = 1; n <= 數量; n++) {
        wrap.insertAdjacentHTML("beforeend", `
          <div class="計時盒" id="計時盒${n}">
            <div class="計時標">計時器 ${n}</div>
            <div id="計時顯示${n}" class="計時顯示">00:00</div>
            <div class="面板列">
              <label>分 <input type="number" id="計時分${n}" min="0" max="120"></label>
              <label>秒 <input type="number" id="計時秒${n}" min="0" max="59"></label>
            </div>
            <label class="面板列 直">時間到要說的話
              <textarea id="計時說明${n}" rows="2" placeholder="例：時間到，請把圖卡收好。"></textarea>
            </label>
            <div class="面板列">
              <button class="主要鈕" id="計時鈕開始${n}">▶ 開始</button>
              <button class="次要鈕" id="計時鈕重設${n}">↺ 重設</button>
              <button class="次要鈕" id="計時鈕試聽${n}">🔊 試聽</button>
            </div>
          </div>`);
      }
      for (let n = 1; n <= 數量; n++) 實例.push(建立單一(n));
    }

    return { 建立 };
  })();

  /* ================= 面板開關 ================= */
  function 切面板(id, 鈕id) {
    const el = document.getElementById(id);
    const 開 = el.classList.toggle("開");
    if (鈕id) document.getElementById(鈕id).classList.toggle("作用中", 開);
    return 開;
  }

  function 初始化() {
    畫筆.建立();
    計時器群.建立();

    document.getElementById("鈕畫筆").onclick = () => 畫筆.切換();
    document.getElementById("鈕計時").onclick = () => 切面板("計時器面板", "鈕計時");

    document.querySelectorAll("#畫筆面板 .色塊").forEach((b) => {
      b.style.background = b.dataset.色;
      b.onclick = () => 畫筆.設色(b.dataset.色);
    });
    document.getElementById("筆粗").oninput = (e) => 畫筆.設粗(e.target.value);
    document.getElementById("鈕橡皮").onclick = () => 畫筆.切橡皮();
    document.getElementById("鈕清畫").onclick = () => 畫筆.清除();
    document.getElementById("鈕關畫筆").onclick = () => 畫筆.切換(false);

    document.getElementById("鈕關計時").onclick = () => 切面板("計時器面板", "鈕計時");

    畫筆.設色("#e6194b");
  }

  return { 初始化, 畫筆, 計時器群, 存 };
})();

/* BEGIN CLASSROOM_WHEEL_V1：離線抽籤輪盤，全站共用。 */
(() => {
  'use strict';
  function initWheel() {
    const toolbar = document.querySelector('.工具列');
    if (!toolbar || document.getElementById('鈕輪盤')) return;
    const style = document.createElement('style');
    style.textContent = `
      #classroom-wheel{border:0;border-radius:24px;padding:24px;width:min(880px,94vw);max-height:92dvh;overflow:auto;background:#fffdf5;color:#173f29;box-sizing:border-box;box-shadow:0 12px 60px #0006}
      #classroom-wheel::backdrop{background:#10291cc9}
      #classroom-wheel *{box-sizing:border-box}
      #classroom-wheel header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
      #classroom-wheel h2{font-size:30px;margin:0}
      #classroom-wheel button{cursor:pointer;font:inherit;min-height:48px;border-radius:12px;padding:8px 18px;border:2px solid #1b6034;background:#fff;color:#173f29}
      #classroom-wheel button:disabled{opacity:.55;cursor:wait}
      #classroom-wheel :focus-visible{outline:4px solid #ee7c29;outline-offset:3px}
      #classroom-wheel .cw-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(200px,1fr);gap:24px;align-items:start}
      #classroom-wheel .cw-wheel{position:relative;margin:14px auto;width:100%;max-width:420px}
      #classroom-wheel .cw-pointer{position:absolute;top:-12px;left:50%;transform:translateX(-50%);z-index:1;width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-top:34px solid #153e27;filter:drop-shadow(0 2px 2px #fff)}
      #classroom-wheel canvas{display:block;width:100%;height:auto;border-radius:50%;border:6px solid white;box-shadow:0 4px 18px #173f2930;transition:transform 4s cubic-bezier(.12,.72,.12,1)}
      #classroom-wheel label{display:block;font-size:22px;font-weight:700;margin-bottom:8px}
      #classroom-wheel textarea{width:100%;min-height:200px;font:22px/1.5 sans-serif;border:2px solid #a1b6a0;border-radius:12px;padding:12px;background:white;color:#173f29;resize:vertical}
      #classroom-wheel p{font-size:18px;line-height:1.5;margin:8px 0 14px}
      #classroom-wheel #cw-result{font-size:30px;font-weight:800;overflow-wrap:anywhere;min-height:52px;text-align:center;margin:18px 0}
      #classroom-wheel #cw-spin{display:block;width:100%;font-size:26px;font-weight:800;background:#1b6034;color:#fff}
      #classroom-wheel #cw-error{color:#9b251c;font-weight:700}
      @media(max-width:600px){#classroom-wheel{padding:18px}.cw-grid{gap:14px!important}#classroom-wheel .cw-grid{grid-template-columns:1fr}#classroom-wheel .cw-wheel{max-width:280px}#classroom-wheel textarea{min-height:110px}#classroom-wheel h2{font-size:26px}}
      @media(prefers-reduced-motion:reduce){#classroom-wheel canvas{transition-duration:.01s}}
    `;
    document.head.append(style);
    const open = document.createElement('button');
    open.id = '鈕輪盤'; open.className = '工具鈕'; open.textContent = '🎯';
    open.title = '抽籤輪盤'; open.setAttribute('aria-label', '開啟抽籤輪盤');
    open.setAttribute('aria-haspopup', 'dialog'); toolbar.append(open);
    const dialog = document.createElement('dialog'); dialog.id = 'classroom-wheel';
    dialog.setAttribute('aria-labelledby', 'cw-title');
    dialog.innerHTML = `<header><h2 id="cw-title">抽籤輪盤</h2><button type="button" id="cw-close" aria-label="關閉抽籤輪盤">關閉</button></header>
      <div class="cw-grid"><section aria-label="輪盤與結果"><div class="cw-wheel"><div class="cw-pointer" aria-hidden="true"></div><canvas width="800" height="800" aria-label="抽籤輪盤，結果顯示在下方"></canvas></div><div id="cw-result" role="status" aria-live="polite">準備好了，轉動輪盤！</div><button type="button" id="cw-spin">開始抽籤</button></section>
      <section><label for="cw-items">籤項清單</label><p id="cw-help">每行一個籤項，可輸入姓名、號碼或活動。每次抽籤機會相同，可重複抽中。</p><textarea id="cw-items" aria-describedby="cw-help cw-error" spellcheck="false"></textarea><p>可放入 2～60 個籤項，每項最多 80 個字。</p><p id="cw-error" role="alert"></p></section></div>`;
    document.body.append(dialog);
    const canvas = dialog.querySelector('canvas'), ctx = canvas.getContext('2d');
    const input = dialog.querySelector('textarea'), spin = dialog.querySelector('#cw-spin');
    const result = dialog.querySelector('#cw-result'), error = dialog.querySelector('#cw-error');
    let items = ['1','2','3','4','5','6'], angle = 0, busy = false, finishTimer;
    try { const saved = sessionStorage.getItem('classroom-wheel-items-v1'); if (saved) input.value = saved; } catch (_) {}
    if (!input.value) input.value = items.join('\n');
    const colors = ['#ffe19a','#bfe0ce','#f8b8a1','#b8d8ee','#e0c8ed','#e5e8a9'];
    function readItems() {
      const list = input.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (list.length < 2 || list.length > 60) { error.textContent = '請輸入 2～60 個籤項，每行一個。'; return null; }
      if (list.some(s => Array.from(s).length > 80)) { error.textContent = '每個籤項請縮短至 80 個字以內。'; return null; }
      error.textContent = ''; return list;
    }
    function draw() {
      ctx.clearRect(0,0,800,800); const step = Math.PI*2/items.length;
      items.forEach((label,i) => {
        const start = -Math.PI/2+i*step;
        ctx.beginPath();ctx.moveTo(400,400);ctx.arc(400,400,390,start,start+step);ctx.closePath();
        ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
        ctx.save();ctx.translate(400,400);ctx.rotate(start+step/2);ctx.fillStyle='#173f29';
        ctx.font=`bold ${items.length>30?18:items.length>16?23:32}px sans-serif`;ctx.textAlign='right';ctx.textBaseline='middle';
        const text=Array.from(label);ctx.fillText(text.length>10?text.slice(0,9).join('')+'…':label,365,0,270);ctx.restore();
      });
      ctx.beginPath();ctx.arc(400,400,42,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    }
    function preview() { const list = readItems(); if (list) { items=list; angle=0;canvas.style.transition='none';canvas.style.transform='rotate(0deg)';draw(); } }
    input.addEventListener('input',preview);
    open.onclick = () => { if (!dialog.open) { dialog.showModal(); dialog.querySelector('#cw-close').focus(); } };
    dialog.querySelector('#cw-close').onclick = () => dialog.close();
    dialog.addEventListener('close',() => open.focus());
    dialog.addEventListener('click',e => { if (e.target===dialog) { const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close(); } });
    function randomIndex(n) {
      const value=new Uint32Array(1), limit=Math.floor(4294967296/n)*n;
      do { crypto.getRandomValues(value); } while(value[0]>=limit);
      return value[0]%n;
    }
    spin.onclick = () => {
      if (busy) return;
      const list=readItems();if(!list){input.focus();return;}items=list;draw();
      try { sessionStorage.setItem('classroom-wheel-items-v1', input.value); } catch (_) {}
      busy=true;spin.disabled=true;input.disabled=true;result.textContent='輪盤轉動中……';
      const selected=randomIndex(items.length), target=(360-(selected+.5)*360/items.length)%360;
      // 固定上方指針落在中選扇形的中心；連續抽籤仍向同方向轉動。
      angle += 1800 + ((target-angle%360+360)%360);
      canvas.style.transition='';void canvas.offsetWidth;canvas.style.transform=`rotate(${angle}deg)`;
      let finished=false;
      function finish() { if(finished)return;finished=true;clearTimeout(finishTimer);canvas.removeEventListener('transitionend',onEnd);result.textContent='抽中了：'+items[selected];busy=false;spin.disabled=false;input.disabled=false; }
      function onEnd(e){if(e.target===canvas&&e.propertyName==='transform')finish();}
      canvas.addEventListener('transitionend',onEnd);
      finishTimer=setTimeout(finish,matchMedia('(prefers-reduced-motion: reduce)').matches?60:4300);
    };
    preview();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initWheel,{once:true});else initWheel();
})();
/* END CLASSROOM_WHEEL_V1 */
