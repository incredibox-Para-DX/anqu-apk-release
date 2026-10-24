(function () {
  'use strict';

  // 代码：raw 为主线路（jsDelivr 的 @main 会长期缓存旧文件），boot2 用于下载不完整时强制重下
  // Worker 反代走 Cloudflare 边缘，国内通常明显快于直连 raw；未部署时会测速失败自动回落
  var PROXY_BASE = 'https://anqu-raw.sdfgasdfgwe7.workers.dev/main';
  var CODE_BASES = [
    PROXY_BASE + '/boot',
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot',
    PROXY_BASE + '/boot2',
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot2',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot2'
  ];
  var SHELL_MARK = 'anqu-shell';

  var CODE_TIMEOUT = 90000;
  var PROBE_TIMEOUT = 8000;

  // 测速结果缓存（1 小时）：上次最快的线路优先，省掉重复测速
  var BASE_PICK_KEY = 'ab_fast_base';
  var BASE_PICK_TTL = 3600 * 1000;

  var VERIFY_CODE = [
    'index.html',
    'css/main.css',
    'js/script_new.js',
    'js/main.js',
    'xml/items.xml',
    'audio/click.mp3'
  ];

  var ci = 0;
  var picked = false;
  var done = false;
  var failed = false;
  var timer = null;
  var pollTimer = null;
  var pct = 0;

  // 进度：以时间为基准推进，真实落盘字节做下限校正
  var files = [];
  var totalBytes = 0;
  var lastIdx = -1;
  var probedBytes = 0;
  var startTs = 0;
  var tickTimer = null;

  var introDone = false;
  var pendingEnter = false;

  function $(id) { return document.getElementById(id); }

  function setMsg(text, showPct) {
    var msg = $('dl-msg');
    if (msg) msg.textContent = text;
    var p = $('dl-pct');
    var s = $('dl-pct-sign');
    if (p) p.style.display = showPct ? '' : 'none';
    if (s) s.style.display = showPct ? '' : 'none';
    var tip = $('loading-tip');
    if (tip) tip.textContent = showPct ? (text + pct + '%') : text;
  }

  function setPct(v) {
    v = Math.max(0, Math.min(100, v));
    pct = Math.floor(v + 0.0001);
    var p = $('dl-pct');
    if (p) p.textContent = pct;
    var a = $('dl-fill');
    if (a) a.style.width = v + '%';
    var b = $('loading-progress-bar');
    if (b) b.style.width = v + '%';
  }

  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  function showProgressUI() {
    var st = $('dl-status');
    if (st) st.className = failed ? 'dl-status failed show' : 'dl-status show';
    var bar = $('dl-bar');
    if (bar) bar.className = 'dl-bar show';
  }

  function go() {
    location.replace('index.html?r=' + Date.now());
  }

  function enter(msg) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    stopPoll();
    setPct(100);
    setMsg(msg || '资源更新完成，正在进入…', true);
    if (introDone) { go(); return; }
    pendingEnter = true;
  }

  function fail(message) {
    if (done) return;
    clearTimeout(timer);
    stopPoll();
    failed = true;
    var ov = $('loading-overlay');
    if (ov) ov.className = 'loading-overlay failed';
    setMsg(message || '资源获取失败，点击屏幕重试', false);
    var st = $('dl-status');
    if (st) st.className = 'dl-status failed show';
  }

  // 跨域请求不加自定义头，避免触发 CORS 预检（raw.githubusercontent 的 OPTIONS 返回 403）
  function get(url, cb, timeout) {
    var xhr = new XMLHttpRequest();
    var finished = false;
    function finish(ok, text) {
      if (finished) return;
      finished = true;
      cb(ok, text);
    }
    try {
      xhr.open('GET', url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), true);
      xhr.timeout = timeout || PROBE_TIMEOUT;
      xhr.onload = function () { finish(xhr.status === 200, xhr.responseText || ''); };
      xhr.onerror = function () { finish(false, ''); };
      xhr.ontimeout = function () { finish(false, ''); };
      xhr.send();
    } catch (e) {
      finish(false, '');
    }
  }

  // ---------------- 进度 ----------------
  // 原生是「整个文件下完才写盘」，磁盘上看不到正在下载的字节，
  // 所以进度用时间曲线推进（保证一直在动），并用真实落盘文件数做下限校正，
  // 最终完成以原生回调和完整性校验为准。

  function byteAt(i) { return (files[i] && files[i].size) || 0; }

  function bytesUpTo(i) {
    var s = 0;
    for (var k = 0; k <= i && k < files.length; k++) s += byteAt(k);
    return s;
  }

  function resetProgress() {
    pct = 0;
    lastIdx = -1;
    probedBytes = 0;
    startTs = Date.now();
    setPct(0);
  }

  function stopPoll() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  }

  function startPoll() {
    stopPoll();
    pollTimer = setInterval(poll, 1000);
    tickTimer = setInterval(tick, 350);
  }

  function recordCheckpoint(i) {
    lastIdx = i;
    probedBytes = bytesUpTo(i);
  }

  // 时间曲线：约 12 秒到 50%，30 秒到 75%，60 秒到 88%，之后逼近 94%
  function tick() {
    if (done || failed) return;
    var elapsed = Date.now() - startTs;
    var byTime = 2 + 92 * (1 - Math.exp(-elapsed / 26000));
    var byReal = 0;
    if (totalBytes) byReal = 2 + 92 * (probedBytes / totalBytes);
    var v = Math.max(byTime, byReal);
    if (v > 96) v = 96;
    if (v > pct) setPct(v);
    if (elapsed > 45000) setMsg('网络较慢，正在等待资源…', true);
  }

  // 顺序探测：从上一个已知位置往后探，用于确认哪些文件已经落盘
  function poll() {
    if (done || failed) return;
    if (!files.length) return;
    var i = lastIdx + 1;

    function step() {
      if (done || failed) return;
      if (i >= files.length) { onAllPresent(); return; }
      get(files[i].path, function (ok) {
        if (ok) { recordCheckpoint(i); i++; step(); return; }
      }, 3000);
    }
    step();
  }

  // 清单里的文件全部就位 → 不用等原生回调，直接校验进入
  function onAllPresent() {
    stopPoll();
    verifyCode(function (ok) {
      if (ok) { enter(); return; }
    });
  }

  function setupFiles(m) {
    if (!m || !m.files || !m.files.length) return;
    files = m.files.filter(function (f) { return f && f.path; });
    totalBytes = 0;
    for (var i = 0; i < files.length; i++) totalBytes += byteAt(i);
    if (!totalBytes) { files = []; }
  }

  function verifyCode(cb) {
    var i = 0;
    function next() {
      if (i >= VERIFY_CODE.length) { cb(true); return; }
      var rel = VERIFY_CODE[i++];
      get(rel, function (ok, text) {
        if (!ok) { cb(false); return; }
        if (rel === 'index.html' && text.indexOf(SHELL_MARK) >= 0) { cb(false); return; }
        // 迁移：旧版 v2.1.1 / v2.1.0 不带 _hotfix，版本比较有 bug，
        // 检测到旧缓存就强制重新下载一次，之后正常跳过
        if (rel === 'js/script_new.js' && text.indexOf('_hotfix.') < 0) { cb(false); return; }
        next();
      }, PROBE_TIMEOUT);
    }
    next();
  }

  function parseText(text) {
    try {
      var m = JSON.parse(text);
      if (m && m.files && m.files.length) return m;
    } catch (e) {}
    return null;
  }

  function call(base, timeout, next) {
    try {
      window.AndroidUpdate.check(base);
    } catch (e) {
      next();
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(next, timeout);
  }

  // 并发测速：四个线路同时请求清单，谁先回谁最快，直接放到第一位下载
  // （国内直连 raw 常常比镜像慢一个数量级，固定顺序会白白浪费时间）
  function pickBase(cb) {
    var cached = null;
    try {
      var raw = lsGet(BASE_PICK_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.base && (Date.now() - o.ts) < BASE_PICK_TTL &&
            CODE_BASES.indexOf(o.base) >= 0) cached = o.base;
      }
    } catch (e) {}
    if (cached) {
      CODE_BASES = [cached].concat(CODE_BASES.filter(function (x) { return x !== cached; }));
      cb(cached);
      return;
    }

    var best = null;
    var pending = CODE_BASES.length;
    CODE_BASES.forEach(function (b) {
      var start = Date.now();
      get(b + '/manifest.json', function (ok, text) {
        if (ok && parseText(text)) {
          var ms = Date.now() - start;
          if (!best || ms < best.ms) best = { base: b, ms: ms, manifest: parseText(text) };
        }
        if (--pending > 0) return;
        if (best) {
          CODE_BASES = [best.base].concat(CODE_BASES.filter(function (x) {
            return x !== best.base;
          }));
          setupFiles(best.manifest);
          try {
            localStorage.setItem(BASE_PICK_KEY,
              JSON.stringify({ base: best.base, ts: Date.now() }));
          } catch (e) {}
        }
        cb(best ? best.base : CODE_BASES[0]);
      }, 6000);
    });
  }

  function tryCode() {
    if (done) return;
    if (!picked) {
      picked = true;
      setMsg('正在连接服务器…', false);
      pickBase(function () { tryCode(); });
      return;
    }
    if (ci >= CODE_BASES.length) { fail('资源获取失败，点击屏幕重试'); return; }
    var base = CODE_BASES[ci++];
    setMsg('正在下载资源中…', true);
    resetProgress();
    var startDownload = function () {
      if (done) return;
      startPoll();
      call(base, CODE_TIMEOUT, function () {
        stopPoll();
        tryCode();
      });
    };
    // 走缓存线路时本地还没有清单，补拉一次用于计算真实进度
    if (files.length) { startDownload(); return; }
    get(base + '/manifest.json', function (ok, text) {
      if (ok) setupFiles(parseText(text));
      startDownload();
    }, PROBE_TIMEOUT);
  }

  window.__onUpdateCheckResult = function (res) {
    if (done) return;
    clearTimeout(timer);
    stopPoll();
    var updated = !!(res && res.updated);

    if (updated) {
      setMsg('正在校验运行文件…', false);
      verifyCode(function (ok) {
        if (ok) { enter(); return; }
        setMsg('运行文件不完整，正在重新获取…', false);
        tryCode();
      });
      return;
    }

    verifyCode(function (ok) {
      if (ok) { enter(); return; }
      tryCode();
    });
  };

  // ---------------- 视频与声音 ----------------

  var intro = $('video-intro');
  var mainVideo = $('video-main');
  var bgmMuted = lsGet('bgm_muted') === 'true';
  var pendingUnmute = false;

  function applyAudio(v) {
    if (!v) return;
    v.muted = bgmMuted;
    v.volume = bgmMuted ? 0 : 0.7;
  }

  // 直接带声音自动播放；被浏览器拦下就降级静音播放，首次触摸时再恢复声音
  function playAuto(v) {
    if (!v) return;
    applyAudio(v);
    var ret = null;
    try { ret = v.play(); } catch (e) {}
    if (ret && ret.catch) {
      ret.catch(function () {
        v.muted = true;
        v.volume = 0;
        pendingUnmute = !bgmMuted;
        try { v.play(); } catch (e) {}
      });
    }
  }

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    if (intro) {
      try { intro.pause(); } catch (e) {}
      intro.style.display = 'none';
    }
    if (pendingEnter) { pendingEnter = false; go(); return; }
    showProgressUI();
    if (mainVideo) {
      mainVideo.style.display = 'block';
      playAuto(mainVideo);
    }
  }

  if (intro) {
    intro.addEventListener('ended', finishIntro);
    intro.addEventListener('error', finishIntro);
    setTimeout(finishIntro, 12000);
    playAuto(intro);
  } else {
    setTimeout(finishIntro, 0);
  }

  function restoreSound() {
    if (!pendingUnmute || bgmMuted) return;
    pendingUnmute = false;
    [intro, mainVideo].forEach(function (v) {
      if (!v) return;
      v.muted = false;
      v.volume = 0.7;
      try { v.play(); } catch (e) {}
    });
  }
  document.addEventListener('touchstart', restoreSound);
  document.addEventListener('click', restoreSound);

  // 失败后点屏幕任意位置重试
  document.addEventListener('click', function () {
    if (!failed || done) return;
    failed = false;
    var st = $('dl-status');
    if (st) st.className = 'dl-status show';
    var ov = $('loading-overlay');
    if (ov) ov.className = 'loading-overlay';
    ci = 0;
    tryCode();
  });

  // 只有本机缺文件（首次安装）才自动热更；已下载过就直接进游戏，
  // 后续版本交给应用内「更多设置 -> 检查更新」手动触发
  function boot() {
    verifyCode(function (ok) {
      if (done) return;
      if (ok) { enter('正在进入游戏…'); return; }
      tryCode();
    });
  }

  boot();
})();
