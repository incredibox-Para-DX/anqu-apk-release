
(function () {
    var LANG_KEY = 'ab_app_lang';
    var LANGS = ['zh-CN', 'zh-TW', 'en', 'ru'];
    var LANG_INDEX = { 'zh-CN': 0, 'zh-TW': 1, 'en': 2, 'ru': 3 };

    var M = {
        
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

        
        nav_more: ['更多功能', '更多功能', 'More', 'Ещё'],
        sec_personal: ['个人数据', '個人數據', 'Profile', 'Профиль'],
        sec_gm: ['GM Debug', 'GM Debug', 'GM Debug', 'GM Debug'],
        sec_other: ['其他功能', '其他功能', 'Other', 'Другое'],
        sec_music: ['背景音乐', '背景音樂', 'Music', 'Музыка'],
        sec_settings: ['更多设置', '更多設置', 'Settings', 'Настройки'],
        sec_info: ['更多信息', '更多信息', 'More Info', 'Подробнее'],

        
        rank: ['段位', '段位', 'Rank', 'Звание'],
        uid: ['UID', 'UID', 'UID', 'UID'],
        total_value: ['总累计价值', '總累計價值', 'Total Value', 'Совокупная ценность'],
        weekly_value: ['本周累计价值', '本週累計價值', 'Weekly Value', 'Недельная ценность'],
        your_nickname: ['你的昵称', '你的暱稱', 'Your nickname', 'Ваш ник'],
        edit_nickname: ['修改昵称', '修改暱稱', 'Edit nickname', 'Изменить ник'],
        next_rank: ['下一个段位进度', '下一個段位進度', 'Next rank progress', 'До следующего звания'],
        cur_rank: ['当前段位', '當前段位', 'Current rank', 'Текущее звание'],

        
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

        
        gm_edit_value: ['编辑总累计价值', '編輯總累計價值', 'Edit total value', 'Правка ценности'],
        gm_hotupdate: ['私链热更新', '私鏈熱更新', 'Private hot-update', 'Секр. апдейт'],
        gm_resource: ['资源管理', '資源管理', 'Resources', 'Ресурсы'],
        gm_board: ['榜单管理', '榜單管理', 'Leaderboard', 'Рейтинг'],
        gm_upload: ['Mod上传', 'Mod上傳', 'Upload Mod', 'Загрузить'],
        gm_center: ['弹窗中心', '彈窗中心', 'Modals', 'Окна'],

        
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

        
        rar_white: ['白色', '白色', 'White', 'Белый'],
        rar_orange: ['橙色', '橙色', 'Orange', 'Оранжевый'],
        rar_purple: ['紫色', '紫色', 'Purple', 'Фиолетовый'],
        rar_red: ['红色', '紅色', 'Red', 'Красный'],
        rar_gold: ['金色', '金色', 'Gold', 'Золотой'],
        collectible: ['收藏品', '收藏品', 'Collectible', 'Коллекц.'],
        cohen: ['柯恩币', '柯恩幣', 'Koen Coin', 'Монета Кён'],

        
        rank_0: ['暗区新锐', '暗區新銳', 'Recruit', 'Новобранец'],
        rank_1: ['暗区尖兵', '暗區尖兵', 'Vanguard', 'Вангард'],
        rank_2: ['暗区精英', '暗區精英', 'Elite', 'Элита'],
        rank_3: ['暗区专家', '暗區專家', 'Expert', 'Эксперт'],
        rank_4: ['暗区大师', '暗區大師', 'Master', 'Мастер'],
        rank_5: ['暗区王牌', '暗區王牌', 'Ace', 'Ас'],
        rank_6: ['暗区传说', '暗區傳說', 'Legend', 'Легенда'],

        
        lang_zhcn: ['简体中文', '簡體中文', 'Simplified', 'Кит. (упр.)'],
        lang_zhtw: ['繁體中文', '繁體中文', 'Traditional', 'Кит. (трад.)'],
        lang_en: ['English', 'English', 'English', 'English'],
        lang_ru: ['Русский', 'Русский', 'Русский', 'Русский'],

        
        mod_mine: ['我的MOD', '我的MOD', 'My Mods', 'Мои MOD'],
        mod_store: ['MOD市场', 'MOD市場', 'MOD Store', 'Магазин'],
        mod_import: ['从本地导入MOD', '從本地匯入MOD', 'Import from device', 'С устройства'],
        mod_detail: ['模组详情', '模組詳情', 'Details', 'Детали'],
        mod_search_ph: ['搜索模组名称 / 简介 / 作者', '搜尋模組名稱 / 簡介 / 作者', 'Search name/desc/author', 'Поиск'],
        mod_all: ['全部', '全部', 'All', 'Все'],
        mod_item: ['物品', '物品', 'Item', 'Предмет'],
        mod_music: ['音乐', '音樂', 'Music', 'Музыка'],
        mod_bg: ['背景', '背景', 'Background', 'Фон'],
        store_sort_default: ['默认', '預設', 'Default', 'По умолч.'],
        store_sort_new: ['最新', '最新', 'Newest', 'Новые'],
        store_sort_hot: ['最热', '最熱', 'Hottest', 'Популярные'],
        store_refresh: ['刷新', '刷新', 'Refresh', 'Обновить'],
        store_filter_toggle: ['筛选 / 排序', '篩選 / 排序', 'Filter / Sort', 'Фильтр / Сортировка'],

        
        redeem_title: ['兑换码', '兌換碼', 'Redeem', 'Коды'],
        redeem_ph: ['请输入兑换码', '請輸入兌換碼', 'Enter a code', 'Введите код'],
        redeem_confirm: ['确认兑换', '確認兌換', 'Redeem', 'Активировать'],
        redeem_desc: ['输入兑换码可获得对应奖励，每个兑换码仅可使用一次。',
            '輸入兌換碼可獲得對應獎勵，每個兌換碼僅可使用一次。',
            'Enter a code to get a reward. Each code works once.',
            'Код даёт награду, действует один раз.'],

        
        ip_unlocked: ['未解锁', '未解鎖', 'Locked', 'Закрыто'],
        ip_sponsor: ['解锁「物品池管理」需赞助', '解鎖「物品池管理」需贊助', 'Unlock Item Pool via sponsor', 'Доступ по спонсору'],
        ip_gocode: ['在「兑换码」中输入即可解锁。', '在「兌換碼」中輸入即可解鎖。', 'Redeem a code to unlock.', 'Введите код, чтобы открыть.'],

        
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

        
        t_m_saved: ['已保存修改', '已儲存修改', 'Changes saved', 'Изменено'],
        t_m_del: ['已删除本地音乐', '已刪除本地音樂', 'Local music deleted', 'Удалено'],
        t_m_unlock: ['已解锁', '已解鎖', 'Unlocked', 'Открыто'],
        t_m_play: ['播放', '播放', 'Play', 'Играть'],
        t_m_locked: ['该歌曲未解锁, 需在播放列表中购买', '該歌曲未解鎖, 需在播放列表中購買', 'Track locked; buy in playlist', 'Трек заблокирован'],
        t_m_import_fail: ['导入失败，可能是存储空间不足或格式不支持', '匯入失敗，可能是儲存空間不足或格式不支持', 'Import failed (space/format)', 'Ошибка импорта'],
        t_m_buy: ['购买', '購買', 'Buy', 'Купить'],
        t_m_imported: ['已导入', '已匯入', 'Imported', 'Импортировано'],

        
        t_mod_deleted: ['已删除', '已刪除', 'Deleted', 'Удалено'],
        t_mod_used: ['已用', '已用', 'Used', 'Использован'],
        t_mod_verifying: ['正在校验并安装…', '正在校驗並安裝…', 'Verifying & installing…', 'Проверка…'],
        t_mod_pick_zip: ['请选择 zip 文件', '請選擇 zip 檔案', 'Select a zip file', 'Выберите zip'],
        t_mod_link_copied: ['链接已复制', '連結已複製', 'Link copied', 'Ссылка скопирована'],
        t_mod_installed: ['已安装', '已安裝', 'Installed', 'Установлено'],
        t_mod_imported: ['已导入', '已匯入', 'Imported', 'Импортировано'],

        
        pool_all_off: ['全部禁用', '全部禁用', 'Disable all', 'Выкл. все'],
        pool_all_on: ['全部启用', '全部啟用', 'Enable all', 'Вкл. все'],
        mod_doc_item: ['物品类 mod.json 写法', '物品類 mod.json 寫法', 'Item mod.json guide', 'Item mod.json'],
        mod_doc_music: ['音乐类 mod.json 写法', '音樂類 mod.json 寫法', 'Music mod.json guide', 'Music mod.json'],
        mod_doc_bg: ['背景类 mod.json 写法', '背景類 mod.json 寫法', 'BG mod.json guide', 'BG mod.json'],

        
        t_synth_selected: ['已选中', '已選中', 'Selected', 'Выбрано'],
        t_synth_done: ['六种样本已全部合成', '六種樣本已全部合成', 'All six samples synthesized', 'Все образцы'],

        
        set_fps_lag: ['高帧率', '高幀率', 'High FPS', 'Выс. FPS'],
        set_fps_smooth: ['流畅', '流暢', 'Smooth', 'Плавный'],
        set_vol_label: ['音量', '音量', 'Volume', 'Громкость'],
        music_now_selected: ['未选择歌曲', '未選擇歌曲', 'No song selected', 'Нет песни'],
        music_now_hint: ['请选择一首歌曲', '請選擇一首歌曲', 'Pick a song', 'Выберите песню'],
        music_mode: ['顺序播放', '順序播放', 'Sequential', 'По порядку'],
        music_playlist: ['播放列表', '播放列表', 'Playlist', 'Плейлист'],
        music_playlist_empty: ['播放列表为空', '播放列表為空', 'Playlist is empty', 'Плейлист пуст'],
        music_search_ph: ['搜索物品名称...', '搜尋物品名稱...', 'Search items...', 'Поиск...'],

        
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

        
        b_upload: ['上传', '上傳', 'Upload', 'Загрузить'],
        b_preview: ['预览', '預覽', 'Preview', 'Просмотр'],
        b_clear: ['清除', '清除', 'Clear', 'Очистить'],
        b_import: ['导入', '匯入', 'Import', 'Импорт'],
        b_save_short: ['保存', '儲存', 'Save', 'Сохранить'],
        b_confirm_edit: ['确认修改', '確認修改', 'Confirm', 'Подтвердить'],
        b_refresh: ['刷新', '刷新', 'Refresh', 'Обновить'],
        b_locked: ['未解锁', '未解鎖', 'Locked', 'Закрыто'],
        b_next: ['下一个', '下一個', 'Next', 'Далее'],

        
        title_cur: ['当前段位', '當前段位', 'Current rank', 'Текущее звание'],
        title_next_progress: ['下一个段位进度', '下一個段位進度', 'Next rank progress', 'До след. звания'],
        title_dl_icons: ['下载段位图标资源包', '下載段位圖示資源包', 'Download rank icons', 'Скачать значки'],
        title_icons_all: ['段位图标资源包已全部下载', '段位圖示資源包已全部下載', 'Rank icons downloaded', 'Значки скачаны'],
        title_icons_desc: ['包含个人信息里全部段位徽章图标', '包含個人信息裡全部段位徽章圖示', 'All rank badge icons', 'Все значки званий'],
        lb_week: ['本周排行榜', '本週排行榜', 'Weekly ranking', 'Рейтинг недели'],
        lb_submit_weekly: ['提交本周累计价值上榜', '提交本週累計價値上榜', 'Submit to weekly board', 'В рейтинг недели'],

        
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

        
        set_flash: ['物品闪光特效', '物品閃光特效', 'Item flash FX', 'Эффект лута'],
        set_sample_refresh: ['样本是否刷新', '樣本是否刷新', 'Refresh samples', 'Обновление'],

        
        mod_upload_notice: ['上传须知（违反无法通过审核）', '上傳須知（違反無法通過審核）', 'Upload rules', 'Правила'],
        mod_no_violate: ['名称与描述不得包含违规内容', '名稱與描述不得包含違規內容', 'No violating names/desc', 'Без нарушений'],
        mod_value_limit: ['物品 value 上限 4,000,000', '物品 value 上限 4,000,000', 'Item value ≤ 4,000,000', 'value ≤ 4 000 000'],
        mod_sound_opt: ['可选：物品支持音效字段 sound（mp3/wav/ogg）', '可選：物品支持音效欄位 sound（mp3/wav/ogg）', 'Optional: sound (mp3/wav/ogg)', 'Опц.: sound'],
        mod_thumb_rule: ['thumb.png、avatar.png 必填；screen 最多 3 张', 'thumb.png、avatar.png 必填；screen 最多 3 張', 'thumb/avatar required; ≤3 screens', 'thumb/avatar обязат.'],
        mod_zip_rule: ['选中里面的文件打包，不要连外层文件夹', '選中裡面的檔案打包，不要連外層資料夾', 'Zip inner files only', 'Только файлы'],
        mod_contact: ['作品投稿 QQ：', '作品投稿 QQ：', 'Submit via QQ:', 'Подача: QQ'],

        
        nick_yours: ['你的昵称', '你的暱稱', 'Your nickname', 'Ваш ник'],
        nick_edit: ['修改昵称', '修改暱稱', 'Edit nickname', 'Изменить ник'],
        nick_new_ph: ['输入新昵称', '輸入新暱稱', 'Enter new nickname', 'Новый ник'],
        count_left: ['获取次数:', '獲取次數:', 'Obtained:', 'Получено:'],
        not_generated2: ['尚未生成', '尚未生成', 'Not generated', 'Не создано'],
        need_download: ['需下载', '需下載', 'Download', 'Скачать'],

        
        synth_centrifuge: ['离心机', '離心機', 'Centrifuge', 'Центрифуга'],
        synth_again: ['重新合成', '重新合成', 'Re-synthesize', 'Заново'],
        synth_sample: ['样本', '樣本', 'Sample', 'Образец'],
        synth_done_banner: ['合成完成', '合成完成', 'Synthesis complete', 'Готово'],
        synth_incubator: ['保温箱', '保溫箱', 'Incubator', 'Инкубатор'],
        synth_els: ['ELS还原样本', 'ELS還原樣本', 'ELS sample', 'ELS-образец'],
        synth_drag_hint: ['到保温箱进行合成', '到保溫箱進行合成', 'into the incubator to synthesize', 'в инкубатор для синтеза'],
        synth_count_label: ['已合成', '已合成', 'Synthesized', 'Синтезировано'],

        
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
        skill_destiny_desc: ['连续开保险未出橙色/红色道具时，第10次必出橙色及以上；触发保底后下次保底次数-1（最低3次）。若在保底前就开出橙/红，保底重置为10次。兑换码获取：前往交流群 1082453829', '連續開保險未出橙色/紅色道具時，第10次必出橙色及以上；觸發保底後下次保底次數-1（最低3次）。若在保底前就開出橙/紅，保底重置為10次。兌換碼獲取：前往交流群 1082453829', 'If consecutive safe searches yield no orange/red items, the 10th is guaranteed orange or above; after a pity trigger the next threshold decreases by 1 (min 3). If orange/red appears before the pity, it resets to 10. Redeem code: join QQ group 1082453829', 'Если подряд не выпадают оранжевые/красные предметы, 10-й будет оранжевым или выше; после срабатывания порог уменьшается на 1 (мин. 3). Если оранжевый/красный выпал раньше — сброс до 10. Код: в QQ-группе 1082453829'],
        skill_destiny_d: ['连续开保险未出橙色/红色道具时，第10次必出橙色及以上；触发保底后下次保底次数-1（最低3次）。若在保底前就开出橙/红，保底重置为10次', '連續開保險未出橙色/紅色道具時，第10次必出橙色及以上；觸發保底後下次保底次數-1（最低3次）。若在保底前就開出橙/紅，保底重置為10次', 'If 10 opens yield no orange/red, guarantee orange+; after triggering, threshold -1 (min 3). Orange/red before threshold resets to 10.', 'Если 10 открытий без оранж./красного — гарантия оранж.+; после срабатывания порог -1 (мин 3).'],
        skill_owned: ['已拥有', '已擁有', 'Owned', 'В наличии'],
        skill_left: ['剩余次数', '剩餘次數', 'Uses left', 'Осталось'],
        skill_redeem: ['兑换码解锁', '兌換碼解鎖', 'Redeem to unlock', 'Открыть кодом'],
        skill_redeem_hint: ['该技能需通过兑换码解锁，请查看技能描述', '該技能需通過兌換碼解鎖，請查看技能描述', 'Unlock via redeem code; see description', 'Откройте кодом'],

        
        up_checking: ['正在检查更新…', '正在檢查更新…', 'Checking for updates…', 'Проверка обновлений…'],
        up_found: ['发现新版本', '發現新版本', 'New version found', 'Новая версия'],
        up_cur: ['当前版本：', '當前版本：', 'Current: ', 'Текущая: '],
        up_latest: ['最新版本：', '最新版本：', 'Latest: ', 'Последняя: '],
        up_is_latest: ['当前已是最新版本', '當前已是最新版本', 'Already up to date', 'Уже последняя версия'],
        up_downloading: ['正在下载更新包，请稍候…', '正在下載更新包，請稍候…', 'Downloading update, please wait…', 'Загрузка обновления…'],
        up_no_exit: ['更新过程中请勿退出', '更新過程中請勿退出', 'Do not exit during update', 'Не выходите'],
        up_done_refresh: ['更新完成，正在刷新…', '更新完成，正在刷新…', 'Update done, refreshing…', 'Готово, обновление…'],
        up_fail_net: ['检查失败：无法连接更新服务器', '檢查失敗：無法連接更新伺服器', 'Check failed: no server', 'Ошибка: нет сервера'],

        
        credits_title: ['制作人员列表', '製作人員列表', 'Credits', 'Авторы'],
        donate_title: ['赞赏本项目', '讚賞本項目', 'Support us', 'Поддержать проект'],
        credits_avatar: ['制作人员头像', '製作人員頭像', 'Staff avatar', 'Аватар автора'],
        notice_loading: ['公告加载中...', '公告載入中...', 'Loading announcement...', 'Загрузка объявления...'],

        
        res_dl_pack: ['下载资源包', '下載資源包', 'Download pack', 'Скачать пакет'],
        res_dl_minigame: ['下载小游戏资源包', '下載小遊戲資源包', 'Download mini-game pack', 'Скачать мини-игру'],
        ph_value: ['例如：500000、1.5M、200K', '例如：500000、1.5M、200K', 'e.g. 500000, 1.5M, 200K', 'напр. 500000, 1.5M, 200K'],
        ph_nick_rank: ['输入昵称参与排行', '輸入昵稱參與排行', 'Enter nickname to rank', 'Введите ник'],
        ph_item_search: ['搜索物品名称...', '搜尋物品名稱...', 'Search items...', 'Поиск предметов...'],

        
        role_main: ['主程序＆主设计', '主程式＆主設計', 'Lead Programmer & Designer', 'Гл. программист и дизайнер'],
        role_test: ['测试', '測試', 'Testing', 'Тестирование'],
        role_edit: ['编辑', '編輯', 'Editing', 'Редактура'],
        role_vocal: ['声乐', '聲樂', 'Vocals', 'Вокал'],
        role_promo: ['宣传', '宣傳', 'Promotion', 'Промо'],
        role_lead: ['项目负责', '項目負責', 'Project Lead', 'Руководитель'],
        role_studio: ['魔方工作室群暗区突围项目组', '魔方工作室群暗區突圍項目組', 'MoreFun Studios · Arena Breakout', 'MoreFun Studios · Arena Breakout'],
        skill_purchased: ['已购买', '已購買', 'Purchased', 'Куплено'],
        skill_permanent: ['永久', '永久', 'Permanent', 'Навсегда'],
        skill_out_of_uses: ['次数已用完，可重新购买', '次數已用完，可重新購買', 'Out of uses; buy again', 'Лимит исчерпан'],
        skill_at_limit: ['次数已达上限(100)，需使用至80次以下才能购买', '次數已達上限(100)，需使用至80次以下才能購買', 'At limit (100); use below 80 to buy', 'Лимит 100; используйте до 80'],
        t_safe_no_space: ['保险放不下该物品', '保險放不下該物品', 'Not enough space in the safe', 'Нет места в сейфе'],
        t_safe_busy: ['保险正在搜索中，请稍后再试', '保險正在搜尋中，請稍後再試', 'Safe is being searched; retry later', 'Идёт поиск в сейфе'],
        t_enter_qty: ['请输入有效数量', '請輸入有效數量', 'Enter a valid amount', 'Введите количество'],
        t_rotate: ['请转动设备', '請轉動設備', 'Please rotate your device', 'Поверните устройство'],
        t_game_not_ready: ['游戏状态未就绪，请先手动打开一次保险', '遊戲狀態未就緒，請先手動打開一次保險', 'Game not ready; open the safe once first', 'Игра не готова; откройте сейф'],
        t_grid_not_found: ['未找到保险网格，请先打开一次保险', '未找到保險網格，請先打開一次保險', 'Safe grid not found; open the safe first', 'Сетка сейфа не найдена'],
        t_saved: ['已保存', '已儲存', 'Saved', 'Сохранено'],
        t_copied: ['已复制', '已複製', 'Copied', 'Скопировано'],
        t_failed: ['失败', '失敗', 'Failed', 'Ошибка'],
        t_save_imported: ['存档已导入 (建议刷新)', '存檔已匯入 (建議刷新)', 'Save imported (refresh recommended)', 'Сохранение импортировано'],
        t_save_exported: ['存档已导出到文本框', '存檔已匯出到文字框', 'Save exported to text box', 'Сохранение экспортировано'],
        t_save_cleared: ['存档已清空, 刷新页面生效', '存檔已清空, 刷新頁面生效', 'Save cleared; refresh to apply', 'Сохранение очищено'],
        t_all_skills: ['全部技能已解锁 (需刷新页面生效)', '全部技能已解鎖 (需刷新頁面生效)', 'All skills unlocked (refresh to apply)', 'Все навыки открыты'],
        res_tip: ['由于使用国外服务器可能会出现卡顿，请在良好WI-FI网络环境下进行下载，可以搭配游戏加速器进行下载，如遇卡顿无法下载请更换网络环境或切换移动数据尝试', '由於使用國外伺服器可能會出現卡頓，請在良好WI-FI網絡環境下進行下載，可以搭配遊戲加速器進行下載，如遇卡頓無法下載請更換網絡環境或切換移動數據嘗試', 'Using a foreign server may lag; download on a good Wi-Fi network. A game accelerator helps. If it stalls, switch networks or mobile data.', 'Зарубежный сервер может тормозить; скачивайте по хорошему Wi-Fi. Может помочь ускоритель.'],
        luck_tip: ['运气也是实力的一部分', '運氣也是實力的一部分', 'Luck is part of skill', 'Удача — тоже навык'],
        moddoc_rarity_note: ['物品 rarity 只能是 purple / gold / orange / red；width 1~5、height 1~6', '物品 rarity 只能是 purple / gold / orange / red；width 1~5、height 1~6', 'Item rarity: purple/gold/orange/red; width 1~5, height 1~6', 'rarity: purple/gold/orange/red; width 1~5, height 1~6'],

        
        tip_noluck: ['没出货多摸就有了', '沒出貨多摸就有了', 'No luck? Just keep searching.', 'Нет дропа — ищите ещё.'],
        tip_leaderboard: ['"更多"中有周排行榜，欢迎各位积极参与', '"更多"中有週排行榜，歡迎各位積極參與', 'Weekly leaderboard is under "More" — join in!', 'Рейтинг недели в «Ещё»'],
        tip_credits: ['制作人员名单中有社媒传送门哦', '製作人員名單中有社媒傳送門哦', 'Social links are in the Credits.', 'Соцсети — в разделе авторов.'],
        tip_free: ['此软件完全免费，圈钱的圈一分死一个亩', '此軟件完全免費，圈錢的圈一分死一個畝', 'This app is completely free.', 'Приложение полностью бесплатное.'],

        
        special_thanks: ['特别感谢', '特別感謝', 'Special Thanks', 'Особая благодарность'],
        redeem_camona: ['兑换成功！累计价值 +20M', '兌換成功！累計價值 +20M', 'Redeemed! Total value +20M', 'Активировано! Ценность +20M'],
        net_down: ['网络断开', '網絡斷開', 'Network disconnected', 'Сеть отключена'],
        net_error: ['网络异常', '網絡異常', 'Network error', 'Ошибка сети'],
        net_restored: ['网络恢复', '網絡恢復', 'Network restored', 'Сеть восстановлена'],

        
        gm_turbo_confirm: ['开启极速模式将解锁「迅捷巧手」+「物资潮汐」并刷新页面，确定?', '開啟極速模式將解鎖「迅捷巧手」+「物資潮汐」並刷新頁面，確定?', 'Turbo mode unlocks Swift Hands + Supply Tide and reloads the page. Continue?', 'Турбо-режим откроет навыки и перезагрузит. Продолжить?'],
        gm_reset_value: ['确定清零累计价值?', '確定清零累計價值?', 'Reset total value?', 'Сбросить ценность?'],
        gm_reset_skills: ['重置全部技能?', '重置全部技能?', 'Reset all skills?', 'Сбросить все навыки?'],
        gm_clear_mock: ['清空全部Mock规则?', '清空全部Mock規則?', 'Clear all Mock rules?', 'Очистить правила Mock?'],
        gm_clear_saves: ['确定清空全部游戏存档? 此操作不可撤销', '確定清空全部遊戲存檔? 此操作不可撤銷', 'Clear all game saves? This cannot be undone.', 'Очистить все сохранения? Необратимо.'],
        gm_name_code_req: ['名称和代码不能为空', '名稱和代碼不能為空', 'Name and code are required', 'Нужны имя и код'],
        gm_enter_url: ['请输入匹配URL', '請輸入匹配URL', 'Enter a matching URL', 'Введите URL'],
        gm_pick_element: ['点击元素测量', '點擊元素測量', 'Pick element to measure', 'Выбрать элемент'],
        gm_highlight_clickable: ['高亮可点击元素', '高亮可點擊元素', 'Highlight clickable', 'Подсветить кликабельные'],
        gm_select_colon: ['选取:', '選取:', 'Select: ', 'Выбор: '],
        gm_element: ['元素:', '元素:', 'Element: ', 'Элемент: '],
        gm_element_total: ['元素总数:', '元素總數:', 'Total elements: ', 'Всего элементов: '],
        gm_globals: ['全局变量', '全局變數', 'Global variables', 'Глобальные'],
        gm_callstack: ['调用栈样本', '調用棧樣本', 'Call stack sample', 'Стек вызовов'],
        gm_uncaught: ['未捕获错误数:', '未捕獲錯誤數:', 'Uncaught errors: ', 'Необработанных: '],
        gm_mem_trend_on: ['内存趋势: 开', '記憶體趨勢: 開', 'Memory trend: on', 'Память: вкл'],
        gm_mem_trend_off: ['内存趋势: 关', '記憶體趨勢: 關', 'Memory trend: off', 'Память: выкл'],
        gm_night_on: ['夜间: 开', '夜間: 開', 'Night: on', 'Ночь: вкл'],
        gm_night_off: ['夜间: 关', '夜間: 關', 'Night: off', 'Ночь: выкл'],
        gm_auto_safe_on: ['自动开保险: 开', '自動開保險: 開', 'Auto-open safe: on', 'Авто-сейф: вкл'],
        gm_auto_safe_off: ['自动开保险: 关', '自動開保險: 關', 'Auto-open safe: off', 'Авто-сейф: выкл'],
        gm_longtask_on: ['长任务: 开', '長任務: 開', 'Long tasks: on', 'Длинные задачи: вкл'],
        gm_longtask_off: ['长任务: 关', '長任務: 關', 'Long tasks: off', 'Длинные задачи: выкл'],
        gm_charging: ['充电中', '充電中', 'Charging', 'Зарядка'],
        gm_battery: ['电量:', '電量:', 'Battery: ', 'Батарея: '],
        gm_proxy: ['代理:', '代理:', 'Proxy: ', 'Прокси: '],
        gm_protocol: ['协议:', '協議:', 'Protocol: ', 'Протокол: '],
        gm_domain: ['域名:', '域名:', 'Domain: ', 'Домен: '],
        gm_font: ['字体:', '字體:', 'Font: ', 'Шрифт: '],
        gm_accuracy: ['精度:±', '精度:±', 'Accuracy: ±', 'Точность: ±'],
        gm_lng: ['经度:', '經度:', 'Longitude: ', 'Долгота: '],
        gm_lat: ['纬度:', '緯度:', 'Latitude: ', 'Широта: '],
        gm_nodes: ['节点数:', '節點數:', 'Nodes: ', 'Узлы: '],
        gm_resources: ['资源数:', '資源數:', 'Resources: ', 'Ресурсы: '],
        gm_path: ['路径:', '路徑:', 'Path: ', 'Путь: '],
        gm_params: ['参数:', '參數:', 'Params: ', 'Параметры: '],
        gm_storage_change: ['存储变化', '存儲變化', 'Storage change', 'Изменение хранилища'],
        gm_del_storage: ['删除存储:', '刪除存儲:', 'Delete storage: ', 'Удалить хранилище: '],
        gm_clear_storage: ['清空存储:', '清空存儲:', 'Clear storage: ', 'Очистить хранилище: '],
        gm_cached_items: ['项缓存', '項緩存', 'items cached', 'в кэше'],
        gm_reload_items: ['项，请重载页面', '項，請重載頁面', 'items, reload the page', 'перезагрузите страницу'],
        gm_none: ['无', '無', 'None', 'Нет'],
        gm_na: ['暂无', '暫無', 'N/A', 'Н/Д'],
        gm_unsupported: ['不支持', '不支持', 'Unsupported', 'Не поддерж.'],
        gm_no_perm_api: ['权限API不支持', '權限API不支持', 'Permissions API unsupported', 'API разрешений нет'],
        gm_no_mem_api: ['内存API不支持', '記憶體API不支持', 'Memory API unsupported', 'API памяти нет'],
        gm_no_batt_api: ['电量API不支持', '電量API不支持', 'Battery API unsupported', 'API батареи нет'],
        gm_no_geo: ['不支持定位', '不支持定位', 'Geolocation unsupported', 'Геолокация нет'],
        gm_no_orient: ['不支持方向传感器', '不支持方向感測器', 'Orientation sensor unsupported', 'Датчик ориентации нет'],
        gm_no_cls: ['不支持CLS监听', '不支持CLS監聽', 'CLS observer unsupported', 'CLS не поддерж.'],
        gm_cls_unavail: ['CLS不可用', 'CLS不可用', 'CLS unavailable', 'CLS недоступен'],
        gm_cls_mon: ['CLS监听中', 'CLS監聽中', 'CLS monitoring', 'Мониторинг CLS'],
        gm_lt_unavail: ['长任务不可用', '長任務不可用', 'Long-task API unavailable', 'API длинных задач нет'],
        gm_lt_mon: ['长任务监听中', '長任務監聽中', 'Long-task monitoring', 'Мониторинг задач'],
        gm_lt_off: ['长任务监听关闭', '長任務監聽關閉', 'Long-task monitoring off', 'Мониторинг выкл'],
        gm_mem_autorefresh: ['内存趋势自动刷新中', '記憶體趨勢自動刷新中', 'Memory trend auto-refreshing', 'Память авто-обновление'],
        gm_cleared_bag: ['已清空背包', '已清空背包', 'Backpack cleared', 'Рюкзак очищен'],
        gm_zeroed: ['已清零', '已清零', 'Reset to zero', 'Сброшено'],
        gm_rule_added: ['已添加规则', '已新增規則', 'Rule added', 'Правило добавлено'],
        gm_set_to: ['已设为', '已設為', 'Set to ', 'Установлено '],
        gm_generated: ['已生成:', '已生成:', 'Generated: ', 'Создано: '],
        gm_safe_triggered: ['已触发开保险', '已觸發開保險', 'Safe opened (triggered)', 'Сейф открыт'],
        gm_reset_refresh: ['已重置 (需刷新)', '已重置 (需刷新)', 'Reset (refresh needed)', 'Сброшено (обновите)'],
        gm_har_exported: ['已导出 HAR', '已匯出 HAR', 'HAR exported', 'HAR экспортирован'],
        gm_sim_offline: ['已模拟离线(fetch会被拒绝)', '已模擬離線(fetch會被拒絕)', 'Simulated offline (fetch rejected)', 'Симуляция оффлайн'],
        gm_snapshot_fail: ['快照失败:', '快照失敗:', 'Snapshot failed: ', 'Ошибка снимка: '],
        gm_snapshot_done: ['快照完成，', '快照完成，', 'Snapshot done, ', 'Снимок готов, '],
        gm_no_snapshot: ['找不到快照', '找不到快照', 'Snapshot not found', 'Снимок не найден'],
        gm_fragment_saved: ['片段已保存', '片段已儲存', 'Snippet saved', 'Фрагмент сохранён'],
        gm_exec_fragment: ['执行片段:', '執行片段:', 'Run snippet: ', 'Запуск: '],
        gm_del_fragment: ['删除片段「', '刪除片段「', 'Delete snippet 「', 'Удалить «'],
        gm_dom_loaded: ['文档加载完成:', '文檔載入完成:', 'Document loaded: ', 'Документ загружен: '],
        gm_no_dom: ['无法读取DOM', '無法讀取DOM', 'Cannot read DOM', 'Нет доступа к DOM'],
        gm_test_fail: ['测试请求失败:', '測試請求失敗:', 'Test request failed: ', 'Ошибка запроса: '],
        gm_test_done: ['测试请求完成', '測試請求完成', 'Test request done', 'Запрос выполнен'],
        gm_timeout: ['请求超时', '請求超時', 'Request timeout', 'Тайм-аут'],
        gm_export_fail: ['导出失败:', '匯出失敗:', 'Export failed: ', 'Ошибка экспорта: '],
        gm_restore: ['恢复', '恢復', 'Restore', 'Восстановить'],
        gm_log_copied: ['日志已复制', '日誌已複製', 'Log copied', 'Лог скопирован'],
        gm_rule_copied: ['规则已复制', '規則已複製', 'Rule copied', 'Правило скопировано'],
        gm_click: ['点击', '點擊', 'Click', 'Клик'],
        gm_farm_started: ['自动农场已启动', '自動農場已啟動', 'Auto-farm started', 'Авто-фарм запущен'],
        gm_farm_stopped: ['自动农场已停止', '自動農場已停止', 'Auto-farm stopped', 'Авто-фарм остановлен'],
        gm_merged_coin: ['已合并柯恩币:', '已合併柯恩幣:', 'Merged Koen coins: ', 'Монеты объединены: '],
        gm_synced_cloud: ['已同步到云端 ·', '已同步到雲端 ·', 'Synced to cloud ·', 'Синхр. с облаком ·'],
        gm_save_not_loaded: ['存档层未加载', '存檔層未載入', 'Save layer not loaded', 'Слой сохранений не загр.'],
        gm_cover_preview: ['封面预览', '封面預覽', 'Cover preview', 'Предпросмотр'],
        gm_exported: ['已导出', '已匯出', 'Exported', 'Экспортировано'],
        gm_added: ['已增加', '已增加', 'Added', 'Добавлено'],
        gl_state: ['游戏: State 未捕获，请先开一次保险', '遊戲: State 未捕獲，請先開一次保險', 'Game: State not captured; open the safe first', 'Игра: нет State; откройте сейф'],
        gl_merge: ['游戏: 合并柯恩币 总值=', '遊戲: 合併柯恩幣 總值=', 'Game: merged coins, total=', 'Игра: монеты объединены, итог='],
        gl_add: ['游戏: 增加价值', '遊戲: 增加價值', 'Game: add value', 'Игра: добавить ценность'],
        gl_import: ['游戏: 导入存档', '遊戲: 匯入存檔', 'Game: import save', 'Игра: импорт'],
        gl_turbo: ['游戏: 开启极速模式', '遊戲: 開啟極速模式', 'Game: turbo mode on', 'Игра: турбо-режим'],
        gl_clear: ['游戏: 清空存档', '遊戲: 清空存檔', 'Game: clear save', 'Игра: очистка'],
        gl_zero: ['游戏: 清零累计价值', '遊戲: 清零累計價值', 'Game: reset total value', 'Игра: сброс ценности'],
        gl_items_loaded: ['游戏: 物品列表加载', '遊戲: 物品列表載入', 'Game: item list loaded', 'Игра: список предметов'],
        gl_no_fit: ['游戏: 物品放不下', '遊戲: 物品放不下', 'Game: item does not fit', 'Игра: нет места'],
        gl_spawn: ['游戏: 生成物品', '遊戲: 生成物品', 'Game: spawn item', 'Игра: создать предмет'],
        gl_farm: ['游戏: 自动农场启动', '遊戲: 自動農場啟動', 'Game: auto-farm started', 'Игра: авто-фарм'],
        gl_unlock_skills: ['游戏: 解锁全部技能', '遊戲: 解鎖全部技能', 'Game: unlock all skills', 'Игра: все навыки'],
        gl_unlock_collect: ['游戏: 解锁全部收藏品', '遊戲: 解鎖全部收藏品', 'Game: unlock all collectibles', 'Игра: все коллекции'],
        gl_unlock_bg: ['游戏: 解锁全部背景', '遊戲: 解鎖全部背景', 'Game: unlock all backgrounds', 'Игра: все фоны'],
        coin_desc: ['由卡莫纳官方发行的货币，由于其与特维拉官方货币的锚定，市价坚挺，是市场上的硬通货。', '由卡莫納官方發行的貨幣，由於其與特維拉官方貨幣的錨定，市價堅挺，是市場上的硬通貨。', 'Currency issued by the Kamona authorities; pegged to the Tevira currency, it stays stable and is the market hard currency.', 'Валюта Kamona, привязанная к тенге Tevira.'],
        gm_all_collect: ['全部收藏品已解锁 (', '全部收藏品已解鎖 (', 'All collectibles unlocked (', 'Все коллекции открыты ('],
        gm_all_bg: ['全部背景已解锁 (', '全部背景已解鎖 (', 'All backgrounds unlocked (', 'Все фоны открыты ('],
        net_down2: ['网络已断开', '網絡已斷開', 'Network disconnected', 'Сеть отключена'],
        gm_not_enabled: ['未启用', '未啟用', 'Not enabled', 'Не включено'],
        song_name: ['歌曲名称', '歌曲名稱', 'Song name', 'Название песни'],
        author_ph: ['作者', '作者', 'Author', 'Автор'],
        gm_confirm_enable: ['确认启用', '確認啟用', 'Confirm enable', 'Включить'],
        gm_confirm_op: ['确认操作', '確認操作', 'Confirm', 'Подтвердить'],
        gm_confirm_disable: ['确认禁用', '確認禁用', 'Confirm disable', 'Отключить'],
        music_edit_local: ['编辑本地音乐', '編輯本地音樂', 'Edit local music', 'Изменить музыку'],
        music_select_song: ['请选择歌曲', '請選擇歌曲', 'Select a song', 'Выберите песню'],
        music_change_file: ['更换歌曲文件', '更換歌曲檔案', 'Change song file', 'Сменить файл'],
        music_pick_audio: ['点击选择新的音频文件', '點擊選擇新的音訊檔案', 'Tap to choose a new audio file', 'Выберите новый аудиофайл'],
        pick_image: ['选择图片', '選擇圖片', 'Choose image', 'Выберите картинку'],
        items_resume: ['所有物品将恢复正常生成。', '所有物品將恢復正常生成。', 'All items will resume spawning.', 'Предметы снова появятся.'],
        items_no_spawn: ['这将导致无法生成任何物品。', '這將導致無法生成任何物品。', 'This will stop all item spawning.', 'Предметы не будут появляться.'],
        confirm_enable_all: ['确定要启用所有物品吗？', '確定要啟用所有物品嗎？', 'Enable all items?', 'Включить все предметы?'],
        confirm_disable_all: ['确定要禁用所有物品吗？', '確定要禁用所有物品嗎？', 'Disable all items?', 'Отключить все предметы?'],

        
        uid_copied: ['UID已复制到剪贴板', 'UID已複製到剪貼簿', 'UID copied to clipboard', 'UID скопирован'],
        lb_noupdate: ['你的累计价值没有提高，无需更新', '你的累計價值沒有提高，無需更新', 'Total value did not increase; nothing to update', 'Ценность не выросла'],
        toggle_skiplogin_off: ['关闭跳过加载登录', '關閉跳過載入登入', 'Turn off skip-load login', 'Выкл. пропуск входа'],
        copy_fail_manual: ['复制失败，请手动复制', '複製失敗，請手動複製', 'Copy failed; copy manually', 'Ошибка копирования'],
        avatar_updated: ['头像已更新', '頭像已更新', 'Avatar updated', 'Аватар обновлён'],
        minigame_mgr_notready: ['小游戏资源管理器未初始化，请稍候再试', '小遊戲資源管理器未初始化，請稍候再試', 'Mini-game resource manager not ready; retry', 'Менеджер мини-игр не готов'],
        skiplogin_off_done: ['已关闭跳过加载登录，下次启动显示加载页', '已關閉跳過載入登入，下次啟動顯示載入頁', 'Skip-load login off; loading page shows next launch', 'Пропуск входа выкл.'],
        font_cn_done: ['已切换到国服字体', '已切換為國服字體', 'Switched to CN font', 'Кит. шрифт'],
        font_intl_done: ['已切换到国际服字体', '已切換為國際服字體', 'Switched to INTL font', 'Глоб. шрифт'],
        skiplogin_on_done: ['已开启跳过加载登录，下次启动直接进入', '已開啟跳過載入登入，下次啟動直接進入', 'Skip-load login on; enters directly next launch', 'Пропуск входа вкл.'],
        lb_cleared: ['已清除你的上榜累计价值', '已清除你的上榜累計價值', 'Cleared your leaderboard value', 'Ваша ценность удалена'],
        submit_ok: ['提交成功！', '提交成功！', 'Submitted!', 'Отправлено!'],
        op_failed: ['操作失败', '操作失敗', 'Operation failed', 'Ошибка операции'],
        nick_empty: ['昵称不能为空', '昵稱不能為空', 'Nickname cannot be empty', 'Ник не может быть пустым'],
        nick_too_long: ['昵称不能超过12个字符', '昵稱不能超過12個字符', 'Nickname max 12 chars', 'Ник: макс 12'],
        nick_banned: ['昵称包含违规词汇', '昵稱包含違規詞彙', 'Nickname contains banned words', 'Ник содержит запрет'],
        nick_updated: ['昵称已更新', '昵稱已更新', 'Nickname updated', 'Ник обновлён'],
        lb_zero: ['累计价值为0，无法上传', '累計價值為0，無法上傳', 'Total value is 0; cannot upload', 'Ценность 0'],
        value_updated: ['累计价值已更新！', '累計價值已更新！', 'Total value updated!', 'Ценность обновлена!'],
        net_cache: ['网络异常，显示上次缓存数据', '網絡異常，顯示上次緩存數據', 'Network error; showing cached data', 'Сеть: кэш-данные'],
        net_req_fail: ['网络请求异常，请检查网络后重试', '網絡請求異常，請檢查網絡後重試', 'Network error; check connection and retry', 'Ошибка сети; повторите'],
        lb_empty: ['暂无排行数据，快来上榜吧', '暫無排行數據，快來上榜吧', 'No ranking data yet; be the first!', 'Рейтинг пуст'],
        lb_req_fail: ['排行榜请求异常，请检查网络后点击「刷新」重试', '排行榜請求異常，請檢查網絡後點擊「刷新」重試', 'Leaderboard request failed; tap Refresh', 'Ошибка рейтинга'],
        anonymous_: ['匿名', '匿名', 'Anonymous', 'Аноним'],
        me_tag_: ['我', '我', 'Me', 'Я'],
        tog_on: ['开', '開', 'On', 'Вкл'],
        tog_off: ['关', '關', 'Off', 'Выкл'],
        unknown_plain: ['未知', '未知', 'Unknown', 'Неизвестно'],
        notice_fail: ['公告暂时无法加载', '公告暫時無法載入', 'Announcement unavailable', 'Объявление недоступно'],
        notice_net: ['网络连接异常或公告服务器暂不可用。', '網絡連接異常或公告伺服器暫不可用。', 'Network or announcement server unavailable.', 'Сеть/сервер объявлений недоступны.'],
        notice_retry: ['请检查网络后点击右上角「刷新」重试。', '請檢查網絡後點擊右上角「刷新」重試。', 'Check network, then tap Refresh (top right).', 'Проверьте сеть и нажмите «Обновить».'],
        crash_msg: ['游戏脚本触发了未处理的错误，部分功能可能已经失效。', '遊戲腳本觸發了未處理的錯誤，部分功能可能已經失效。', 'The game script hit an unhandled error; some features may be broken.', 'Скрипт игры вызвал ошибку; часть функций может не работать.'],
        ui_abnormal: ['界面出现异常', '介面出現異常', 'UI error', 'Сбой интерфейса'],
        dl_ing: ['下载中…', '下載中…', 'Downloading…', 'Загрузка…'],
        hu_dl_hint: ['下载完成后自动刷新，请勿退出', '下載完成後自動刷新，請勿退出', 'Auto-refresh when done; do not exit', 'Авто-обновление; не выходите'],
        installing_: ['安装中…', '安裝中…', 'Installing…', 'Установка…'],
        generating_: ['生成中...', '生成中...', 'Generating...', 'Создание...'],
        pause_dl: ['暂停下载', '暫停下載', 'Pause download', 'Пауза'],
        resume_dl: ['继续下载', '繼續下載', 'Resume download', 'Продолжить'],
        continue_use: ['继续使用', '繼續使用', 'Continue', 'Продолжить'],
        continue_search: ['继续搜索', '繼續搜尋', 'Continue searching', 'Продолжить поиск'],
        reload_: ['重新载入', '重新載入', 'Reload', 'Перезагрузить'],
        load_items: ['加载物品', '載入物品', 'Load items', 'Загрузить предметы'],
        no_image: ['暂无图片', '暫無圖片', 'No image', 'Нет изображения'],
        no_modals: ['暂无已注册的弹窗', '暫無已註冊的彈窗', 'No registered modals', 'Нет окон'],
        no_mods: ['暂无模组', '暫無模組', 'No mods', 'Нет модов'],
        turbo_label: ['开启极速模式 (迅捷巧手+物资潮汐)', '開啟極速模式 (迅捷巧手+物資潮汐)', 'Enable turbo (Swift Hands + Supply Tide)', 'Турбо (навыки)'],
        sim_delay: ['模拟延迟:', '模擬延遲:', 'Sim delay: ', 'Задержка: '],
        fetching_: ['正在拉取：', '正在拉取：', 'Fetching: ', 'Загрузка: '],
        check_fail_: ['检查失败：', '檢查失敗：', 'Check failed: ', 'Ошибка проверки: '],
        detect_select: ['检测 / 选取', '檢測 / 選取', 'Detect / select', 'Проверка / выбор'],
        how_proceed: ['请选择如何处理：', '請選擇如何處理：', 'How to proceed?', 'Как поступить?'],
        upload_file_: ['上传文件', '上傳檔案', 'Upload file', 'Загрузить файл'],
        upload_modfile_: ['上传模组文件', '上傳模組檔案', 'Upload mod file', 'Загрузить файл мода'],
        cloud_sync_: ['云同步:', '雲同步:', 'Cloud sync: ', 'Облако: '],
        mem_: ['内存:', '記憶體:', 'Memory: ', 'Память: '],
        success_: ['成功', '成功', 'Success', 'Успешно'],
        set_to_: ['设为', '設為', 'Set to', 'Установить'],
        gm_auto_farm: ['自动农场', '自動農場', 'Auto-farm', 'Авто-фарм'],
        gm_pick_el: ['点选元素', '點選元素', 'Pick element', 'Выбрать элемент'],
        gm_tap_page_el: ['点击页面元素', '點擊頁面元素', 'Tap page element', 'Тап по элементу'],
        gm_precise_spawn: ['精确刷物品', '精確刷物品', 'Precise item spawn', 'Точный спавн'],
        gm_total_koen: ['累计价值 (柯恩币)', '累計價值 (柯恩幣)', 'Total value (Koen)', 'Ценность (Кён)'],
        gm_storage_change2: ['存储变化', '存儲變化', 'Storage change', 'Изменение хранилища'],
        gm_longtask_colon: ['长任务:', '長任務:', 'Long tasks: ', 'Длинные задачи: '],
        dbg_assert: ['断言测试', '斷言測試', 'Assertion test', 'Тест утверждений'],
        dbg_url_clip: ['URL / 剪贴板', 'URL / 剪貼簿', 'URL / Clipboard', 'URL / Буфер'],
        dbg_import_json: ['导入 JSON', '匯入 JSON', 'Import JSON', 'Импорт JSON'],
        dbg_core: ['核', '核', 'core', 'ядро'],
        tap_resume_exact: ['点击继续下载', '點擊繼續下載', 'Tap to resume', 'Нажмите продолжить'],
        tap_retry_exact: ['点击重试', '點擊重試', 'Tap to retry', 'Нажмите повторить'],
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
        restored_: ['已恢复', '已恢復', 'Restored', 'Восстановлено'],
        go_fetch_mod: ['去「MOD市场」下载，或在「从本地导入MOD」导入 zip', '去「MOD市場」下載，或在「從本地匯入MOD」匯入 zip', 'Download in MOD Store, or import a zip from device', 'Скачайте в магазине или импортируйте zip'],
        go_redeem: ['去兑换码', '去兌換碼', 'Go to Redeem', 'К кодам'],
        copy_qq: ['复制QQ', '複製QQ', 'Copy QQ', 'Копировать QQ'],
        login_btn: ['登录', '登入', 'Login', 'Войти'],
        details_: ['详情', '詳情', 'Details', 'Детали'],
        group_chat: ['软件交流群 : 1082453829', '軟件交流群 : 1082453829', 'QQ group: 1082453829', 'QQ-группа: 1082453829'],
        no_mod_installed: ['还没有安装的 Mod', '還沒有安裝的 Mod', 'No mods installed yet', 'Модов пока нет'],
        moddoc_submit: ['把你打包好的 zip 发给作者 QQ，审核通过后即会上架 Mod 库，全服玩家可下载。', '把你打包好的 zip 發給作者 QQ，審核通過後即會上架 Mod 庫，全服玩家可下載。', 'Send your zip to the author via QQ; once approved it goes live in the Mod library.', 'Отправьте zip автору в QQ; после проверки мод появится в библиотеке.'],
        slogan_free: ['此软件完全免费，圈钱的圈一分死一亩', '此軟件完全免費，圈錢的圈一分死一畝', 'This app is completely free', 'Приложение полностью бесплатное'],
        slogan_follow: ['关注盒饭谢谢喵', '關注盒飯謝謝喵', 'Follow HeFan, thanks~', 'Подпишитесь на HeFan']
    };

    var cur = 'zh-CN';
    try {
        var saved = localStorage.getItem(LANG_KEY);
        if (saved && LANGS.indexOf(saved) !== -1) cur = saved;
    } catch (e) {}

    function idx() { return LANG_INDEX[cur] || 0; }

    var REV = {};
    for (var __k in M) REV[M[__k][0]] = __k;

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
        ['欢迎，', ['欢迎，', '歡迎，', 'Welcome, ', 'Добро пожаловать, ']],
        ['需下载', ['需下载', '需下載', 'Need download', 'Нужно скачать']],
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
        ['已恢复 ', ['已恢复 ', '已恢復 ', 'Restored ', 'Восстановлено ']],
        ['→ 重新打包为 zip（', ['→ 重新打包为 zip（', '→ 重新打包為 zip（', '→ Repack as zip (', '→ Перепакуйте в zip (']],
        ['里的图片 → 用记事本修改', ['里的图片 → 用记事本修改', '裡的圖片 → 用記事本修改', 'images → edit with Notepad', 'изображения → блокнот']],
        ['里的图片', ['里的图片', '裡的圖片', 'images', 'изображения']],
        ['本软件由', ['本软件由', '本軟件由', 'Made by ', 'Сделано: ']],
        ['剩余次数', ['剩余次数', '剩餘次數', 'Uses left', 'Осталось']],
        ['剩余 ', ['剩余 ', '剩餘 ', 'Left ', 'Осталось ']],
        ['购买 ', ['购买 ', '購買 ', 'Buy ', 'Купить ']],
        ['购买需要', ['购买需要', '購買需要', 'Cost', 'Стоимость']],
        ['已选中 ', ['已选中 ', '已選中 ', 'Selected ', 'Выбрано ']],
        ['红色', ['红色', '紅色', 'Red', 'Красный']],
        ['橙色', ['橙色', '橙色', 'Orange', 'Оранжевый']],
        ['紫色', ['紫色', '紫色', 'Purple', 'Фиолетовый']],
        ['白色', ['白色', '白色', 'White', 'Белый']],
        ['金色', ['金色', '金色', 'Gold', 'Золотой']],
        ['游戏: ', ['游戏: ', '遊戲: ', 'Game: ', 'Игра: ']],
        ['当前版本', ['当前版本', '當前版本', 'Current version', 'Текущая версия']],
        ['最新版本', ['最新版本', '最新版本', 'Latest version', 'Последняя версия']],
        ['JS错误', ['JS错误', 'JS錯誤', 'JS error', 'Ошибка JS']],
        ['存储变化', ['存储变化', '存儲變化', 'Storage change', 'Изменение хранилища']],
        ['点击', ['点击', '點擊', 'Click', 'Клик']],
        ['成功购买背景: ', ['成功购买背景: ', '成功購買背景: ', 'Purchased BG: ', 'Куплен фон: ']],
        ['成功购买: ', ['成功购买: ', '成功購買: ', 'Purchased: ', 'Куплено: ']],
        ['已解锁技能「', ['已解锁技能「', '已解鎖技能「', 'Skill unlocked 「', 'Навык открыт «']],
        ['总累计价值不足，需要', ['总累计价值不足，需要', '總累計價值不足，需要', 'Not enough total value; need ', 'Мало ценности; нужно ']],
        ['总累计价值不足, 需要', ['总累计价值不足, 需要', '總累計價值不足, 需要', 'Not enough total value; need ', 'Мало ценности; нужно ']],
        ['需要总累计价值达到: ', ['需要总累计价值达到: ', '需要總累計價值達到: ', 'Required total value: ', 'Нужна ценность: ']],
        ['本次最高价值物品为【', ['本次最高价值物品为【', '本次最高價值物品為【', 'This search top item is 【', 'Топ-предмет: 【']],
        ['文件过大，请选择小于', ['文件过大，请选择小于', '檔案過大，請選擇小於', 'File too large; pick under ', 'Файл велик; < ']],
        ['次数已达上限，需使用至', ['次数已达上限，需使用至', '次數已達上限，需使用至', 'At limit; use below ', 'Лимит; используйте до ']],
        ['已下载 ', ['已下载 ', '已下載 ', 'Downloaded ', 'Скачано ']],
        ['提交失败 (', ['提交失败 (', '提交失敗 (', 'Submit failed (', 'Ошибка отправки (']],
        ['请求失败 (', ['请求失败 (', '請求失敗 (', 'Request failed (', 'Ошибка запроса (']],
        ['展开下 ', ['展开下 ', '展開下 ', 'Show next ', 'Показать ещё ']],
        ['预览: ', ['预览: ', '預覽: ', 'Preview: ', 'Просмотр: ']],
        ['失败:', ['失败:', '失敗:', 'Failed: ', 'Ошибка: ']],
        ['导入失败', ['导入失败', '匯入失敗', 'Import failed', 'Ошибка импорта']],
        ['QQ 已复制：', ['QQ 已复制：', 'QQ 已複製：', 'QQ copied: ', 'QQ скопирован: ']],
        ['已增加 ', ['已增加 ', '已增加 ', 'Added ', 'Добавлено ']],
        ['已导出 ', ['已导出 ', '已匯出 ', 'Exported ', 'Экспортировано ']],
        ['本地已有进度，云端进度更新于 ', ['本地已有进度，云端进度更新于 ', '本地已有進度，雲端進度更新於 ', 'Local progress exists; cloud updated at ', 'Есть локальный прогресс; облако: ']],
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
        tr: function (zh) {
            var s = String(zh == null ? '' : zh);
            var k = REV[s];
            if (k) return I18N.t(k);
            for (var i = 0; i < PREFIX.length; i++) {
                var pre = PREFIX[i][0];
                if (s.indexOf(pre) === 0) return PREFIX[i][1][idx()] + s.slice(pre.length);
            }
            return zh;
        },
        trFull: function (zh) {
            var raw = String(zh == null ? '' : zh);
            var s = raw.trim();
            if (!s) return zh;
            var out = null;
            var k = REV[s];
            if (k) out = I18N.t(k);
            else {
                var stripped = s.replace(/^[^\u4e00-\u9fffA-Za-z\u0400-\u04ff]+/, '');
                if (stripped && stripped !== s && REV[stripped]) {
                    out = s.slice(0, s.length - stripped.length) + I18N.t(REV[stripped]);
                } else {
                    for (var i = 0; i < PREFIX.length; i++) {
                        var pre = PREFIX[i][0];
                        if (s.indexOf(pre) === 0) { out = PREFIX[i][1][idx()] + s.slice(pre.length); break; }
                    }
                    if (out == null) out = _translateNumeric(s);
                    if (out == null) { var c = _cleanupUnits(s); if (c !== s) out = c; }
                }
            }
            if (out == null) return zh;
            return _cleanupUnits(out);
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

    var RANK_NAMES = ['暗区新锐', '暗区尖兵', '暗区精英', '暗区专家', '暗区大师', '暗区王牌', '暗区传说'];
    window.i18nRankName = function (zhName) {
        var i = RANK_NAMES.indexOf(zhName);
        if (i === -1) return zhName;
        return I18N.t('rank_' + i, zhName);
    };
    I18N.refreshDynamic = function () { if (typeof I18N.onChange === 'function') I18N.onChange(I18N.getLang()); };

    
    function _skipParent(node) {
        var p = node.parentNode;
        while (p) {
            var n = p.nodeName ? p.nodeName.toUpperCase() : '';
            if (n === 'SCRIPT' || n === 'STYLE' || n === 'TEXTAREA' || n === 'INPUT' || n === 'NOSCRIPT') return true;
            p = p.parentNode;
        }
        return false;
    }
    function _translateNumeric(trimmed) {
        var lang = I18N.getLang();
        if (lang !== 'en' && lang !== 'ru') return null;
        var ru = lang === 'ru', m;
        if ((m = trimmed.match(/^共\s*(\d+)\s*个模组$/))) return (ru ? 'Всего ' : '') + m[1] + (ru ? ' модов' : ' mods');
        if ((m = trimmed.match(/^(\d+)\s*个模组$/))) return m[1] + (ru ? ' модов' : ' mods');
        if ((m = trimmed.match(/^共\s*(\d+)\s*首$/))) return m[1] + (ru ? ' треков' : ' songs');
        if ((m = trimmed.match(/^(\d+)\s*首$/))) return m[1] + (ru ? ' треков' : ' songs');
        if ((m = trimmed.match(/^(\d+)\s*次$/))) return m[1] + (ru ? ' раз' : ' times');
        if ((m = trimmed.match(/^(\d+)\s*个$/))) return String(m[1]);
        if ((m = trimmed.match(/^第\s*(\d+)$/))) return (ru ? '№ ' : 'No. ') + m[1];
        return null;
    }
    function _cleanupUnits(s) {
        var lang = I18N.getLang();
        if (lang === 'zh-CN') return s;
        if (lang === 'zh-TW') return s.replace(/个/g, '個').replace(/特遣队员/g, '特遣隊員');
        if (lang !== 'en' && lang !== 'ru') return s;
        var ru = lang === 'ru';
        s = s.replace(/(\d+)年(\d+)月(\d+)日/g, ru ? '$3.$2.$1' : '$2/$3/$1');
        s = s.replace(/次以下才能购买/g, ru ? ' для покупки' : ' to buy');
        s = s.replace(/(\d+)\s*名（剩余\s*/g, '$1' + (ru ? ' (осталось ' : ' (remaining '));
        s = s.replace(/(\d+)\s*名）/g, '$1)');
        s = s.replace(/ MB 的图片或视频/g, ' MB');
        s = s.replace(/的图片或视频/g, '');
        s = s.replace(/，价值 /g, ru ? ', ценность ' : ', value ');
        s = s.replace(/(\d+)\s*个模组/g, '$1' + (ru ? ' модов' : ' mods'));
        s = s.replace(/(\d+)\s*个物品/g, '$1' + (ru ? ' предм.' : ' items'));
        s = s.replace(/(\d+)\s*个背景/g, '$1' + (ru ? ' фонов' : ' backgrounds'));
        s = s.replace(/(\d+)\s*个文件/g, '$1' + (ru ? ' файлов' : ' files'));
        s = s.replace(/(\d+)\s*个/g, '$1');
        s = s.replace(/(\d+)\s*次/g, '$1' + (ru ? ' раз' : ' times'));
        s = s.replace(/(\d+)\s*首/g, '$1' + (ru ? ' треков' : ' songs'));
        s = s.replace(/共\s*/g, ru ? 'Всего ' : 'Total ');
        s = s.replace(/第\s*/g, ru ? '№ ' : 'No. ');
        s = s.replace(/个模组/g, ru ? 'модов' : 'mods');
        s = s.replace(/模组/g, ru ? 'моды' : 'mods');
        s = s.replace(/个/g, '');
        s = s.replace(/次/g, '');
        s = s.replace(/首/g, '');
        s = s.replace(/特遣队员/g, ru ? 'Оперативник' : 'Operator');
        s = s.replace(/点击继续下载/g, ru ? 'нажмите продолжить' : 'tap to resume');
        s = s.replace(/点击保温箱放入/g, ru ? 'нажмите инкубатор' : 'tap the incubator to place');
        s = s.replace(/保温箱放入/g, ru ? 'в инкубатор' : 'into the incubator');
        s = s.replace(/点击重试/g, ru ? 'нажмите повторить' : 'tap to retry');
        s = s.replace(/(\d+)\s*核/g, '$1' + (ru ? ' ядер' : ' cores'));
        s = s.replace(/开$/, ru ? 'вкл' : 'on').replace(/关$/, ru ? 'выкл' : 'off');
        s = s.replace(/制作/g, '');
        s = s.replace(/，/g, ', ').replace(/。/g, '.').replace(/、/g, ', ').replace(/：/g, ': ').replace(/！/g, '!').replace(/？/g, '?');
        return s;
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
            var stripped = trimmed.replace(/^[^\u4e00-\u9fffA-Za-z\u0400-\u04ff]+/, '');
            if (stripped && stripped !== trimmed && REV[stripped]) {
                var lead = trimmed.slice(0, trimmed.length - stripped.length);
                targetTr = lead + I18N.t(REV[stripped]);
            }
        }
        if (targetTr == null) {
            for (var i = 0; i < PREFIX.length; i++) {
                var pre0 = PREFIX[i][0];
                if (trimmed.indexOf(pre0) === 0) { targetTr = PREFIX[i][1][idx()] + trimmed.slice(pre0.length); break; }
            }
            if (targetTr == null) targetTr = _translateNumeric(trimmed);
        }
        if (targetTr == null) {
            var cleaned = _cleanupUnits(trimmed);
            if (cleaned !== trimmed) targetTr = cleaned;
        }
        if (targetTr == null) return;
        targetTr = _cleanupUnits(targetTr);
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
        for (var i = 0; i < list.length; i++) {
            if (list[i].__i18nOrig != null) { list[i].nodeValue = list[i].__i18nOrig; list[i].__i18nOrig = null; }
        }
        for (var j = 0; j < list.length; j++) _translateTextNode(list[j]);
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

    // 首次启动语言选择弹窗（登录后调用）
    I18N.showFirstLaunchPicker = function (onDone) {
        var modal = document.getElementById('first-lang-modal');
        var box = document.getElementById('first-lang-options');
        if (!modal || !box) { if (onDone) onDone(); return; }
        var labels = { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', 'en': 'English', 'ru': 'Русский' };
        box.innerHTML = '';
        LANGS.forEach(function (l) {
            var b = document.createElement('button');
            b.className = 'first-lang-opt';
            b.setAttribute('data-lang', l);
            b.textContent = labels[l] || l;
            b.onclick = function () {
                I18N.setLang(l);
                try { localStorage.setItem('ab_lang_chosen', '1'); } catch (e) {}
                modal.classList.remove('show');
                setTimeout(function () { modal.style.display = 'none'; }, 260);
                if (onDone) onDone();
            };
            box.appendChild(b);
        });
        modal.style.display = 'flex';
        setTimeout(function () { modal.classList.add('show'); }, 10);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { I18N.init(); buildSelector(); });
    else { I18N.init(); buildSelector(); }
})();
