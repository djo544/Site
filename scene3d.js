import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

function initScene() {
  const canvas = document.querySelector('#three-canvas');
  if (!canvas || canvas.dataset.ready) return;
  canvas.dataset.ready = 'true';
  const host = canvas.parentElement;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.15, 5.8);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.add(new THREE.HemisphereLight(0xfff3d5, 0x173c32, 2.4));
  const key = new THREE.DirectionalLight(0xffe1aa, 4.5);
  key.position.set(-3, 4, 4); key.castShadow = true; scene.add(key);
  const rim = new THREE.PointLight(0x8fd1b2, 12, 8); rim.position.set(3, 1, 2); scene.add(rim);

  const heroObject = new THREE.Group();
  scene.add(heroObject);

  // A sculptural product form: soft ceramic body, wooden base and brass detail.
  const body = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.02, .3, 96, 18, 2, 3),
    new THREE.MeshPhysicalMaterial({ color: 0xe8bd72, roughness: .22, metalness: .08, clearcoat: .75, clearcoatRoughness: .14 })
  );
  body.scale.set(1, 1.08, .75); body.rotation.x = .28; body.castShadow = true; heroObject.add(body);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(.86, 1.12, .3, 64),
    new THREE.MeshStandardMaterial({ color: 0x9d6542, roughness: .34 })
  );
  base.position.y = -1.27; base.castShadow = true; heroObject.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(.92, .055, 16, 80),
    new THREE.MeshStandardMaterial({ color: 0xf5d38c, metalness: .85, roughness: .2, emissive: 0x543514, emissiveIntensity: .2 })
  );
  ring.rotation.x = Math.PI / 2; ring.position.y = -1.05; heroObject.add(ring);

  const dust = new THREE.Group();
  const dustMaterial = new THREE.MeshBasicMaterial({ color: 0xffe9ac, transparent: true, opacity: .78 });
  for (let i = 0; i < 38; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(Math.random() * .025 + .008, 8, 8), dustMaterial);
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 1.3;
    dot.position.set(Math.cos(angle) * radius, (Math.random() - .5) * 3, (Math.sin(angle) * radius) - .2);
    dot.userData.speed = .2 + Math.random() * .5;
    dust.add(dot);
  }
  scene.add(dust);

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  host.addEventListener('pointermove', (event) => {
    const rect = host.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / rect.width - .5) * 2;
    pointer.targetY = ((event.clientY - rect.top) / rect.height - .5) * 2;
  });
  host.addEventListener('pointerleave', () => { pointer.targetX = 0; pointer.targetY = 0; });

  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const clock = new THREE.Clock();
  function animate() {
    const time = clock.getElapsedTime();
    pointer.x += (pointer.targetX - pointer.x) * .035; pointer.y += (pointer.targetY - pointer.y) * .035;
    heroObject.rotation.y = time * .24 + pointer.x * .28;
    heroObject.rotation.x = pointer.y * .16;
    heroObject.position.y = Math.sin(time * 1.2) * .09;
    ring.rotation.z = time * .45;
    dust.rotation.y = time * .035;
    dust.children.forEach((particle, i) => { particle.position.y += Math.sin(time * particle.userData.speed + i) * .0008; });
    renderer.render(scene, camera); requestAnimationFrame(animate);
  }
  animate();
}

initScene();
window.addEventListener('hashchange', () => setTimeout(initScene, 0));
