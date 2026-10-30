/* 全局下载镜像兜底：当 raw.githubusercontent.com 直连失败/被屏蔽时，自动尝试国内可达的 GitHub 加速镜像。
   代码走镜像也安全：boot 有签名清单 + 哈希校验，被篡改会被拒绝进入。 */
(function (w) {
    'use strict';
    if (!w.fetch) return;
    var GH_RAW = 'https://raw.githubusercontent.com/';
    var MIRRORS = [
        'https://ghproxy.net/',
        'https://ghfast.top/',
        'https://gh-proxy.com/',
        'https://ghproxy.cc/',
        'https://gh.llkk.cc/',
        'https://ghp.ci/'
    ];
    function mirrorsFor(url) {
        if (typeof url === 'string' && url.indexOf(GH_RAW) === 0) {
            return MIRRORS.map(function (m) { return m + url; });
        }
        return [];
    }
    var orig = w.fetch.bind(w);
    function tryList(list, i, input, init, lastResp) {
        if (i >= list.length) return lastResp || Promise.reject(new Error('mirror failed'));
        return orig(list[i], init).then(function (r) {
            if (r && r.ok) return r;
            return tryList(list, i + 1, input, init, r);
        }, function () {
            return tryList(list, i + 1, input, init, lastResp);
        });
    }
    w.fetch = function (input, init) {
        var isStr = (typeof input === 'string');
        var url = isStr ? input : (input && input.url);
        return orig(input, init).then(function (r) {
            if (r && r.ok) return r;
            if (!isStr) return r;
            var list = mirrorsFor(url);
            if (!list.length) return r;
            return tryList(list, 0, input, init, r);
        }, function (err) {
            if (!isStr) throw err;
            var list = mirrorsFor(url);
            if (!list.length) throw err;
            return tryList(list, 0, input, init, null);
        });
    };
})(window);
