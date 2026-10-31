(function () {
    if (!window.i18next) return;
    var LANGS = ['zh-CN', 'zh-TW', 'en', 'ru'];

    function bundles() {
        var dict = window.I18N && window.I18N.__dict;
        var out = {};
        LANGS.forEach(function (l) { out[l] = {}; });
        if (!dict) return out;
        Object.keys(dict).forEach(function (k) {
            var row = dict[k];
            if (!row) return;
            for (var i = 0; i < LANGS.length; i++) {
                var v = row[i];
                if (v == null || v === '') v = row[0];
                if (v == null) continue;
                out[LANGS[i]][k] = String(v);
                // 同时以中文原文作为 key，兼容 tr(中文)
                if (row[0] != null && row[0] !== '') out[LANGS[i]][String(row[0])] = String(v);
            }
        });
        return out;
    }

    function sync() {
        var lng = (window.I18N && I18N.getLang && I18N.getLang()) || 'zh-CN';
        try {
            i18next.init({
                lng: lng,
                fallbackLng: 'zh-CN',
                resources: bundles(),
                interpolation: { escapeValue: false },
                returnNull: false,
                initImmediate: false
            });
            window.__I18NEXT_READY__ = true;
        } catch (e) { window.__I18NEXT_READY__ = false; }
    }

    window.__i18nNextSync = sync;
    window.__i18nNextSetLang = function (l) {
        try { if (window.__I18NEXT_READY__) i18next.changeLanguage(l); } catch (e) {}
    };
    sync();
})();
