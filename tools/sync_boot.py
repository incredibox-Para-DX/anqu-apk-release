#!/usr/bin/env python3
"""把需要远程加载的代码文件同步到 boot/ 与 boot2/，并生成各自的 manifest.json。

APK 内只保留“登录界面壳”（main.html + css/shell.css + js/shell.js），
启动时从 boot/ 拉取全部运行文件到内部存储。

boot2/ 是 boot/ 的镜像，manifest 版本号多一个 .m 后缀：
当上次下载不完整（版本号已写入但文件缺失）时，壳会切到 boot2 强制重新下载。

发版流程：修改根目录代码后执行本脚本，再推送仓库。
"""
import json
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 需要从 APK 中移除、改为远程加载的代码文件（相对仓库根目录）
CODE_FILES = [
    "MiniGame/index.html",
    "MiniGame/scripts/all.js",
    "MiniGame/images/index.css",
    "css/icon.css",
    "css/main.css",
    "css/styles.css",
    "js/debug.js",
    "js/inline-scripts.js",
    "js/main.js",
    "js/music.js",
    "js/script_new.js",
    "js/synthesis.js",
    "js/banned-words.js",
    "libs/GSAP.js",
    "libs/jquery.js",
    "libs/lodash.js",
    "xml/backgrounds.xml",
    "xml/items.xml",
    "xml/loading-tips.xml",
    "xml/music-config.xml",
    "xml/video-config.xml",
]

# 入口页放最后下载：中途失败时内部存储里没有入口页，壳仍会显示
BOOT_ORDER = CODE_FILES + ["index.html", "main.html"]

TARGETS = [("boot", ""), ("boot2", ".m")]


def build(dirname, suffix, version):
    out_dir = os.path.join(ROOT, dirname)
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir)

    files = []
    for rel in BOOT_ORDER:
        src = os.path.join(ROOT, rel)
        if not os.path.isfile(src):
            print("缺失文件:", rel, file=sys.stderr)
            sys.exit(1)
        dst = os.path.join(out_dir, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        files.append({"path": rel, "size": os.path.getsize(src)})

    out = {"version": version + suffix, "files": files, "fileCount": len(files),
           "totalSize": sum(f["size"] for f in files)}
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"{dirname}/ 已生成：{len(files)} 个文件，共 {out['totalSize']/1024/1024:.2f} MB，"
          f"版本 {out['version']}")


def main():
    version = "unknown"
    manifest_path = os.path.join(ROOT, "manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as f:
            version = json.load(f).get("version", "unknown")

    for dirname, suffix in TARGETS:
        build(dirname, suffix, version)


if __name__ == "__main__":
    main()
