#!/usr/bin/env python3
"""图片加密工具（PoC）：把指定图片 XOR 加密为 .enc，并可选删除原图。
用法：
  python3 tools/encrypt_images.py <密钥> <文件1> [文件2 ...]
"""
import sys, os

def xor(data: bytes, key: bytes) -> bytes:
    out = bytearray(len(data))
    kl = len(key)
    for i, b in enumerate(data):
        out[i] = b ^ key[i % kl]
    return bytes(out)

def main():
    if len(sys.argv) < 3:
        print('usage: encrypt_images.py <key> <files...>'); return 1
    key = sys.argv[1].encode('utf-8')
    for p in sys.argv[2:]:
        if not os.path.isfile(p):
            print('skip', p); continue
        data = open(p, 'rb').read()
        enc = xor(data, key)
        out = p + '.enc'
        with open(out, 'wb') as f:
            f.write(enc)
        print('encrypted', p, '->', out, len(data), 'bytes')
    return 0

if __name__ == '__main__':
    sys.exit(main())
