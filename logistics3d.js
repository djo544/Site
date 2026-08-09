import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

function initLogisticsGlobe(){
  const canvas=document.querySelector('#three-canvas');
  if(!canvas||canvas.dataset.ready)return;
  canvas.dataset.ready='true';
  const host=canvas.parentElement,scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,0,5.6);
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  scene.add(new THREE.AmbientLight(0x6e8cff,1.4));const blue=new THREE.PointLight(0x2e70ff,14,9);blue.position.set(-3,1,3);scene.add(blue);const orange=new THREE.PointLight(0xff8b32,12,8);orange.position.set(3,2,1);scene.add(orange);
  const globe=new THREE.Group();globe.rotation.z=.18;scene.add(globe);
  const radius=1.55;
  const points=[];
  for(let lat=-80;lat<=80;lat+=10)for(let lon=-180;lon<180;lon+=10){const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;points.push(radius*Math.sin(phi)*Math.cos(theta),radius*Math.cos(phi),radius*Math.sin(phi)*Math.sin(theta))}
  const pointGeo=new THREE.BufferGeometry();pointGeo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));globe.add(new THREE.Points(pointGeo,new THREE.PointsMaterial({color:0x9bb5ff,size:.034,transparent:true,opacity:.78})));
  const wire=new THREE.Mesh(new THREE.SphereGeometry(radius,24,12),new THREE.MeshBasicMaterial({color:0x365fe0,wireframe:true,transparent:true,opacity:.1}));globe.add(wire);
  const locations=[[-33,151],[31,121],[51,0],[25,55],[40,-74],[1,103]];
  const toVec=([lat,lon])=>{const p=(90-lat)*Math.PI/180,t=(lon+180)*Math.PI/180;return new THREE.Vector3(radius*Math.sin(p)*Math.cos(t),radius*Math.cos(p),radius*Math.sin(p)*Math.sin(t))};
  function route(a,b,color){const va=toVec(a),vb=toVec(b),mid=va.clone().add(vb).multiplyScalar(.5).normalize().multiplyScalar(radius*1.32);const curve=new THREE.QuadraticBezierCurve3(va,mid,vb),geo=new THREE.BufferGeometry().setFromPoints(curve.getPoints(36));globe.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:.9})));const pin=new THREE.Mesh(new THREE.SphereGeometry(.065,12,12),new THREE.MeshBasicMaterial({color}));pin.position.copy(va);globe.add(pin)}
  route(locations[0],locations[2],0xff8533);route(locations[2],locations[4],0x4b86ff);route(locations[1],locations[3],0xff8533);route(locations[3],locations[5],0x4b86ff);route(locations[4],locations[1],0xff8533);
  const particles=new THREE.Group();for(let i=0;i<35;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.012+Math.random()*.018,6,6),new THREE.MeshBasicMaterial({color:i%2?0x407dff:0xff9d4d,transparent:true,opacity:.8}));const a=Math.random()*Math.PI*2,r=1.9+Math.random()*.9;p.position.set(Math.cos(a)*r,(Math.random()-.5)*3,Math.sin(a)*r);p.userData.speed=.2+Math.random()*.4;particles.add(p)}scene.add(particles);
  const pointer={x:0,y:0,tx:0,ty:0};host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();pointer.tx=((e.clientX-r.left)/r.width-.5)*2;pointer.ty=((e.clientY-r.top)/r.height-.5)*2});host.addEventListener('pointerleave',()=>{pointer.tx=0;pointer.ty=0});
  const resize=()=>{renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(host);resize();const clock=new THREE.Clock();
  function frame(){const t=clock.getElapsedTime();pointer.x+=(pointer.tx-pointer.x)*.035;pointer.y+=(pointer.ty-pointer.y)*.035;globe.rotation.y=t*.09+pointer.x*.22;globe.rotation.x=pointer.y*.12;particles.rotation.y=-t*.03;particles.children.forEach((p,i)=>p.position.y+=Math.sin(t*p.userData.speed+i)*.0005);renderer.render(scene,camera);requestAnimationFrame(frame)}frame();
}
initLogisticsGlobe();window.addEventListener('hashchange',()=>setTimeout(initLogisticsGlobe,0));
