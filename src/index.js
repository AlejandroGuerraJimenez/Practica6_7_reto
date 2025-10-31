import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

let scene, renderer, camera, controls;
let info;
let planets = [],
  moons = [];
let rings = []; // <-- array para los anillos
let raycaster, mouse, plane;
let startTime;
let globalSpeed = 0.0001;
let selectedPlanet = null;
let followDistance = 10;
let gui; // GUI global

// Movimiento WASD
let moveForward = false,
  moveBackward = false,
  moveLeft = false,
  moveRight = false;
const direction = new THREE.Vector3();
const moveSpeed = 0.5;

// Rotación alrededor del planeta
let isDragging = false;
const previousMouse = { x: 0, y: 0 };
let rotX = 0,
  rotY = 0;

// Modo cámara
const params = {
  globalSpeed: 0.0001,
  cameraMode: "Libre", // Libre, Seguir Planeta, Agregar Planetas
  // Valores iniciales para nuevos planetas
  newPlanetRadius: 0.5,
  newPlanetSpeed: 1,
  newPlanetColor: "#ffffff",
};

init();
animate();

function init() {
  setupInfo();
  setupScene();
  setupCamera();
  setupRenderer();
  setupControls();
  setupLights();
  loadTexturesAndCreateBodies();
  setupRaycasterAndPlane();
  setupEvents();
  setupGUI();
  setupKeyboardControls();
  startTime = Date.now();
  window.addEventListener("resize", onWindowResize);
}

function setupInfo() {
  info = document.createElement("div");
  Object.assign(info.style, {
    position: "absolute",
    top: "20px",
    width: "100%",
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Monospace",
  });
  info.innerHTML =
    "Sistema Solar Educativo<br>(clic en un planeta para seguirlo)";
  document.body.appendChild(info);
}

function setupScene() {
  scene = new THREE.Scene();

  // Configuración del fondo como esfera invertida
  setupBackground();
}

function setupBackground() {
  const loader = new THREE.TextureLoader();
  const spaceTexture = loader.load("textures/milky_way_map.jpg"); // tu textura única

  const geometry = new THREE.SphereGeometry(1000, 64, 64); // esfera gigante
  const material = new THREE.MeshBasicMaterial({
    map: spaceTexture,
    side: THREE.BackSide, // se ve desde dentro
  });

  const backgroundSphere = new THREE.Mesh(geometry, material);
  scene.add(backgroundSphere);
}

function setupCamera() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(30, 20, 50);
}

function setupRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
}

function setupControls() {
  controls = new PointerLockControls(camera, renderer.domElement);
  scene.add(controls.getObject());

  renderer.domElement.addEventListener("click", () => {
    if (params.cameraMode === "Libre" && !controls.isLocked) controls.lock();
  });

  controls.addEventListener("unlock", () => {
    if (params.cameraMode === "Libre")
      info.innerHTML = "Modo Libre: WASD + Mouse (clic para activar)";
  });
}

function setupLights() {
  scene.add(new THREE.PointLight(0xffffff, 1.5));
  scene.add(new THREE.AmbientLight(0x555555));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(50, 50, 50);
  scene.add(dirLight);
}

function loadTexturesAndCreateBodies() {
  const loader = new THREE.TextureLoader();

  const textures = {
    sun: loader.load("textures/sun/sunmap.jpg"),
    mercury: {
      map: loader.load("textures/mercury/mercurymap.jpg"),
      bump: loader.load("textures/mercury/mercurybump.jpg"),
    },
    venus: {
      map: loader.load("textures/venus/venusmap.jpg"),
      bump: loader.load("textures/venus/venusbump.jpg"),
    },
    earth: {
      map: loader.load("textures/earth/earthmap.jpg"),
      bump: loader.load("textures/earth/earthbump.jpg"),
      spec: loader.load("textures/earth/earthspec.jpg"),
      cloud: loader.load("textures/earth/earthcloudmap.jpg"),
      alpha: loader.load("textures/earth/earthcloudmaptrans_invert.jpg"),
      moon: {
        map: loader.load("textures/earth/moon/moonmap.jpg"),
        bump: loader.load("textures/earth/moon/moonbump.jpg"),
      },
    },
    mars: {
      map: loader.load("textures/mars/marsmap.jpg"),
      bump: loader.load("textures/mars/marsbump.jpg"),
      phobos: {
        map: loader.load("textures/mars/phobos/phobosmap.png"),
        bump: loader.load("textures/mars/phobos/phobosbump.jpg"),
      },
      deimos: {
        map: loader.load("textures/mars/deimos/deimosmap.jpg"),
        bump: loader.load("textures/mars/deimos/deimosbump.jpg"),
      },
    },
    jupiter: { map: loader.load("textures/jupiter/jupitermap.jpg") },
    saturn: { map: loader.load("textures/saturn/saturnmap.jpg") },
    uranus: { map: loader.load("textures/uranus/uranusmap.jpg") },
    neptune: { map: loader.load("textures/neptune/neptunemap.jpg") },
  };

  // Crear estrellas y planetas normales
  createStar(2.5, 0xffffff, textures.sun);
  const mercury = createPlanet(
    0.4,
    12,
    1.5,
    0xffffff,
    1,
    0.9,
    textures.mercury.map,
    textures.mercury.bump
  );
  const venus = createPlanet(
    0.5,
    18,
    1.2,
    0xffffff,
    1,
    0.96,
    textures.venus.map,
    textures.venus.bump
  );
  const earth = createPlanet(
    0.6,
    25,
    1,
    0xffffff,
    1,
    0.98,
    textures.earth.map,
    textures.earth.bump,
    textures.earth.spec,
    textures.earth.cloud,
    textures.earth.alpha
  );
  const mars = createPlanet(
    0.5,
    33,
    0.8,
    0xffffff,
    1,
    0.9,
    textures.mars.map,
    textures.mars.bump
  );
  const jupiter = createPlanet(
    1,
    45,
    0.6,
    0xffffff,
    1,
    0.95,
    textures.jupiter.map
  );
  const saturn = createPlanet(
    0.9,
    60,
    0.5,
    0xffffff,
    1,
    0.9,
    textures.saturn.map
  );
  const uranus = createPlanet(
    0.7,
    75,
    0.4,
    0xffffff,
    1,
    0.97,
    textures.uranus.map
  );
  const neptune = createPlanet(
    0.7,
    90,
    0.3,
    0xffffff,
    1,
    0.93,
    textures.neptune.map
  );

  // Lunas
  createMoon(
    earth,
    0.15,
    1.5,
    2,
    0xffffff,
    Math.PI / 4,
    textures.earth.moon.map,
    textures.earth.moon.bump
  );
  createMoon(
    mars,
    0.08,
    1,
    2.5,
    0xaaaaaa,
    Math.PI / 6,
    textures.mars.phobos.map,
    textures.mars.phobos.bump
  );
  createMoon(
    mars,
    0.06,
    2,
    1.8,
    0x888888,
    Math.PI / 4,
    textures.mars.deimos.map,
    textures.mars.deimos.bump
  );

  // Anillos usando carga asíncrona
  loader.load("textures/saturn/ring/ringcolor.jpg", function (sColor) {
    loader.load("textures/saturn/ring/ringalpha.png", function (sAlpha) {
      sColor.wrapS = sColor.wrapT = THREE.ClampToEdgeWrapping;
      sAlpha.wrapS = sAlpha.wrapT = THREE.ClampToEdgeWrapping;
      sAlpha.flipY = false;

      createRing(
        saturn,
        1.2,
        2.3,
        sColor,
        sAlpha,
        THREE.MathUtils.degToRad(27)
      );
    });
  });

  loader.load("textures/uranus/ring/ringcolor.jpg", function (uColor) {
    loader.load("textures/uranus/ring/ringalpha.png", function (uAlpha) {
      uColor.wrapS = uColor.wrapT = THREE.ClampToEdgeWrapping;
      uAlpha.wrapS = uAlpha.wrapT = THREE.ClampToEdgeWrapping;
      uAlpha.flipY = false;

      createRing(
        uranus,
        0.8,
        1.6,
        uColor,
        uAlpha,
        THREE.MathUtils.degToRad(97.77)
      );
    });
  });

  // Etiquetas
  addLabelToBody(moons[moons.length - 3].mesh, "Luna");
  addLabelToBody(moons[moons.length - 2].mesh, "Fobos");
  addLabelToBody(moons[moons.length - 1].mesh, "Deimos");
  addLabelToBody(mercury, "Mercurio");
  addLabelToBody(venus, "Venus");
  addLabelToBody(earth, "Tierra");
  addLabelToBody(mars, "Marte");
  addLabelToBody(jupiter, "Júpiter");
  addLabelToBody(saturn, "Saturno");
  addLabelToBody(uranus, "Urano");
  addLabelToBody(neptune, "Neptuno");
}

function addLabelToBody(body, text, usePivot = null) {
  const canvas = document.createElement("canvas");
  const size = 256;
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3, 1.5, 1);
  const parent = usePivot || body;

  let offsetY = 0;
  if (
    body.geometry &&
    body.geometry.parameters &&
    body.geometry.parameters.radius
  )
    offsetY = body.geometry.parameters.radius;
  body.children.forEach((child) => {
    if (child.geometry && child.geometry.type === "RingGeometry") {
      const ringRadius = child.geometry.parameters.outerRadius;
      if (ringRadius > offsetY) offsetY = ringRadius;
    }
  });
  sprite.position.set(0, offsetY + 0.5, 0);
  parent.add(sprite);
}

function createStar(radius, color, texture) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color,
    emissive: 0xffffff,
  });
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 64),
    material
  );
  scene.add(mesh);
  return mesh;
}

function createPlanet(
  radius,
  dist,
  speed,
  color,
  f1,
  f2,
  texture,
  bump = null,
  spec = null,
  cloud,
  alpha
) {
  const material = new THREE.MeshStandardMaterial({ color });
  if (texture) material.map = texture;
  if (bump) {
    material.bumpMap = bump;
    material.bumpScale = 0.05;
  }

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 64),
    material
  );
  mesh.userData = {
    dist,
    speed,
    f1,
    f2,
    angleOffset: Math.random() * Math.PI * 2,
  };
  scene.add(mesh);
  planets.push(mesh);

  if (cloud && alpha) {
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(radius + 0.02, 64, 64),
      new THREE.MeshStandardMaterial({
        map: cloud,
        alphaMap: alpha,
        transparent: true,
        roughness: 1,
        metalness: 0,
      })
    );
    mesh.add(clouds);
    mesh.userData.clouds = clouds;
  }

  const orbitPoints = new THREE.EllipseCurve(
    0,
    0,
    dist * f1,
    dist * f2,
    0,
    2 * Math.PI
  ).getPoints(100);
  const orbit = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(orbitPoints),
    new THREE.LineBasicMaterial({ color: 0x555555 })
  );
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);

  return mesh;
}

function createMoon(
  planet,
  radius,
  dist,
  speed,
  color,
  angle,
  texture = null,
  bump = null
) {
  const pivot = new THREE.Object3D();
  pivot.rotation.x = angle; // inclinación
  pivot.rotation.z = (Math.random() - 0.5) * 0.2; // ligera inclinación
  planet.add(pivot);

  const material = new THREE.MeshStandardMaterial({ color });
  if (texture) material.map = texture;
  if (bump) {
    material.bumpMap = bump;
    material.bumpScale = 0.02;
  }

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 16, 16),
    material
  );
  moon.position.set(dist, 0, 0);
  pivot.add(moon);

  moons.push({
    mesh: moon,
    pivot,
    speed,
    angleOffset: Math.random() * Math.PI * 2,
  });
}

function createRing(
  planet,
  innerRadius,
  outerRadius,
  colorMap,
  alphaMap,
  inclination = 0
) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 512, 1);

  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const radius = Math.sqrt(x * x + y * y);
    let v = (radius - innerRadius) / (outerRadius - innerRadius);
    const padding = 0.04;
    v = THREE.MathUtils.clamp(v * (1 - padding * 2) + padding, 0, 1);
    uv[i * 2] = v;
    uv[i * 2 + 1] = 0.5;
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));

  const material = new THREE.MeshBasicMaterial({
    map: colorMap,
    alphaMap: alphaMap,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const ring = new THREE.Mesh(geometry, material);

  // Aplicar inclinación real
  ring.rotation.x = inclination;

  planet.add(ring);
  rings.push(ring);

  return ring;
}

function setupRaycasterAndPlane() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  scene.add(plane);
}

function setupEvents() {
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("mousedown", (e) => {
    if (params.cameraMode === "Seguir Planeta" && selectedPlanet) {
      isDragging = true;
      previousMouse.x = e.clientX;
      previousMouse.y = e.clientY;
    }
  });
  renderer.domElement.addEventListener("mouseup", () => (isDragging = false));
  renderer.domElement.addEventListener("mousemove", (e) => {
    if (isDragging && selectedPlanet) {
      const deltaX = e.clientX - previousMouse.x;
      const deltaY = e.clientY - previousMouse.y;
      rotY -= deltaX * 0.005;
      rotX += deltaY * 0.005;
      rotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotX));
      previousMouse.x = e.clientX;
      previousMouse.y = e.clientY;
    }
  });
  window.addEventListener("wheel", (event) => {
    if (params.cameraMode === "Seguir Planeta") {
      followDistance += event.deltaY * 0.01;
      followDistance = Math.max(2, Math.min(followDistance, 100));
    }
  });
}

function setupGUI() {
  gui = new GUI();
  gui
    .add(params, "globalSpeed", 0.0001, 0.001, 0.0001)
    .name("Velocidad Global")
    .onChange((v) => (globalSpeed = v));
  gui
    .add(params, "cameraMode", ["Libre", "Seguir Planeta", "Agregar Planetas"])
    .name("Modo Cámara")
    .onChange((value) => {
      selectedPlanet = null;
      rotX = 0;
      rotY = 0;
      isDragging = false;
      if (value === "Libre") controls.unlock();
      info.innerHTML =
        value === "Libre"
          ? "Modo Libre: WASD + Mouse"
          : value === "Seguir Planeta"
          ? "Modo Seguir Planeta: Click en un planeta"
          : "Modo Agregar Planetas: Clic para crear un planeta";
    });

  const folder = gui.addFolder("Agregar Planetas");
  folder.add(params, "newPlanetRadius", 0.1, 2, 0.1).name("Radio");
  folder.add(params, "newPlanetSpeed", 0.1, 5, 0.1).name("Velocidad");
  folder.addColor(params, "newPlanetColor").name("Color");
  folder.open();
}

function setupKeyboardControls() {
  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyW") moveForward = true;
    if (e.code === "KeyS") moveBackward = true;
    if (e.code === "KeyA") moveLeft = true;
    if (e.code === "KeyD") moveRight = true;
  });
  document.addEventListener("keyup", (e) => {
    if (e.code === "KeyW") moveForward = false;
    if (e.code === "KeyS") moveBackward = false;
    if (e.code === "KeyA") moveLeft = false;
    if (e.code === "KeyD") moveRight = false;
  });
}

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (params.cameraMode === "Agregar Planetas") {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObject(plane)[0];
    if (hit) {
      const point = hit.point.clone(); // punto exacto en el plano
      const dist = Math.sqrt(point.x * point.x + point.z * point.z); // distancia radial en XZ

      // parámetros del nuevo planeta (tomados de GUI o aleatorios)
      const radius = params.newPlanetRadius;
      const speed = params.newPlanetSpeed;
      const color = params.newPlanetColor;
      const f1 = 1;
      const f2 = 1;

      // calcular el ángulo inicial para que el planeta aparezca en el clic
      const elapsed = (Date.now() - startTime) * globalSpeed;
      const angleOffset = Math.atan2(point.z, point.x) - elapsed * speed;

      const newPlanet = createPlanet(radius, dist, speed, color, f1, f2);
      newPlanet.userData.angleOffset = angleOffset;

      // posicionar exactamente en el punto del clic
      newPlanet.position.set(point.x, 0, point.z);

      info.innerHTML = `Nuevo planeta creado en (${point.x.toFixed(
        2
      )}, ${point.z.toFixed(2)})`;
    }
    return; // salir para no seleccionar otro planeta
  }

  if (params.cameraMode === "Seguir Planeta") {
    const hit = raycaster.intersectObjects(planets, true)[0];
    if (hit) {
      let obj = hit.object;
      while (obj && !planets.includes(obj)) obj = obj.parent;
      if (obj) selectPlanet(obj);
    }
  }
}

function selectPlanet(planet) {
  selectedPlanet = planet;
  rotX = 0;
  rotY = 0;
  isDragging = false;
  followDistance = Math.max(planet.geometry.parameters.radius || 1 * 6, 6);
  info.innerHTML = "Siguiendo planeta: ESC para liberar";
}

function animate() {
  const elapsed = (Date.now() - startTime) * globalSpeed;
  requestAnimationFrame(animate);

  planets.forEach((p) => {
    const a = elapsed * p.userData.speed + p.userData.angleOffset;
    p.position.set(
      Math.cos(a) * p.userData.f1 * p.userData.dist,
      0,
      Math.sin(a) * p.userData.f2 * p.userData.dist
    );
    p.rotation.y += 0.01;
    if (p.userData.clouds) p.userData.clouds.rotation.y += 0.02;
  });

  moons.forEach((m) => {
    m.pivot.rotation.y = elapsed * m.speed + m.angleOffset;
    m.pivot.rotation.x += 0.0005; // ligera inclinación
  });

  rings.forEach((ring) => {
    ring.rotation.z += 0.001; // rotación de los anillos
  });

  if (params.cameraMode === "Libre" && controls.isLocked) {
    updateCameraMovement();
  } else if (params.cameraMode === "Seguir Planeta" && selectedPlanet) {
    const offset = new THREE.Vector3(0, 0, 1)
      .applyEuler(new THREE.Euler(rotX, rotY, 0))
      .multiplyScalar(followDistance);
    camera.position.copy(selectedPlanet.position.clone().add(offset));
    camera.lookAt(selectedPlanet.position);
  }

  renderer.render(scene, camera);
}

function updateCameraMovement() {
  direction.set(0, 0, 0);
  if (moveForward) direction.z -= 1;
  if (moveBackward) direction.z += 1;
  if (moveLeft) direction.x -= 1;
  if (moveRight) direction.x += 1;
  direction.normalize();
  const moveVector = new THREE.Vector3(
    direction.x,
    0,
    direction.z
  ).applyQuaternion(camera.quaternion);
  camera.position.add(moveVector.multiplyScalar(moveSpeed));
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
