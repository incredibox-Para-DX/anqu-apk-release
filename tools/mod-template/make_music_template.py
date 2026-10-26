#!/usr/bin/env python3
"""生成音乐类 Mod 模板目录 anqu-music-template-v1.zip"""
import os, json, zipfile, wave, struct, math, zlib, shutil, sys

ITEM_TPL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mod-template')
HERE = os.path.dirname(os.path.abspath(__file__))
MUSIC_DIR = os.path.join(HERE, 'mod-template-music')
OUT = os.path.join(HERE, 'anqu-music-template-v1.zip')


def make_wav(path, freq, dur=0.5, rate=22050, vol=0.5):
    n = int(rate * dur)
    samples = []
    for i in range(n):
        env = 1.0 if i < n * 0.85 else max(0.0, (n - i) / (n * 0.15))  # 尾部淡出防爆音
        samples.append(int(vol * 32767 * math.sin(2 * math.pi * freq * i / rate) * env))
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b''.join(struct.pack('<h', s) for s in samples))


def make_png(path, w, h, rgb):
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)  # 8-bit RGB, no alpha
    raw = b''
    for y in range(h):
        # 简单竖向渐变，作为封面占位
        r = int(rgb[0] + (120 - rgb[0]) * y / h)
        g = int(rgb[1] + (80 - rgb[1]) * y / h)
        b = int(rgb[2] + (40 - rgb[2]) * y / h)
        raw += b'\x00' + bytes([r, g, b]) * w
    idat = zlib.compress(raw)
    png = sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def main():
    if os.path.exists(MUSIC_DIR):
        shutil.rmtree(MUSIC_DIR)
    os.makedirs(os.path.join(MUSIC_DIR, 'content', 'music'))

    # 1) 复用同目录（物品模板）的展示图作为占位（作者可替换）
    for img in ('thumb.png', 'avatar.png', 'screen-1.png'):
        src = os.path.join(HERE, img)
        if os.path.exists(src):
            shutil.copyfile(src, os.path.join(MUSIC_DIR, img))
        else:
            print('WARN 未找到展示图:', img)

    # 2) 生成示例音频 + 封面
    make_wav(os.path.join(MUSIC_DIR, 'content/music/track-1.wav'), 523.25)
    make_wav(os.path.join(MUSIC_DIR, 'content/music/track-2.wav'), 783.99)
    make_png(os.path.join(MUSIC_DIR, 'content/music/cover-1.png'), 512, 512, (30, 30, 60))
    make_png(os.path.join(MUSIC_DIR, 'content/music/cover-2.png'), 512, 512, (60, 20, 30))

    # 3) mod.json
    mod = {
        "name": "示例音乐模组",
        "author": "官方示例",
        "version": "1.0.0",
        "type": "music",
        "desc": "官方示例：包含 2 首曲目，展示音乐类 mod.json 的标准写法。替换成你的音乐和封面即可。",
        "tracks": [
            {
                "title": "示例曲一 · 晨风",
                "artist": "官方示例",
                "file": "content/music/track-1.wav",
                "cover": "content/music/cover-1.png"
            },
            {
                "title": "示例曲二 · 落日",
                "artist": "官方示例",
                "file": "content/music/track-2.wav",
                "cover": "content/music/cover-2.png"
            }
        ]
    }
    with open(os.path.join(MUSIC_DIR, 'mod.json'), 'w', encoding='utf-8') as f:
        json.dump(mod, f, ensure_ascii=False, indent=2)
    # 校验
    json.load(open(os.path.join(MUSIC_DIR, 'mod.json')))

    # 4) 说明.txt
    with open(os.path.join(MUSIC_DIR, '说明.txt'), 'w', encoding='utf-8') as f:
        f.write(MUSIC_README)

    # 5) 打包
    if os.path.exists(OUT):
        os.remove(OUT)
    count = 0
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(MUSIC_DIR):
            for name in sorted(files):
                p = os.path.join(root, name)
                rel = os.path.relpath(p, MUSIC_DIR)
                z.write(p, rel)
                count += 1
    print('打包完成:', OUT, os.path.getsize(OUT), 'bytes,', count, 'files')
    with zipfile.ZipFile(OUT) as z:
        for n in z.namelist():
            print(' ', n)


MUSIC_README = """========================================
 暗区保险模拟 · Mod 制作说明（音乐类）
========================================

一、模组里有什么
----------------------------------------
mod.json        模组的"大脑"，所有内容都在这里定义（必填）
thumb.png       列表缩略图，建议 360x202（必填）
avatar.png      作者头像，建议 128x128（必填）
screen-1~3.png  详情页展示图，最多 3 张（可选）
content/music/  音频与封面放这里

二、mod.json 字段说明（音乐类）
----------------------------------------
name    模组名称（必填，≤20 字）
author  作者名（必填，≤16 字）
version 版本号（必填，如 1.0.0）
type    模组类型（必填，音乐类固定填 "music"）
desc    模组简介（必填，≤60 字）

tracks  曲目数组（最多 10 首），每首：
  title   曲名（必填，≤40 字）
  file    音频路径，相对 zip 根目录，如 content/music/xx.mp3（必填）
          支持格式：mp3 / m4a / aac / wav / ogg / flac
  cover   封面图片路径（可选），如 content/music/xx.png
  artist  歌手名（可选，不填则显示模组 author）

三、硬性规则（违反无法通过审核）
----------------------------------------
1. 曲目最多 10 首
2. 单张图片请控制在 500KB 内（更省流量，非强制）
3. 封面图请用 PNG / JPG
4. thumb.png、avatar.png 必填
5. 名称与描述不得含违规内容

四、制作步骤（三步）
----------------------------------------
1. 解压本模板，把 content/music/ 里的示例音频/封面换成你自己的
2. 用记事本（或任意文本编辑器）打开 mod.json，照着示例改：
   - 改 name / author / desc
   - 改每首曲目，file / cover 路径对应你放的文件
   - 增删曲目：复制一段 { ... } 改内容即可（注意逗号）
3. 重新打包成 zip（注意：是选中"里面的文件"打包，
   不要把外层文件夹打进去，保证打开 zip 第一眼就是 mod.json）

五、提交
----------------------------------------
加 QQ：2312367270
发送：你的 zip 文件 + 想展示的说明（可选）
审核通过后会在游戏内 Mod 库上线，全服玩家可下载。
"""

if __name__ == '__main__':
    main()
