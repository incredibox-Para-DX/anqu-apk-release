#!/usr/bin/env python3
"""把原始 APK 改造成"启动器壳"：
   - 删除 assets/www 下的代码文件（js/css/xml/html）
   - 用启动器页面替换 assets/www/index.html
   - 保留图片/音频/字体等媒体资源
   - 删除旧签名，输出未签名 APK
"""
import os
import sys
import zipfile

SRC = "/tmp/app.apk"
BOOTSTRAP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bootstrap.html")
OUT = "/tmp/app-unsigned.apk"

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
    "assets/www/libs/GSAP.js",
    "assets/www/libs/jquery.js",
    "assets/www/libs/lodash.js",
    "assets/www/xml/backgrounds.xml",
    "assets/www/xml/items.xml",
    "assets/www/xml/loading-tips.xml",
    "assets/www/xml/music-config.xml",
    "assets/www/xml/video-config.xml",
]

SKIP = set(CODE_FILES)
SKIP.update({"META-INF/MANIFEST.MF", "META-INF/APP.SF", "META-INF/APP.RSA"})


def main():
    if not os.path.exists(SRC):
        sys.exit("缺少原始 APK: " + SRC)
    with open(BOOTSTRAP, encoding="utf-8") as f:
        bootstrap = f.read().encode("utf-8")

    src = zipfile.ZipFile(SRC)
    names = src.namelist()
    removed, kept = 0, 0

    with zipfile.ZipFile(OUT, "w") as dst:
        for info in src.infolist():
            if info.filename in SKIP:
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

        # 启动器作为新的入口页，压缩写入
        info = zipfile.ZipInfo("assets/www/index.html", date_time=(2026, 10, 23, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        dst.writestr(info, bootstrap)

    print(f"完成：保留 {kept} 项，删除 {removed} 项，入口页已替换")
    print("输出:", OUT, f"{os.path.getsize(OUT)/1024/1024:.1f} MB")

    # 校验：确认代码文件已不在包内
    left = [n for n in zipfile.ZipFile(OUT).namelist()
            if n.startswith("assets/www/") and
            (n.endswith((".js", ".css", ".xml")) or n.endswith(".html"))]
    print("包内剩余代码类文件:", left)


if __name__ == "__main__":
    main()
