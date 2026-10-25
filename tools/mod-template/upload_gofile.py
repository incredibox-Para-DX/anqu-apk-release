#!/usr/bin/env python3
"""上传文件到 gofile.io 并输出下载链接"""
import json, os, sys, urllib.request, uuid, mimetypes

def upload(path):
    # 1. 取上传服务器
    with urllib.request.urlopen('https://api.gofile.io/servers', timeout=20) as r:
        servers = json.load(r)
    server = servers['data']['servers'][0]['name']
    print('使用服务器:', server)

    # 2. multipart 上传
    boundary = '----' + uuid.uuid4().hex
    fname = os.path.basename(path)
    ctype = mimetypes.guess_type(fname)[0] or 'application/octet-stream'
    with open(path, 'rb') as f:
        data = f.read()
    body = b''
    body += ('--%s\r\n' % boundary).encode()
    body += ('Content-Disposition: form-data; name="file"; filename="%s"\r\n' % fname).encode()
    body += ('Content-Type: %s\r\n\r\n' % ctype).encode()
    body += data + b'\r\n'
    body += ('--%s--\r\n' % boundary).encode()

    url = 'https://%s.gofile.io/contents/uploadfile' % server
    req = urllib.request.Request(url, data=body, method='POST')
    req.add_header('Content-Type', 'multipart/form-data; boundary=%s' % boundary)
    with urllib.request.urlopen(req, timeout=120) as r:
        resp = json.load(r)
    print(json.dumps(resp, ensure_ascii=False, indent=2))
    if resp.get('status') == 'ok':
        print('下载链接:', resp['data']['downloadPage'])
        print('直链:', resp['data'].get('link', ''))

if __name__ == '__main__':
    upload(sys.argv[1])
