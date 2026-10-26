#!/usr/bin/env python3
"""把 Mod zip 发布到 anqu-mods-resources 仓库结构。

用法：
  python3 publish_mod.py <mod.zip> --repo <仓库目录> [--id <slug>]

生成/更新：
  <repo>/mods.json
  <repo>/mods/<id>/mod.zip
  <repo>/mods/<id>/thumb.png|avatar.png|screen-1..3.png
"""
import argparse, json, os, re, shutil, sys, zipfile, hashlib

RARITIES = {'purple', 'gold', 'orange', 'red'}
TYPES = {'item', 'music', 'background'}


def fail(msg):
    print('[FAIL]', msg)
    sys.exit(1)


def norm(name):
    return name.replace('\\', '/').lstrip('./')


def pick_entry(names, wanted):
    """在 zip 里找文件：优先根目录，其次唯一一级子目录"""
    if wanted in names:
        return wanted
    cands = [n for n in names if n.endswith('/' + wanted)]
    if len(cands) == 1:
        return cands[0]
    return None


def validate(mod, names, zip_size):
    if not isinstance(mod, dict):
        fail('mod.json 不是对象')
    t = mod.get('type')
    if t not in TYPES:
        fail('type 必须是 item/music/background')
    for k, mx, label in (('name', 20, '模组名称'), ('author', 16, '作者名'),
                         ('version', 16, '版本号'), ('desc', 60, '模组简介')):
        v = str(mod.get(k, '')).strip()
        if not v:
            fail(label + '不能为空')
        if len(v) > mx:
            fail(label + '超过 %d 字' % mx)
    if pick_entry(names, 'thumb.png') is None:
        fail('缺少 thumb.png')
    if pick_entry(names, 'avatar.png') is None:
        fail('缺少 avatar.png')

    def entry(p):
        return pick_entry(names, norm(p))

    if t == 'item':
        items = mod.get('items') or []
        if not isinstance(items, list) or not items:
            fail('items 不能为空')
        if len(items) > 30:
            fail('物品数量超过 30')
        for i, it in enumerate(items, 1):
            tag = '第 %d 个物品：' % i
            if not isinstance(it, dict):
                fail(tag + '格式错误')
            if not str(it.get('name', '')).strip():
                fail(tag + '名称不能为空')
            try:
                w, h = int(it.get('width')), int(it.get('height'))
                val = int(it.get('value'))
            except Exception:
                fail(tag + 'width/height/value 必须是数字')
            if not (1 <= w <= 5):
                fail(tag + 'width 必须 1~5')
            if not (1 <= h <= 6):
                fail(tag + 'height 必须 1~6')
            if not (1 <= val <= 4000000):
                fail(tag + 'value 必须 1~4000000')
            if it.get('rarity') not in RARITIES:
                fail(tag + 'rarity 必须是 purple/gold/orange/red')
            p = entry(it.get('image', ''))
            if not p:
                fail(tag + '图片不存在：' + str(it.get('image')))
            if not re.search(r'\.(png|jpe?g|webp)$', p, re.I):
                fail(tag + '图片必须是 png/jpg/webp')
            snd = it.get('sound')
            if snd:
                sp = entry(snd)
                if not sp:
                    fail(tag + '音效文件不存在：' + str(snd))
                if not re.search(r'\.(mp3|m4a|aac|wav|ogg)$', sp, re.I):
                    fail(tag + '音效必须是 mp3/wav/ogg 等格式')
    elif t == 'music':
        tracks = mod.get('tracks') or []
        if not isinstance(tracks, list) or not tracks:
            fail('tracks 不能为空')
        if len(tracks) > 10:
            fail('曲目数量超过 10')
        for i, tr in enumerate(tracks, 1):
            tag = '第 %d 首：' % i
            if not str(tr.get('title', '')).strip():
                fail(tag + '标题不能为空')
            p = entry(tr.get('file', ''))
            if not p:
                fail(tag + '音频文件不存在')
            if not re.search(r'\.(mp3|m4a|aac|wav|ogg|flac)$', p, re.I):
                fail(tag + '音频格式不支持')
    else:
        bgs = mod.get('backgrounds') or []
        if not isinstance(bgs, list) or not bgs:
            fail('backgrounds 不能为空')
        if len(bgs) > 10:
            fail('背景数量超过 10')
        for i, bg in enumerate(bgs, 1):
            tag = '第 %d 个背景：' % i
            if not str(bg.get('name', '')).strip():
                fail(tag + '名称不能为空')
            p = entry(bg.get('file', ''))
            if not p:
                fail(tag + '文件不存在')
            if not re.search(r'\.(png|jpe?g|webp|mp4|webm)$', p, re.I):
                fail(tag + '必须是图片或视频')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('zip')
    ap.add_argument('--repo', required=True)
    ap.add_argument('--id', default='')
    args = ap.parse_args()

    zpath = args.zip
    if not os.path.isfile(zpath):
        fail('找不到 zip: ' + zpath)
    zsize = os.path.getsize(zpath)

    with zipfile.ZipFile(zpath) as z:
        names = [n for n in z.namelist() if not n.endswith('/')]
        if len(names) > 200:
            fail('zip 内文件数超过 200')
        mod_name = pick_entry(names, 'mod.json')
        if not mod_name:
            fail('zip 内缺少 mod.json')
        try:
            mod = json.loads(z.read(mod_name).decode('utf-8-sig'))
        except Exception as e:
            fail('mod.json 不是合法 JSON: %s' % e)
        validate(mod, names, zsize)

        slug = args.id or re.sub(r'[^a-z0-9]+', '_', mod['name'].lower()).strip('_')
        if not slug:
            slug = 'mod_' + hashlib.md5(os.urandom(8)).hexdigest()[:8]
        out_dir = os.path.join(args.repo, 'mods', slug)
        os.makedirs(out_dir, exist_ok=True)

        # 拷贝 zip
        shutil.copy2(zpath, os.path.join(out_dir, 'mod.zip'))
        # 提取展示图
        def extract(wanted, dest_name):
            src = pick_entry(names, wanted)
            if not src:
                return False
            with open(os.path.join(out_dir, dest_name), 'wb') as f:
                f.write(z.read(src))
            return True

        extract('thumb.png', 'thumb.png')
        extract('avatar.png', 'avatar.png')
        screens = []
        for i in range(1, 4):
            if extract('screen-%d.png' % i, 'screen-%d.png' % i):
                screens.append('mods/%s/screen-%d.png' % (slug, i))

    # 更新 mods.json
    mpath = os.path.join(args.repo, 'mods.json')
    manifest = {'version': 1, 'mods': []}
    if os.path.isfile(mpath):
        try:
            manifest = json.load(open(mpath, encoding='utf-8'))
        except Exception:
            manifest = {'version': 1, 'mods': []}
    manifest.setdefault('mods', [])
    manifest['version'] = int(manifest.get('version', 1)) + 1

    entry = {
        'id': slug,
        'name': str(mod['name']).strip(),
        'type': mod['type'],
        'author': str(mod['author']).strip(),
        'version': str(mod['version']).strip(),
        'desc': str(mod['desc']).strip(),
        'size': zsize,
        'file': 'mods/%s/mod.zip' % slug,
        'thumb': 'mods/%s/thumb.png' % slug,
        'avatar': 'mods/%s/avatar.png' % slug,
        'screens': screens,
        'updatedAt': int(__import__('time').time() * 1000)
    }
    # 同 id 覆盖更新
    manifest['mods'] = [m for m in manifest['mods'] if m.get('id') != slug] + [entry]
    with open(mpath, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print('[OK] %s -> mods/%s（%d 字节，共 %d 个模组）' % (mod['name'], slug, zsize, len(manifest['mods'])))
    print('     mods.json 版本:', manifest['version'])


if __name__ == '__main__':
    main()
