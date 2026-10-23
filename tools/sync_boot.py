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

# index.html 放最后下载：中途失败时内部存储里没有入口页，加载页仍会显示
# main.html 是启动入口（登录 CG + 下载界面），只留在 APK 里，始终不被覆盖
BOOT_ORDER = CODE_FILES + ["index.html"]

TARGETS = [("boot", ""), ("boot2", ".m")]

# 物品图 / 收藏室图：放在 media/ 下（启动加载页下载，路径仍按 www 根目录的 images/、collect/）
MEDIA_ROOT = "media"
MEDIA_DIRS = ["images", "collect"]

# 真实进度用的标记文件：远程内容写清单版本号，APK 里放同名文件内容 "0"
# 版本号参与比对，图片/代码版本一变，旧标记自动失效，进度从头开始
MEDIA_MARKS = 100


def write_mark(out_dir, rel, content):
    dst = os.path.join(out_dir, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst, "w", encoding="ascii") as f:
        f.write(content)


def build(dirname, suffix, version):
    out_dir = os.path.join(ROOT, dirname)
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir)

    files = []
    for i, rel in enumerate(BOOT_ORDER, 1):
        src = os.path.join(ROOT, rel)
        if not os.path.isfile(src):
            print("缺失文件:", rel, file=sys.stderr)
            sys.exit(1)
        dst = os.path.join(out_dir, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        files.append({"path": rel, "size": os.path.getsize(src)})

        # 每个文件后面跟一个进度标记，壳据此算真实进度
        mark = "progress/c%02d.txt" % i
        write_mark(out_dir, mark, version + suffix)
        files.append({"path": mark, "size": len(version) + len(suffix)})

    out = {"version": version + suffix, "files": files, "fileCount": len(files),
           "totalSize": sum(f["size"] for f in files)}
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"{dirname}/ 已生成：{len(files)} 个文件，共 {out['totalSize']/1024/1024:.2f} MB，"
          f"版本 {out['version']}")


def build_media():
    """生成 media/manifest.json。版本号独立（media/version.txt），
    改代码不会触发图片重下，只有改图时手动升这个版本号。"""
    out_dir = os.path.join(ROOT, MEDIA_ROOT)
    version_file = os.path.join(out_dir, "version.txt")
    version = "v2.1.0_media.1"
    if os.path.isfile(version_file):
        with open(version_file, encoding="utf-8") as f:
            version = (f.readline() or "").strip() or version

    real = []
    for d in MEDIA_DIRS:
        base = os.path.join(out_dir, d)
        if not os.path.isdir(base):
            print("缺失目录:", os.path.join(MEDIA_ROOT, d), file=sys.stderr)
            sys.exit(1)
        for name in sorted(os.listdir(base)):
            path = os.path.join(base, name)
            if os.path.isfile(path):
                real.append({"path": d + "/" + name, "size": os.path.getsize(path)})

    # 按字节把 100 个进度标记插到图片序列里，壳据此算真实下载百分比
    progress_dir = os.path.join(out_dir, "progress")
    if os.path.isdir(progress_dir):
        shutil.rmtree(progress_dir)
    total_bytes = sum(f["size"] for f in real) or 1
    files = []
    cum = 0
    mk = 0
    for f in real:
        files.append(f)
        cum += f["size"]
        while mk < MEDIA_MARKS and cum >= total_bytes * (mk + 1) / MEDIA_MARKS:
            mk += 1
            mark = "progress/m%03d.txt" % mk
            write_mark(out_dir, mark, version)
            files.append({"path": mark, "size": len(version)})

    out = {"version": version, "files": files, "fileCount": len(files),
           "totalSize": sum(f["size"] for f in real)}
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"{MEDIA_ROOT}/ 已生成：{len(real)} 张图 + {mk} 个进度标记，共 "
          f"{out['totalSize']/1024/1024:.2f} MB，版本 {out['version']}")


def main():
    version = "unknown"
    manifest_path = os.path.join(ROOT, "manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as f:
            version = json.load(f).get("version", "unknown")

    for dirname, suffix in TARGETS:
        build(dirname, suffix, version)
    build_media()


if __name__ == "__main__":
    main()
