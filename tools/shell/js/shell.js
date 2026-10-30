(function () {
  'use strict';

  // 代码线路：私链 GitHub p-i18n（Worker 反代 → raw → jsDelivr 多 CDN 兜底）
  // boot2 仅在 boot 下载不完整时追加尝试
  var GH = 'incredibox-Para-DX/anqu-apk-release';
  var PROXY_ROOT = 'https://anqu-raw.sdfgasdfgwe7.workers.dev';
  var COS = 'https://anqu-1372693228.cos.ap-guangzhou.myqcloud.com';
  var RAW = 'https://raw.githubusercontent.com/' + GH;
  var GLIST = ['https://ghproxy.net/', 'https://ghfast.top/', 'https://gh-proxy.com/'];
  var CODE_BASES = [
    COS + '/boot',
    PROXY_ROOT + '/' + GH + '/p-i18n/boot',
    RAW + '/p-i18n/boot',
    'https://cdn.jsdelivr.net/gh/' + GH + '@p-i18n/boot',
    'https://fastly.jsdelivr.net/gh/' + GH + '@p-i18n/boot',
    'https://gcore.jsdelivr.net/gh/' + GH + '@p-i18n/boot'
  ]
    .concat(GLIST.map(function (m) { return m + RAW + '/p-i18n/boot'; }))
    .concat([
      COS + '/boot2',
      PROXY_ROOT + '/' + GH + '/p-i18n/boot2',
      RAW + '/p-i18n/boot2',
      'https://cdn.jsdelivr.net/gh/' + GH + '@p-i18n/boot2',
      'https://fastly.jsdelivr.net/gh/' + GH + '@p-i18n/boot2'
    ])
    .concat(GLIST.map(function (m) { return m + RAW + '/p-i18n/boot2'; }));
  var SHELL_MARK = 'anqu-shell';

  var CODE_TIMEOUT = 180000;
  var PROBE_TIMEOUT = 8000;

  // 测速结果缓存（1 小时）：上次最快的线路优先，省掉重复测速
  var BASE_PICK_KEY = 'ab_fast_base';
  var BASE_PICK_TTL = 10 * 60 * 1000;

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
  var needDl = false;
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

  // 进度：以“已完成文件字节”为主导（真实），仅叠加极小蠕动避免长时间不动
  function tick() {
    if (done || failed) return;
    var elapsed = Date.now() - startTs;
    var byReal = 0;
    if (totalBytes) byReal = 2 + 95 * (probedBytes / totalBytes);
    var v;
    if (byReal > 2.5) {
      // 有真实字节后：真实值主导，蠕动最多只领先真实 6%
      var creep = 2 + 95 * (1 - Math.exp(-elapsed / 180000));
      v = Math.max(byReal, Math.min(creep, byReal + 6));
    } else {
      // 尚未落盘任何文件：极慢蠕动，避免卡在 0%
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
        // 版本兼容：接受 vX.Y.Z 与 vX.Y.Z_hotfix.N 两种格式
        if (rel === 'js/script_new.js' && !/v\d+\.\d+\.\d+/.test(text)) { cb(false); return; }
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
    needDl = true;
    if (!picked) {
      picked = true;
      setMsg('正在连接服务器…', false);
      pickBase(function () { tryCode(); });
      return;
    }
    if (ci >= CODE_BASES.length) { fail('资源获取失败，点击屏幕重试'); return; }
    var base = CODE_BASES[ci++];
    setMsg('正在下载资源中…', true);
    // 首次尝试才归零；线路重试时保留已到达的进度，避免“回退0%”
    resetProgress(ci > 1);
    var startDownload = function () {
      if (done) return;
      startPoll();
      call(base, CODE_TIMEOUT, function () {
        stopPoll();
        try { localStorage.removeItem(BASE_PICK_KEY); } catch (e) {}
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

  // ---- 完整性校验：清单签名(原生 RSA) + 逐文件 SHA-256 ----
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
    }).catch(function(){ __integrityFail('读取失败'); });
  }

  boot();
})();
