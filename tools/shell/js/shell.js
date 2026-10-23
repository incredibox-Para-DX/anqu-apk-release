(function () {
  'use strict';

  // 代码：raw 为主线路（jsDelivr 的 @main 会长期缓存旧文件），boot2 用于下载不完整时强制重下
  var CODE_BASES = [
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot',
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot2',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot2'
  ];
  var SHELL_MARK = 'anqu-shell';

  var CODE_TIMEOUT = 120000;
  var PROBE_TIMEOUT = 8000;
  var MARK_TIMEOUT = 6000;
  var TICK = 300;

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

  var stage = 'code';
  var ci = 0;
  var picked = false;
  var done = false;
  var failed = false;
  var timer = null;
  var pollTimer = null;
  var pct = 0;

  var codeMarks = null;
  var codeTotal = 0;
  var codeVer = '';

  var markList = null;
  var markIdx = 0;
  var markBase = 0;
  var markSpan = 0;
  var markTotal = 1;
  var markExpect = '1';
  var markProbing = false;
  var pollGen = 0;

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

  // 进度标记：包内文件内容是 "0"，下载写入内部存储后是清单版本号
  function readMark(path, expect, cb) {
    var xhr = new XMLHttpRequest();
    var finished = false;
    function finish(ok) {
      if (finished) return;
      finished = true;
      cb(ok);
    }
    try {
      xhr.open('GET', path + '?t=' + Date.now(), true);
      xhr.timeout = MARK_TIMEOUT;
      xhr.onload = function () {
        finish(xhr.status === 200 &&
               String(xhr.responseText || '').replace(/\s/g, '') === expect);
      };
      xhr.onerror = function () { finish(false); };
      xhr.ontimeout = function () { finish(false); };
      xhr.send();
    } catch (e) {
      finish(false);
    }
  }

  function stopPoll() {
    pollGen++;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    markProbing = false;
  }

  function startPoll(list, total, base, span, expect) {
    stopPoll();
    markList = list || [];
    markTotal = total > 0 ? total : 1;
    markBase = base;
    markSpan = span;
    markExpect = expect || '1';
    markIdx = 0;
    if (!markList.length) return;
    pollTimer = setInterval(tick, TICK);
    tick();
  }

  function tick() {
    if (done) return;
    if (markProbing) return;
    if (!markList || markIdx >= markList.length) { stopPoll(); return; }
    markProbing = true;
    var probes = 0;
    var gen = pollGen;
    (function step() {
      if (done || gen !== pollGen) { markProbing = false; return; }
      if (!markList || markIdx >= markList.length) { markProbing = false; return; }
      if (probes++ >= 4) { markProbing = false; return; }
      var idx = markIdx;
      readMark(markList[idx].path, markExpect, function (ok) {
        if (done || gen !== pollGen) { markProbing = false; return; }
        if (!ok) { markProbing = false; return; }
        markIdx = idx + 1;
        setPct(markBase + (markList[idx].cum / markTotal) * markSpan);
        if (markIdx >= markList.length) { markProbing = false; stopPoll(); return; }
        step();
      });
    })();
  }

  function verifyCode(cb) {
    var i = 0;
    function next() {
      if (i >= VERIFY_CODE.length) { cb(true); return; }
      var rel = VERIFY_CODE[i++];
      get(rel, function (ok, text) {
        if (!ok) { cb(false); return; }
        if (rel === 'index.html' && text.indexOf(SHELL_MARK) >= 0) { cb(false); return; }
        next();
      }, PROBE_TIMEOUT);
    }
    next();
  }

  // 把 manifest 拆成「真实文件」「进度标记」两部分，标记记录自己前面已下载的字节数
  function parseManifest(m) {
    var res = { files: [], marks: [], total: 0 };
    var list = (m && m.files) || [];
    var cum = 0;
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      if (!f || !f.path) continue;
      if (f.path.indexOf('progress/') === 0) {
        res.marks.push({ path: f.path, cum: cum });
      } else {
        res.files.push(f);
        cum += (f.size || 0);
      }
    }
    res.total = cum;
    return res;
  }

  function parseText(text) {
    try {
      var m = JSON.parse(text);
      if (m && m.files && m.files.length) return m;
    } catch (e) {}
    return null;
  }

  function loadManifest(base, localPath, cb) {
    get(base + '/manifest.json', function (ok, text) {
      if (ok) {
        var m = parseText(text);
        if (m) { cb(m); return; }
      }
      // 远程清单拿不到时用包内清单，保证进度条照样能跑
      get(localPath, function (ok2, text2) {
        cb(ok2 ? parseText(text2) : null);
      }, 8000);
    }, 20000);
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
    if (cached) { cb(cached); return; }

    var best = null;
    var pending = CODE_BASES.length;
    CODE_BASES.forEach(function (b) {
      var start = Date.now();
      get(b + '/manifest.json', function (ok, text) {
        if (ok && parseText(text)) {
          var ms = Date.now() - start;
          if (!best || ms < best.ms) best = { base: b, ms: ms };
        }
        if (--pending > 0) return;
        if (best) {
          CODE_BASES = [best.base].concat(CODE_BASES.filter(function (x) {
            return x !== best.base;
          }));
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
    stage = 'code';
    setMsg('正在下载资源中…', true);
    loadManifest(base, 'boot-manifest.json', function (m) {
      if (m) {
        var p = parseManifest(m);
        codeVer = m.version || '';
        codeMarks = p.marks;
        codeTotal = p.total;
      }
      startPoll(codeMarks, codeTotal, 0, 95, codeVer);
      call(base, CODE_TIMEOUT, tryCode);
    });
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
