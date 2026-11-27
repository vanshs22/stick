# Rendering on Kaggle's free GPUs

What is verified: the packer, the shard split, the tier flags and the probe run and are tested here (`node tools/selftest_gpu.mjs`). What is NOT verified: anything on Kaggle itself (GPU types, hours, whether Chrome reaches the GPU, NVENC). The first run is a probe for that reason.

1. `node tools/gpu_probe.mjs` anywhere, any time: which WebGL backend reaches a GPU, is NVENC present. Render tools use its answer (`~/.reel-studio/gpu-probe.json`); `REMOTION_GL` overrides.
2. `node tools/kaggle_pack.mjs <project> --user <kaggle-username> --probe-only` builds `kaggle-pack/` (dataset tarball, kernel script, both metadata files).
3. Create the dataset and push the kernel with a Kaggle MCP or the CLI (`kaggle datasets create -p kaggle-pack/dataset`, `kaggle kernels push -p kaggle-pack/kernel`). Keep GPU and, for the first run, internet on. Poll, then read the kernel log: it prints `RECOMMENDED GL` and whether GPU rendering works.
4. If the probe says GPU rendering is real, pack again without `--probe-only` (`--tier proof` first, then `final`). The kernel starts one render process per GPU, each with `--shard i/n` (balanced by frames), then assembles once and leaves the MP4s and `gpu-probe.json` in the kernel output.
5. No internet in the kernel: build the pack with `--with-node-modules` and bundle Chrome (`REEL_CHROME`) and the Kokoro/Whisper models yourself; fonts are already local (`tools/fonts_localize.mjs`).

If the probe shows only software rendering, the pipeline still works and still splits shots across processes, just without the GPU speed-up. Do not assume more until the probe says so.
