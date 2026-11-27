#!/usr/bin/env python3
"""Linux only, when Blender's `bpy` cannot load because a system library is missing (libSM, libGL ...) and you cannot install packages (no root, read-only system).
Downloads the few Ubuntu 20.04 libraries into <toolkit>/.syslibs (no root needed); tools/photoreal.mjs adds that folder to LD_LIBRARY_PATH itself."""
import gzip, os, re, subprocess, sys, urllib.request
TK = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); dest = os.path.join(TK, '.syslibs'); dl = os.path.join(dest, 'dl'); os.makedirs(dl, exist_ok=True)
base = 'http://archive.ubuntu.com/ubuntu/'; idx = {}
for comp in ('main', 'universe'):
    d = urllib.request.urlopen(f'{base}dists/focal/{comp}/binary-amd64/Packages.gz', timeout=60).read()
    for blk in gzip.decompress(d).decode().split('\n\n'):
        m = re.search(r'^Package: (.+)$', blk, re.M); f = re.search(r'^Filename: (.+)$', blk, re.M)
        if m and f: idx[m.group(1)] = f.group(1)
for p in 'libsm6 libice6 libgl1 libglvnd0 libglx0 libxi6 libxxf86vm1 libxfixes3 libxrender1 libxext6 libx11-6 libxcb1 libxau6 libxdmcp6 libbsd0 libmd0 libuuid1'.split():
    out = os.path.join(dl, p + '.deb')
    if not os.path.exists(out): open(out, 'wb').write(urllib.request.urlopen(base + idx[p], timeout=120).read())
    subprocess.run(f'cd "{dl}" && ar x {p}.deb && tar -xf data.tar.* -C .. && rm -f data.tar.* control.tar.* debian-binary', shell=True, check=True); print('ok', p)
import shutil; shutil.rmtree(dl, ignore_errors=True); print('done:', dest)
