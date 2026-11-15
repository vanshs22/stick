"""Sample the combined resident memory of everything started by a command and report the peak.
  python deploy/peakmem.py -- taskset -c 0,1 bash make.sh script.txt --name x
Used to check that a render fits a 4 GB / 2 vCPU VPS."""
import subprocess, sys, time
cmd = sys.argv[sys.argv.index("--") + 1:]
p = subprocess.Popen(cmd)
def rss_tree(root):
    kids = {}
    for d in __import__("os").listdir("/proc"):
        if d.isdigit():
            try:
                st = open(f"/proc/{d}/stat").read().rsplit(")", 1)[1].split()
                kids.setdefault(int(st[1]), []).append((int(d), int(st[21])))
            except Exception: pass
    total, todo = 0, [root]
    while todo:
        n = todo.pop()
        for pid, rss in kids.get(n, []):
            total += rss * 4096; todo.append(pid)
    return total
peak = 0; t0 = time.time(); trace = []
while p.poll() is None:
    m = rss_tree(p.pid); peak = max(peak, m)
    if int(time.time() - t0) % 20 == 0 and (not trace or time.time() - trace[-1][0] > 19): trace.append((time.time(), m))
    time.sleep(0.4)
print(f"\nPEAK MEMORY {peak/1e6:.0f} MB, wall time {time.time()-t0:.0f} s, exit {p.returncode}")
sys.exit(p.returncode)
