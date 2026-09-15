import * as THREE from 'three';

export class TempleScene3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x1a040b, 0.04);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.targetCameraPos = new THREE.Vector3(0, 1.3, 7.8);
    this.targetLookAt = new THREE.Vector3(0, 0.9, 0);
    this.currentLookAt = new THREE.Vector3(0, 0.9, 0);
    this.camera.position.copy(this.targetCameraPos);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.clock = new THREE.Clock();

    this.activeDiyas = [];
    this.activePetals = [];
    this.bellSwinging = false;
    this.bellAngle = 0;
    this.bellVelocity = 0;
    this.bellWaves = [];

    this.initLights();
    this.initAltar();
    this.initParticles();
    this.initBell();
    this.bindEvents();
    this.animate();
  }

  initLights() {
    const ambient = new THREE.AmbientLight(0xffdf9e, 0.85);
    this.scene.add(ambient);

    // Deity Spotlight
    this.spotlight = new THREE.SpotLight(0xffc857, 4.8);
    this.spotlight.position.set(0, 7.5, 5);
    this.spotlight.angle = 0.55;
    this.spotlight.penumbra = 0.6;
    this.spotlight.castShadow = true;
    this.spotlight.shadow.mapSize.width = 1024;
    this.spotlight.shadow.mapSize.height = 1024;
    this.scene.add(this.spotlight);

    // Diya Point Lights
    this.diyaLightLeft = new THREE.PointLight(0xff8c00, 2.4, 8);
    this.diyaLightLeft.position.set(-2.4, 0.6, 1.2);
    this.scene.add(this.diyaLightLeft);

    this.diyaLightRight = new THREE.PointLight(0xff8c00, 2.4, 8);
    this.diyaLightRight.position.set(2.4, 0.6, 1.2);
    this.scene.add(this.diyaLightRight);

    // Subtle Sanctum Back Glow
    const rimLight = new THREE.DirectionalLight(0xc0175a, 1.4);
    rimLight.position.set(0, 4, -5);
    this.scene.add(rimLight);
  }

  initAltar() {
    this.altarGroup = new THREE.Group();

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      metalness: 0.85,
      roughness: 0.22,
      emissive: 0x3d2800,
      emissiveIntensity: 0.2
    });

    const maroonMat = new THREE.MeshStandardMaterial({
      color: 0x4e0e1f,
      roughness: 0.4,
      metalness: 0.3
    });

    const sanctumMat = new THREE.MeshStandardMaterial({
      color: 0x2b0713,
      roughness: 0.6,
      metalness: 0.2
    });

    // Sanctum Backwall & Platform
    const backwallGeo = new THREE.BoxGeometry(9.5, 7.5, 0.4);
    const backwall = new THREE.Mesh(backwallGeo, sanctumMat);
    backwall.position.set(0, 2.5, -1);
    this.altarGroup.add(backwall);

    const platformGeo = new THREE.CylinderGeometry(3.6, 4.0, 0.6, 32);
    const platform = new THREE.Mesh(platformGeo, maroonMat);
    platform.position.set(0, -0.3, 0.5);
    platform.receiveShadow = true;
    this.altarGroup.add(platform);

    const stepGeo = new THREE.CylinderGeometry(2.6, 2.8, 0.4, 32);
    const step = new THREE.Mesh(stepGeo, goldMat);
    step.position.set(0, 0.1, 0.5);
    step.receiveShadow = true;
    this.altarGroup.add(step);

    // 4 Golden Pillars
    const pillarPositions = [
      [-2.6, 0.5],
      [2.6, 0.5],
      [-2.6, -0.6],
      [2.6, -0.6]
    ];

    pillarPositions.forEach(([x, z]) => {
      const pillarGroup = new THREE.Group();
      const colGeo = new THREE.CylinderGeometry(0.18, 0.22, 4.2, 24);
      const col = new THREE.Mesh(colGeo, goldMat);
      col.castShadow = true;
      pillarGroup.add(col);

      const baseGeo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
      const base = new THREE.Mesh(baseGeo, maroonMat);
      base.position.y = -2;
      pillarGroup.add(base);

      const capitalGeo = new THREE.BoxGeometry(0.55, 0.35, 0.55);
      const capital = new THREE.Mesh(capitalGeo, goldMat);
      capital.position.y = 2;
      pillarGroup.add(capital);

      pillarGroup.position.set(x, 2, z);
      this.altarGroup.add(pillarGroup);
    });

    // Arch Dome
    const archGeo = new THREE.TorusGeometry(2.6, 0.18, 16, 48, Math.PI);
    const arch = new THREE.Mesh(archGeo, goldMat);
    arch.position.set(0, 3.9, 0.5);
    arch.rotation.x = Math.PI / 2;
    this.altarGroup.add(arch);

    // 3D Rotating Star Mandala Halo
    this.haloGroup = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(1.45, 0.04, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf3cb5c,
      emissive: 0xd4a017,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1
    });
    const haloRing = new THREE.Mesh(ringGeo, ringMat);
    this.haloGroup.add(haloRing);

    const starGeo = new THREE.DodecahedronGeometry(1.25, 0);
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xf3cb5c,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const haloStar = new THREE.Mesh(starGeo, starMat);
    this.haloGroup.add(haloStar);

    this.haloGroup.position.set(0, 2.15, -0.4);
    this.altarGroup.add(this.haloGroup);

    // Deity Frame
    const frameGeo = new THREE.BoxGeometry(2.15, 2.8, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      metalness: 0.9,
      roughness: 0.2
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 2.15, -0.2);
    this.altarGroup.add(frame);

    // Deity Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/deity-main.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const photoGeo = new THREE.PlaneGeometry(1.9, 2.55);
      const photoMat = new THREE.MeshBasicMaterial({ map: texture });
      const photo = new THREE.Mesh(photoGeo, photoMat);
      photo.position.set(0, 2.15, -0.12);
      this.altarGroup.add(photo);
    });

    this.scene.add(this.altarGroup);
  }

  initParticles() {
    const count = 240;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 8 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xf3cb5c,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  initBell() {
    this.bellGroup = new THREE.Group();

    const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.5, 8);
    const chainMat = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.8 });
    const chain = new THREE.Mesh(chainGeo, chainMat);
    chain.position.y = 1.25;
    this.bellGroup.add(chain);

    const bellBodyGeo = new THREE.CylinderGeometry(0.15, 0.45, 0.6, 24);
    const bellMat = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x4a3200,
      emissiveIntensity: 0.3
    });
    const bellBody = new THREE.Mesh(bellBodyGeo, bellMat);
    bellBody.position.y = 0.3;
    this.bellGroup.add(bellBody);

    const crownGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const crown = new THREE.Mesh(crownGeo, bellMat);
    crown.position.y = 0.6;
    this.bellGroup.add(crown);

    this.bellGroup.position.set(0, 4.2, 2.0);
    this.scene.add(this.bellGroup);
  }

  /* Interactive Seva 1: Diya Offering */
  spawnDiya() {
    const diyaGroup = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(0.18, 0.26, 0.12, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x9b6710, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    diyaGroup.add(base);

    const flameGeo = new THREE.ConeGeometry(0.08, 0.22, 12);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 0.15;
    diyaGroup.add(flame);

    const light = new THREE.PointLight(0xffaa00, 2.5, 4);
    light.position.y = 0.2;
    diyaGroup.add(light);

    const startX = (Math.random() - 0.5) * 2.5;
    diyaGroup.position.set(startX, -1.2, 5.0);
    this.scene.add(diyaGroup);

    this.activeDiyas.push({
      mesh: diyaGroup,
      progress: 0,
      targetY: 0.2 + Math.random() * 0.4,
      targetZ: 1.2 + Math.random() * 0.8,
      speed: 0.008 + Math.random() * 0.005,
      wobbleOffset: Math.random() * Math.PI * 2
    });
  }

  /* Interactive Seva 2: Flower Shower */
  showerFlowers() {
    const colors = [0xe8720c, 0xc0175a, 0xf3cb5c, 0xff3366];
    const count = 60;

    for (let i = 0; i < count; i++) {
      const geo = new THREE.PlaneGeometry(0.14, 0.18);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide,
        roughness: 0.5,
        metalness: 0.1
      });
      const petal = new THREE.Mesh(geo, mat);

      petal.position.set(
        (Math.random() - 0.5) * 6,
        6 + Math.random() * 3,
        (Math.random() - 0.5) * 4 + 1
      );

      petal.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      this.scene.add(petal);

      this.activePetals.push({
        mesh: petal,
        vy: -0.02 - Math.random() * 0.025,
        vx: (Math.random() - 0.5) * 0.012,
        vz: (Math.random() - 0.5) * 0.012,
        rx: (Math.random() - 0.5) * 0.04,
        ry: (Math.random() - 0.5) * 0.04,
        rz: (Math.random() - 0.5) * 0.04
      });
    }
  }

  /* Interactive Seva 3: Ring Temple Bell */
  ringBell() {
    this.bellVelocity = 0.35;
    this.bellSwinging = true;

    const waveGeo = new THREE.RingGeometry(0.1, 0.3, 32);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xf3cb5c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.position.copy(this.bellGroup.position);
    wave.position.y -= 0.2;
    wave.rotation.x = Math.PI / 2;
    this.scene.add(wave);

    this.bellWaves.push({ mesh: wave, scale: 1, opacity: 0.8 });
  }

  setCameraView(viewName) {
    switch (viewName) {
      case 'home':
        this.targetCameraPos.set(0, 1.3, 7.8);
        this.targetLookAt.set(0, 0.9, 0);
        break;
      case 'about':
        this.targetCameraPos.set(-2.5, 1.8, 6.0);
        this.targetLookAt.set(0, 1.2, 0);
        break;
      case 'timings':
        this.targetCameraPos.set(2.5, 1.8, 6.2);
        this.targetLookAt.set(0, 1.0, 0);
        break;
      case 'gallery':
        this.targetCameraPos.set(-2.8, 2.4, 6.5);
        this.targetLookAt.set(0, 1.5, 0);
        break;
      case 'donate':
        this.targetCameraPos.set(0, 0.9, 4.6);
        this.targetLookAt.set(0, 1.6, -0.2);
        break;
      case 'reviews':
      case 'contact':
        this.targetCameraPos.set(0, 3.2, 8.4);
        this.targetLookAt.set(0, 0.5, 0);
        break;
    }
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.camera.position.lerp(this.targetCameraPos, 0.04);
    this.currentLookAt.lerp(this.targetLookAt, 0.04);

    const parallaxCam = this.camera.position.clone();
    parallaxCam.x += this.mouse.x * 0.4;
    parallaxCam.y += -this.mouse.y * 0.3;
    this.camera.lookAt(this.currentLookAt);

    if (this.haloGroup) {
      this.haloGroup.rotation.z = time * 0.2;
      this.haloGroup.children[1].rotation.x = time * 0.4;
      this.haloGroup.children[1].rotation.y = time * 0.3;
    }

    if (this.diyaLightLeft && this.diyaLightRight) {
      this.diyaLightLeft.intensity = 2.2 + Math.sin(time * 15) * 0.4 + Math.cos(time * 23) * 0.3;
      this.diyaLightRight.intensity = 2.2 + Math.cos(time * 17) * 0.4 + Math.sin(time * 29) * 0.3;
    }

    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] += 0.003;
        if (positions[i * 3 + 1] > 7) positions[i * 3 + 1] = -1;
        positions[i * 3] += Math.sin(time + i) * 0.002;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    for (let i = this.activeDiyas.length - 1; i >= 0; i--) {
      const d = this.activeDiyas[i];
      d.progress += d.speed;
      d.mesh.position.y = THREE.MathUtils.lerp(-1.2, d.targetY, d.progress) + Math.sin(time * 4 + d.wobbleOffset) * 0.08;
      d.mesh.position.z = THREE.MathUtils.lerp(5.0, d.targetZ, d.progress);

      if (d.progress >= 1) {
        d.mesh.position.y = d.targetY + Math.sin(time * 3 + d.wobbleOffset) * 0.06;
      }
    }

    for (let i = this.activePetals.length - 1; i >= 0; i--) {
      const p = this.activePetals[i];
      p.mesh.position.x += p.vx + Math.sin(time * 2 + i) * 0.005;
      p.mesh.position.y += p.vy;
      p.mesh.position.z += p.vz;

      p.mesh.rotation.x += p.rx;
      p.mesh.rotation.y += p.ry;
      p.mesh.rotation.z += p.rz;

      if (p.mesh.position.y < -1) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.activePetals.splice(i, 1);
      }
    }

    if (this.bellSwinging) {
      this.bellAngle += this.bellVelocity;
      this.bellVelocity -= this.bellAngle * 0.08;
      this.bellVelocity *= 0.95;

      this.bellGroup.rotation.z = this.bellAngle;

      if (Math.abs(this.bellAngle) < 0.002 && Math.abs(this.bellVelocity) < 0.002) {
        this.bellSwinging = false;
        this.bellGroup.rotation.z = 0;
      }
    }

    for (let i = this.bellWaves.length - 1; i >= 0; i--) {
      const w = this.bellWaves[i];
      w.scale += 0.12;
      w.opacity -= 0.02;
      w.mesh.scale.set(w.scale, w.scale, 1);
      w.mesh.material.opacity = w.opacity;

      if (w.opacity <= 0) {
        this.scene.remove(w.mesh);
        w.mesh.geometry.dispose();
        w.mesh.material.dispose();
        this.bellWaves.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
