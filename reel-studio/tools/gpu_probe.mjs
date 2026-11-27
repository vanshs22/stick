#!/usr/bin/env node
// What can this machine render with? Run once (a few seconds), also first thing in a Kaggle kernel.
//   node tools/gpu_probe.mjs [--json]      writes ~/.reel-studio/gpu-probe.json; render tools then use its recommended backend
// Opens the same Chrome Remotion uses with each WebGL backend, asks WebGL for its renderer name, and calls it software when the name says SwiftShader/llvmpipe.
// Also reports nvidia-smi, NVENC and Vulkan so the encoder can be chosen. A backend that fails is reported, never hidden.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run, BROWSER_OPTS } from './lib/pipeline.mjs';

export const BACKENDS = { swangle: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], 'angle-egl': ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'], vulkan: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist', '--enable-gpu'], angle: ['--use-gl=angle', '--ignore-gpu-blocklist', '--enable-gpu'] };
const PAGE = "data:text/html,<body><script>const c=document.createElement('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');let r='no-webgl';if(g){const e=g.getExtension('WEBGL_debug_renderer_info');r=e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER)}document.body.textContent='RENDERER['+r+']'</script>";
export const isSoftware = (r) => /swiftshader|llvmpipe|software|softpipe|no-webgl/i.test(r);

export function probe() {
  const exe = BROWSER_OPTS.browserExecutable || 'google-chrome', out = { at: new Date().toISOString(), chrome: exe, backends: {}, gpu: null, nvenc: false, vulkan: false };
  for (const [name, flags] of Object.entries(BACKENDS)) {
    const r = run(exe, ['--headless', '--no-sandbox', '--disable-dev-shm-usage', ...flags, '--virtual-time-budget=2000', '--dump-dom', PAGE], { timeout: 30000 }), m = /RENDERER\[([^\]]*)\]/.exec(r.stdout || '');
    out.backends[name] = m ? { renderer: m[1], software: isSoftware(m[1]) } : { renderer: null, software: true, error: String(r.stderr || r.error || 'no output').split('\n').filter((l) => !/dbus/i.test(l)).slice(0, 2).join(' | ').slice(0, 160) };
  }
  const smi = run('nvidia-smi', ['--query-gpu=name,memory.total', '--format=csv,noheader']); if (smi.status === 0 && smi.stdout?.trim()) out.gpu = smi.stdout.trim().split('\n');
  out.nvenc = /h264_nvenc/.test(run('ffmpeg', ['-hide_banner', '-encoders']).stdout || ''); out.vulkan = run('vulkaninfo', ['--summary']).status === 0;
  const hw = Object.entries(out.backends).find(([, v]) => v.renderer && !v.software);
  out.recommended_gl = hw ? hw[0] : 'swangle'; out.gpu_rendering = !!hw;
  out.encoder = out.gpu && out.nvenc ? 'h264_nvenc (verify with a test clip; it can fail at run time without libnvidia-encode)' : 'libx264';
  out.notes = [...(out.gpu && !hw ? ['An NVIDIA GPU is present but no WebGL backend reached it: Chrome is falling back to software. Check the NVIDIA graphics libraries (libEGL_nvidia, Vulkan ICD) and NVIDIA_DRIVER_CAPABILITIES=all.'] : []), ...(!out.gpu ? ['No NVIDIA GPU found: software rendering (swangle). Slower, same pictures.'] : [])];
  return out;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const r = probe(), f = path.join(os.homedir(), '.reel-studio/gpu-probe.json'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(r, null, 1));
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 1));
  else { for (const [k, v] of Object.entries(r.backends)) console.log(`${k.padEnd(10)} ${v.software ? 'software' : 'GPU     '}  ${v.renderer || v.error}`); console.log(`gpu: ${r.gpu?.join('; ') || 'none'} | nvenc: ${r.nvenc} | vulkan: ${r.vulkan}\nuse: REMOTION_GL=${r.recommended_gl}  encoder: ${r.encoder}\n${r.notes.join('\n')}`); }
}
