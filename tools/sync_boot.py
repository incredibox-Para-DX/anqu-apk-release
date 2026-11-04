#!/usr/bin/env python3
"""把需要远程加载的代码文件同步到 boot/ 与 boot2/，并生成各自的 manifest.json。

APK 内只保留“登录界面壳”（main.html + css/shell.css + js/shell.js），
启动时从 boot/ 拉取全部运行文件到内部存储。

boot2/ 是 boot/ 的镜像，manifest 版本号多一个 .m 后缀：
当上次下载不完整（版本号已写入但文件缺失）时，壳会切到 boot2 强制重新下载。

发版流程：修改根目录代码后执行本脚本，再推送仓库。
"""
import json
import hashlib
import re
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


CODE_FILES = [
    "MiniGame/index.html",
    "MiniGame/scripts/all.js",
    "MiniGame/images/index.css",
    "css/icon.css",
    "css/main.css",
    "css/styles.css",
    "debug-console.css",
    "js/debug.js",
    "js/inline-scripts.js",
    "js/main.js",
    "js/modal-registry.js",
    "js/music.js",
    "js/net-mirror.js",
    "js/telemetry.js",
    "js/ui-fx.js",
    "js/themes.js",
    "js/mod-editor.js",
    "js/collect-pack.js",
    "js/cloud-profile.js",
    "js/telemetry-dashboard.js",
    "js/net.js",
    "js/redeem.js",
    "js/script_new.js",
    "js/synthesis.js",
    "js/banned-words.js",
    "js/storage.js",
    "js/i18next.min.js",
    "js/i18n.js",
    "js/i18n-next.js",
    "js/i18n-rules.js",
    "js/cards.js",
    "js/pass.js",
    "js/card-pack.js",
    "js/entitlements.js",
    "js/bans.js",
    "js/item-i18n.js",
    "js/bg-i18n.js",
    "js/gm-i18n.js",
    "js/toast-catalog.js",
    "libs/GSAP.js",
    "libs/jquery.js",
    "libs/lodash.js",
    "libs/jszip.min.js",
    "js/mods.js",
    "js/thanks.js",
    "js/particles.js",
    "js/ui-polish.js",
    "js/catalog.js",
    "admin/anqu-admin.html",
    "admin/leaderboard-admin.html",
    "xml/backgrounds.xml",
    "xml/items.dat",
    "xml/loading-tips.xml",
    "xml/music-config.xml",
    "xml/video-config.xml",
    "lion-inspect.html",
    "secretfile-inspect.html",
    "xcompound-inspect.html",
    "item-inspect.html",
]


BULK_DIRS = ["lion", "vendor/three"]


def bulk_files():
    out = []
    for d in BULK_DIRS:
        base = os.path.join(ROOT, d)
        for dirpath, _, names in os.walk(base):
            for name in sorted(names):
                rel = os.path.relpath(os.path.join(dirpath, name), ROOT)
                out.append(rel.replace(os.sep, "/"))
    return out




BOOT_ORDER = CODE_FILES + bulk_files() + ["index.html"]

TARGETS = [("boot", ""), ("boot2", ".m")]


MARK_COUNT = 0


MEDIA_ROOT = "media"
MEDIA_DIRS = ["images", "collect"]



MEDIA_MARKS = 0


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
    total = len(BOOT_ORDER)
    step = max(1, total // MARK_COUNT) if MARK_COUNT > 0 else 0
    mi = 0
    for i, rel in enumerate(BOOT_ORDER, 1):
        src = os.path.join(ROOT, rel)
        if not os.path.isfile(src):
            print("缺失文件:", rel, file=sys.stderr)
            sys.exit(1)
        dst = os.path.join(out_dir, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        files.append({"path": rel, "size": os.path.getsize(src), "sha256": hashlib.sha256(open(src, 'rb').read()).hexdigest()})


        if step and (i % step == 0 or i == total):
            mi += 1
            mark = "progress/c%03d.txt" % mi
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

    sc = os.path.join(ROOT, 'js', 'script_new.js')
    if os.path.isfile(sc):
        txt = open(sc, encoding='utf-8').read()
        txt = re.sub(r"HU_BUILD_VERSION = 'v[^']+'", "HU_BUILD_VERSION = '" + version + "'", txt)
        open(sc, 'w', encoding='utf-8').write(txt)

    for dirname, suffix in TARGETS:
        build(dirname, suffix, version)
    build_media()



    src = os.path.join(ROOT, "boot", "manifest.json")
    with open(src, encoding="utf-8") as f:
        data = json.load(f)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"manifest.json 已同步 boot/ 清单：{data['version']}，{len(data['files'])} 项")


if __name__ == "__main__":
    main()
