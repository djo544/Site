import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function GlobeScene() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas.parentElement;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 5.6);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene.add(new THREE.AmbientLight(0x718bff, 1.4));
    const blue = new THREE.PointLight(0x4374ff, 14, 9); blue.position.set(-3, 1, 3); scene.add(blue);
    const orange = new THREE.PointLight(0xff8b45, 12, 8); orange.position.set(3, 2, 1); scene.add(orange);

    const globe = new THREE.Group(); globe.rotation.z = 0.18; scene.add(globe);
    const radius = 1.55;
    const dots = [];
    for (let lat = -80; lat <= 80; lat += 10) {
      for (let lon = -180; lon < 180; lon += 10) {
        const phi = (90 - lat) * Math.PI / 180, theta = (lon + 180) * Math.PI / 180;
        dots.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
      }
    }
    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dots, 3));
    globe.add(new THREE.Points(dotGeometry, new THREE.PointsMaterial({ color: 0xa6bcff, size: 0.034, transparent: true, opacity: 0.8 })));
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 12), new THREE.MeshBasicMaterial({ color: 0x365fe0, wireframe: true, transparent: true, opacity: 0.1 })));

    const locations = [[-33, 151], [31, 121], [51, 0], [25, 55], [40, -74], [1, 103]];
    const toVector = ([lat, lon]) => { const phi = (90 - lat) * Math.PI / 180, theta = (lon + 180) * Math.PI / 180; return new THREE.Vector3(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)); };
    const addRoute = (from, to, color) => {
      const a = toVector(from), b = toVector(to), mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(radius * 1.32);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(36));
      globe.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 })));
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), new THREE.MeshBasicMaterial({ color })); pin.position.copy(a); globe.add(pin);
    };
    addRoute(locations[0], locations[2], 0xff8533); addRoute(locations[2], locations[4], 0x4b86ff); addRoute(locations[1], locations[3], 0xff8533); addRoute(locations[3], locations[5], 0x4b86ff); addRoute(locations[4], locations[1], 0xff8533);

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onMove = (event) => { const rect = host.getBoundingClientRect(); pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2; pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2; };
    const onLeave = () => { pointer.targetX = 0; pointer.targetY = 0; };
    host.addEventListener('pointermove', onMove); host.addEventListener('pointerleave', onLeave);
    const resize = () => { renderer.setSize(host.clientWidth, host.clientHeight, false); camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    let animation; const clock = new THREE.Clock();
    const frame = () => { const time = clock.getElapsedTime(); pointer.x += (pointer.targetX - pointer.x) * 0.035; pointer.y += (pointer.targetY - pointer.y) * 0.035; globe.rotation.y = time * 0.09 + pointer.x * 0.22; globe.rotation.x = pointer.y * 0.12; renderer.render(scene, camera); animation = requestAnimationFrame(frame); };
    frame();
    return () => { cancelAnimationFrame(animation); observer.disconnect(); host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave); renderer.dispose(); dotGeometry.dispose(); };
  }, []);
  return <canvas ref={canvasRef} aria-label="كرة أرضية ثلاثية الأبعاد لمسارات الشحن" />;
}
