#!/usr/bin/env python3
"""生成 Mod 模板所需的全部示例图片（物品图标/缩略图/头像/展示图）"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.dirname(os.path.abspath(__file__))
random.seed(42)


def radial_bg(size, inner, outer):
    """深色径向渐变背景"""
    img = Image.new('RGB', (size, size), outer)
    d = ImageDraw.Draw(img)
    cx = cy = size // 2
    maxr = int(size * 0.72)
    steps = 60
    for i in range(steps, 0, -1):
        r = int(maxr * i / steps)
        t = i / steps
        col = tuple(int(outer[k] + (inner[k] - outer[k]) * t) for k in range(3))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    return img


def glow(draw_img, cx, cy, r, color, blur=18, alpha=110):
    """外发光"""
    lay = Image.new('RGBA', draw_img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (alpha,))
    lay = lay.filter(ImageFilter.GaussianBlur(blur))
    draw_img.alpha_composite(lay)


def gold_watch(size=512):
    """鎏金怀表：金色圆形表盘 + 表冠 + 指针"""
    img = radial_bg(size, (46, 38, 16), (12, 10, 6)).convert('RGBA')
    d = ImageDraw.Draw(img)
    cx = cy = size // 2
    R = int(size * 0.30)
    glow(img, cx, cy, int(R * 1.15), (255, 200, 60), 30, 90)
    # 表冠 + 环
    d.ellipse([cx - 14, cy - R - 42, cx + 14, cy - R - 8], fill=(212, 175, 55))
    d.ellipse([cx - 26, cy - R - 30, cx + 26, cy - R - 6], outline=(255, 223, 110), width=7)
    # 表壳（双圈）
    d.ellipse([cx - R - 12, cy - R - 12, cx + R + 12, cy + R + 12], fill=(120, 96, 26))
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(212, 175, 55))
    d.ellipse([cx - R + 16, cy - R + 16, cx + R - 16, cy + R - 16], fill=(240, 228, 180))
    # 刻度
    for i in range(12):
        a = math.radians(i * 30)
        x1 = cx + (R - 30) * math.sin(a); y1 = cy - (R - 30) * math.cos(a)
        x2 = cx + (R - 44) * math.sin(a); y2 = cy - (R - 44) * math.cos(a)
        d.line([x1, y1, x2, y2], fill=(90, 70, 20), width=6)
    # 指针
    d.line([cx, cy, cx, cy - (R - 60)], fill=(60, 45, 12), width=9)          # 分
    d.line([cx, cy, cx + int((R - 70) * 0.7), cy - int((R - 70) * 0.7)], fill=(60, 45, 12), width=7)  # 时
    d.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=(60, 45, 12))
    return img


def purple_can(size=512):
    """紫晶饮料：紫色罐体 + 高光 + 发光环"""
    img = radial_bg(size, (38, 20, 58), (12, 8, 18)).convert('RGBA')
    d = ImageDraw.Draw(img)
    cx = cy = size // 2
    w, h = int(size * 0.34), int(size * 0.56)
    glow(img, cx, cy, int(size * 0.34), (170, 90, 255), 30, 100)
    x1, y1 = cx - w // 2, cy - h // 2
    x2, y2 = cx + w // 2, cy + h // 2
    # 罐体
    d.rounded_rectangle([x1, y1, x2, y2], radius=int(w * 0.16), fill=(126, 60, 200))
    d.rounded_rectangle([x1 + 10, y1 + 10, x2 - 10, y2 - 10], radius=int(w * 0.13),
                        outline=(206, 150, 255), width=6)
    # 顶/底盖
    d.rounded_rectangle([x1 + 6, y1 - 12, x2 - 6, y1 + 18], radius=12, fill=(200, 200, 214))
    d.rounded_rectangle([x1 + 6, y2 - 18, x2 - 6, y2 + 12], radius=12, fill=(150, 150, 165))
    # 高光条
    d.rounded_rectangle([x1 + int(w*0.14), y1 + 26, x1 + int(w*0.30), y2 - 30],
                        radius=10, fill=(226, 190, 255, 180))
    # 菱形标志
    pts = [(cx, cy - 52), (cx + 42, cy), (cx, cy + 52), (cx - 42, cy)]
    d.polygon(pts, fill=(240, 220, 255))
    d.polygon([(cx, cy - 30), (cx + 24, cy), (cx, cy + 30), (cx - 24, cy)], fill=(126, 60, 200))
    return img


def medkit(size=512):
    """军用急救包：橙色箱体 + 白十字"""
    img = radial_bg(size, (52, 30, 10), (14, 10, 6)).convert('RGBA')
    d = ImageDraw.Draw(img)
    cx = cy = size // 2
    w, h = int(size * 0.62), int(size * 0.46)
    glow(img, cx, cy, int(size * 0.36), (255, 150, 40), 30, 100)
    x1, y1 = cx - w // 2, cy - h // 2
    x2, y2 = cx + w // 2, cy + h // 2
    # 箱体
    d.rounded_rectangle([x1, y1, x2, y2], radius=26, fill=(226, 110, 20))
    d.rounded_rectangle([x1 + 12, y1 + 12, x2 - 12, y2 - 12], radius=18,
                        outline=(255, 190, 110), width=6)
    # 提手
    d.rounded_rectangle([cx - int(w*0.16), y1 - 34, cx + int(w*0.16), y1 + 6],
                        radius=20, outline=(90, 45, 8), width=14)
    # 白十字
    cw = int(w * 0.14); ch = int(h * 0.44)
    d.rounded_rectangle([cx - cw//2, cy - ch//2, cx + cw//2, cy + ch//2], radius=8, fill=(250, 248, 242))
    d.rounded_rectangle([cx - ch//2, cy - cw//2, cx + ch//2, cy + cw//2], radius=8, fill=(250, 248, 242))
    # 扣具
    for fx in (x1 + 30, x2 - 44):
        d.rounded_rectangle([fx, cy - 16, fx + 14, cy + 16], radius=4, fill=(60, 30, 6))
    return img


def compose_thumb(items, size=(360, 202)):
    """列表缩略图：三图标横排 + 深色底"""
    W, H = size
    img = Image.new('RGB', (W, H), (16, 18, 24))
    d = ImageDraw.Draw(img)
    for x in range(0, W, 4):  # 微弱对角纹理
        d.line([(x, 0), (x - H, H)], fill=(20, 23, 30))
    cell = int(H * 0.78)
    gap = (W - cell * 3) // 4
    for i, it in enumerate(items):
        ic = it.resize((cell, cell), Image.LANCZOS)
        x = gap + i * (cell + gap)
        y = (H - cell) // 2
        img.paste(ic, (x, y), ic)
    return img


def avatar(size=128):
    """作者头像占位：青色圆 + 人形剪影"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([0, 0, size - 1, size - 1], fill=(38, 52, 68))
    d.ellipse([0, 0, size - 1, size - 1], outline=(90, 160, 220), width=5)
    cx = size // 2
    d.ellipse([cx - size*0.18, size*0.16, cx + size*0.18, size*0.52], fill=(150, 175, 200))   # 头
    d.ellipse([cx - size*0.34, size*0.58, cx + size*0.34, size*1.25], fill=(150, 175, 200))   # 肩
    return img


def screen_shot(items, size=(640, 360)):
    """详情展示图：三图标 + 装饰框"""
    W, H = size
    img = Image.new('RGB', (W, H), (14, 16, 22))
    d = ImageDraw.Draw(img)
    d.rectangle([6, 6, W - 7, H - 7], outline=(70, 90, 120), width=2)
    cell = int(H * 0.62)
    gap = (W - cell * 3) // 4
    for i, it in enumerate(items):
        ic = it.resize((cell, cell), Image.LANCZOS)
        x = gap + i * (cell + gap)
        y = (H - cell) // 2
        img.paste(ic, (x, y), ic)
    return img


def to_png(img, path, max_kb=480, q_steps=(95, 88, 80, 70, 60)):
    """存 PNG（RGB 无透明则压缩为优化 PNG）；超限则转高质量 JPEG"""
    img.save(path, optimize=True)
    if os.path.getsize(path) <= max_kb * 1024:
        return
    p = path.rsplit('.', 1)[0] + '.png'
    rgb = img.convert('RGB')
    for q in q_steps:
        tmp = p
        rgb.save(tmp, quality=q, optimize=True)
        if os.path.getsize(tmp) <= max_kb * 1024:
            return
    raise SystemExit('无法压缩到限制内: ' + path)


def main():
    watch, can, kit = gold_watch(), purple_can(), medkit()
    items = [watch, can, kit]

    os.makedirs(os.path.join(OUT, 'content', 'items'), exist_ok=True)
    to_png(watch, os.path.join(OUT, 'content', 'items', 'gold_watch.png'))
    to_png(can,   os.path.join(OUT, 'content', 'items', 'purple_can.png'))
    to_png(kit,   os.path.join(OUT, 'content', 'items', 'medkit.png'))
    to_png(compose_thumb(items), os.path.join(OUT, 'thumb.png'))
    to_png(avatar(), os.path.join(OUT, 'avatar.png'))
    to_png(screen_shot(items), os.path.join(OUT, 'screen-1.png'))
    # screen-2/3：单图标大图占位
    to_png(watch.resize((640, 360)).crop((140, 0, 500, 360)), os.path.join(OUT, 'screen-2.png'))
    to_png(kit.resize((640, 360)).crop((140, 0, 500, 360)), os.path.join(OUT, 'screen-3.png'))
    print('images done ->', OUT)


if __name__ == '__main__':
    main()
