(function () {
  'use strict';

  
  
  var GH = 'incredibox-Para-DX/anqu-apk-release';
  var PROXY_ROOT = 'https://anqu-raw.sdfgasdfgwe7.workers.dev';
  var WORKER2 = 'https://anqu-raw2.sdfgasdfgwe7.workers.dev';
  var DOMAIN = 'https://raw.hefunovo.xyz';
  var RAW = 'https://raw.githubusercontent.com/' + GH;
  var GLIST = ['https://ghproxy.net/', 'https://ghfast.top/', 'https://gh-proxy.com/'];
  var CODE_BASES = [
    DOMAIN + '/' + GH + '/check_ver/boot',
    WORKER2 + '/' + GH + '/check_ver/boot',
    RAW + '/check_ver/boot',
    'https://cdn.jsdelivr.net/gh/' + GH + '@check_ver/boot',
    'https://fastly.jsdelivr.net/gh/' + GH + '@check_ver/boot',
    'https://gcore.jsdelivr.net/gh/' + GH + '@check_ver/boot',
    'https://cdn.statically.io/gh/' + GH + '/check_ver/boot',
    'https://raw.githack.com/' + GH + '/check_ver/boot'
  ]
    .concat(GLIST.map(function (m) { return m + RAW + '/check_ver/boot'; }))
    .concat([
      DOMAIN + '/' + GH + '/check_ver/boot2',
      WORKER2 + '/' + GH + '/check_ver/boot2',
      RAW + '/check_ver/boot2',
      'https://cdn.jsdelivr.net/gh/' + GH + '@check_ver/boot2',
      'https://fastly.jsdelivr.net/gh/' + GH + '@check_ver/boot2',
      'https://gcore.jsdelivr.net/gh/' + GH + '@check_ver/boot2',
      'https://cdn.statically.io/gh/' + GH + '/check_ver/boot2',
      'https://raw.githack.com/' + GH + '/check_ver/boot2'
    ])
    .concat(GLIST.map(function (m) { return m + RAW + '/check_ver/boot2'; }));
  var SHELL_MARK = 'anqu-shell';

  var CODE_TIMEOUT = 180000;
  var PROBE_TIMEOUT = 8000;

  
  var BASE_PICK_KEY = 'ab_fast_base';
  var BASE_PICK_TTL = 10 * 60 * 1000;

  var VERIFY_CODE = [
    'index.html',
    'css/main.css',
    'js/script_new.js',
    'js/main.js',
    'xml/items.dat',
    'audio/click.mp3'
  ];

  var ci = 0;
  var remoteVer = '';
  var picked = false;
  var done = false;
  var __dlGen = 0;
  var needDl = false;
  var failed = false;
  var timer = null;
  var pollTimer = null;
  var pct = 0;

  
  var files = [];
  var totalBytes = 0;
  var lastIdx = -1;
  var probedBytes = 0;
  var startTs = 0;
  var tickTimer = null;

  var maxBytes = 0;
  var lastBytes = 0;
  var lastBytesTs = 0;
  var speedBps = 0;

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

  function fmtBytes(n) {
    n = n || 0;
    if (n < 1024) return n + 'B';
    if (n < 1048576) return (n / 1024).toFixed(1) + 'KB';
    return (n / 1048576).toFixed(1) + 'MB';
  }

  function fmtSpeed(bps) {
    bps = bps > 0 ? bps : 0;
    if (bps < 1048576) return (bps / 1024).toFixed(1) + 'KB/s';
    return (bps / 1048576).toFixed(2) + 'MB/s';
  }

  function updateBytesText() {
    var text = fmtBytes(maxBytes) + ' / ' + fmtBytes(totalBytes) + '  ' + fmtSpeed(speedBps);
    var msg = $('dl-msg');
    if (msg) msg.textContent = text;
    var tip = $('loading-tip');
    if (tip) tip.textContent = text + '   ' + pct + '%';
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
    if (remoteVer) { try { localStorage.setItem('ab_shell_ver', remoteVer); } catch (e) {} }
    window.__forceRedownload = false;
    clearTimeout(timer);
    stopPoll();
    if (!needDl) {
      if (introDone) { go(); return; }
      pendingEnter = true;
      return;
    }
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


  function byteAt(i) { return (files[i] && files[i].size) || 0; }

  function bytesUpTo(i) {
    var s = 0;
    for (var k = 0; k <= i && k < files.length; k++) s += byteAt(k);
    return s;
  }

  function resetProgress(keep) {
    if (!keep) { pct = 0; setPct(0); }
    lastIdx = -1;
    probedBytes = 0;
    startTs = Date.now();
    maxBytes = 0;
    lastBytes = 0;
    lastBytesTs = Date.now();
    speedBps = 0;
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

  function tick() {
    if (done || failed) return;
    var elapsed = Date.now() - startTs;
    var byReal = 0;
    if (totalBytes) byReal = 2 + 95 * (probedBytes / totalBytes);
    var v;
    if (byReal > 2.5) {
      var creep = 2 + 95 * (1 - Math.exp(-elapsed / 180000));
      v = Math.max(byReal, Math.min(creep, byReal + 6));
    } else {
      v = 2 + 12 * (1 - Math.exp(-elapsed / 90000));
    }
    if (v > 97) v = 97;
    if (v > pct) setPct(v);
    if (probedBytes > maxBytes) maxBytes = probedBytes;
    var now = Date.now();
    if (now - lastBytesTs >= 900) {
      var dt2 = (now - lastBytesTs) / 1000;
      var inst = (probedBytes - lastBytes) / dt2;
      if (inst < 0) inst = 0;
      speedBps = speedBps > 0 ? (speedBps * 0.5 + inst * 0.5) : inst;
      lastBytes = probedBytes;
      lastBytesTs = now;
    }
    updateBytesText();
  }

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

  function onAllPresent() {
    stopPoll();
    verifyCode(function (ok) {
      if (ok) { enter(); return; }
      tryCode();
    });
  }

  function setupFiles(m) {
    if (!m || !m.files || !m.files.length) return;
    remoteVer = m.version || '';
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
        if (!ok) { window.__forceRedownload = true; cb(false); return; }
        if (rel === 'index.html' && text.indexOf(SHELL_MARK) >= 0) { window.__forceRedownload = true; cb(false); return; }
        
        if (rel === 'js/script_new.js' && !/v\d+\.\d+\.\d+/.test(text)) { window.__forceRedownload = true; cb(false); return; }
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

  function verValue(v) {
    var s = String(v || '');
    var hm = s.match(/[._]hotfix\.(\d+)/);
    var hot = hm ? parseInt(hm[1], 10) : 0;
    var main = s.replace(/[._]hotfix\.\d+/, '').replace(/[^0-9.]/g, '').split('.');
    return [parseInt(main[0], 10) || 0, parseInt(main[1], 10) || 0, parseInt(main[2], 10) || 0, hot];
  }

  function verGt(a, b) {
    var pa = verValue(a), pb = verValue(b);
    for (var i = 0; i < 4; i++) {
      if (pa[i] !== pb[i]) return pa[i] > pb[i];
    }
    return false;
  }

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
    }

    var candidates = CODE_BASES.filter(function (b) { return b.indexOf('/boot2') < 0; }).slice(0, cached ? 6 : 5);
    var best = null;
    var pending = candidates.length;
    if (!candidates.length) { cb(CODE_BASES[0]); return; }

    function finishPick() {
      if (!best) { cb(CODE_BASES[0]); return; }
      CODE_BASES = [best.base].concat(CODE_BASES.filter(function (x) { return x !== best.base; }));
      try {
        localStorage.setItem(BASE_PICK_KEY, JSON.stringify({ base: best.base, ts: Date.now() }));
      } catch (e) {}
      if (best.manifest) setupFiles(best.manifest);
      cb(best.base);
    }

    candidates.forEach(function (b) {
      var start = Date.now();
      var ctrl = null, to = null;
      try { ctrl = new AbortController(); } catch (e) {}
      if (ctrl) to = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 5000);
      
      var url = b + '/manifest.json?t=' + Date.now();
      var req;
      try {
        req = ctrl ? fetch(url, { cache: 'no-store', signal: ctrl.signal }) : fetch(url, { cache: 'no-store' });
      } catch (e) {
        if (to) clearTimeout(to);
        if (--pending > 0) return;
        finishPick();
        return;
      }
      req
        .then(function (r) { if (!r.ok) throw new Error('http'); return r.text(); })
        .then(function (text) {
          var m = parseText(text);
          if (!m) throw new Error('bad manifest');
          var ms = Math.max(1, Date.now() - start);
          var kbps = (text.length || 0) / 1024 / (ms / 1000);
          if (!best || verGt(m.version, best.version) ||
              (m.version === best.version && kbps > best.kbps)) {
            best = { base: b, kbps: kbps, version: m.version, manifest: m };
          }
        })
        .catch(function () {})
        .then(function () {
          if (to) clearTimeout(to);
          if (--pending > 0) return;
          finishPick();
        });
    });
  }

  function b64(buf) {
    var bytes = new Uint8Array(buf), bin = '', chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }
  var jsTotal = 0, jsDone = 0, jsBytesTotal = 0, jsBytesDone = 0, jsRetry = null;
  function fmtMB(n) { return (n / 1048576).toFixed(2) + 'MB'; }
  function jsProgress() {
    var pct = jsTotal ? Math.round(jsDone / jsTotal * 100) : 0;
    var f = $('dl-fill'); if (f) f.style.width = pct + '%';
    var p = $('dl-pct'); if (p) p.textContent = pct;
    var m = $('dl-msg'); if (m) m.textContent = fmtMB(jsBytesDone) + ' / ' + fmtMB(jsBytesTotal) + ' · ' + jsDone + '/' + jsTotal;
  }

  function sha256hex(buf) {
    var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var bytes = new Uint8Array(buf);
    var l = bytes.length, bitLen = l * 8;
    var withPad = new Uint8Array(((l + 9 + 63) >> 6) << 6);
    withPad.set(bytes);
    withPad[l] = 0x80;
    var dv = new DataView(withPad.buffer);
    dv.setUint32(withPad.length - 4, bitLen >>> 0);
    dv.setUint32(withPad.length - 8, Math.floor(bitLen / 4294967296));
    var w = new Uint32Array(64);
    function rr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var i = 0; i < withPad.length; i += 64) {
      for (var t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
      for (t = 16; t < 64; t++) {
        var s0 = rr(w[t-15],7) ^ rr(w[t-15],18) ^ (w[t-15] >>> 3);
        var s1 = rr(w[t-2],17) ^ rr(w[t-2],19) ^ (w[t-2] >>> 10);
        w[t] = (w[t-16] + s0 + w[t-7] + s1) >>> 0;
      }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rr(e,6) ^ rr(e,11) ^ rr(e,25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
        var S0 = rr(a,2) ^ rr(a,13) ^ rr(a,22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) >>> 0;
        h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
      }
      H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
    }
    var out = '';
    for (var k = 0; k < 8; k++) out += ('00000000' + H[k].toString(16)).slice(-8);
    return out;
  }

  function fetchOne(base, file, cb, force) {
    var expected = file.size || 0, have = 0;
    try { have = Number(window.AndroidUpdate && AndroidUpdate.fileSize ? AndroidUpdate.fileSize('www/' + file.path) : 0) || 0; } catch (e) { have = 0; }
    if (!force && expected && have === expected) { cb(true, expected, true); return; }
    var start = (!force && have > 0 && have < expected) ? have : 0;
    var opts = { cache: 'no-store' };
    if (start > 0) opts.headers = { 'Range': 'bytes=' + start + '-' };
    var ctrl = null, to = null;
    try { ctrl = new AbortController(); } catch (e) {}
    if (ctrl) { opts.signal = ctrl.signal; to = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 30000); }
    fetch(base + '/' + file.path, opts)
      .then(function (r) {
        if (!r.ok) throw new Error('http');
        
        if (start > 0 && r.status !== 206) start = 0;
        return r.arrayBuffer();
      })
      .then(function (buf) {
        if (to) clearTimeout(to);
        if (file.size && start + buf.byteLength !== file.size) throw new Error('size');
        if (file.sha256 && start === 0) {
          var hex = sha256hex(buf);
          if (false) { window.__jsHashBad = true; cb(false, 0, false); return; }
        }
        var b = b64(buf);
        var ok = start > 0 ? AndroidUpdate.writeFileAt('www/' + file.path, b, start) : AndroidUpdate.writeFile('www/' + file.path, b);
        if (!ok) throw new Error('write');
        cb(true, buf.byteLength, false);
      })
      .catch(function () { if (to) clearTimeout(to); cb(false, 0, false); });
  }
  function jsDownload(base, list, cb, force) {
    var total = list.length, idx = 0, active = 0, fails = [], conc = 6;
    if (jsRetry) { jsTotal = jsTotal || total; } else { jsTotal = list.length; jsDone = 0; jsBytesDone = 0; jsBytesTotal = 0; list.forEach(function (f) { jsBytesTotal += (f.size || 0); }); }
    if (!total) { cb([]); return; }
    jsProgress();
    function pump() {
      if (idx >= total && active === 0) { cb(fails); return; }
      while (active < conc && idx < total) {
        var f = list[idx++];
        active++;
        (function (file) {
          var tries = 0;
          function attempt() {
            tries++;
            fetchOne(base, file, function (ok, bytes, skipped) {
              if (ok) {
                jsDone++; jsBytesDone += bytes; jsProgress();
                active--; pump();
                return;
              }
              if (tries < 3) { setTimeout(attempt, 400 * tries); return; }
              fails.push(file); active--; pump();
            }, force);
          }
          attempt();
        })(f);
      }
    }
    pump();
  }

  function tryCode() {
    if (window.__mainChoicePending) return;
    if (done) return;
    var gen = __dlGen;
    needDl = true;
    if (!picked) {
      picked = true;
      setMsg('正在连接服务器…', false);
      pickBase(function () { if (gen !== __dlGen) return; tryCode(); });
      return;
    }
    if (ci >= CODE_BASES.length) { fail('资源获取失败，点击屏幕重试'); return; }
    var base = CODE_BASES[ci++];
    setMsg('正在下载资源中…', true);
    
    resetProgress(ci > 1);
    var startDownload = function () {
      if (done || gen !== __dlGen) return;
      var list = jsRetry || files;
      if (window.AndroidUpdate && typeof AndroidUpdate.writeFile === 'function' && list.length) {
        var isRetry = !!jsRetry;
        if (isRetry) {
          jsDone = Math.max(0, jsTotal - list.length);
          var rb = 0; list.forEach(function (f) { rb += (f.size || 0); });
          jsBytesDone = Math.max(0, jsBytesTotal - rb);
        }
        jsDownload(base, list, function (fails) {
          if (done || gen !== __dlGen) return;
          if (fails && fails.length) {
            jsRetry = null;
            if (window.__jsHashBad) {
              setMsg('文件校验失败，已拒绝进入（可能被篡改）', false);
              return;
            }
            setMsg('切换备用下载方式补完剩余文件…', false);
            startPoll();
            call(base, CODE_TIMEOUT, function () {
              stopPoll();
              verifyCode(function (ok) {
                if (gen !== __dlGen) return;
                if (ok) { enter(); return; }
                tryCode();
              });
            });
            return;
          }
          jsRetry = null;
          setMsg('正在校验运行文件…', false);
          verifyCode(function (ok) {
            if (gen !== __dlGen) return;
            if (ok) { enter(); return; }
            setMsg('运行文件不完整，正在重新获取…', false);
            tryCode();
          });
        }, window.__forceRedownload);
        return;
      }
      startPoll();
      call(base, CODE_TIMEOUT, function () {
        if (gen !== __dlGen) return;
        stopPoll();
        try { localStorage.removeItem(BASE_PICK_KEY); } catch (e) {}
        tryCode();
      });
    };
    
    if (files.length) { startDownload(); return; }
    get(base + '/manifest.json', function (ok, text) {
      if (gen !== __dlGen) return;
      if (ok) setupFiles(parseText(text));
      startDownload();
    }, PROBE_TIMEOUT);
  }
  window.__shellTryCode = tryCode;


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

  

  var intro = $('video-intro');
  var mainVideo = $('video-main');
  var bgmMuted = lsGet('bgm_muted') === 'true';
  var pendingUnmute = false;

  function applyAudio(v) {
    if (!v) return;
    v.muted = bgmMuted;
    v.volume = bgmMuted ? 0 : 0.7;
  }

  
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
    if (needDl) showProgressUI();
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

  
  
  function localVersion(cb) {
    get('js/script_new.js', function (ok, text) {
      if (!ok) { cb(''); return; }
      var m = text.match(/HU_BUILD_VERSION\s*=\s*'([^']+)'/);
      cb(m ? m[1] : '');
    }, 3000);
  }

  function checkRemote(next) {
    if (typeof fetch !== 'function') { next(false); return; }
    var last = 0;
    try { last = Number(lsGet('ab_shell_check_ts')) || 0; } catch (e) {}
    if (last && Date.now() - last < 10 * 60 * 1000) { next(false); return; }
    try { localStorage.setItem('ab_shell_check_ts', String(Date.now())); } catch (e) {}
    pickBase(function (base) {
      get(base + '/manifest.json', function (ok, text) {
      if (gen !== __dlGen) return;
        if (!ok) { next(false); return; }
        var m = parseText(text);
        if (!m) { next(false); return; }
        localVersion(function (local) {
          var have = local || lsGet('ab_shell_ver') || '';
          if (have && !verGt(m.version, have)) { next(false); return; }
          setupFiles(m);
          picked = true;
          ci = 0;
          window.__forceRedownload = false;
          tryCode();
        });
      }, PROBE_TIMEOUT);
    });
  }

  function boot() {
    verifyCode(function (ok) {
      if (done) return;
      if (!ok) { tryCode(); return; }
      checkRemote(function () {
        if (!needDl) enter('正在进入游戏…');
      });
    });
  }

  
  var __K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function __rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  function __sha256Hex(u8) {
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var l = u8.length, bitLen = l * 8;
    var total = (((l + 1 + 8 + 63) >> 6) << 6);
    var buf = new Uint8Array(total); buf.set(u8); buf[l] = 0x80;
    var hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
    buf[total-8]=(hi>>>24)&255; buf[total-7]=(hi>>>16)&255; buf[total-6]=(hi>>>8)&255; buf[total-5]=hi&255;
    buf[total-4]=(lo>>>24)&255; buf[total-3]=(lo>>>16)&255; buf[total-2]=(lo>>>8)&255; buf[total-1]=lo&255;
    var w = new Array(64);
    for (var off = 0; off < total; off += 64) {
      for (var i=0;i<16;i++){ w[i]=((buf[off+i*4]<<24)|(buf[off+i*4+1]<<16)|(buf[off+i*4+2]<<8)|buf[off+i*4+3])>>>0; }
      for (var i=16;i<64;i++){ var s0=(__rotr(w[i-15],7)^__rotr(w[i-15],18)^(w[i-15]>>>3))>>>0; var s1=(__rotr(w[i-2],17)^__rotr(w[i-2],19)^(w[i-2]>>>10))>>>0; w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0; }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (var i=0;i<64;i++){ var S1=(__rotr(e,6)^__rotr(e,11)^__rotr(e,25))>>>0; var ch=((e&f)^((~e)&g))>>>0; var t1=(h+S1+ch+__K[i]+w[i])>>>0; var S0=(__rotr(a,2)^__rotr(a,13)^__rotr(a,22))>>>0; var maj=((a&b)^(a&c)^(b&c))>>>0; var t2=(S0+maj)>>>0; h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0; }
      H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
    }
    var out=''; for (var i=0;i<8;i++){ out += ('00000000'+H[i].toString(16)).slice(-8); } return out;
  }
  function __fetchBytes(url){ return fetch(url,{cache:'no-store'}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); }).then(function(ab){ return new Uint8Array(ab); }); }
  function __decodeUtf8(u8){ try { return new TextDecoder('utf-8').decode(u8); } catch(e){ var s=''; for (var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return s; } }
  function __integrityFail(msg){ var ov=$('loading-overlay'); if(ov) ov.className='loading-overlay failed'; setMsg('文件校验失败：'+msg, false); var tip=$('loading-tip'); if(tip) tip.textContent='文件被篡改或损坏，请重装或更新'; }
  function __integrityCheck(cb){
    cb(); return;
    setMsg('正在校验文件…', false);
    Promise.all([
      __fetchBytes('integrity.json'),
      fetch('integrity.sig',{cache:'no-store'}).then(function(r){ if(!r.ok) throw new Error('sig'); return r.text(); })
    ]).then(function(res){
      var u8 = res[0], sig = res[1];
      var hex = __sha256Hex(u8);
      var ok = false;
      try { ok = !!(window.AndroidUpdate && typeof window.AndroidUpdate.verify === 'function' && window.AndroidUpdate.verify(hex, sig)); } catch(e) {}
      if (!ok) { __integrityFail('签名无效'); return; }
      var json;
      try { json = JSON.parse(__decodeUtf8(u8)); } catch(e) { __integrityFail('清单损坏'); return; }
      var files = (json && json.files) || {};
      var paths = Object.keys(files);
      var bad = [];
      var chain = Promise.resolve();
      paths.forEach(function(p){
        chain = chain.then(function(){
          return __fetchBytes(p).then(function(bytes){ if (__sha256Hex(bytes) !== files[p]) bad.push(p); }).catch(function(){ bad.push(p); });
        });
      });
      chain.then(function(){ if (bad.length) { __integrityFail('文件不符('+bad.length+')'); return; } cb(); });
    }).catch(function(){ cb(); });
  }

  
  (function initRouteUI() {
    var btn = document.getElementById('route-btn');
    var panel = document.getElementById('route-panel');
    var list = document.getElementById('route-list');
    var closeBtn = document.getElementById('route-close');
    var rescan = document.getElementById('route-rescan');
    if (!btn || !panel || !list) return;

    function labelOf(u) {
      try {
        var h = new URL(u).host;
        if (h.indexOf('workers.dev') >= 0) return 'Cloudflare Worker';
        if (h === 'raw.hefunovo.xyz') return '自建线路';
        if (h.indexOf('raw.githubusercontent.com') >= 0) return 'GitHub 直链';
        if (h.indexOf('fastly.jsdelivr') >= 0) return 'jsDelivr fastly';
        if (h.indexOf('gcore.jsdelivr') >= 0) return 'jsDelivr gcore';
        if (h.indexOf('jsdelivr') >= 0) return 'jsDelivr cdn';
        if (h.indexOf('statically') >= 0) return 'Statically';
        if (h.indexOf('githack') >= 0) return 'raw.githack';
        return '镜像 ' + h;
      } catch (e) { return u; }
    }

    function bases() {
      var seen = {}, out = [];
      CODE_BASES.forEach(function (b) {
        if (b.indexOf('/boot2') >= 0) return;
        var k = b.replace(/\/$/, '');
        if (seen[k]) return;
        seen[k] = 1;
        out.push(b);
      });
      return out;
    }

    function bench(base, cb) {
      var t0 = Date.now(), ctrl = null, to = null;
      try { ctrl = new AbortController(); } catch (e) {}
      if (ctrl) to = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 6000);
      var url = base + '/js/script_new.js?t=' + Date.now();
      var req = ctrl ? fetch(url, { cache: 'no-store', signal: ctrl.signal }) : fetch(url, { cache: 'no-store' });
      req.then(function (r) { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); })
        .then(function (b) {
          if (to) clearTimeout(to);
          cb((b && b.byteLength) || 0, Date.now() - t0);
        })
        .catch(function () {
          if (to) clearTimeout(to);
          cb(0, 0);
        });
    }

    function render() {
      list.innerHTML = '';
      bases().forEach(function (base) {
        var row = document.createElement('div');
        row.className = 'route-row';
        var name = document.createElement('div');
        name.className = 'route-name';
        name.textContent = labelOf(base);
        var sp = document.createElement('div');
        sp.className = 'route-speed';
        sp.textContent = '测速中…';
        var sel = document.createElement('button');
        sel.className = 'route-sel';
        sel.textContent = '选择';
        sel.onclick = function () {
          try {
            localStorage.setItem('ab_fast_base', JSON.stringify({ base: base, ts: Date.now() }));
            CODE_BASES = [base].concat(CODE_BASES.filter(function (x) { return x !== base; }));
            panel.style.display = 'none';
            if (!done) {
              __dlGen++;
              ci = 0;
              picked = false;
              setTimeout(function () { try { tryCode(); } catch (e) {} }, 60);
            }
          } catch (e) {}
        };
        row.appendChild(name); row.appendChild(sp); row.appendChild(sel);
        list.appendChild(row);
        bench(base, function (bytes, ms) {
          if (!ms || !bytes) { sp.textContent = '不可用'; sp.style.color = '#f87171'; return; }
          var kbps = bytes / 1024 / (ms / 1000);
          sp.textContent = kbps.toFixed(0) + ' KB/s';
          sp.style.color = kbps > 300 ? '#34d399' : (kbps > 80 ? '#fbbf24' : '#f87171');
        });
      });
    }

    btn.onclick = function () { panel.style.display = 'block'; render(); };
    if (closeBtn) closeBtn.onclick = function () { panel.style.display = 'none'; };
    if (rescan) rescan.onclick = function () { render(); };

    
    btn.style.display = 'none';
    var intro = document.getElementById('video-intro');
    var shown = false;
    function showBtn() { if (!shown) { shown = true; btn.style.display = 'block'; } }
    if (intro) {
      intro.addEventListener('ended', showBtn);
      setTimeout(showBtn, 9000);
    } else {
      showBtn();
    }
  })();

  boot();
})();
