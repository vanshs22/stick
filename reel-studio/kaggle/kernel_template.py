# Kaggle kernel script (generated copy lives in <out>/kernel/kernel.py). Runs a reel-studio project on Kaggle's free GPUs.
# UNVERIFIED on Kaggle itself: the first run is a probe. Read its output before trusting the GPU path.
import json, os, shutil, subprocess, sys, tarfile
from pathlib import Path

CFG = json.loads('''__CONFIG__''')
IN = Path('/kaggle/input') / CFG['dataset_slug']; WORK = Path('/kaggle/working'); RS = WORK / 'rs'

def sh(cmd, **kw):
    print('$', cmd if isinstance(cmd, str) else ' '.join(cmd), flush=True)
    return subprocess.run(cmd, shell=isinstance(cmd, str), text=True, **kw)

# 1. unpack toolkit + project (node_modules is bundled when the dataset was built with --with-node-modules, so no internet is needed)
if not RS.exists():
    with tarfile.open(next(IN.glob('*.tar.gz'))) as t: t.extractall(WORK)
os.chdir(RS)
env = dict(os.environ, NODE_USE_ENV_PROXY='1')

# 2. node
if shutil.which('node') is None:
    sh('curl -fsSL https://nodejs.org/dist/v22.12.0/node-v22.12.0-linux-x64.tar.xz | tar -xJ -C /opt && ln -sf /opt/node-v22.12.0-linux-x64/bin/* /usr/local/bin/')
if not (RS / 'remotion-template/node_modules').exists():
    sh('cd remotion-template && npm ci --no-audit --no-fund')

# 3. probe: which WebGL backend reaches the GPU, is NVENC usable
sh('node tools/gpu_probe.mjs')
probe = json.loads((Path.home() / '.reel-studio/gpu-probe.json').read_text())
gl = probe['recommended_gl']; print('RECOMMENDED GL:', gl, '| GPU rendering:', probe['gpu_rendering'])
if CFG['probe_only']: sys.exit(0)

# 4. render: one process per GPU, each its balanced share of the shots, then assemble
n = max(1, len(probe.get('gpu') or [])) if probe['gpu_rendering'] else 1
procs = []
for i in range(n):
    e = dict(env, REMOTION_GL=gl, CUDA_VISIBLE_DEVICES=str(i), REMOTION_CONCURRENCY=str(CFG.get('concurrency', 3)))
    procs.append(subprocess.Popen(['node', 'tools/build_video.mjs', f"project", '--tier', CFG['tier'], '--shard', f'{i+1}/{n}', '--no-assemble'], env=e))
codes = [p.wait() for p in procs]; print('shard exit codes', codes)
sh(['node', 'tools/assemble.mjs', 'project', CFG['name']])
# 5. results into /kaggle/working (kept as kernel output)
out = WORK / 'out'; out.mkdir(exist_ok=True)
for f in (RS / 'project/renders').glob('*.mp4'): shutil.copy(f, out / f.name)
shutil.copy(Path.home() / '.reel-studio/gpu-probe.json', out / 'gpu-probe.json')
print('DONE', [p.name for p in out.iterdir()])
