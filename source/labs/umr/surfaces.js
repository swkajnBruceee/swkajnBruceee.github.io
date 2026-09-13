import * as THREE from '/vendor/three/build/three.module.min.js';

// Geometry is baked from the attributed OBJ / URDF, not synthesized primitives.
// Rendering is composited into the accessible 2D canvas used by the lab, so point
// overlays, exported pixels and the low-GPU fallback use identical projections.
export async function loadSurfaces() {
  const responses = await Promise.all(['models.json', 'samples.json', 'surfaces.bin'].map(async name => {
    const response = await fetch(new URL('./assets/' + name, import.meta.url));
    if (!response.ok) throw new Error(`模型资源加载失败：${name} (${response.status})`);
    return name.endsWith('.bin') ? response.arrayBuffer() : response.json();
  }));
  const [metadata, model, binary] = responses;
  if (metadata.version !== 1) throw new Error('不支持的模型资源版本');
  const objects = [], geometries = [];
  for (const mesh of metadata.meshes) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(binary, mesh.position, mesh.vertices * 3), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(binary, mesh.normal, mesh.vertices * 3), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(binary, mesh.index, mesh.triangles * 3), 1));
    geometry.computeBoundingSphere();
    geometries.push(geometry);
    objects.push({ ...mesh, geometry });
  }
  let renderer;
  try {
    // A failed context leaves the visible 2D canvas usable. No network fallback.
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { antialias: true, alpha: true, preserveDrawingBuffer: true });
    if (context) renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, preserveDrawingBuffer: true });
  } catch (_) { /* use the real-mesh wireframe fallback below */ }
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, .1, 4000);
  camera.position.z = 1500;
  const human = new THREE.Group(), robot = new THREE.Group();
  scene.add(human, robot);
  const material = {
    human: new THREE.MeshStandardMaterial({ color: '#afc5d1', roughness: .77, metalness: .04 }),
    shell: new THREE.MeshStandardMaterial({ color: '#dce3ea', roughness: .42, metalness: .18 }),
    joint: new THREE.MeshStandardMaterial({ color: '#344454', roughness: .6, metalness: .27 })
  };
  for (const object of objects) {
    const mesh = new THREE.Mesh(object.geometry, material[object.material]);
    mesh.name = object.name;
    (object.material === 'human' ? human : robot).add(mesh);
  }
  scene.add(new THREE.HemisphereLight('#f0f7ff', '#596777', 2.2));
  const key = new THREE.DirectionalLight('#ffffff', 3.1);
  key.position.set(-600, 1000, 1200); scene.add(key);
  const rim = new THREE.DirectionalLight('#bed8ff', 2);
  rim.position.set(800, 400, -500); scene.add(rim);
  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
  }
  let cache = '', contextLost = false;
  renderer?.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); contextLost = true; cache = ''; });
  renderer?.domElement.addEventListener('webglcontextrestored', () => { contextLost = false; cache = ''; });
  function draw(ctx, w, h, views, angle, dark, showMesh) {
    if (!showMesh) return;
    if (renderer && !contextLost) {
      const signature = JSON.stringify([w, h, views, angle, dark]);
      if (cache !== signature) {
        renderer.setSize(w, h, false);
        camera.right = w; camera.top = h; camera.updateProjectionMatrix();
        material.human.color.set(dark ? '#87a8bf' : '#afc5d1');
        material.shell.color.set(dark ? '#b3c4d6' : '#dce3ea');
        const rotation = new THREE.Matrix4().makeRotationX(.12).multiply(new THREE.Matrix4().makeRotationY(angle * Math.PI / 180));
        for (const [index, group] of [human, robot].entries()) {
          group.setRotationFromMatrix(rotation);
          group.scale.setScalar(views[index].scale);
          group.position.set(views[index].x, h - views[index].base, 0);
        }
        // Clip both views at the center. Zooming into a hand must not draw over
        // the other body, even when a much larger mesh extends outside its pane.
        renderer.setScissorTest(true);
        human.visible = true; robot.visible = false;
        renderer.setScissor(0, 0, w / 2, h); renderer.render(scene, camera);
        human.visible = false; robot.visible = true;
        renderer.setScissor(w / 2, 0, w / 2, h); renderer.render(scene, camera);
        renderer.setScissorTest(false);
        cache = signature;
      }
      ctx.drawImage(renderer.domElement, 0, 0, w, h);
    } else {
      // All original triangle edges remain available without WebGL2. Coarser
      // edge selection is for drawing only; optimization uses the same samples.
      const yaw = angle * Math.PI / 180;
      ctx.strokeStyle = dark ? '#8499ac' : '#8d9fae'; ctx.globalAlpha = .25; ctx.lineWidth = .45;
      for (const object of objects) {
        const viewIndex = object.material === 'human' ? 0 : 1, view = views[viewIndex];
        const vertices = object.geometry.attributes.position.array, faces = object.geometry.index.array;
        const xy = id => {
          const x = vertices[id * 3], y = vertices[id * 3 + 1], z = vertices[id * 3 + 2];
          const depth = -x * Math.sin(yaw) + z * Math.cos(yaw);
          return [view.x + (x * Math.cos(yaw) + z * Math.sin(yaw)) * view.scale,
            view.base - (y * Math.cos(.12) - depth * Math.sin(.12)) * view.scale];
        };
        ctx.save(); ctx.beginPath(); ctx.rect(viewIndex * w / 2, 0, w / 2, h); ctx.clip(); ctx.beginPath();
        for (let i = 0; i < faces.length; i += 12) {
          const a = xy(faces[i]), b = xy(faces[i + 1]), c = xy(faces[i + 2]);
          ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...a);
        }
        ctx.stroke(); ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  return { model, metadata, draw, mode: renderer ? 'webgl' : 'wireframe', dispose() {
    geometries.forEach(g => g.dispose()); Object.values(material).forEach(m => m.dispose()); renderer?.dispose();
  } };
}
