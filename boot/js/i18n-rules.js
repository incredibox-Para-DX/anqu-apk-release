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
        ]
    });
})();
