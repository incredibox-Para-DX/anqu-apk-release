(function () {
    if (!window.I18N || typeof I18N.addEntries !== 'function') return;
    I18N.addEntries({
        rules_title: ['排行榜须知', '排行榜須知', 'Leaderboard Rules', 'Правила рейтинга'],
        rules_1: [
            '统计范围：本周（周一 00:00 至周日 23:59，以服务器时间为准）内，单次搜索物品的累计总价值。',
            '統計範圍：本週（週一 00:00 至週日 23:59，以伺服器時間為準）內，單次搜尋物品的累計總價值。',
            'Scope: the total value of a single search run within this week (Mon 00:00 to Sun 23:59, server time).',
            'Охват: суммарная ценность одного поиска за неделю (пн 00:00 — вс 23:59, время сервера).'
        ],
        rules_2: [
            '上榜方式：需点击「上传」提交本周成绩；同一玩家仅保留本周最高一次成绩。',
            '上榜方式：需點擊「上傳」提交本週成績；同一玩家僅保留本週最高一次成績。',
            'To rank, tap "Upload" to submit your weekly score; only your best score of the week is kept.',
            'Чтобы попасть в рейтинг, нажмите «Загрузить» и отправьте результат; сохраняется только лучший результат недели.'
        ],
        rules_3: [
            '同一玩家按 UID 去重；修改昵称不会改变成绩与排名。',
            '同一玩家按 UID 去重；修改暱稱不會改變成績與排名。',
            'Players are deduplicated by UID; changing your nickname does not affect your score or rank.',
            'Игроки уникальны по UID; смена ника не влияет на результат и место.'
        ],
        rules_4: [
            '严禁使用外挂、修改器、篡改文件或刷分等行为，一经发现取消成绩并取消上榜资格。',
            '嚴禁使用外掛、修改器、竄改檔案或刷分等行為，一經發現取消成績並取消上榜資格。',
            'Cheating (hacks, modded clients, file tampering, score farming) is prohibited; violators will have their scores removed and be disqualified.',
            'Запрещены читы, модифицированные клиенты, подмена файлов и накрутка; результаты будут аннулированы, доступ в рейтинг закрыт.'
        ],
        rules_5: [
            '榜单每周重置，历史成绩不累计。',
            '榜單每週重置，歷史成績不累計。',
            'The leaderboard resets weekly; past scores do not accumulate.',
            'Рейтинг сбрасывается каждую неделю; прошлые результаты не накапливаются.'
        ],
        rules_6: [
            '昵称请勿使用违规词，否则可能被清除。',
            '暱稱請勿使用違規詞，否則可能被清除。',
            'Do not use inappropriate words in your nickname; it may be removed.',
            'Не используйте недопустимые слова в нике — он может быть удалён.'
        ],
        rules_icons_title: ['图标说明', '圖示說明', 'Icon Legend', 'Обозначения'],
        rules_icon_box: [
            '箱子：累计搜索物品数',
            '箱子：累計搜尋物品數',
            'Box: total searched items',
            'Ящик: всего найдено предметов'
        ],
        rules_icon_bag: [
            '钱袋：累计总价值',
            '錢袋：累計總價值',
            'Money bag: total value',
            'Мешок: общая ценность'
        ],
        skill_devil_name: ['恶魔契约', '惡魔契約', 'Demon Contract', 'Демонический контракт'],
        skill_devil_desc: [
            '开启后每次搜索消耗 1 次：50% 概率本次全部为紫色物品；50% 概率必出 2 个高价值物品。需通行证 80 级（典藏）解锁购买权，可重复购买，每月限购 100 次。',
            '開啟後每次搜尋消耗 1 次：50% 機率本次全部為紫色物品；50% 機率必出 2 個高價值物品。需通行證 80 級（典藏）解鎖購買權，可重複購買，每月限購 100 次。',
            'When enabled, each search consumes 1 use: 50% chance all items are purple; 50% chance exactly 2 high-value items. Requires Pass level 80 (Premium) purchase right; repeatable, limited to 100 purchases per month.',
            'При включении каждый поиск расходует 1 заряд: 50% — все предметы фиолетовые; 50% — ровно 2 предмета высокой ценности. Требуется право покупки на 80 уровне пропуска (Премиум); можно покупать повторно, до 100 раз в месяц.'
        ],
        skill_devil_month_limit: ['恶魔契约本月购买次数已达上限（100）', '惡魔契約本月購買次數已達上限（100）', 'Demon Contract monthly purchase limit reached (100)', 'Достигнут месячный лимит покупок Демонического контракта (100)'],
        skill_devil_pass_locked: ['需通行证 80 级（典藏）解锁购买权', '需通行證 80 級（典藏）解鎖購買權', 'Requires the Pass level 80 (Premium) purchase right', 'Требуется право покупки на 80 уровне пропуска (Премиум)'],
        skill_buy_success: ['成功购买：%s', '成功購買：%s', 'Purchased: %s', 'Куплено: %s'],
        skill_unlocked: ['已解锁技能「%s」', '已解鎖技能「%s」', 'Skill unlocked: %s', 'Навык открыт: %s'],
        hu_checking: ['正在检查更新…', '正在檢查更新…', 'Checking for updates…', 'Проверка обновлений…'],
        hu_check_failed_net: ['检查失败：无法连接更新服务器', '檢查失敗：無法連接更新伺服器', 'Check failed: cannot reach update server', 'Ошибка проверки: сервер обновлений недоступен'],
        hu_new_version: ['发现新版本', '發現新版本', 'New version found', 'Найдена новая версия'],
        hu_current_latest: ['当前已是最新版本', '目前為最新版本', 'You are up to date', 'У вас последняя версия'],
        hu_update_done: ['更新完成，正在刷新…', '更新完成，正在重新整理…', 'Update complete, reloading…', 'Обновление завершено, перезагрузка…'],
        hu_update_failed: ['更新失败（弱网或线路不通）', '更新失敗（弱網或線路不通）', 'Update failed (weak network or blocked route)', 'Обновление не удалось (слабая сеть или маршрут недоступен)'],
        hu_retry_hint: ['可重试，或到 GM 切换线路后再试', '可重試，或到 GM 切換線路後再試', 'Retry, or switch routes in GM and try again', 'Повторите или смените маршрут в GM'],
        hu_retry: ['重试更新', '重試更新', 'Retry update', 'Повторить обновление'],
        hu_downloading: ['正在下载更新包，请稍候…', '正在下載更新包，請稍候…', 'Downloading update…', 'Загрузка обновления…'],
        hu_keep_open: ['更新过程中请勿退出', '更新過程中請勿退出', 'Do not exit during the update', 'Не закрывайте приложение во время обновления'],
        hu_check_failed: ['检查失败：', '檢查失敗：', 'Check failed: ', 'Ошибка проверки: '],
        hu_close: ['关闭', '關閉', 'Close', 'Закрыть'],
        hu_later: ['稍后再说', '稍後再說', 'Later', 'Позже'],
        hu_update_now: ['立即更新', '立即更新', 'Update now', 'Обновить'],
        hu_current_version: ['当前版本：', '目前版本：', 'Current: ', 'Текущая: '],
        hu_latest_version: ['最新版本：', '最新版本：', 'Latest: ', 'Последняя: '],
        hu_version_mismatch: ['下载内容版本不匹配，请重试', '下載內容版本不匹配，請重試', 'Downloaded content version mismatch; please retry', 'Версия загруженного содержимого не совпадает; повторите'],
        hu_update_failed_reason: ['更新失败：', '更新失敗：', 'Update failed: ', 'Обновление не удалось: '],
        hu_bg_preview_unavailable: ['背景预览不可用', '背景預覽不可用', 'Background preview unavailable', 'Предпросмотр фона недоступен'],
        hu_card_preview_unavailable: ['名片预览不可用', '名片預覽不可用', 'Card preview unavailable', 'Предпросмотр визитки недоступен']
    });
})();
