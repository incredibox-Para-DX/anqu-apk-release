(function () {
  'use strict';

  // 代码：raw 为主线路（jsDelivr 的 @main 会长期缓存旧文件），boot2 用于下载不完整时强制重下
  var CODE_BASES = [
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot',
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot2',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot2'
  ];
  // 物品图 / 收藏室图：仓库 media/ 目录，清单 media/manifest.json
  var MEDIA_BASES = [
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/media',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/media'
  ];
  var MEDIA_KEY = 'ab_media_ver';
  var SHELL_MARK = 'anqu-shell';

  var CODE_TIMEOUT = 120000;
  var MEDIA_TIMEOUT = 600000;
  var PROBE_TIMEOUT = 8000;
  var MARK_TIMEOUT = 6000;
  var TICK = 350;

  var VERIFY_CODE = [
    'index.html',
    'css/main.css',
    'js/script_new.js',
    'js/main.js',
    'xml/items.xml'
  ];

  // 拿不到图片清单时的兜底抽检文件
  var SENTINELS = [
    'images/img_b353ca7f64.png',
    'images/img_a9db6da1e9.png',
    'collect/img_e3e8e2a20c.png'
  ];

  var stage = 'media';
  var mi = 0;
  var ci = 0;
  var done = false;
  var failed = false;
  var timer = null;
  var pollTimer = null;
  var pct = 0;

  var mediaVer = '';
  var mediaFiles = null;
  var mediaMarks = null;
  var mediaTotal = 0;
  var codeMarks = null;
  var codeTotal = 0;

  var markList = null;
  var markIdx = 0;
  var markBase = 0;
  var markSpan = 0;
  var markTotal = 1;
  var markProbing = false;
  var pollGen = 0;

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
    var tip = $('loading-tip');
    if (tip && tip.textContent) tip.textContent = tip.textContent.replace(/\d+%$/, pct + '%');
  }

  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  function enter() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    stopPoll();
    setPct(100);
    setMsg('资源更新完成，正在进入…', true);
    setTimeout(function () {
      // 相对地址；带参数强制 WebView 重新读取内部存储里刚下载好的入口页
      location.replace('index.html?r=' + Date.now());
    }, 350);
  }

  function fail(message) {
    if (done) return;
    clearTimeout(timer);
    stopPoll();
    failed = true;
    var st = $('dl-status');
    if (st) st.className = 'dl-status failed';
    var ov = $('loading-overlay');
    if (ov) ov.className = 'loading-overlay failed';
    setMsg(message || '资源获取失败，点击屏幕重试', false);
  }

  function get(url, cb, timeout, binary) {
    var xhr = new XMLHttpRequest();
    var finished = false;
    function finish(ok, text) {
      if (finished) return;
      finished = true;
      cb(ok, text);
    }
    try {
      xhr.open('GET', url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), true);
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.timeout = timeout || PROBE_TIMEOUT;
      if (binary) xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        finish(xhr.status === 200, binary ? '' : (xhr.responseText || ''));
      };
      xhr.onerror = function () { finish(false, ''); };
      xhr.ontimeout = function () { finish(false, ''); };
      xhr.send();
    } catch (e) {
      finish(false, '');
    }
  }

  // 进度标记文件：APK 里是 "0"，下载后内部存储里是 "1"
  function readMark(path, cb) {
    var xhr = new XMLHttpRequest();
    var finished = false;
    function finish(ok) {
      if (finished) return;
      finished = true;
      cb(ok);
    }
    try {
      xhr.open('GET', path + '?t=' + Date.now(), true);
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.timeout = MARK_TIMEOUT;
      xhr.onload = function () {
        finish(xhr.status === 200 && String(xhr.responseText || '').replace(/\s/g, '') === '1');
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

  function startPoll(list, total, base, span) {
    stopPoll();
    markList = list || [];
    markTotal = total > 0 ? total : 1;
    markBase = base;
    markSpan = span;
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
      readMark(markList[idx].path, function (ok) {
        if (done || gen !== pollGen) { markProbing = false; return; }
        if (!ok) { markProbing = false; return; }
        markIdx = idx + 1;
        var bytes = markList[idx].cum;
        setPct(markBase + (bytes / markTotal) * markSpan);
        if (markIdx >= markList.length) { markProbing = false; stopPoll(); return; }
        step();
      });
    })();
  }

  function probe(paths, binary, cb) {
    var i = 0;
    function next() {
      if (done) return;
      if (i >= paths.length) { cb(true); return; }
      get(paths[i++], function (ok) {
        if (!ok) { cb(false); return; }
        next();
      }, PROBE_TIMEOUT, binary);
    }
    next();
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

  function mediaSample() {
    if (!mediaFiles || !mediaFiles.length) return SENTINELS;
    var n = mediaFiles.length;
    var idx = [0, Math.floor(n * 0.15), Math.floor(n * 0.3), Math.floor(n * 0.45),
               Math.floor(n * 0.6), Math.floor(n * 0.75), Math.floor(n * 0.9), n - 1];
    var out = [];
    for (var i = 0; i < idx.length; i++) {
      var f = mediaFiles[idx[i]];
      if (f && f.path && out.indexOf(f.path) < 0) out.push(f.path);
    }
    return out;
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

  function fetchManifest(base, cb) {
    get(base + '/manifest.json', function (ok, text) {
      if (!ok) { cb(null); return; }
      try {
        var m = JSON.parse(text);
        if (m && m.version && m.files && m.files.length) { cb(m); return; }
      } catch (e) {}
      cb(null);
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

  function tryMedia() {
    if (done) return;
    if (mi >= MEDIA_BASES.length) {
      setMsg('图片下载失败，先进入应用…', false);
      setTimeout(tryCode, 600);
      return;
    }
    stage = 'media';
    setMsg('正在下载资源中…', true);
    startPoll(mediaMarks, mediaTotal, 0, 95);
    call(MEDIA_BASES[mi++], MEDIA_TIMEOUT, tryMedia);
  }

  function tryCode() {
    if (done) return;
    if (ci >= CODE_BASES.length) { fail('资源获取失败，点击屏幕重试'); return; }
    var base = CODE_BASES[ci++];
    stage = 'code';
    setMsg('正在下载资源中…', true);
    fetchManifest(base, function (m) {
      if (m) {
        var p = parseManifest(m);
        codeMarks = p.marks;
        codeTotal = p.total;
      }
      startPoll(codeMarks, codeTotal, 95, 5);
      call(base, CODE_TIMEOUT, tryCode);
    });
  }

  function start() {
    if (done) return;
    stage = 'media';
    mi = 0;
    ci = 0;
    pct = 0;
    setPct(0);
    setMsg('正在校验资源…', false);

    fetchManifest(MEDIA_BASES[0], function (m1) {
      if (m1) { applyMediaManifest(m1); afterMediaManifest(); return; }
      fetchManifest(MEDIA_BASES[1], function (m2) {
        if (m2) applyMediaManifest(m2);
        afterMediaManifest();
      });
    });

    function applyMediaManifest(m) {
      var p = parseManifest(m);
      mediaVer = m.version;
      mediaFiles = p.files;
      mediaMarks = p.marks;
      mediaTotal = p.total;
    }

    function afterMediaManifest() {
      if (done) return;
      var local = lsGet(MEDIA_KEY);
      probe(mediaSample(), true, function (present) {
        if (done) return;
        var need = mediaVer ? (local !== mediaVer) : !present;
        if (need) { tryMedia(); return; }
        if (mediaVer) lsSet(MEDIA_KEY, mediaVer);
        setPct(95);
        tryCode();
      });
    }
  }

  window.__onUpdateCheckResult = function (res) {
    if (done) return;
    clearTimeout(timer);
    stopPoll();
    var updated = !!(res && res.updated);

    if (stage === 'media') {
      probe(mediaSample(), true, function (present) {
        if (present) {
          if (mediaVer) lsSet(MEDIA_KEY, mediaVer);
          setPct(95);
          tryCode();
        } else {
          tryMedia();
        }
      });
      return;
    }

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

  // 失败后点屏幕任意位置重试（保持原加载页外观，不额外加按钮）
  document.addEventListener('click', function () {
    if (!failed || done) return;
    failed = false;
    var st = $('dl-status');
    if (st) st.className = 'dl-status';
    var ov = $('loading-overlay');
    if (ov) ov.className = 'loading-overlay';
    mi = 0;
    ci = 0;
    start();
  });

  // 首次点击开启 CG 声音（与原登录页一致）
  var video = $('cg-video');
  if (video) {
    var soundOn = false;
    var enableSound = function () {
      if (soundOn) return;
      soundOn = true;
      try {
        video.muted = false;
        video.volume = 1;
        video.play();
      } catch (e) {}
    };
    document.addEventListener('touchstart', enableSound, { once: true });
    document.addEventListener('click', enableSound, { once: true });
  }

  start();
})();
