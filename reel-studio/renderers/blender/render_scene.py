#!/usr/bin/env python
"""Photoreal engine: a scene spec (JSON) -> a path-traced frame, its depth map and a film look. Runs in .venv-blender (the `bpy` module, Cycles on CPU or GPU).
   .venv-blender/bin/python renderers/blender/render_scene.py <scene.json> <out-prefix> [--t 0.0] [--samples N] [--scale 1.0] [--sequence --fps 12 --seconds 3]
Writes <out>.png (the plate, after the film look), <out>.depth.png (16-bit, 1 = near, 0 = far) and <out>.json (near/far, fov, camera). Sequence mode writes <out>_0001.png ...
The scene spec is documented in docs/PHOTOREAL.md. Honest limit: no people. Props, rooms, products, landscapes and abstract sets only (assets: tools/assets/polyhaven.mjs)."""
import json, math, os, sys, time
import bpy
from mathutils import Vector

A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
def opt(k, d=None, cast=str):
    return cast(A[A.index('--' + k) + 1]) if '--' + k in A else d
spec_path, out = A[0], A[1]
S = json.load(open(spec_path)); base = os.path.dirname(os.path.abspath(spec_path))
def P(p):  # a path in the spec is relative to the project (the spec's folder or its parent)
    if os.path.isabs(p): return p
    for b in (base, os.path.dirname(base), os.getcwd()):
        if os.path.exists(os.path.join(b, p)): return os.path.join(b, p)
    return os.path.join(base, p)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; r = sc.render
W0, H0 = S.get('resolution', [1920, 1080]); k = opt('scale', 1.0, float); OV = S.get('overscan', 0.0)   # plates for parallax: render (1+overscan) larger, same lens, the Remotion shot crops back to the frame
r.resolution_x, r.resolution_y, r.resolution_percentage = int(W0 * k * (1 + OV)), int(H0 * k * (1 + OV)), 100
sc.render.engine = 'CYCLES'; cy = sc.cycles
cy.samples = opt('samples', S.get('samples', 64), int); cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.02
cy.use_denoising = S.get('denoise', True); cy.max_bounces = 6; cy.diffuse_bounces = 3; cy.glossy_bounces = 3; cy.transmission_bounces = 4; cy.caustics_reflective = False; cy.caustics_refractive = False
# GPU if there is one (the speed-up is 10-30x); otherwise CPU on every core
dev = 'CPU'
try:
    pref = bpy.context.preferences.addons['cycles'].preferences
    for t in ('OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI'):
        try:
            pref.compute_device_type = t; pref.get_devices()
            gpus = [d for d in pref.devices if d.type != 'CPU']
            if gpus:
                for d in pref.devices: d.use = d.type != 'CPU'
                dev = 'GPU'; break
        except Exception: continue
except Exception: pass
cy.device = dev; sc.render.threads_mode = 'AUTO'

# ---- world: an HDRI is the light AND the reflections (the single biggest step from "3D render" to "photograph")
w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True; nt = w.node_tree; nt.nodes.clear()
bg = nt.nodes.new('ShaderNodeBackground'); o = nt.nodes.new('ShaderNodeOutputWorld'); nt.links.new(bg.outputs[0], o.inputs[0])
if S.get('hdri'):
    env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(P(S['hdri']))
    mp = nt.nodes.new('ShaderNodeMapping'); tc = nt.nodes.new('ShaderNodeTexCoord'); mp.inputs['Rotation'].default_value[2] = math.radians(S.get('hdri_rotation', 0))
    nt.links.new(tc.outputs['Generated'], mp.inputs[0]); nt.links.new(mp.outputs[0], env.inputs[0]); nt.links.new(env.outputs[0], bg.inputs[0])
else:
    bg.inputs[0].default_value = (*S.get('sky', [0.05, 0.05, 0.06]), 1)
bg.inputs[1].default_value = S.get('hdri_strength', 1.0)
if S.get('background') == 'transparent': r.film_transparent = True

def pbr(name, folder=None, color=None, rough=0.5, metal=0.0, uv=1.0, emission=None, transmission=0.0, ior=1.45):
    m = bpy.data.materials.new(name); m.use_nodes = True; n = m.node_tree.nodes; l = m.node_tree.links; b = n['Principled BSDF']
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if color: b.inputs['Base Color'].default_value = (*color, 1)
    if transmission: b.inputs['Transmission Weight'].default_value = transmission; b.inputs['IOR'].default_value = ior
    if emission: b.inputs['Emission Color'].default_value = (*emission[:3], 1); b.inputs['Emission Strength'].default_value = emission[3]
    if folder:
        d = P(folder); tc = n.new('ShaderNodeTexCoord'); mp = n.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (uv, uv, uv); l.new(tc.outputs['UV'], mp.inputs[0])
        def tex(fn, nc=False):
            for ext in ('jpg', 'png'):
                f = os.path.join(d, f'{fn}.{ext}')
                if os.path.exists(f):
                    t = n.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(f); l.new(mp.outputs[0], t.inputs[0])
                    if nc: t.image.colorspace_settings.name = 'Non-Color'
                    return t
        t = tex('Diffuse'); t and l.new(t.outputs[0], b.inputs['Base Color'])
        t = tex('Rough', True); t and l.new(t.outputs[0], b.inputs['Roughness'])
        t = tex('Metal', True); t and l.new(t.outputs[0], b.inputs['Metallic'])
        t = tex('nor_gl', True)
        if t: nm = n.new('ShaderNodeNormalMap'); l.new(t.outputs[0], nm.inputs['Color']); l.new(nm.outputs[0], b.inputs['Normal'])
    return m
def put(ob, s):
    ob.location = s.get('pos', [0, 0, 0]); ob.rotation_euler = [math.radians(x) for x in s.get('rot', [0, 0, 0])]
    sc_ = s.get('scale', 1.0); ob.scale = sc_ if isinstance(sc_, list) else [sc_] * 3

# ---- set: ground + objects (glTF models from Poly Haven, or primitives with PBR materials)
g = S.get('ground')
if g:
    bpy.ops.mesh.primitive_plane_add(size=g.get('size', 30)); gr = bpy.context.object; gr.name = 'ground'
    gr.data.materials.append(pbr('ground', g.get('texture'), g.get('color', [0.5, 0.5, 0.5]), g.get('rough', 0.6), 0.0, g.get('uv_scale', 6)))
for i, s in enumerate(S.get('objects', [])):
    if s.get('model'):
        before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=P(s['model'])); new = [x for x in bpy.data.objects if x not in before]
        meshes = [x for x in new if x.type == 'MESH']
        if not meshes: continue
        pts = [x.matrix_world @ Vector(c) for x in meshes for c in x.bound_box]; lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        root = bpy.data.objects.new(f'obj{i}', None); bpy.context.collection.objects.link(root)
        for x in new:
            if x.parent is None: x.parent = root
        f = (s['fit_height'] / max(1e-6, hi.z - lo.z)) if s.get('fit_height') else 1.0
        put(root, {**s, 'scale': f * (s.get('scale', 1.0) if not isinstance(s.get('scale'), list) else 1.0)}); root.location = [s.get('pos', [0, 0, 0])[0] - (lo.x + hi.x) / 2 * f, s.get('pos', [0, 0, 0])[1] - (lo.y + hi.y) / 2 * f, s.get('pos', [0, 0, 0])[2] - lo.z * f]
        bpy.context.view_layer.update()
    else:
        pr = s.get('prim', 'cube'); sz = s.get('size', 1.0)
        {'cube': lambda: bpy.ops.mesh.primitive_cube_add(size=sz), 'sphere': lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=sz / 2, segments=96, ring_count=48), 'cylinder': lambda: bpy.ops.mesh.primitive_cylinder_add(radius=sz / 2, depth=s.get('depth', sz), vertices=96), 'plane': lambda: bpy.ops.mesh.primitive_plane_add(size=sz), 'cone': lambda: bpy.ops.mesh.primitive_cone_add(radius1=sz / 2, depth=s.get('depth', sz), vertices=96)}[pr]()
        ob = bpy.context.object; put(ob, s); m = s.get('material', {}); ob.data.materials.append(pbr(f'm{i}', m.get('texture'), m.get('color', [0.8, 0.8, 0.8]), m.get('rough', 0.5), m.get('metal', 0.0), m.get('uv_scale', 1.0), m.get('emission'), m.get('transmission', 0.0), m.get('ior', 1.45)))
        if s.get('bevel', 0): bv = ob.modifiers.new('b', 'BEVEL'); bv.width = s['bevel']; bv.segments = 4
        bpy.ops.object.shade_smooth()
for s in S.get('lights', []):
    bpy.ops.object.light_add(type=s.get('type', 'AREA'), location=s['pos']); L = bpy.context.object; L.data.energy = s.get('energy', 500); L.data.color = s.get('color', [1, 1, 1])
    if s.get('type', 'AREA') == 'AREA': L.data.size = s.get('size', 2.0)
    if s.get('look_at'): L.rotation_euler = (Vector(s['look_at']) - Vector(s['pos'])).to_track_quat('-Z', 'Y').to_euler()

# ---- camera: motivated moves (keyframes), a real lens, depth of field with a focus target, optional handheld
C = S['camera']; cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam); bpy.context.collection.objects.link(co); sc.camera = co
cam.sensor_width = 36; cam.dof.use_dof = bool(C.get('fstop')); cam.dof.aperture_fstop = C.get('fstop', 2.8)
def cam_at(t):
    ks = C.get('keys') or [{'t': 0, **{x: C[x] for x in ('pos', 'look_at', 'fov') if x in C}}]
    if len(ks) == 1 or t <= ks[0]['t']: return ks[0]
    for a, b in zip(ks, ks[1:]):
        if t <= b['t']:
            u = (t - a['t']) / max(1e-6, b['t'] - a['t']); u = u * u * (3 - 2 * u)   # ease in-out: a real camera has mass
            mix = lambda x, y: [p + (q - p) * u for p, q in zip(x, y)]
            return {'pos': mix(a['pos'], b['pos']), 'look_at': mix(a['look_at'], b['look_at']), 'fov': a['fov'] + (b['fov'] - a['fov']) * u, 'focus': mix(a.get('focus', a['look_at']), b.get('focus', b['look_at']))}
    return ks[-1]
def aim(t):
    c = cam_at(t); pos = Vector(c['pos']); la = Vector(c['look_at'])
    if C.get('handheld'):
        h = C['handheld']; ph = [math.sin(t * f + s) for f, s in ((1.3, 0), (2.1, 1.7), (3.4, 3.1))]; pos += Vector((ph[0], ph[1], ph[2])) * h.get('amount', 0.01); la += Vector((ph[1], ph[2], ph[0])) * h.get('amount', 0.01) * 0.6
    co.location = pos; co.rotation_euler = (la - pos).to_track_quat('-Z', 'Y').to_euler(); cam.angle = 2 * math.atan(math.tan(math.radians(c['fov']) / 2) * (1 + OV))
    cam.dof.focus_distance = (Vector(c.get('focus', c['look_at'])) - pos).length if not C.get('focus_dist') else C['focus_dist']
    return c, pos

def post(png, depth_png=None):
    from PIL import Image, ImageFilter, ImageChops
    import numpy as np
    F = S.get('film', {}); im = Image.open(png).convert('RGB'); a = np.asarray(im).astype('float32') / 255
    if F.get('bloom', 0) > 0:   # bloom and halation: only the bright part, wide and soft, warm
        lum = a.max(axis=2, keepdims=True); hi = np.clip((lum - 0.78) / 0.22, 0, 1) * a
        bl = Image.fromarray((hi * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(max(2, im.width // 70))); a = 1 - (1 - a) * (1 - np.asarray(bl).astype('float32') / 255 * F['bloom'] * np.array([1.0, 0.85, 0.7]))
    if F.get('vignette', 0) > 0:
        h, w_ = a.shape[:2]; yy, xx = np.mgrid[0:h, 0:w_]; d = np.sqrt(((xx - w_ / 2) / (w_ / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2); a *= (1 - F['vignette'] * np.clip(d - 0.55, 0, 1) ** 1.6)[..., None]
    if F.get('grain', 0) > 0:   # fixed seed per frame index so a still is reproducible
        rng = np.random.default_rng(int(abs(hash(os.path.basename(png))) % 2**32)); n = rng.normal(0, F['grain'], a.shape[:2])[..., None]; a = a + n * (0.5 + 0.5 * (1 - a.mean(axis=2, keepdims=True)))
    if F.get('chroma', 0) > 0:   # lateral chromatic aberration like a real lens: R untouched, G and B magnified a hair more, then centre-cropped (never padded)
        h, w_ = a.shape[:2]; s_ = F['chroma']; chs = []
        for i, m in enumerate((1.0, 1 + s_, 1 + 2 * s_)):
            c = Image.fromarray((a[..., i] * 255).clip(0, 255).astype('uint8'))
            if m > 1: c = c.resize((round(w_ * m), round(h * m)), Image.BICUBIC); x0 = (c.width - w_) // 2; y0 = (c.height - h) // 2; c = c.crop((x0, y0, x0 + w_, y0 + h))
            chs.append(np.asarray(c).astype('float32') / 255)
        a = np.stack(chs, axis=2)
    Image.fromarray((np.clip(a, 0, 1) * 255).astype('uint8')).save(png)

def render_frame(t, path, depth=True):
    c, pos = aim(t); sc.render.filepath = path; sc.view_settings.view_transform = S.get('film', {}).get('look', 'AgX'); sc.view_settings.look = 'None'; sc.view_settings.exposure = S.get('film', {}).get('exposure', 0.0)
    r.image_settings.file_format = 'PNG'; r.image_settings.color_depth = '8'; bpy.ops.render.render(write_still=True); post(path)
    info = {'t': t, 'fov': c['fov'], 'pos': list(pos), 'device': dev}
    if depth:   # depth by material override: view-space distance -> emission, 1 sample. 1 = near, 0 = far
        pts = [Vector(x) for x in [c['look_at']]]; near = max(0.1, (Vector(c['look_at']) - pos).length * 0.25); far = (Vector(c['look_at']) - pos).length * 4 + 10
        ov = bpy.data.materials.new('depth'); ov.use_nodes = True; n = ov.node_tree.nodes; l = ov.node_tree.links; n.clear()
        cd = n.new('ShaderNodeCameraData'); mr = n.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = near; mr.inputs['From Max'].default_value = far; mr.inputs['To Min'].default_value = 1.0; mr.inputs['To Max'].default_value = 0.0; mr.clamp = True
        em = n.new('ShaderNodeEmission'); oo = n.new('ShaderNodeOutputMaterial'); l.new(cd.outputs['View Z Depth'], mr.inputs[0]); l.new(mr.outputs[0], em.inputs[0]); l.new(em.outputs[0], oo.inputs[0])
        vl = bpy.context.view_layer; vl.material_override = ov; s0, d0, vt, lk, dof = cy.samples, cy.use_denoising, sc.view_settings.view_transform, sc.view_settings.look, cam.dof.use_dof
        cy.samples = 1; cy.use_denoising = False; cam.dof.use_dof = False; sc.view_settings.view_transform = 'Standard'; r.image_settings.color_depth = '16'; sc.render.filepath = path[:-4] + '.depth.png'
        w0 = sc.world.node_tree.nodes['Background'].inputs[1].default_value; sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0
        bpy.ops.render.render(write_still=True)
        vl.material_override = None; cy.samples, cy.use_denoising, sc.view_settings.view_transform, cam.dof.use_dof = s0, d0, vt, dof; sc.world.node_tree.nodes['Background'].inputs[1].default_value = w0
        info.update({'near': near, 'far': far})
    return info

t0 = time.time()
if '--sequence' in A:
    fps = opt('fps', 12, int); sec = opt('seconds', 3.0, float); n = int(fps * sec); meta = []
    for i in range(n): meta.append(render_frame(i / fps, f'{out}_{i + 1:04d}.png', depth=False)); print(f'frame {i + 1}/{n}', flush=True)
    json.dump({'fps': fps, 'frames': n, 'device': dev, 'seconds_render': round(time.time() - t0, 1)}, open(out + '.json', 'w'))
else:
    info = render_frame(opt('t', 0.0, float), out + '.png'); info.update({'seconds_render': round(time.time() - t0, 1), 'resolution': [r.resolution_x, r.resolution_y], 'samples': cy.samples}); json.dump(info, open(out + '.json', 'w'), indent=1); print(json.dumps(info))
