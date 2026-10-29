"""把仓库的 boot/ boot2/ manifest.json 同步到本地 Gitee 镜像目录，供推送。
用法：
  python3 tools/sync_gitee.py            # 默认镜像目录 /tmp/gitee_mirror
  GITEE_MIRROR=/path/to/clone python3 tools/sync_gitee.py
推送（需要你的 Gitee 令牌/密码）：
  git -C /tmp/gitee_mirror push gitee master
"""
import os
import shutil
import subprocess

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIRROR = os.environ.get('GITEE_MIRROR', '/tmp/gitee_mirror')


def main():
    os.makedirs(MIRROR, exist_ok=True)
    for name in ('boot', 'boot2'):
        src = os.path.join(REPO, name)
        dst = os.path.join(MIRROR, name)
        if not os.path.isdir(src):
            raise SystemExit('missing ' + src)
        if os.path.isdir(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    shutil.copy2(os.path.join(REPO, 'manifest.json'), os.path.join(MIRROR, 'manifest.json'))
    # Mod 模板（供 mods.js 的 TEMPLATE_MIRROR 使用）
    tpl_src = os.path.join(REPO, 'tools', 'mod-template')
    if os.path.isdir(tpl_src):
        tpl_dst = os.path.join(MIRROR, 'tools', 'mod-template')
        if os.path.isdir(tpl_dst):
            shutil.rmtree(tpl_dst)
        os.makedirs(os.path.join(MIRROR, 'tools'), exist_ok=True)
        shutil.copytree(tpl_src, tpl_dst)
    subprocess.call(['git', '-C', MIRROR, 'add', '-A'])
    subprocess.call(['git', '-C', MIRROR, '-c', 'user.email=bot@local',
                     '-c', 'user.name=bot', 'commit', '-m', 'sync boot/boot2/manifest'])
    print('synced ->', MIRROR)
    print('push: git -C %s push gitee master' % MIRROR)


if __name__ == '__main__':
    main()
