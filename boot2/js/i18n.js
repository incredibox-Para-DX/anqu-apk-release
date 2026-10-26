/* ============================================================
 * i18n.js · 暗区保险模拟 语言切换
 * 词表格式：key → [zh-CN, zh-TW, en, ru]，缺项回退 zh-CN（第 0 项）
 * 用法：I18N.t('key', fallback?)  取当前语言文案
 * 切换：I18N.setLang('en')  → 持久化 + 触发 I18N.onChange 重渲染
 * ============================================================ */
(function () {
    var LANG_KEY = 'ab_app_lang';
    var LANGS = ['zh-CN', 'zh-TW', 'en', 'ru'];
    var LANG_INDEX = { 'zh-CN': 0, 'zh-TW': 1, 'en': 2, 'ru': 3 };

    // key → [zh-CN, zh-TW, en, ru]
    var M = {
        /* ---------- 顶栏 / 通用 ---------- */
        app_title: ['暗区突围保险模拟', '暗區突圍保險模擬', 'Arena Breakout Safebox', 'Симулятор страхового ящика'],
        loading: ['加载中...', '載入中...', 'Loading...', 'Загрузка...'],
        loading_dots: ['加载中…', '載入中…', 'Loading…', 'Загрузка…'],
        preparing: ['准备中...', '準備中...', 'Preparing...', 'Подготовка...'],
        save: ['保存', '儲存', 'Save', 'Сохранить'],
        cancel: ['取消', '取消', 'Cancel', 'Отмена'],
        confirm: ['确认', '確認', 'OK', 'ОК'],
        back: ['返回', '返回', 'Back', 'Назад'],
        close: ['关闭', '關閉', 'Close', 'Закрыть'],
        delete_: ['删除', '刪除', 'Delete', 'Удалить'],
        reset: ['重置', '重置', 'Reset', 'Сбросить'],
        switch_: ['切换', '切換', 'Switch', 'Переключить'],
        refresh: ['刷新', '刷新', 'Refresh', 'Обновить'],
        import_: ['导入', '匯入', 'Import', 'Импорт'],
        open: ['打开', '開啟', 'Open', 'Открыть'],

        /* ---------- 侧边栏分组 ---------- */
        nav_more: ['更多功能', '更多功能', 'More', 'Ещё'],
        sec_personal: ['个人数据', '個人數據', 'Profile', 'Профиль'],
        sec_gm: ['GM Debug', 'GM Debug', 'GM Debug', 'GM Debug'],
        sec_other: ['其他功能', '其他功能', 'Other', 'Другое'],
        sec_music: ['背景音乐', '背景音樂', 'Music', 'Музыка'],
        sec_settings: ['更多设置', '更多設置', 'Settings', 'Настройки'],
        sec_info: ['更多信息', '更多信息', 'More Info', 'Подробнее'],

        /* ---------- 个人数据 ---------- */
        rank: ['段位', '段位', 'Rank', 'Звание'],
        uid: ['UID', 'UID', 'UID', 'UID'],
        total_value: ['总累计价值', '總累計價值', 'Total Value', 'Совокупная ценность'],
        weekly_value: ['本周累计价值', '本週累計價值', 'Weekly Value', 'Недельная ценность'],
        your_nickname: ['你的昵称', '你的暱稱', 'Your nickname', 'Ваш ник'],
        edit_nickname: ['修改昵称', '修改暱稱', 'Edit nickname', 'Изменить ник'],
        next_rank: ['下一个段位进度', '下一個段位進度', 'Next rank progress', 'До следующего звания'],
        cur_rank: ['当前段位', '當前段位', 'Current rank', 'Текущее звание'],

        /* ---------- 其他功能 按钮 ---------- */
        btn_notice: ['查看最新公告', '查看最新公告', 'View notices', 'Просматривать'],
        btn_shop: ['能力商店', '能力商店', 'Ability Shop', 'Магазин'],
        btn_leaderboard: ['周累价值排行榜', '周累價值排行榜', 'Weekly Leaderboard', 'Рейтинг недели'],
        btn_bg_shop: ['背景商店', '背景商店', 'Background Shop', 'Фоны'],
        btn_custom_bg: ['自定义背景', '自定義背景', 'Custom BG', 'Свой фон'],
        btn_clear_bg: ['清除自定义背景', '清除自定義背景', 'Clear custom BG', 'Убрать фон'],
        btn_item_pool: ['物品池管理', '物品池管理', 'Item Pool', 'Склад'],
        btn_collect: ['收藏室', '收藏室', 'Collection', 'Коллекция'],
        btn_synth: ['样本合成台', '樣本合成台', 'Synthesis', 'Синтез'],
        btn_download: ['资源下载', '資源下載', 'Downloads', 'Загрузки'],
        btn_redeem: ['兑换码', '兌換碼', 'Redeem', 'Коды'],
        btn_mod: ['MOD', 'MOD', 'MOD', 'MOD'],
        btn_minigame_fruit: ['小游戏·暗区水果忍者', '小遊戲·暗區水果忍者', 'Mini · Fruit Ninja', 'Мини: Фрукты'],
        btn_minigame_map: ['小游戏·熟图模拟器', '小遊戲·熟圖模擬器', 'Mini · Map Sim', 'Мини: Карта'],

        /* ---------- GM ---------- */
        gm_edit_value: ['编辑总累计价值', '編輯總累計價值', 'Edit total value', 'Правка ценности'],
        gm_hotupdate: ['私链热更新', '私鏈熱更新', 'Private hot-update', 'Секр. апдейт'],
        gm_resource: ['资源管理', '資源管理', 'Resources', 'Ресурсы'],
        gm_board: ['榜单管理', '榜單管理', 'Leaderboard', 'Рейтинг'],
        gm_upload: ['Mod上传', 'Mod上傳', 'Upload Mod', 'Загрузить'],
        gm_center: ['弹窗中心', '彈窗中心', 'Modals', 'Окна'],

        /* ---------- 设置 ---------- */
        set_effect: ['效果设置', '效果設置', 'Effects', 'Эффекты'],
        set_sound: ['声音设置', '聲音設置', 'Sound', 'Звук'],
        set_cloud: ['云同步', '雲同步', 'Cloud sync', 'Облако'],
        set_check: ['检查更新', '檢查更新', 'Check update', 'Обновить'],
        set_language: ['语言', '語言', 'Language', 'Язык'],
        set_framerate: ['动画帧率', '動畫幀率', 'Frame rate', 'Кадр/с'],
        set_vsync: ['垂直同步', '垂直同步', 'V-Sync', 'V-Sync'],
        set_smooth: ['流畅', '流暢', 'Smooth', 'Плавный'],
        set_highfr: ['高帧率', '高幀率', 'High FPS', 'Выс. FPS'],
        set_volume: ['音量', '音量', 'Volume', 'Громкость'],
        set_popup_vol: ['弹窗提示音量调整', '彈窗提示音量調整', 'Popup volume', 'Голос окон'],
        set_sfx_vol: ['界面音效音量调整', '界面音效音量調整', 'SFX volume', 'Голос UI'],
        set_vibrate: ['高价值物品振动', '高價值物品振動', 'Vibrate on loot', 'Вибро на лут'],
        set_skip_search: ['跳过搜索遮罩', '跳過搜索遮罩', 'Skip search mask', 'Пропустить'],
        set_popup_msg: ['弹窗消息提示', '彈窗消息提示', 'Popup message', 'Сообщение'],
        set_skip_load: ['开启跳过加载登录', '開啟跳過載入登入', 'Skip load login', 'Пропустить вход'],
        set_cn_font: ['切换为国服字体', '切換為國服字體', 'CN font', 'Кит. шрифт'],
        set_intl_font: ['切换为国际服字体', '切換為國際服字體', 'INTL font', 'Глоб. шрифт'],

        /* ---------- 稀有度 ---------- */
        rar_white: ['白色', '白色', 'White', 'Белый'],
        rar_orange: ['橙色', '橙色', 'Orange', 'Оранжевый'],
        rar_purple: ['紫色', '紫色', 'Purple', 'Фиолетовый'],
        rar_red: ['红色', '紅色', 'Red', 'Красный'],
        rar_gold: ['金色', '金色', 'Gold', 'Золотой'],
        collectible: ['收藏品', '收藏品', 'Collectible', 'Коллекц.'],
        cohen: ['柯恩币', '柯恩幣', 'Koen coin', 'Монеты'],

        /* ---------- 段位名 ---------- */
        rank_0: ['暗区新锐', '暗區新銳', 'Recruit', 'Новобранец'],
        rank_1: ['暗区尖兵', '暗區尖兵', 'Vanguard', 'Вангард'],
        rank_2: ['暗区精英', '暗區精英', 'Elite', 'Элита'],
        rank_3: ['暗区专家', '暗區專家', 'Expert', 'Эксперт'],
        rank_4: ['暗区大师', '暗區大師', 'Master', 'Мастер'],
        rank_5: ['暗区王牌', '暗區王牌', 'Ace', 'Ас'],
        rank_6: ['暗区传说', '暗區傳說', 'Legend', 'Легенда'],

        /* ---------- 语言选项 ---------- */
        lang_zhcn: ['简体中文', '簡體中文', 'Simplified', 'Кит. (упр.)'],
        lang_zhtw: ['繁體中文', '繁體中文', 'Traditional', 'Кит. (трад.)'],
        lang_en: ['English', 'English', 'English', 'English'],
        lang_ru: ['Русский', 'Русский', 'Русский', 'Русский'],

        /* ---------- Mod / 市场 ---------- */
        mod_mine: ['我的MOD', '我的MOD', 'My Mods', 'Мои MOD'],
        mod_store: ['MOD市场', 'MOD市場', 'MOD Store', 'Магазин'],
        mod_import: ['从本地导入MOD', '從本地匯入MOD', 'Import from device', 'С устройства'],
        mod_detail: ['模组详情', '模組詳情', 'Details', 'Детали'],
        mod_search_ph: ['搜索模组名称 / 简介 / 作者', '搜尋模組名稱 / 簡介 / 作者', 'Search name/desc/author', 'Поиск'],
        mod_all: ['全部', '全部', 'All', 'Все'],
        mod_item: ['物品', '物品', 'Item', 'Предмет'],
        mod_music: ['音乐', '音樂', 'Music', 'Музыка'],
        mod_bg: ['背景', '背景', 'Background', 'Фон'],

        /* ---------- 兑换码 ---------- */
        redeem_title: ['兑换码', '兌換碼', 'Redeem', 'Коды'],
        redeem_ph: ['请输入兑换码', '請輸入兌換碼', 'Enter a code', 'Введите код'],
        redeem_confirm: ['确认兑换', '確認兌換', 'Redeem', 'Активировать'],
        redeem_desc: ['输入兑换码可获得对应奖励，每个兑换码仅可使用一次。',
            '輸入兌換碼可獲得對應獎勵，每個兌換碼僅可使用一次。',
            'Enter a code to get a reward. Each code works once.',
            'Код даёт награду, действует один раз.'],

        /* ---------- 物品池解锁 ---------- */
        ip_unlocked: ['未解锁', '未解鎖', 'Locked', 'Закрыто'],
        ip_sponsor: ['解锁「物品池管理」需赞助', '解鎖「物品池管理」需贊助', 'Unlock Item Pool via sponsor', 'Доступ по спонсору'],
        ip_gocode: ['在「兑换码」中输入即可解锁。', '在「兌換碼」中輸入即可解鎖。', 'Redeem a code to unlock.', 'Введите код, чтобы открыть.']
    };

    var cur = 'zh-CN';
    try {
        var saved = localStorage.getItem(LANG_KEY);
        if (saved && LANGS.indexOf(saved) !== -1) cur = saved;
    } catch (e) {}

    function idx() { return LANG_INDEX[cur] || 0; }

    var I18N = {
        LANGS: LANGS,
        getLang: function () { return cur; },
        t: function (key, fallback) {
            var row = M[key];
            if (!row) return (typeof fallback === 'undefined') ? key : fallback;
            var v = row[idx()];
            if (v === '' || v == null) v = row[0];
            return (v == null) ? (typeof fallback !== 'undefined' ? fallback : key) : v;
        },
        has: function (key) { var r = M[key]; return !!(r && (r[idx()] || r[0])); },
        addEntries: function (obj) { // 允许后续文件扩展词表
            for (var k in obj) if (obj.hasOwnProperty(k)) M[k] = obj[k];
        },
        setLang: function (lang, silent) {
            if (LANGS.indexOf(lang) === -1) return;
            cur = lang;
            try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
            try { document.documentElement.setAttribute('lang', cur === 'zh-TW' ? 'zh-Hant' : cur); } catch (e) {}
            if (!silent) {
                I18N.translateStatic();
                if (typeof I18N.onChange === 'function') I18N.onChange(cur);
            }
        },
        // 刷新所有 data-i18n / data-i18n-ph / data-i18n-title
        translateStatic: function () {
            var i;
            var els = document.querySelectorAll('[data-i18n]');
            for (i = 0; i < els.length; i++) {
                els[i].textContent = I18N.t(els[i].getAttribute('data-i18n'), els[i].getAttribute('data-i18n-fallback'));
            }
            var ph = document.querySelectorAll('[data-i18n-ph]');
            for (i = 0; i < ph.length; i++) {
                ph[i].setAttribute('placeholder', I18N.t(ph[i].getAttribute('data-i18n-ph')));
            }
            var tt = document.querySelectorAll('[data-i18n-title]');
            for (i = 0; i < tt.length; i++) {
                tt[i].setAttribute('title', I18N.t(tt[i].getAttribute('data-i18n-title')));
            }
        },
        init: function () {
            I18N.translateStatic();
            try { document.documentElement.setAttribute('lang', cur === 'zh-TW' ? 'zh-Hant' : cur); } catch (e) {}
        }
    };

    window.I18N = I18N;

    // 段位名（中文）→ 当前语言；未知名称回退原值
    var RANK_NAMES = ['暗区新锐', '暗区尖兵', '暗区精英', '暗区专家', '暗区大师', '暗区王牌', '暗区传说'];
    window.i18nRankName = function (zhName) {
        var i = RANK_NAMES.indexOf(zhName);
        if (i === -1) return zhName;
        return I18N.t('rank_' + i, zhName);
    };
    I18N.refreshDynamic = function () { if (typeof I18N.onChange === 'function') I18N.onChange(I18N.getLang()); };

    // 语言选择器 UI（若页面里有 #lang-select 容器则填充）
    function buildSelector() {
        var box = document.getElementById('lang-select');
        if (!box) return;
        var labels = { 'zh-CN': '简中', 'zh-TW': '繁中', 'en': 'EN', 'ru': 'RU' };
        box.innerHTML = '';
        LANGS.forEach(function (l) {
            var b = document.createElement('button');
            b.className = 'lang-opt' + (l === cur ? ' active' : '');
            b.setAttribute('data-lang', l);
            b.textContent = labels[l] || l;
            b.onclick = function () { I18N.setLang(l); };
            box.appendChild(b);
        });
        var sync = document.querySelectorAll('#lang-select .lang-opt');
        for (var i = 0; i < sync.length; i++) {
            if (sync[i].getAttribute('data-lang') === cur) sync[i].classList.add('active');
        }
    }
    I18N.buildSelector = buildSelector;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { I18N.init(); buildSelector(); });
    else { I18N.init(); buildSelector(); }
})();
