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
import zipfile

SRC = "/tmp/app.apk"
HERE = os.path.dirname(os.path.abspath(__file__))
SHELL_DIR = os.path.join(HERE, "shell")
OUT = "/tmp/app-unsigned.apk"

# 包内需要移除的代码文件（相对 APK 根）
CODE_FILES = [
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
    "assets/www/index.html": os.path.join(SHELL_DIR, "index.html"),
    "assets/www/css/shell.css": os.path.join(SHELL_DIR, "css", "shell.css"),
    "assets/www/js/shell.js": os.path.join(SHELL_DIR, "js", "shell.js"),
}

# 物品图 / 收藏室图也移除，由加载页统一下载
REMOVE_PREFIXES = ("assets/www/images/", "assets/www/collect/")

SKIP = set(CODE_FILES)
SKIP.update({"META-INF/MANIFEST.MF", "META-INF/APP.SF", "META-INF/APP.RSA"})


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
            new_info = zipfile.ZipInfo(info.filename, date_time=info.date_time)
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

    print(f"完成：保留 {kept} 项，删除 {removed} 项，壳文件 {len(SHELL_FILES)} 个")
    print("输出:", OUT, f"{os.path.getsize(OUT)/1024/1024:.1f} MB")

    left = sorted(n for n in zipfile.ZipFile(OUT).namelist()
                  if n.startswith("assets/www/") and n.endswith((".js", ".css", ".xml", ".html")))
    print("包内代码类文件:", left)


if __name__ == "__main__":
    main()
