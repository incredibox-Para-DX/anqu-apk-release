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
        rar_white: ['白色', '白色', '白色', '白色'],
        rar_orange: ['橙色', '橙色', '橙色', '橙色'],
        rar_purple: ['紫色', '紫色', '紫色', '紫色'],
        rar_red: ['红色', '红色', '红色', '红色'],
        rar_gold: ['金色', '金色', '金色', '金色'],
        collectible: ['收藏品', '收藏品', '收藏品', '收藏品'],
        cohen: ['柯恩币', '柯恩幣', 'Koen Coin', 'Монета Кён'],

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
        ip_gocode: ['在「兑换码」中输入即可解锁。', '在「兌換碼」中輸入即可解鎖。', 'Redeem a code to unlock.', 'Введите код, чтобы открыть.'],

        /* ---------- 通用状态 / toast ---------- */
        t_downloading: ['正在下载...', '正在下載...', 'Downloading...', 'Загрузка...'],
        t_done: ['已完成', '已完成', 'Done', 'Готово'],
        t_notdl: ['未下载', '未下載', 'Not downloaded', 'Не скачано'],
        t_retry: ['开保险失败，请重试', '開保險失敗，請重試', 'Failed to open safe, retry', 'Ошибка, повторите'],
        t_updated: ['总累计价值已更新', '總累計價值已更新', 'Total value updated', 'Ценность обновлена'],
        t_before_end: ['前面没有收藏品了', '前面沒有收藏品了', 'No more items before', 'Выше нет предметов'],
        t_after_end: ['后面没有收藏品了', '後面沒有收藏品了', 'No more items after', 'Ниже нет предметов'],
        t_save_fail_small: ['保存失败，请换一张体积更小的文件重试', '儲存失敗，請換一張體積更小的檔案重試', 'Save failed, use a smaller file', 'Не удалось сохранить'],
        t_default_bg: ['已恢复默认背景', '已恢復默認背景', 'Default BG restored', 'Фон по умолчанию'],
        t_cloud_newer: ['云端有更新的进度，可在「云同步」中恢复', '雲端有更新的進度，可在「雲同步」中恢復', 'Newer progress in cloud; restore via Cloud Sync', 'В облаке новый прогресс'],
        t_sync_code: ['同步码已生成，请务必记下', '同步碼已生成，請務必記下', 'Sync code generated; save it', 'Код создан, запишите'],
        t_new_version: ['检测到新版本，请点击「检查更新」', '檢測到新版本，請點擊「檢查更新」', 'New version found; tap Check update', 'Есть новая версия'],
        t_times_up: ['次数已用完，请重新购买', '次數已用完，請重新購買', 'Uses left: 0, buy more', 'Без покупок'],
        t_later: ['稍后再说', '稍後再說', 'Maybe later', 'Позже'],
        t_now: ['立即更新', '立即更新', 'Update now', 'Обновить'],
        t_close: ['关闭', '關閉', 'Close', 'Закрыть'],
        t_sel_value: ['请输入数值', '請輸入數值', 'Enter a value', 'Введите число'],
        t_sel_value_k: ['请输入有效数值（支持 K/M 单位）', '請輸入有效數值（支持 K/M 單位）', 'Enter a value (K/M ok)', 'Введите (K/M)'],
        t_sel_bg: ['请选择一个背景', '請選擇一個背景', 'Pick a background', 'Выберите фон'],
        t_sel_media: ['请选择图片或视频文件', '請選擇圖片或影片檔案', 'Pick an image or video', 'Выберите файл'],
        t_sel_audio: ['请选择音频文件', '請選擇音訊檔案', 'Pick an audio file', 'Выберите аудио'],
        t_sel_img: ['请选择图片文件', '請選擇圖片檔案', 'Pick an image file', 'Выберите картинку'],
        t_reslist_fail: ['资源清单加载失败，请检查网络后点击下载重试', '資源清單載入失敗，請檢查網絡後點擊下載重試', 'Failed to load manifest; retry', 'Ошибка списка'],
        t_bg_list_empty: ['背景列表为空，请检查配置文件', '背景列表為空，請檢查配置檔案', 'Background list is empty', 'Список пуст'],
        t_bg_saved: ['背景设置已保存', '背景設置已保存', 'Background saved', 'Фон сохранён'],
        t_bg_list_fail: ['背景资源列表加载失败，请检查网络', '背景資源列表載入失敗，請檢查網絡', 'Failed to load backgrounds', 'Ошибка загрузки'],
        t_bg_done: ['背景资源包已下载完成', '背景資源包已下載完成', 'Backgrounds downloaded', 'Фоны готовы'],
        t_bg_locked: ['该背景尚未解锁，请先购买', '該背景尚未解鎖，請先購買', 'BG locked; buy first', 'Фон заблокирован'],
        t_bg_need_res: ['请先下载背景资源后再打开背景商店', '請先下載背景資源後再打開背景商店', 'Download resources first', 'Сначала скачайте'],
        t_title_list_fail: ['段位图标清单加载失败，请检查网络', '段位圖示清單載入失敗，請檢查網絡', 'Failed to load rank icons', 'Ошибка значков'],
        t_title_done: ['段位图标资源包已下载完成', '段位圖示資源包已下載完成', 'Rank icons downloaded', 'Значки готовы'],
        t_title_need_dl: ['请先在资源下载中下载段位图标', '請先在資源下載中下載段位圖示', 'Download rank icons first', 'Сначала значки'],
        t_music_list_fail: ['音乐资源列表加载失败，请检查网络', '音樂資源列表載入失敗，請檢查網絡', 'Failed to load music list', 'Ошибка списка'],
        t_music_done: ['音乐资源包已下载完成', '音樂資源包已下載完成', 'Music pack downloaded', 'Музыка готова'],
        t_music_need_res: ['请先下载音乐资源包后再打开音乐列表', '請先下載音樂資源包後再打開音樂列表', 'Download music pack first', 'Сначала музыка'],
        t_minigame_fail: ['小游戏启动失败', '小遊戲啟動失敗', 'Mini-game failed to start', 'Ошибка запуска'],
        t_minigame_done: ['小游戏资源包已下载完成', '小遊戲資源包已下載完成', 'Mini-game resources done', 'Ресурсы готовы'],
        t_minigame_fail_list: ['小游戏资源清单加载失败，请检查网络', '小遊戲資源清單載入失敗，請檢查網絡', 'Failed to load mini-game list', 'Ошибка списка'],
        t_pool_all_on: ['所有物品已被启用', '所有物品已被啟用', 'All items enabled', 'Всё включено'],
        t_pool_all_off: ['所有物品已被禁用', '所有物品已被禁用', 'All items disabled', 'Всё выключено'],
        t_pool_off_hint: ['所有物品已被禁用，请到物品池重新启用', '所有物品已被禁用，請到物品池重新啟用', 'All disabled; re-enable in Item Pool', 'Всё выключено'],
        t_qq_copied: ['QQ 已复制：2312367270', 'QQ 已複製：2312367270', 'QQ copied: 2312367270', 'QQ скопирован'],
        t_bg_fav_on: ['已加入喜好', '已加入喜好', 'Added to favorites', 'В избранное'],
        t_bg_fav_off: ['已取消喜好', '已取消喜好', 'Removed from favorites', 'Из избранного'],
        t_bg_video_on: ['已应用自定义视频背景', '已應用自定義視頻背景', 'Custom video BG applied', 'Видео-фон применён'],
        t_bg_image_on: ['已应用自定义图片背景', '已應用自定義圖片背景', 'Custom image BG applied', 'Фон применён'],
        t_nothing_del: ['未检测到已下载资源，无需删除', '未檢測到下載資源，無需刪除', 'No downloaded resources to delete', 'Нечего удалять'],
        t_clear_fail: ['清除失败，请重试', '清除失敗，請重試', 'Clear failed, retry', 'Ошибка очистки'],
        t_qq_plain: ['QQ：2312367270', 'QQ：2312367270', 'QQ: 2312367270', 'QQ: 2312367270'],

        /* ---------- 音乐 ---------- */
        t_m_saved: ['已保存修改', '已儲存修改', 'Changes saved', 'Изменено'],
        t_m_del: ['已删除本地音乐', '已刪除本地音樂', 'Local music deleted', 'Удалено'],
        t_m_unlock: ['已解锁', '已解鎖', 'Unlocked', 'Открыто'],
        t_m_play: ['播放', '播放', 'Play', 'Играть'],
        t_m_locked: ['该歌曲未解锁, 需在播放列表中购买', '該歌曲未解鎖, 需在播放列表中購買', 'Track locked; buy in playlist', 'Трек заблокирован'],
        t_m_import_fail: ['导入失败，可能是存储空间不足或格式不支持', '匯入失敗，可能是儲存空間不足或格式不支持', 'Import failed (space/format)', 'Ошибка импорта'],
        t_m_buy: ['购买', '購買', 'Buy', 'Купить'],
        t_m_imported: ['已导入', '已匯入', 'Imported', 'Импортировано'],

        /* ---------- Mod ---------- */
        t_mod_deleted: ['已删除', '已刪除', 'Deleted', 'Удалено'],
        t_mod_used: ['已用', '已用', 'Used', 'Использован'],
        t_mod_verifying: ['正在校验并安装…', '正在校驗並安裝…', 'Verifying & installing…', 'Проверка…'],
        t_mod_pick_zip: ['请选择 zip 文件', '請選擇 zip 檔案', 'Select a zip file', 'Выберите zip'],
        t_mod_link_copied: ['链接已复制', '連結已複製', 'Link copied', 'Ссылка скопирована'],
        t_mod_installed: ['已安装', '已安裝', 'Installed', 'Установлено'],
        t_mod_imported: ['已导入', '已匯入', 'Imported', 'Импортировано'],

        /* ---------- 物品池 / Mod 文档 ---------- */
        pool_all_off: ['全部禁用', '全部禁用', 'Disable all', 'Выкл. все'],
        pool_all_on: ['全部启用', '全部啟用', 'Enable all', 'Вкл. все'],
        mod_doc_item: ['物品类 mod.json 写法', '物品類 mod.json 寫法', 'Item mod.json guide', 'Item mod.json'],
        mod_doc_music: ['音乐类 mod.json 写法', '音樂類 mod.json 寫法', 'Music mod.json guide', 'Music mod.json'],
        mod_doc_bg: ['背景类 mod.json 写法', '背景類 mod.json 寫法', 'BG mod.json guide', 'BG mod.json'],

        /* ---------- 合成 ---------- */
        t_synth_selected: ['已选中', '已選中', 'Selected', 'Выбрано'],
        t_synth_done: ['六种样本已全部合成', '六種樣本已全部合成', 'All six samples synthesized', 'Все образцы'],

        /* ---------- 设置详情 ---------- */
        set_fps_lag: ['高帧率', '高幀率', 'High FPS', 'Выс. FPS'],
        set_fps_smooth: ['流畅', '流暢', 'Smooth', 'Плавный'],
        set_vol_label: ['音量', '音量', 'Volume', 'Громкость'],
        music_now_selected: ['未选择歌曲', '未選擇歌曲', 'No song selected', 'Нет песни'],
        music_now_hint: ['请选择一首歌曲', '請選擇一首歌曲', 'Pick a song', 'Выберите песню'],
        music_mode: ['顺序播放', '順序播放', 'Sequential', 'По порядку'],
        music_playlist: ['播放列表', '播放列表', 'Playlist', 'Плейлист'],
        music_playlist_empty: ['播放列表为空', '播放列表為空', 'Playlist is empty', 'Плейлист пуст'],
        music_search_ph: ['搜索物品名称...', '搜尋物品名稱...', 'Search items...', 'Поиск...'],

        /* ---------- 主界面 / 弹窗 ---------- */
        open_safe: ['打开保险', '打開保險', 'Open safe', 'Открыть сейф'],
        pause_search: ['暂停搜索', '暫停搜索', 'Pause search', 'Пауза'],
        searching: ['搜索中', '搜尋中', 'Searching', 'Поиск'],
        inv_empty: ['尚未发现任何物品', '尚未發現任何物品', 'No items found', 'Ничего не найдено'],
        inv_hint: ['点击"打开保险"开始搜索物品', '點擊「打開保險」開始搜索物品', 'Tap "Open safe" to start', 'Нажмите «Открыть сейф»'],
        stat_total: ['总价值 :', '總價值 :', 'Total :', 'Всего :'],
        stat_highest: ['最高价值 :', '最高價值 :', 'Highest :', 'Максимум :'],
        obtain_count: ['获取次数:', '獲取次數:', 'Obtained:', 'Получено:'],
        lb_submit: ['提交分数', '提交分數', 'Submit score', 'Отправить'],
        bg_fav: ['加入喜好', '加入喜好', 'Add to favorites', 'В избранное'],
        not_generated: ['尚未生成', '尚未生成', 'Not generated', 'Не создано'],
        step1: ['第一步：下载官方模板', '第一步：下載官方模板', 'Step 1: Get the template', 'Шаг 1: шаблон'],
        step2: ['第二步：制作你的模组', '第二步：製作你的模組', 'Step 2: Build your mod', 'Шаг 2: создание'],
        step3: ['第三步：提交审核', '第三步：提交審核', 'Step 3: Submit', 'Шаг 3: отправка'],

        /* ---------- 弹窗通用 ---------- */
        b_upload: ['上传', '上傳', 'Upload', 'Загрузить'],
        b_preview: ['预览', '預覽', 'Preview', 'Просмотр'],
        b_clear: ['清除', '清除', 'Clear', 'Очистить'],
        b_import: ['导入', '匯入', 'Import', 'Импорт'],
        b_save_short: ['保存', '儲存', 'Save', 'Сохранить'],
        b_confirm_edit: ['确认修改', '確認修改', 'Confirm', 'Подтвердить'],
        b_refresh: ['刷新', '刷新', 'Refresh', 'Обновить'],
        b_locked: ['未解锁', '未解鎖', 'Locked', 'Закрыто'],
        b_next: ['下一个', '下一個', 'Next', 'Далее'],

        /* ---------- 段位 / 排行榜 ---------- */
        title_cur: ['当前段位', '當前段位', 'Current rank', 'Текущее звание'],
        title_next_progress: ['下一个段位进度', '下一個段位進度', 'Next rank progress', 'До след. звания'],
        title_dl_icons: ['下载段位图标资源包', '下載段位圖示資源包', 'Download rank icons', 'Скачать значки'],
        title_icons_all: ['段位图标资源包已全部下载', '段位圖示資源包已全部下載', 'Rank icons downloaded', 'Значки скачаны'],
        title_icons_desc: ['包含个人信息里全部段位徽章图标', '包含個人信息裡全部段位徽章圖示', 'All rank badge icons', 'Все значки званий'],
        lb_week: ['本周排行榜', '本週排行榜', 'Weekly ranking', 'Рейтинг недели'],
        lb_submit_weekly: ['提交本周累计价值上榜', '提交本週累計價値上榜', 'Submit to weekly board', 'В рейтинг недели'],

        /* ---------- 云同步 ---------- */
        cloud_my_code: ['我的同步码', '我的同步碼', 'My sync code', 'Мой код'],
        cloud_gen: ['生成同步码并上传', '生成同步碼並上傳', 'Generate & upload', 'Создать и загрузить'],
        cloud_input_ph: ['输入同步码，如 AB7K-9QX2-M3FD', '輸入同步碼，如 AB7K-9QX2-M3FD', 'Enter code, e.g. AB7K-...', 'Введите код'],
        cloud_restore: ['从云端恢复', '從雲端恢復', 'Restore from cloud', 'Из облака'],
        cloud_overwrite: ['用云端覆盖', '用雲端覆蓋', 'Overwrite local', 'Заменить'],
        cloud_restore_code: ['用同步码恢复', '用同步碼恢復', 'Restore by code', 'По коду'],
        cloud_backup: ['备份本地后恢复', '備份本地後恢復', 'Backup then restore', 'Резерв и восстановление'],
        cloud_sync_now: ['立即同步', '立即同步', 'Sync now', 'Синхр.'],
        cloud_copy_code: ['复制同步码', '複製同步碼', 'Copy code', 'Копировать'],
        cloud_desc: ['同步码就是你的存档凭证，记下它，换设备输入即可恢复进度。', '同步碼就是你的存檔憑証，記下它，換設備輸入即可恢復進度。', 'The code is your save key; enter it on another device.', 'Код — ключ к сохранению.'],

        /* ---------- 背景商店 / 资源 ---------- */
        bg_setting: ['背景设置', '背景設置', 'Background', 'Фон'],
        bg_dl_pack: ['下载背景资源包', '下載背景資源包', 'Download BG pack', 'Скачать фоны'],
        bg_pack_all: ['背景资源包已全部下载', '背景資源包已全部下載', 'BG pack downloaded', 'Фоны скачаны'],
        bg_pack_desc: ['包含全部背景资源', '包含全部背景資源', 'All backgrounds', 'Все фоны'],
        bg_auto_rotate: ['开启后每次进入游戏将随机切换一张喜好的壁纸。', '開啟後每次進入遊戲將隨機切換一張喜好的壁紙。', 'Randomize a favorite wallpaper each launch.', 'Случайные обои при запуске.'],
        bg_play_fav: ['播放喜好的壁纸', '播放喜好的壁紙', 'Play favorite wallpapers', 'Любимые обои'],
        bg_custom_note: ['自定义背景（开启「播放喜好的壁纸」后将自动清除）', '自定義背景（開啟「播放喜好的壁紙」後將自動清除）', 'Custom BG (auto-cleared if favorites play)', 'Свой фон'],
        bg_upload_custom: ['上传自定义背景', '上傳自定義背景', 'Upload custom BG', 'Загрузить фон'],
        res_music_pack: ['下载音乐资源包', '下載音樂資源包', 'Download music pack', 'Скачать музыку'],
        res_music_all: ['音乐资源包已全部下载', '音樂資源包已全部下載', 'Music pack downloaded', 'Музыка скачана'],
        res_music_desc: ['包含全部音乐资源与音乐封面', '包含全部音樂資源與音樂封面', 'All music & covers', 'Вся музыка'],
        res_music_rel: ['音乐相关资源包', '音樂相關資源包', 'Music packs', 'Музыка'],

        /* ---------- 设置详情补充 ---------- */
        set_flash: ['物品闪光特效', '物品閃光特效', 'Item flash FX', 'Эффект лута'],
        set_sample_refresh: ['样本是否刷新', '樣本是否刷新', 'Refresh samples', 'Обновление'],

        /* ---------- Mod 教程 / 投稿 ---------- */
        mod_upload_notice: ['上传须知（违反无法通过审核）', '上傳須知（違反無法通過審核）', 'Upload rules', 'Правила'],
        mod_no_violate: ['名称与描述不得包含违规内容', '名稱與描述不得包含違規內容', 'No violating names/desc', 'Без нарушений'],
        mod_value_limit: ['物品 value 上限 4,000,000', '物品 value 上限 4,000,000', 'Item value ≤ 4,000,000', 'value ≤ 4 000 000'],
        mod_sound_opt: ['可选：物品支持音效字段 sound（mp3/wav/ogg）', '可選：物品支持音效欄位 sound（mp3/wav/ogg）', 'Optional: sound (mp3/wav/ogg)', 'Опц.: sound'],
        mod_thumb_rule: ['thumb.png、avatar.png 必填；screen 最多 3 张', 'thumb.png、avatar.png 必填；screen 最多 3 張', 'thumb/avatar required; ≤3 screens', 'thumb/avatar обязат.'],
        mod_zip_rule: ['选中里面的文件打包，不要连外层文件夹', '選中裡面的檔案打包，不要連外層資料夾', 'Zip inner files only', 'Только файлы'],
        mod_contact: ['作品投稿 QQ：', '作品投稿 QQ：', 'Submit via QQ:', 'Подача: QQ'],

        /* ---------- 采集 / 昵称 ---------- */
        nick_yours: ['你的昵称', '你的暱稱', 'Your nickname', 'Ваш ник'],
        nick_edit: ['修改昵称', '修改暱稱', 'Edit nickname', 'Изменить ник'],
        nick_new_ph: ['输入新昵称', '輸入新暱稱', 'Enter new nickname', 'Новый ник'],
        count_left: ['获取次数:', '獲取次數:', 'Obtained:', 'Получено:'],
        not_generated2: ['尚未生成', '尚未生成', 'Not generated', 'Не создано'],
        need_download: ['需下载', '需下載', 'Download', 'Скачать'],

        /* ---------- 离心机（样本合成） ---------- */
        synth_centrifuge: ['离心机', '離心機', 'Centrifuge', 'Центрифуга'],
        synth_again: ['重新合成', '重新合成', 'Re-synthesize', 'Заново'],
        synth_sample: ['样本', '樣本', 'Sample', 'Образец'],
        synth_done_banner: ['合成完成', '合成完成', 'Synthesis complete', 'Готово'],
        synth_incubator: ['保温箱', '保溫箱', 'Incubator', 'Инкубатор'],
        synth_els: ['ELS还原样本', 'ELS還原樣本', 'ELS sample', 'ELS-образец'],
        synth_drag_hint: ['到保温箱进行合成', '到保溫箱進行合成', 'into the incubator to synthesize', 'в инкубатор для синтеза'],
        synth_count_label: ['已合成', '已合成', 'Synthesized', 'Синтезировано'],

        /* ---------- 技能商店 ---------- */
        shop_title: ['技能商店', '技能商店', 'Skill Shop', 'Магазин навыков'],
        skill_swift: ['迅捷巧手', '迅捷巧手', 'Swift Hands', 'Быстрые руки'],
        skill_swift_d: ['增加保险的搜索速度', '增加保險的搜尋速度', 'Faster safe searching', 'Быстрый поиск'],
        skill_bounty: ['赏金协议', '賞金協議', 'Bounty Pact', 'Контракт за голову'],
        skill_bounty_d: ['提前显示物品稀有度', '提前顯示物品稀有度', 'Reveal item rarity early', 'Редкость заранее'],
        skill_tide: ['物资潮汐', '物資潮汐', 'Supply Tide', 'Прилив припасов'],
        skill_tide_d: ['接下来20次搜索爆率双倍', '接下來20次搜尋爆率雙倍', '2x drop rate for next 20 searches', 'x2 дроп 20 поисков'],
        skill_prophet: ['先知', '先知', 'Prophet', 'Пророк'],
        skill_prophet_d: ['打开保险时提前知道本次最高价值物品', '打開保險時提前知道本次最高價值物品', 'Know the top-value item in advance', 'Заранее топ-предмет'],
        skill_lucky: ['红运当头', '紅運當頭', 'Lucky Streak', 'Полоса удачи'],
        skill_lucky_d: ['接下来20次搜索必出高价值物品', '接下來20次搜尋必出高價值物品', 'High-value guarantee for next 20 searches', 'Гарантия топ-предмета 20'],
        skill_destiny: ['命运保底', '命運保底', 'Destiny Pity', 'Гарант судьбы'],
        skill_destiny_d: ['连续开保险未出橙色/红色道具时，第10次必出橙色及以上；触发保底后下次保底次数-1（最低3次）。若在保底前就开出橙/红，保底重置为10次', '連續開保險未出橙色/紅色道具時，第10次必出橙色及以上；觸發保底後下次保底次數-1（最低3次）。若在保底前就開出橙/紅，保底重置為10次', 'If 10 opens yield no orange/red, guarantee orange+; after triggering, threshold -1 (min 3). Orange/red before threshold resets to 10.', 'Если 10 открытий без оранж./красного — гарантия оранж.+; после срабатывания порог -1 (мин 3).'],
        skill_owned: ['已拥有', '已擁有', 'Owned', 'В наличии'],
        skill_left: ['剩余次数', '剩餘次數', 'Uses left', 'Осталось'],
        skill_redeem: ['兑换码解锁', '兌換碼解鎖', 'Redeem to unlock', 'Открыть кодом'],
        skill_redeem_hint: ['该技能需通过兑换码解锁，请查看技能描述', '該技能需通過兌換碼解鎖，請查看技能描述', 'Unlock via redeem code; see description', 'Откройте кодом'],

        /* ---------- 检查更新 ---------- */
        up_checking: ['正在检查更新…', '正在檢查更新…', 'Checking for updates…', 'Проверка обновлений…'],
        up_found: ['发现新版本', '發現新版本', 'New version found', 'Новая версия'],
        up_cur: ['当前版本：', '當前版本：', 'Current: ', 'Текущая: '],
        up_latest: ['最新版本：', '最新版本：', 'Latest: ', 'Последняя: '],
        up_is_latest: ['当前已是最新版本', '當前已是最新版本', 'Already up to date', 'Уже последняя версия'],
        up_downloading: ['正在下载更新包，请稍候…', '正在下載更新包，請稍候…', 'Downloading update, please wait…', 'Загрузка обновления…'],
        up_no_exit: ['更新过程中请勿退出', '更新過程中請勿退出', 'Do not exit during update', 'Не выходите'],
        up_done_refresh: ['更新完成，正在刷新…', '更新完成，正在刷新…', 'Update done, refreshing…', 'Готово, обновление…'],
        up_fail_net: ['检查失败：无法连接更新服务器', '檢查失敗：無法連接更新伺服器', 'Check failed: no server', 'Ошибка: нет сервера'],

        /* ---------- 制作人员 / 赞助 / 公告 ---------- */
        credits_title: ['制作人员列表', '製作人員列表', 'Credits', 'Авторы'],
        donate_title: ['赞赏本项目', '讚賞本項目', 'Support us', 'Поддержать проект'],
        credits_avatar: ['制作人员头像', '製作人員頭像', 'Staff avatar', 'Аватар автора'],
        notice_loading: ['公告加载中...', '公告載入中...', 'Loading announcement...', 'Загрузка объявления...'],

        /* ---------- 资源下载 / 输入框预填 ---------- */
        res_dl_pack: ['下载资源包', '下載資源包', 'Download pack', 'Скачать пакет'],
        res_dl_minigame: ['下载小游戏资源包', '下載小遊戲資源包', 'Download mini-game pack', 'Скачать мини-игру'],
        ph_value: ['例如：500000、1.5M、200K', '例如：500000、1.5M、200K', 'e.g. 500000, 1.5M, 200K', 'напр. 500000, 1.5M, 200K'],
        ph_nick_rank: ['输入昵称参与排行', '輸入昵稱參與排行', 'Enter nickname to rank', 'Введите ник'],
        ph_item_search: ['搜索物品名称...', '搜尋物品名稱...', 'Search items...', 'Поиск предметов...'],

        /* ---------- 制作人员职位 ---------- */
        role_main: ['主程序＆主设计', '主程式＆主設計', 'Lead Programmer & Designer', 'Гл. программист и дизайнер'],
        role_test: ['测试', '測試', 'Testing', 'Тестирование'],
        role_edit: ['编辑', '編輯', 'Editing', 'Редактура'],
        role_vocal: ['声乐', '聲樂', 'Vocals', 'Вокал'],
        role_promo: ['宣传', '宣傳', 'Promotion', 'Промо'],
        role_lead: ['项目负责', '項目負責', 'Project Lead', 'Руководитель'],
        role_studio: ['魔方工作室群暗区突围项目组', '魔方工作室群暗區突圍項目組', 'MoCube Studio Arena Breakout Team', 'MoCube Studio'],
        m_repeat_one: ['单曲循环', '單曲循環', 'Repeat One', 'Повтор одного'],
        m_shuffle: ['随机播放', '隨機播放', 'Shuffle', 'Перемешать'],
        t_delete_again: ['再点一次删除', '再點一次刪除', 'Tap delete again', 'Нажмите ещё раз'],
        confirm_delete: ['确定删除', '確定刪除', 'Confirm delete', 'Подтвердить удаление'],
        confirm_delete_pre: ['确定删除「', '確定刪除「', 'Confirm delete 「', 'Удалить «'],
        deleted_pre: ['已删除（', '已刪除（', 'Deleted (', 'Удалено ('],
        drag_hint: ['拖拽', '拖拽', 'Drag', 'Перетащите'],
        tap_incubator: ['点击保温箱放入', '點擊保溫箱放入', 'Tap the incubator to place', 'Нажмите инкубатор'],
        coin_name: ['科恩币', '科恩幣', 'Koen Coin', 'Монета Кён'],
        qq_group: ['能力投稿＆意见反馈交流群 : 1082453829', '能力投稿＆意見回饋交流群 : 1082453829', 'Contribution & feedback QQ group: 1082453829', 'QQ-группа: 1082453829'],
        qq_group2: ['能力投稿&意见反馈交流群：1082453829', '能力投稿&意見回饋交流群：1082453829', 'Contribution & feedback QQ group: 1082453829', 'QQ-группа: 1082453829'],
        got_drop: ['我出货了', '我出貨了', 'I got a drop', 'Мне выпало'],
        got_drop_q: ['“我出货了”', '“我出貨了”', '“I got a drop”', '«Мне выпало»'],
        synth_all_done_pre: ['六种样本已全部合成', '六種樣本已全部合成', 'All six samples synthesized', 'Все шесть образцов'],
        first_obtained: ['第一次获取:', '第一次獲取:', 'First obtained:', 'Впервые получено:'],
        collected: ['已收集', '已收集', 'Collected', 'Собрано'],
        not_collected: ['未收集', '未收集', 'Not collected', 'Не собрано'],
        placed: ['已放入', '已放入', 'Placed', 'Помещено'],
        pool_enabled: ['已启用', '已啟用', 'Enabled', 'Включено'],
        pool_disabled: ['已停用', '已停用', 'Disabled', 'Отключено'],
        pool_enabled_pre: ['已启用「', '已啟用「', 'Enabled 「', 'Включено «'],
        pool_disabled_pre: ['已停用「', '已停用「', 'Disabled 「', 'Отключено «'],
        pool_enable_items: ['启用物品', '啟用物品', 'Enable items', 'Включить предметы'],
        pool_disable_items: ['禁用物品', '禁用物品', 'Disable items', 'Отключить предметы'],
        bg_unknown: ['未知背景', '未知背景', 'Unknown BG', 'Неизвестный фон'],
        bg_default: ['默认背景', '默認背景', 'Default BG', 'Фон по умолчанию'],
        bg_fav_add: ['加入喜好', '加入喜好', 'Add to favorites', 'В избранное'],
        bg_fav_remove: ['取消喜好', '取消喜好', 'Remove favorite', 'Убрать из избранного'],
        bg_no_fav: ['还没有喜好的背景，请先在背景商店中加入喜好。', '還沒有喜好的背景，請先在背景商店中加入喜好。', 'No favorite backgrounds yet; add some in the BG shop.', 'Нет избранных фонов.'],
        bg_cur_fav_pre: ['当前已喜好 ', '當前已喜好 ', 'Favorited ', 'В избранном '],
        bg_locked_buy: ['该背景尚未解锁，请先购买', '該背景尚未解鎖，請先購買', 'BG locked; buy first', 'Фон заблокирован'],
        bg_custom_image: ['自定义图片背景', '自定義圖片背景', 'Custom image BG', 'Свой фон-картинка'],
        bg_custom_video: ['自定义视频背景', '自定義視頻背景', 'Custom video BG', 'Свой видео-фон'],
        need_: ['需要', '需要', 'Need', 'Нужно'],
        buy_success: ['购买成功!', '購買成功!', 'Purchase success!', 'Покупка успешна!'],
        buy_fail_pre: ['购买失败', '購買失敗', 'Purchase failed', 'Ошибка покупки'],
        owned_skill: ['已拥有此技能', '已擁有此技能', 'Already owned', 'Уже есть'],
        owned_this_skill: ['该技能已拥有', '該技能已擁有', 'Already owned', 'Уже есть'],
        owned_bg: ['已拥有此背景', '已擁有此背景', 'Already owned', 'Уже есть'],
        owned_song: ['已拥有该歌曲', '已擁有該歌曲', 'Already owned', 'Уже есть'],
        skill_unlock_code: ['该技能需通过兑换码解锁', '該技能需通過兌換碼解鎖', 'Unlock via redeem code', 'Открыть кодом'],
        rank_d0: ['初入暗区', '初入暗區', 'New to the Dark Zone', 'Новичок в Тёмной зоне'],
        rank_d1: ['累计价值突破1M', '累計價值突破1M', 'Total value over 1M', 'Ценность > 1M'],
        rank_d2: ['累计价值突破10M', '累計價值突破10M', 'Total value over 10M', 'Ценность > 10M'],
        rank_d3: ['累计价值突破50M', '累計價值突破50M', 'Total value over 50M', 'Ценность > 50M'],
        rank_d4: ['累计价值突破100M', '累計價值突破100M', 'Total value over 100M', 'Ценность > 100M'],
        rank_d5: ['累计价值突破500M', '累計價值突破500M', 'Total value over 500M', 'Ценность > 500M'],
        rank_d6: ['累计价值突破1000M', '累計價值突破1000M', 'Total value over 1000M', 'Ценность > 1000M'],
        max_rank: ['已达到最高段位', '已達到最高段位', 'Max rank reached', 'Макс. звание'],
        max_rank2: ['已最高段位', '已最高段位', 'Max rank', 'Макс. звание'],
        copied_pre: ['已复制：', '已複製：', 'Copied: ', 'Скопировано: '],
        copy_fail: ['复制失败', '複製失敗', 'Copy failed', 'Ошибка копирования'],
        please_wait: ['请稍候...', '請稍候...', 'Please wait...', 'Подождите...'],
        uploading: ['正在上传…', '正在上傳…', 'Uploading…', 'Загрузка…'],
        sync_no_progress: ['云端没有该同步码的进度', '雲端沒有該同步碼的進度', 'No cloud progress for this code', 'Нет прогресса для кода'],
        sync_code_notfound: ['该同步码不存在，请检查后重试', '該同步碼不存在，請檢查後重試', 'Sync code not found', 'Код не найден'],
        sync_code_invalid: ['同步码格式不正确，应为 12 位字母数字', '同步碼格式不正確，應為 12 位字母數字', 'Invalid code (12 alphanumerics)', 'Неверный код (12 симв.)'],
        sync_not_gen: ['尚未生成同步码', '尚未生成同步碼', 'Sync code not generated', 'Код не создан'],
        sync_copy_fail: ['复制失败，请长按同步码手动复制', '複製失敗，請長按同步碼手動複製', 'Copy failed; long-press the code', 'Не скопировано; удерживайте код'],
        redeem_invalid: ['兑换码无效', '兌換碼無效', 'Invalid code', 'Неверный код'],
        redeem_used: ['该兑换码已使用', '該兌換碼已使用', 'Code already used', 'Код уже использован'],
        redeem_fail: ['兑换失败，请稍后重试', '兌換失敗，請稍後重試', 'Redeem failed, retry', 'Ошибка активации'],
        redeem_get: ['获取兑换码，', '獲取兌換碼，', 'Get a code, ', 'Получить код, '],
        mod_name_f: ['模组名称', '模組名稱', 'Mod name', 'Название мода'],
        mod_desc_f: ['模组简介', '模組簡介', 'Mod description', 'Описание мода'],
        author_f: ['作者名', '作者名', 'Author', 'Автор'],
        version_f: ['版本号', '版本號', 'Version', 'Версия'],
        desc_f: ['描述', '描述', 'Description', 'Описание'],
        file_f: ['文件', '檔案', 'File', 'Файл'],
        title_f: ['标题', '標題', 'Title', 'Заголовок'],
        image_f: ['图片', '圖片', 'Image', 'Изображение'],
        mod_not_found: ['模组不存在', '模組不存在', 'Mod not found', 'Мод не найден'],
        mod_no_match: ['没有符合筛选条件的模组', '沒有符合篩選條件的模組', 'No mods match the filter', 'Нет подходящих модов'],
        mod_same_installed_pre: ['相同内容的模组已安装（', '相同內容的模組已安裝（', 'Same mod already installed (', 'Такой мод уже установлен ('],
        mod_installed_retry: ['该模组已安装，如需重装请先删除', '該模組已安裝，如需重裝請先刪除', 'Already installed; delete to reinstall', 'Уже установлен; удалите'],
        feature_locked: ['功能未解锁', '功能未解鎖', 'Feature locked', 'Функция закрыта'],
        fetching_list: ['正在获取资源清单...', '正在獲取資源清單...', 'Fetching resource list...', 'Загрузка списка...'],
        res_pack: ['资源包', '資源包', 'Resource pack', 'Пакет ресурсов'],
        download_all: ['全部下载', '全部下載', 'Download all', 'Скачать всё'],
        download_failed: ['下载失败', '下載失敗', 'Download failed', 'Ошибка загрузки'],
        resuming: ['继续下载中...', '繼續下載中...', 'Resuming download...', 'Продолжение...'],
        paused_resume: ['已暂停 · 点击「继续下载」恢复', '已暫停 · 點擊「繼續下載」恢復', 'Paused · tap Resume', 'Пауза · нажмите'],
        res_unavailable: ['资源包暂不可用：远程资源未上传或网络异常', '資源包暫不可用：遠程資源未上傳或網絡異常', 'Resource unavailable: not uploaded or network error', 'Пакет недоступен'],
        minigame_pack: ['小游戏资源包', '小遊戲資源包', 'Mini-game pack', 'Пакет мини-игр'],
        music_pack: ['音乐资源包', '音樂資源包', 'Music pack', 'Музыкальный пакет'],
        bg_pack: ['背景资源包', '背景資源包', 'BG pack', 'Пакет фонов'],
        title_pack: ['段位图标资源包', '段位圖示資源包', 'Rank icon pack', 'Пакет значков'],
        upload_fail: ['上传失败，请检查网络后重试', '上傳失敗，請檢查網絡後重試', 'Upload failed; check network', 'Ошибка загрузки'],
        report_group: ['若失效请到交流群反馈', '若失效請到交流群反饋', 'If broken, report to the group', 'Сообщите в группу'],
        sponsor_qq: ['赞助后联系 QQ', '贊助後聯繫 QQ', 'Contact QQ after sponsoring', 'Связь QQ после поддержки'],
        lore_tbd: ['世界观内容待补充。', '世界觀內容待補充。', 'Lore to be added.', 'Лор будет добавлен.'],
        unknown_author: ['未知作者', '未知作者', 'Unknown author', 'Неизвестный автор'],
        unknown_time: ['未知时间', '未知時間', 'Unknown time', 'Неизвестное время'],
        unknown_error: ['未知错误', '未知錯誤', 'Unknown error', 'Неизвестная ошибка'],

        /* ---------- 校验错误（模组导入） ---------- */
        v_bg_empty: ['backgrounds 不能为空', 'backgrounds 不能為空', 'backgrounds cannot be empty', 'backgrounds не может быть пустым'],
        v_items_empty: ['items 不能为空', 'items 不能為空', 'items cannot be empty', 'items не может быть пустым'],
        v_tracks_empty: ['tracks 不能为空', 'tracks 不能為空', 'tracks cannot be empty', 'tracks не может быть пустым'],
        v_type: ['type 必须是 item / music / background', 'type 必須是 item / music / background', 'type must be item / music / background', 'type: item / music / background'],
        v_height: ['height 必须是 1~6', 'height 必須是 1~6', 'height must be 1~6', 'height: 1~6'],
        v_width: ['width 必须是 1~5', 'width 必須是 1~5', 'width must be 1~5', 'width: 1~5'],
        v_value: ['value 必须是 1~', 'value 必須是 1~', 'value must be 1~', 'value: 1~'],
        v_rarity: ['rarity 必须是 purple/gold/orange/red', 'rarity 必須是 purple/gold/orange/red', 'rarity must be purple/gold/orange/red', 'rarity: purple/gold/orange/red'],
        v_image_path: ['image 路径非法', 'image 路徑非法', 'invalid image path', 'неверный путь image'],
        v_json: ['mod.json 不是合法 JSON', 'mod.json 不是合法 JSON', 'mod.json is not valid JSON', 'mod.json — неверный JSON'],
        v_json_hint: ['mod.json 不是合法 JSON（常见原因：多写了逗号或引号）', 'mod.json 不是合法 JSON（常見原因：多寫了逗號或引號）', 'mod.json is not valid JSON (extra comma/quote)', 'mod.json — неверный JSON (лишняя запятая)'],
        v_json_fmt: ['mod.json 格式错误', 'mod.json 格式錯誤', 'mod.json format error', 'ошибка формата mod.json'],
        v_zip_files: ['zip 内文件数超过', 'zip 內檔案數超過', 'zip has too many files', 'слишком много файлов в zip'],
        v_zip_no_modjson: ['zip 内缺少 mod.json', 'zip 內缺少 mod.json', 'zip is missing mod.json', 'в zip нет mod.json'],
        v_empty: ['不能为空', '不能為空', 'cannot be empty', 'не может быть пустым'],
        v_img_fmt: ['必须是 png/jpg/webp', '必須是 png/jpg/webp', 'must be png/jpg/webp', 'нужно png/jpg/webp'],
        v_img_video: ['必须是图片或视频', '必須是圖片或影片', 'must be an image or video', 'нужно изображение или видео'],
        v_file_missing: ['文件不存在', '檔案不存在', 'file not found', 'файл не найден'],
        v_audio_missing: ['音频文件不存在', '音訊檔案不存在', 'audio file not found', 'аудиофайл не найден'],
        v_sound_missing: ['音效文件不存在', '音效檔案不存在', 'sound file not found', 'звукфайл не найден'],
        v_audio_fmt: ['音频格式不支持', '音訊格式不支持', 'unsupported audio format', 'формат не поддерж.'],
        v_sound_fmt: ['音效必须是 mp3/wav/ogg 等格式', '音效必須是 mp3/wav/ogg 等格式', 'sound must be mp3/wav/ogg', 'звук: mp3/wav/ogg'],
        v_in_zip: ['在 zip 内不存在', '在 zip 內不存在', 'not found in zip', 'нет в zip'],
        v_no_thumb: ['缺少 thumb.png（列表缩略图）', '缺少 thumb.png（列表縮圖）', 'missing thumb.png', 'нет thumb.png'],
        v_no_avatar: ['缺少 avatar.png（作者头像）', '缺少 avatar.png（作者頭像）', 'missing avatar.png', 'нет avatar.png'],
        v_bg_missing: ['背景不存在', '背景不存在', 'background not found', 'фон не найден'],
        v_items_max: ['物品数量超过', '物品數量超過', 'too many items', 'слишком много предметов'],
        v_bg_max: ['背景数量超过', '背景數量超過', 'too many backgrounds', 'слишком много фонов'],
        v_tracks_max: ['曲目数量超过', '曲目數量超過', 'too many tracks', 'слишком много треков'],

        /* ---------- 云同步 / 热更新 / 其他 ---------- */
        cloud_not_deployed: ['云端服务尚未部署，暂不可用', '雲端服務尚未部署，暫不可用', 'Cloud service not deployed yet', 'Облако не развёрнуто'],
        cloud_deploy_hint: ['云端服务尚未部署，部署后填入地址即可使用', '雲端服務尚未部署，部署後填入地址即可使用', 'Cloud not deployed; fill in the URL after deploying', 'Облако не развёрнуто; укажите URL'],
        cloud_no_net: ['无法连接云端，请检查网络', '無法連線雲端，請檢查網絡', 'Cannot reach cloud; check network', 'Нет связи с облаком'],
        cloud_reading: ['正在读取云端进度…', '正在讀取雲端進度…', 'Reading cloud progress…', 'Чтение прогресса…'],
        cloud_uploading: ['正在上传本地进度…', '正在上傳本地進度…', 'Uploading local progress…', 'Загрузка прогресса…'],
        hu_from_url: ['从该地址热更新', '從該地址熱更新', 'Hot-update from this URL', 'Обновить по URL'],
        hu_remote_url: ['远程更新地址', '遠程更新地址', 'Remote update URL', 'URL обновления'],
        hu_custom_desc: ['自定义地址热更新（私有测试通道，不会推给其他玩家）。', '自定義地址熱更新（私有測試通道，不會推給其他玩家）。', 'Custom URL hot-update (private test channel).', 'Свой URL (тестовый канал).'],
        hu_ver_diff: ['私有 manifest 的 version 必须与本地不同才会应用。', '私有 manifest 的 version 必須與本地不同才會應用。', 'Private manifest version must differ from local.', 'Версия manifest должна отличаться.'],
        hu_applied: ['更新已应用，正在刷新…', '更新已應用，正在刷新…', 'Update applied, refreshing…', 'Обновлено, перезагрузка…'],
        hu_no_bridge: ['当前安装包不支持热更新（缺少 AndroidUpdate 桥）', '當前安裝包不支持熱更新（缺少 AndroidUpdate 橋）', 'This build does not support hot-update', 'Сборка не поддерживает обновление'],
        hu_pkg_unsupported: ['当前安装包不支持热更新', '當前安裝包不支持熱更新', 'This build does not support hot-update', 'Обновление не поддерж.'],
        save_failed: ['保存失败', '儲存失敗', 'Save failed', 'Ошибка сохранения'],
        notice_title: ['公告(使用国外服务器可能会卡顿，请在良好网络环境下使用)', '公告(使用國外伺服器可能會卡頓，請在良好網絡環境下使用)', 'Announcement (foreign server may lag; use a good network)', 'Объявление (возможны задержки)'],
        name_f: ['名称', '名稱', 'Name', 'Название'],
        avatar_f: ['头像', '頭像', 'Avatar', 'Аватар'],
        done_: ['完成', '完成', 'Done', 'Готово'],
        launch_fail: ['启动失败：', '啟動失敗：', 'Launch failed: ', 'Ошибка запуска: '],
        url_invalid: ['地址无效：必须以 http:// 或 https:// 开头', '地址無效：必須以 http:// 或 https:// 開頭', 'Invalid URL: must start with http:// or https://', 'Неверный URL: http(s)://'],
        copy_template: ['复制模板下载链接', '複製模板下載連結', 'Copy template link', 'Копировать ссылку шаблона'],
        repo_not_config: ['官方 Mod 仓库尚未配置或无内容', '官方 Mod 倉庫尚未配置或無內容', 'Official mod repo not configured', 'Офиц. репозиторий не настроен'],
        cur_rank_icon: ['当前段位图标', '當前段位圖示', 'Current rank icon', 'Текущий значок'],
        local_storage_unsupported: ['当前环境不支持本地存储', '當前環境不支持本地存儲', 'Local storage unsupported', 'Хранилище недоступно'],
        local_storage_fail: ['打开本地存储失败', '打開本地存儲失敗', 'Failed to open local storage', 'Не удалось открыть хранилище'],
        skill_destiny_unlocked: ['技能「命运保底」已解锁', '技能「命運保底」已解鎖', 'Skill "Destiny Pity" unlocked', 'Навык «Гарант судьбы» открыт'],
        skill_not_found: ['技能不存在', '技能不存在', 'Skill not found', 'Навык не найден'],
        skill_not_redeem: ['技能不存在或不是兑换解锁项', '技能不存在或不是兌換解鎖項', 'Skill not found or not a redeem unlock', 'Навык не найден'],
        skill_not_ready: ['技能系统未就绪', '技能系統未就緒', 'Skill system not ready', 'Система навыков не готова'],
        skill_unlock_fail: ['技能解锁失败', '技能解鎖失敗', 'Skill unlock failed', 'Ошибка разблокировки'],
        file_over40: ['文件超过 40MB，已忽略', '檔案超過 40MB，已忽略', 'File over 40MB, ignored', 'Файл > 40MB пропущен'],
        mods_json_updating: ['更新 mods.json…', '更新 mods.json…', 'Updating mods.json…', 'Обновление mods.json…'],
        local_import: ['本地导入', '本地匯入', 'Import local', 'Импорт локально'],
        local_music: ['本地音乐', '本地音樂', 'Local music', 'Локальная музыка'],
        song_list: ['歌曲列表', '歌曲列表', 'Song list', 'Список песен'],
        song_cover: ['歌曲封面', '歌曲封面', 'Song cover', 'Обложка песни'],
        tap_modal_hint: ['点击按钮打开对应的游戏弹窗（用于测试）。', '點擊按鈕打開對應的遊戲彈窗（用於測試）。', 'Tap a button to open its modal (for testing).', 'Нажмите кнопку, чтобы открыть окно.'],
        operator: ['特遣队员', '特遣隊員', 'Operator', 'Оперативник'],
        admin_panel: ['管理后台', '管理後台', 'Admin panel', 'Панель админа'],
        unzip_replace: ['解压模板 → 替换', '解壓模板 → 替換', 'Unzip template → replace', 'Распакуйте → замените'],
        parsing_zip: ['解析 zip…', '解析 zip…', 'Parsing zip…', 'Разбор zip…'],
        compute_module: ['计算机验算模块', '計算機驗算模組', 'Compute module', 'Вычислительный модуль'],
        need_github_token: ['请先填写 GitHub Token', '請先填寫 GitHub Token', 'Enter GitHub Token first', 'Введите GitHub Token'],
        longpress_copy: ['请长按同步码手动复制：', '請長按同步碼手動複製：', 'Long-press the code to copy: ', 'Удерживайте код: '],
        res_incomplete: ['资源不完整 (', '資源不完整 (', 'Resource incomplete (', 'Ресурсы неполные ('],
        res_unavailable2: ['资源包暂不可用：远程资源未上传或网络异常（可点击重试，图标仍用安装包内置版）', '資源包暫不可用：遠程資源未上傳或網絡異常（可點擊重試，圖示仍用安裝包內置版）', 'Resource unavailable (tap to retry; using built-in icons)', 'Ресурсы недоступны (нажмите)'],
        support_us: ['赞赏支持', '讚賞支持', 'Support us', 'Поддержать'],
        enabled_tag: ['（已启用）', '（已啟用）', ' (enabled)', ' (включено)'],
        reinstall_hint: ['），如需重装请先删除', '），如需重裝請先刪除', '), delete first to reinstall', '), удалите для переустановки'],
        and_failed: ['，失败 ', '，失敗 ', ', failed ', ', ошибок '],
        tap_incubator2: ['，点击保温箱放入', '，點擊保溫箱放入', ', tap the incubator to place', ', нажмите инкубатор'],

        /* ---------- GM / 上传 ---------- */
        gm_on: ['GM 模式已开启', 'GM 模式已開啟', 'GM mode enabled', 'GM включён'],
        gh_token_local: ['GitHub Token（仅保存在本机）', 'GitHub Token（僅保存在本機）', 'GitHub Token (local only)', 'GitHub Token (локально)'],
        mod_published: ['Mod 已上传并发布', 'Mod 已上傳並發布', 'Mod uploaded & published', 'Мод загружен'],
        modmgr_not_ready: ['ModManager 未就绪', 'ModManager 未就緒', 'ModManager not ready', 'ModManager не готов'],
        zip_parser_not_loaded: ['ZIP 解析组件未加载', 'ZIP 解析組件未載入', 'ZIP parser not loaded', 'ZIP-парсер не загружен'],
        publishing_mod: ['发布模组：', '發布模組：', 'Publishing mod: ', 'Публикация мода: '],
        uploading_file: ['上传文件 ', '上傳檔案 ', 'Uploading file ', 'Загрузка файла '],
        uploading_modfile: ['上传模组文件 ', '上傳模組檔案 ', 'Uploading mod file ', 'Загрузка файла мода '],
        start_upload: ['开始上传：', '開始上傳：', 'Start upload: ', 'Начало загрузки: '],
        upload_ok: ['✅ 上传成功：', '✅ 上傳成功：', '✅ Upload success: ', '✅ Загружено: '],
        ip_unlocked_msg: ['「物品池管理」已解锁', '「物品池管理」已解鎖', '“Item Pool” unlocked', '«Склад» открыт'],
        all_routes_failed: ['全部下载线路失败', '全部下載線路失敗', 'All download routes failed', 'Все каналы недоступны'],
        restored_: ['已恢复', '已恢復', 'Restored', 'Восстановлено']
    };

    var cur = 'zh-CN';
    try {
        var saved = localStorage.getItem(LANG_KEY);
        if (saved && LANGS.indexOf(saved) !== -1) cur = saved;
    } catch (e) {}

    function idx() { return LANG_INDEX[cur] || 0; }

    // 反查索引：zh-CN 原文 → key（供 I18N.tr(中文) 使用）
    var REV = {};
    for (var __k in M) REV[M[__k][0]] = __k;

    // 前缀规则：拼接型文案（如「已安装「X」」「下载失败：e」），只译前缀，保留后段
    var PREFIX = [
        ['已安装「', ['已安装「', '已安裝「', 'Installed 「', 'Установлено 「']],
        ['已导入「', ['已导入「', '已匯入「', 'Imported 「', 'Импортировано 「']],
        ['已安装 ', ['已安装 ', '已安裝 ', 'Installed ', 'Установлено ']],
        ['已导入 ', ['已导入 ', '已匯入 ', 'Imported ', 'Импортировано ']],
        ['下载失败：', ['下载失败：', '下載失敗：', 'Download failed: ', 'Ошибка загрузки: ']],
        ['导入失败：', ['导入失败：', '匯入失敗：', 'Import failed: ', 'Ошибка импорта: ']],
        ['删除失败：', ['删除失败：', '刪除失敗：', 'Delete failed: ', 'Ошибка удаления: ']],
        ['保存失败：', ['保存失败：', '儲存失敗：', 'Save failed: ', 'Ошибка сохранения: ']],
        ['完成：', ['完成：', '完成：', 'Done: ', 'Готово: ']],
        ['全部下载完成', ['全部下载完成', '全部下載完成', 'All downloads done', 'Всё скачано']],
        ['已用 ', ['已用 ', '已用 ', 'Used ', 'Использован ']],
        ['欢迎，', ['歡迎，', 'Welcome, ', 'Добро пожаловать, ']],
        ['需下载', ['需下載', 'Need download', 'Нужно скачать']],
        ['确定删除「', ['确定删除「', '確定刪除「', 'Confirm delete 「', 'Удалить «']],
        ['已删除（', ['已删除（', '已刪除（', 'Deleted (', 'Удалено (']],
        ['已启用「', ['已启用「', '已啟用「', 'Enabled 「', 'Включено «']],
        ['已停用「', ['已停用「', '已停用「', 'Disabled 「', 'Отключено «']],
        ['已复制：', ['已复制：', '已複製：', 'Copied: ', 'Скопировано: ']],
        ['当前已喜好 ', ['当前已喜好 ', '當前已喜好 ', 'Favorited ', 'В избранном ']],
        ['购买失败', ['购买失败', '購買失敗', 'Purchase failed', 'Ошибка покупки']],
        ['六种样本已全部合成', ['六种样本已全部合成', '六種樣本已全部合成', 'All six samples synthesized', 'Все шесть образцов']],
        ['第一次获取:', ['第一次获取:', '第一次獲取:', 'First obtained:', 'Впервые получено:']],
        ['已合成 ', ['已合成 ', '已合成 ', 'Synthesized ', 'Синтезировано ']],
        ['第 ', ['第 ', '第 ', 'No. ', '№ ']],
        ['· 共 ', ['· 共 ', '· 共 ', '· Total ', '· Всего ']],
        ['全部下载完成 (', ['全部下载完成 (', '全部下載完成 (', 'All downloads done (', 'Всё скачано (']],
        ['已恢复 ', ['已恢復 ', 'Restored ', 'Восстановлено ']]
    ];

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
        // 按中文原文反查：命中则当前语言文案，未命中原样返回（安全回退）
        tr: function (zh) {
            var s = String(zh == null ? '' : zh);
            var k = REV[s];
            if (k) return I18N.t(k);
            // 前缀规则（拼接型）
            for (var i = 0; i < PREFIX.length; i++) {
                var pre = PREFIX[i][0];
                if (s.indexOf(pre) === 0) return PREFIX[i][1][idx()] + s.slice(pre.length);
            }
            return zh;
        },
        has: function (key) { var r = M[key]; return !!(r && (r[idx()] || r[0])); },
        addEntries: function (obj) { // 允许后续文件扩展词表
            for (var k in obj) if (obj.hasOwnProperty(k)) { M[k] = obj[k]; if (obj[k] && obj[k][0] != null) REV[obj[k][0]] = k; }
        },
        setLang: function (lang, silent) {
            if (LANGS.indexOf(lang) === -1) return;
            cur = lang;
            try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
            try { document.documentElement.setAttribute('lang', cur === 'zh-TW' ? 'zh-Hant' : cur); } catch (e) {}
            if (!silent) {
                I18N.translateStatic();
                try { if (I18N.translateAll) I18N.translateAll(); } catch (e) {}
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
            try { if (I18N.translateAll) I18N.translateAll(); } catch (e) {}
            try { if (I18N.startObserver) I18N.startObserver(); } catch (e) {}
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

    /* ===== 自动翻译层：遍历文本节点 + MutationObserver =====
     * 只要文本（trim 后）命中词表中文原文，就按当前语言替换；
     * 覆盖静态 HTML、弹窗内容、JS 重渲染后的节点；切换语言时先还原再重译。 */
    function _skipParent(node) {
        var p = node.parentNode;
        while (p) {
            var n = p.nodeName ? p.nodeName.toUpperCase() : '';
            if (n === 'SCRIPT' || n === 'STYLE' || n === 'TEXTAREA' || n === 'INPUT' || n === 'NOSCRIPT') return true;
            p = p.parentNode;
        }
        return false;
    }
    function _translateTextNode(node) {
        if (!node || node.nodeType !== 3 || _skipParent(node)) return;
        if (I18N.getLang() === 'zh-CN') return; // 默认语言无需翻译，省开销
        var cur = node.nodeValue;
        if (cur == null) return;
        var trimmed = cur.trim();
        if (!trimmed) return;
        var targetTr = null;
        var key = REV[trimmed];
        if (key) targetTr = I18N.t(key);
        else {
            for (var i = 0; i < PREFIX.length; i++) {
                var pre0 = PREFIX[i][0];
                if (trimmed.indexOf(pre0) === 0) { targetTr = PREFIX[i][1][idx()] + trimmed.slice(pre0.length); break; }
            }
        }
        if (targetTr == null) return;
        var preWs = (cur.match(/^\s*/) || [''])[0];
        var postWs = (cur.match(/\s*$/) || [''])[0];
        var target = preWs + targetTr + postWs;
        if (cur !== target) {
            if (node.__i18nOrig == null) node.__i18nOrig = trimmed;
            node.nodeValue = target;
        }
    }
    function _walkTranslate(root) {
        if (!root) return;
        if (root.nodeType === 3) { _translateTextNode(root); return; }
        if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
        try {
            var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
            var n;
            while ((n = walker.nextNode())) _translateTextNode(n);
        } catch (e) {}
    }
    // 属性翻译：placeholder / title / img[alt]
    function _translateAttrs(root) {
        if (!root || !root.querySelectorAll) return;
        var els = root.querySelectorAll('[placeholder],[title],img[alt]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            for (var a = 0; a < 3; a++) {
                var attr = a === 0 ? 'placeholder' : (a === 1 ? 'title' : 'alt');
                if (!el.hasAttribute || !el.hasAttribute(attr)) continue;
                var v = el.getAttribute(attr);
                if (!v) continue;
                var k = REV[v.trim()];
                if (!k) continue;
                var tr = I18N.t(k);
                if (v !== tr) {
                    el.__i18nAttrOrig = el.__i18nAttrOrig || {};
                    if (el.__i18nAttrOrig[attr] == null) el.__i18nAttrOrig[attr] = v;
                    el.setAttribute(attr, tr);
                }
            }
        }
    }
    I18N.translateAll = function () {
        if (!document.body) return;
        var walker, n;
        var list = [];
        try {
            walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
            while ((n = walker.nextNode())) list.push(n);
        } catch (e) { return; }
        // 先还原成中文原文
        for (var i = 0; i < list.length; i++) {
            if (list[i].__i18nOrig != null) { list[i].nodeValue = list[i].__i18nOrig; list[i].__i18nOrig = null; }
        }
        // 再按当前语言翻译
        for (var j = 0; j < list.length; j++) _translateTextNode(list[j]);
        // 属性：先还原再翻译
        try {
            var all = document.body.getElementsByTagName('*');
            for (var e = 0; e < all.length; e++) {
                var el = all[e];
                if (el.__i18nAttrOrig) {
                    for (var at in el.__i18nAttrOrig) { if (el.__i18nAttrOrig.hasOwnProperty(at)) el.setAttribute(at, el.__i18nAttrOrig[at]); }
                    el.__i18nAttrOrig = null;
                }
            }
        } catch (e2) {}
        _translateAttrs(document.body);
    };
    I18N.startObserver = function () {
        if (I18N._obs || !window.MutationObserver || !document.body) return;
        I18N._obs = new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var m = muts[i];
                if (m.type === 'childList') {
                    for (var j = 0; j < m.addedNodes.length; j++) {
                        var nd = m.addedNodes[j];
                        if (nd.nodeType === 1) { _walkTranslate(nd); _translateAttrs(nd); }
                        else if (nd.nodeType === 3) _translateTextNode(nd);
                    }
                } else if (m.type === 'characterData') {
                    _translateTextNode(m.target);
                }
            }
        });
        I18N._obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    };

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
