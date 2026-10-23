#!/usr/bin/env python3
"""把原始 APK 改造成“登录加载页即下载页”：

  - 保留原登录入口 main.html（登录 CG 视频页，只引用内置媒体）
  - 删除 assets/www 下全部 js / css / xml 代码文件
  - index.html 换成原加载页样式的下载页：css/shell.css + js/shell.js
  - 图片 / 音频 / 字体等媒体资源保留在包内
  - 删除旧签名文件，输出未签名 APK（随后 zipalign + apksigner）
"""
import os
import sys
import json
import zipfile

SRC = "/tmp/app.apk"
HERE = os.path.dirname(os.path.abspath(__file__))
SHELL_DIR = os.path.join(HERE, "shell")
REPO = os.path.dirname(HERE)
OUT = "/tmp/app-unsigned.apk"

# 包内需要移除的代码文件（相对 APK 根）
CODE_FILES = [
    "assets/www/main.html",
    "assets/www/index.html",
    "assets/www/MiniGame/index.html",
    "assets/www/MiniGame/scripts/all.js",
    "assets/www/MiniGame/images/index.css",
    "assets/www/css/icon.css",
    "assets/www/css/main.css",
    "assets/www/css/styles.css",
    "assets/www/js/debug.js",
    "assets/www/js/inline-scripts.js",
    "assets/www/js/main.js",
    "assets/www/js/music.js",
    "assets/www/js/script_new.js",
    "assets/www/js/synthesis.js",
    "assets/www/js/违禁词.js",
    "assets/www/js/banned-words.js",
    "assets/www/libs/GSAP.js",
    "assets/www/libs/jquery.js",
    "assets/www/libs/lodash.js",
    "assets/www/xml/backgrounds.xml",
    "assets/www/xml/items.xml",
    "assets/www/xml/loading-tips.xml",
    "assets/www/xml/music-config.xml",
    "assets/www/xml/video-config.xml",
]

# 写回包内的壳文件：APK 内路径 -> 仓库内源文件
SHELL_FILES = {
    "assets/www/main.html": os.path.join(SHELL_DIR, "main.html"),
    "assets/www/index.html": os.path.join(SHELL_DIR, "index.html"),
    "assets/www/css/shell.css": os.path.join(SHELL_DIR, "css", "shell.css"),
    "assets/www/js/shell.js": os.path.join(SHELL_DIR, "js", "shell.js"),
    # 包内清单副本：远程清单拿不到时，壳用它算进度
    "assets/www/boot-manifest.json": os.path.join(REPO, "boot", "manifest.json"),
}

# 图片资源保留在包内，但改成 ASCII 文件名（仓库里的引用已同步改写）
RENAME_MAP = json.load(open("/tmp/rename_map.json", encoding="utf-8"))

# audio / music-player 改为首次打开时下载
REMOVE_PREFIXES = ("assets/www/progress/", "assets/www/music-player/", "assets/www/audio/")

# 收藏室背景图：以仓库 media/collect 为准覆盖/补充到包内
# （原包里的同名图会被跳过，改用这里的版本；新增的图直接写进去）
COLLECT_DIR = os.path.join(REPO, "media", "collect")
COLLECT_FILES = {}
if os.path.isdir(COLLECT_DIR):
    for fn in sorted(os.listdir(COLLECT_DIR)):
        COLLECT_FILES["assets/www/collect/" + fn] = os.path.join(COLLECT_DIR, fn)
# 同名的旧图（扩展名可能已从 png 换成 jpg）一律丢掉，避免包里留两份
COLLECT_STEMS = {os.path.splitext(os.path.basename(k))[0] for k in COLLECT_FILES}

# 字体文件：同样以仓库 fonts/ 为准覆盖包内版本
FONTS_DIR = os.path.join(REPO, "fonts")
FONT_FILES = {}
if os.path.isdir(FONTS_DIR):
    for fn in sorted(os.listdir(FONTS_DIR)):
        FONT_FILES["assets/www/fonts/" + fn] = os.path.join(FONTS_DIR, fn)

SKIP = set(CODE_FILES)
SKIP.update({"META-INF/MANIFEST.MF", "META-INF/APP.SF", "META-INF/APP.RSA"})


def mark_paths():
    """从 boot/ 清单里取出所有进度标记路径（progress/xxx.txt）。"""
    out = []
    for rel in ("boot/manifest.json",):
        path = os.path.join(REPO, rel)
        if not os.path.isfile(path):
            sys.exit("缺少清单: " + rel)
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        for item in data.get("files", []):
            p = item.get("path", "")
            if p.startswith("progress/") and p not in out:
                out.append(p)
    return out


def main():
    if not os.path.exists(SRC):
        sys.exit("缺少原始 APK: " + SRC)

    src = zipfile.ZipFile(SRC)
    removed, kept = 0, 0

    with zipfile.ZipFile(OUT, "w") as dst:
        for info in src.infolist():
            if info.filename in SKIP or info.filename.startswith(REMOVE_PREFIXES):
                removed += 1
                continue
            data = src.read(info.filename)
            name = info.filename
            if name.startswith("assets/www/"):
                rel = name[len("assets/www/"):]
                if rel in RENAME_MAP:
                    name = "assets/www/" + RENAME_MAP[rel]
            if name in COLLECT_FILES or name in FONT_FILES or (
                    name.startswith("assets/www/collect/")
                    and os.path.splitext(os.path.basename(name))[0] in COLLECT_STEMS):
                # 收藏室背景图 / 字体统一由下面的覆盖清单重写，避免包里出现重复条目
                removed += 1
                continue
            new_info = zipfile.ZipInfo(name, date_time=info.date_time)
            new_info.compress_type = info.compress_type
            new_info.external_attr = info.external_attr
            new_info.internal_attr = info.internal_attr
            new_info.create_system = info.create_system
            dst.writestr(new_info, data)
            kept += 1

        for name, path in SHELL_FILES.items():
            with open(path, "rb") as f:
                data = f.read()
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 23, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            dst.writestr(info, data)

        # 收藏室背景图：覆盖 + 补充
        for name, path in COLLECT_FILES.items():
            with open(path, "rb") as f:
                data = f.read()
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 23, 0, 0, 0))
            info.compress_type = zipfile.ZIP_STORED
            info.external_attr = 0o644 << 16
            dst.writestr(info, data)

        # 字体：覆盖包内旧版本
        for name, path in FONT_FILES.items():
            with open(path, "rb") as f:
                data = f.read()
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 23, 0, 0, 0))
            info.compress_type = zipfile.ZIP_STORED
            info.external_attr = 0o644 << 16
            dst.writestr(info, data)

        # 进度标记：包内同名文件写 "0"，下载完成后内部存储里的 "1" 会覆盖它
        for rel in mark_paths():
            info = zipfile.ZipInfo("assets/www/" + rel, date_time=(2026, 10, 23, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            dst.writestr(info, "0")

    print(f"完成：保留 {kept} 项，删除 {removed} 项，壳文件 {len(SHELL_FILES)} 个，"
          f"进度标记 {len(mark_paths())} 个")
    print("输出:", OUT, f"{os.path.getsize(OUT)/1024/1024:.1f} MB")

    left = sorted(n for n in zipfile.ZipFile(OUT).namelist()
                  if n.startswith("assets/www/") and n.endswith((".js", ".css", ".xml", ".html")))
    print("包内代码类文件:", left)


if __name__ == "__main__":
    main()
