

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
        if (typeof url !== 'string' || url.indexOf(GH_RAW) !== 0) return [];
        var rest = url.slice(GH_RAW.length);
        var parts = rest.split('/');
        if (parts.length >= 3) {
            var user = parts[0], repo = parts[1], branch = parts[2], tail = parts.slice(3).join('/');
            var out = [
                'https://raw.hefunovo.xyz/' + user + '/' + repo + '/' + branch + '/' + tail,
                'https://anqu-raw2.sdfgasdfgwe7.workers.dev/' + user + '/' + repo + '/' + branch + '/' + tail,
                'https://cdn.statically.io/gh/' + user + '/' + repo + '/' + branch + '/' + tail,
                'https://raw.githack.com/' + user + '/' + repo + '/' + branch + '/' + tail,
                'https://cdn.jsdelivr.net/gh/' + user + '/' + repo + '@' + branch + '/' + tail
            ];
            MIRRORS.forEach(function (m) { out.push(m + url); });
            return out;
        }
        return MIRRORS.map(function (m) { return m + url; });
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
