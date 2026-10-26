#!/usr/bin/env python3
"""生成背景类 / 音乐类示例模组 zip（供官方示例发布）"""
import json, math, os, random, struct, wave, zipfile
from PIL import Image, ImageDraw, ImageFilter

OUT = '/tmp/example-mods'
os.makedirs(OUT, exist_ok=True)
random.seed(7)


def vignette(img):
    W, H = img.size
    mask = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-W * 0.2, -H * 0.2, W * 1.2, H * 1.2], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(W // 8))
    black = Image.new('RGB', (W, H), (0, 0, 0))
    return Image.composite(img, black, mask)


def make_background(W=1280, H=720):
    img = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(img)
    # 垂直渐变 深蓝黑
    for y in range(H):
        t = y / H
        r = int(8 + 18 * t); g = int(12 + 26 * t); b = int(20 + 40 * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))
    # 远景轮廓（山地/废墟感）
    for layer, (base, col) in enumerate([(0.58, (14, 20, 30)), (0.68, (10, 15, 23)), (0.78, (7, 10, 16))]):
        pts = [(0, H)]
        x = 0
        while x <= W:
            y = int(H * base + math.sin(x / (140 + layer * 60)) * 28 + random.uniform(-14, 14))
            pts.append((x, y)); x += 40
        pts.append((W, H))
        d.polygon(pts, fill=col)
    # 微光点
    for _ in range(120):
        x, y = random.randrange(W), random.randrange(int(H * 0.6))
        a = random.randint(40, 140)
        d.point((x, y), fill=(a + 60, a + 70, a + 90))
    # 中央光晕
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W * 0.36, H * 0.12, W * 0.64, H * 0.5], fill=(60, 110, 180, 26))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    img = Image.alpha_composite(img.convert('RGBA'), glow).convert('RGB')
    return vignette(img)


def make_cover(size=320):
    img = Image.new('RGB', (size, size), (12, 16, 26))
    d = ImageDraw.Draw(img)
    for i in range(0, size, 4):
        d.line([(0, i), (size, i)], fill=(16, 22, 36))
    cx = cy = size // 2
    for k, col in [(0.82, (30, 90, 160)), (0.62, (60, 150, 220)), (0.40, (120, 200, 255))]:
        r = int(size * k / 2)
        d.arc([cx - r, cy - r, cx + r, cy + r], 200, 340, fill=col, width=max(2, size // 40))
    d.ellipse([cx - 14, cy - 14, cx + 14, cy + 14], fill=(140, 210, 255))
    return img


def make_thumb(img, size=(360, 202)):
    W, H = size
    out = img.convert('RGB').resize((W, W * img.size[1] // img.size[0]))
    top = (out.size[1] - H) // 2
    return out.crop((0, max(0, top), W, max(0, top) + H))


def make_avatar(size=128):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([0, 0, size - 1, size - 1], fill=(24, 34, 48))
    d.ellipse([0, 0, size - 1, size - 1], outline=(96, 180, 240), width=5)
    d.ellipse([size * 0.3, size * 0.18, size * 0.7, size * 0.58], fill=(150, 190, 225))
    d.ellipse([size * 0.14, size * 0.6, size * 0.86, size * 1.3], fill=(150, 190, 225))
    return img


def write_wav(path, seconds=16, sr=22050):
    """简单氛围旋律：低音铺底 + 琶音"""
    n = int(sr * seconds)
    buf = bytearray()
    notes = [220.0, 261.63, 329.63, 392.0, 329.63, 261.63]
    for i in range(n):
        t = i / sr
        step = int(t * 3) % len(notes)
        f = notes[step]
        env = 0.5 + 0.5 * math.sin(2 * math.pi * 0.25 * t)          # 缓慢呼吸
        arp = 0.22 * math.sin(2 * math.pi * f * t) * math.exp(-((t * 3) % 1) * 2.2)
        pad = 0.16 * math.sin(2 * math.pi * 110 * t) + 0.10 * math.sin(2 * math.pi * 165 * t)
        v = (arp + pad) * env * 0.9
        buf += struct.pack('<h', max(-32768, min(32767, int(v * 32767))))
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(bytes(buf))


def zip_mod(directory, out_zip):
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(directory):
            for f in files:
                p = os.path.join(root, f)
                z.write(p, os.path.relpath(p, directory))


def save_png(img, path):
    img.save(path, optimize=True)


# ---------- 背景类 ----------
bg_dir = os.path.join(OUT, 'bg_mod')
os.makedirs(os.path.join(bg_dir, 'content', 'backgrounds'), exist_ok=True)
bg = make_background()
save_png(bg, os.path.join(bg_dir, 'content', 'backgrounds', 'night_ruins.png'))
save_png(make_thumb(bg), os.path.join(bg_dir, 'thumb.png'))
save_png(make_avatar(), os.path.join(bg_dir, 'avatar.png'))
save_png(make_thumb(bg, (640, 360)), os.path.join(bg_dir, 'screen-1.png'))
json.dump({
    "name": "示例背景模组", "author": "官方示例", "version": "1.0.0",
    "type": "background",
    "desc": "官方示例：一张可用的背景图。替换 content/backgrounds 下的图片即可。",
    "backgrounds": [{"name": "夜幕废墟", "file": "content/backgrounds/night_ruins.png"}]
}, open(os.path.join(bg_dir, 'mod.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
zip_mod(bg_dir, os.path.join(OUT, 'official_example_background.zip'))

# ---------- 音乐类 ----------
mu_dir = os.path.join(OUT, 'music_mod')
os.makedirs(os.path.join(mu_dir, 'content', 'music'), exist_ok=True)
write_wav(os.path.join(mu_dir, 'content', 'music', 'night_patrol.wav'))
cover = make_cover()
save_png(cover, os.path.join(mu_dir, 'content', 'music', 'cover.png'))
save_png(make_thumb(cover), os.path.join(mu_dir, 'thumb.png'))
save_png(make_avatar(), os.path.join(mu_dir, 'avatar.png'))
save_png(make_thumb(cover, (640, 360)), os.path.join(mu_dir, 'screen-1.png'))
json.dump({
    "name": "示例音乐模组", "author": "官方示例", "version": "1.0.0",
    "type": "music",
    "desc": "官方示例：一首可直接播放的曲目。替换 content/music 下的音频即可。",
    "tracks": [{"title": "夜幕巡逻", "artist": "官方示例",
                "file": "content/music/night_patrol.wav",
                "cover": "content/music/cover.png"}]
}, open(os.path.join(mu_dir, 'mod.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
zip_mod(mu_dir, os.path.join(OUT, 'official_example_music.zip'))

for f in ('official_example_background.zip', 'official_example_music.zip'):
    print(f, os.path.getsize(os.path.join(OUT, f)), 'bytes')
