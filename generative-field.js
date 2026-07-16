(function () {
  const config = {
    canvasId: 'generative-field',
    seed: 'danielcole',
    cellSize: 6,
    bayerSize: 4,
    fpsCap: 20,
    objectScale: 0.96,
    centerX: 0.5,
    centerY: 0.5,
    viewRadius: 1.02,
    boundingRadius: 1.46,
    cameraDistance: 3.2,
    maxRayDistance: 6.2,
    maxRaySteps: 54,
    surfaceEpsilon: 0.012,
    normalEpsilon: 0.025,
    selectedShape: 'auto',
    shapeOptions: ['torus', 'box', 'sphere', 'cylinder', 'cone'],
    rotationSpeedX: 0.000115,
    rotationSpeedY: 0.000157,
    rotationSpeedZ: 0.000073,
    tiltX: -0.42,
    tiltY: 0.34,
    tiltZ: 0.18,
    lightDirection: [-0.22, 0.52, 0.82],
    lightOrbitAmount: 0.14,
    lightOrbitSpeed: 0.00008,
    sphereLightOrbitAmount: 0.68,
    sphereLightOrbitSpeed: 0.00018,
    baseInkDensity: 0.36,
    shadowInkDensity: 0.5,
    rimInkDensity: 0.44,
    rimPower: 2,
    toneThresholds: [0.24, 0.42, 0.62],
    toneCoverages: [0, 0.33, 0.64, 1],
    backgroundColor: '#dce7f2',
    inkColor: '#0e1a2a',
  };

  const canvas = document.getElementById(config.canvasId);

  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d', { alpha: false });

  if (!context) {
    return;
  }
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bayer4 = [
    0, 8, 2, 10,
    12, 4, 14, 6,
    3, 11, 1, 9,
    15, 7, 13, 5,
  ].map((value) => (value + 0.5) / 16);
  const bayer8 = [
    0, 48, 12, 60, 3, 51, 15, 63,
    32, 16, 44, 28, 35, 19, 47, 31,
    8, 56, 4, 52, 11, 59, 7, 55,
    40, 24, 36, 20, 43, 27, 39, 23,
    2, 50, 14, 62, 1, 49, 13, 61,
    34, 18, 46, 30, 33, 17, 45, 29,
    10, 58, 6, 54, 9, 57, 5, 53,
    42, 26, 38, 22, 41, 25, 37, 21,
  ].map((value) => (value + 0.5) / 64);

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    animationFrame: 0,
    lastFrameTime: 0,
    startedAt: performance.now(),
    visible: true,
    inView: true,
    pausedAt: 0,
    pausedTotal: 0,
    reduceMotion: reduceMotionQuery.matches,
    selectedShape: chooseShape(),
    rotationPhaseX: randomUnit() * Math.PI * 2,
    rotationPhaseY: randomUnit() * Math.PI * 2,
    rotationPhaseZ: randomUnit() * Math.PI * 2,
    lightPhase: randomUnit() * Math.PI * 2,
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      state.inView = entries.some((entry) => entry.isIntersecting);
      updateLoop();
    });

    observer.observe(canvas);
  }
  resizeCanvas();
  renderFrame(0);
  updateLoop();

  window.addEventListener('resize', debounce(() => {
    resizeCanvas();
    renderFrame(currentTime());
  }, 120));

  document.addEventListener('visibilitychange', () => {
    state.visible = !document.hidden;
    updateLoop();
  });

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', handleMotionPreference);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(handleMotionPreference);
  }

  function handleMotionPreference(event) {
    state.reduceMotion = event.matches;
    updateLoop();
    renderFrame(currentTime());
  }

  function updateLoop() {
    const shouldAnimate = state.visible && state.inView && !state.reduceMotion;

    if (!shouldAnimate) {
      if (!state.pausedAt) {
        state.pausedAt = performance.now();
      }

      window.cancelAnimationFrame(state.animationFrame);
      state.animationFrame = 0;
      return;
    }

    if (state.pausedAt) {
      state.pausedTotal += performance.now() - state.pausedAt;
      state.pausedAt = 0;
    }

    if (!state.animationFrame) {
      state.animationFrame = window.requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    const minFrameGap = 1000 / config.fpsCap;

    state.animationFrame = 0;

    if (now - state.lastFrameTime >= minFrameGap) {
      state.lastFrameTime = now;
      renderFrame(currentTime(now));
    }

    updateLoop();
  }

  function currentTime(now) {
    return (now || performance.now()) - state.startedAt - state.pausedTotal;
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));

    state.width = width;
    state.height = height;
    state.dpr = dpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function renderFrame(time) {
    const width = state.width;
    const height = state.height;

    if (!width || !height) {
      return;
    }

    const background = readCssColor('--field-background', config.backgroundColor);
    const ink = readCssColor('--field-ink', config.inkColor);
    const cellSize = config.cellSize;
    const objectSize = width * config.objectScale;
    const centerX = width * config.centerX;
    const centerY = height * config.centerY;
    const radiusPx = objectSize * 0.58;
    const startCol = Math.max(0, Math.floor((centerX - radiusPx) / cellSize) - 1);
    const endCol = Math.min(Math.ceil(width / cellSize), Math.ceil((centerX + radiusPx) / cellSize) + 1);
    const startRow = Math.max(0, Math.floor((centerY - radiusPx) / cellSize) - 1);
    const endRow = Math.min(Math.ceil(height / cellSize), Math.ceil((centerY + radiusPx) / cellSize) + 1);
    const rotation = rotationState(time);
    const light = lightState(time);

    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = ink;

    for (let row = startRow; row < endRow; row += 1) {
      for (let col = startCol; col < endCol; col += 1) {
        const sampleX = col * cellSize + cellSize * 0.5;
        const sampleY = row * cellSize + cellSize * 0.5;
        const hit = raymarch(
          sampleX,
          sampleY,
          centerX,
          centerY,
          objectSize,
          state.selectedShape,
          rotation,
          light
        );

        if (!hit.hit) {
          continue;
        }

        const tone = twoBitTone(hit.density);

        if (shouldDrawTone(tone, col, row)) {
          context.fillRect(
            Math.floor(col * cellSize),
            Math.floor(row * cellSize),
            Math.ceil(cellSize),
            Math.ceil(cellSize)
          );
        }
      }
    }
  }

  function raymarch(sampleX, sampleY, centerX, centerY, objectSize, shape, rotation, light) {
    const x = ((sampleX - centerX) / (objectSize * 0.5)) * config.viewRadius;
    const y = (-(sampleY - centerY) / (objectSize * 0.5)) * config.viewRadius;
    const radiusSquared = config.boundingRadius * config.boundingRadius;
    const xySquared = x * x + y * y;

    if (xySquared > radiusSquared) {
      return { hit: false, density: 0 };
    }

    const sphereDepth = Math.sqrt(radiusSquared - xySquared);
    let distanceTraveled = config.cameraDistance - sphereDepth;

    for (let step = 0; step < config.maxRaySteps; step += 1) {
      const point = [x, y, config.cameraDistance - distanceTraveled];
      const distance = sceneDistance(point, shape, rotation);

      if (distance < config.surfaceEpsilon) {
        const normal = estimateNormal(point, shape, rotation);
        const density = shadeDensity(normal, light);
        return { hit: true, density };
      }

      distanceTraveled += Math.max(distance * 0.84, 0.01);

      if (distanceTraveled > config.maxRayDistance) {
        break;
      }
    }

    return { hit: false, density: 0 };
  }

  function sceneDistance(point, shape, rotation) {
    const localPoint = rotatePoint(point, -rotation.y, -rotation.x, -rotation.z);
    return primitiveDistance(localPoint, shape);
  }

  function primitiveDistance(point, shape) {
    if (shape === 'sphere') {
      return length3(point) - 0.92;
    }

    if (shape === 'box' || shape === 'roundedBox') {
      return sdRoundedBox(point, [0.56, 0.46, 0.62], 0.1);
    }

    if (shape === 'cylinder') {
      return sdCylinder(point, 0.62, 1.24);
    }

    if (shape === 'cone') {
      return sdCappedCone(point, 0.72, 0.18, 1.32);
    }

    if (shape === 'torusWide') {
      return sdTorus(point, 0.56, 0.25);
    }

    if (shape === 'torusNarrow') {
      return sdTorus(point, 0.62, 0.18);
    }

    return sdTorus(point, 0.58, 0.22);
  }

  function rotationState(time) {
    const activeTime = state.reduceMotion ? 0 : time;

    return {
      x: config.tiltX + state.rotationPhaseX + activeTime * config.rotationSpeedX,
      y: config.tiltY + state.rotationPhaseY + activeTime * config.rotationSpeedY,
      z: config.tiltZ + state.rotationPhaseZ + activeTime * config.rotationSpeedZ,
    };
  }

  function lightState(time) {
    const base = normalize3(config.lightDirection);

    if (state.reduceMotion) {
      return base;
    }

    const isSphere = state.selectedShape === 'sphere';
    const amount = isSphere ? config.sphereLightOrbitAmount : config.lightOrbitAmount;
    const speed = isSphere ? config.sphereLightOrbitSpeed : config.lightOrbitSpeed;
    const phase = time * speed + state.lightPhase;

    return normalize3([
      base[0] + Math.cos(phase) * amount,
      base[1] + Math.sin(phase * 0.74 + 0.7) * amount * 0.55,
      base[2] + Math.sin(phase) * amount * 0.35,
    ]);
  }

  function estimateNormal(point, shape, rotation) {
    const epsilon = config.normalEpsilon;
    const dx = sceneDistance([point[0] + epsilon, point[1], point[2]], shape, rotation)
      - sceneDistance([point[0] - epsilon, point[1], point[2]], shape, rotation);
    const dy = sceneDistance([point[0], point[1] + epsilon, point[2]], shape, rotation)
      - sceneDistance([point[0], point[1] - epsilon, point[2]], shape, rotation);
    const dz = sceneDistance([point[0], point[1], point[2] + epsilon], shape, rotation)
      - sceneDistance([point[0], point[1], point[2] - epsilon], shape, rotation);

    return normalize3([dx, dy, dz]);
  }

  function shadeDensity(normal, light) {
    const diffuse = Math.max(0, dot3(normal, light));
    const shadow = 1 - diffuse;
    const viewFacing = clamp(normal[2], 0, 1);
    const rim = Math.pow(1 - viewFacing, config.rimPower);
    return clamp(
      config.baseInkDensity
        + shadow * config.shadowInkDensity
        + rim * config.rimInkDensity,
      0.22,
      0.94
    );
  }

  function bayerThreshold(col, row) {
    const size = config.bayerSize === 8 ? 8 : 4;
    const matrix = size === 8 ? bayer8 : bayer4;
    return matrix[(row % size) * size + (col % size)];
  }

  function twoBitTone(density) {
    const thresholds = config.toneThresholds;

    if (density < thresholds[0]) {
      return 0;
    }

    if (density < thresholds[1]) {
      return 1;
    }

    if (density < thresholds[2]) {
      return 2;
    }

    return 3;
  }

  function shouldDrawTone(tone, col, row) {
    if (tone <= 0) {
      return false;
    }

    const coverage = config.toneCoverages[tone];

    if (coverage >= 1) {
      return true;
    }

    return bayerThreshold(col, row) < coverage;
  }

  function sdRoundedBox(point, halfSize, radius) {
    const q = [
      Math.abs(point[0]) - halfSize[0],
      Math.abs(point[1]) - halfSize[1],
      Math.abs(point[2]) - halfSize[2],
    ];
    const outside = [
      Math.max(q[0], 0),
      Math.max(q[1], 0),
      Math.max(q[2], 0),
    ];
    const inside = Math.min(Math.max(q[0], Math.max(q[1], q[2])), 0);
    return length3(outside) + inside - radius;
  }

  function sdCylinder(point, radius, height) {
    const d = [
      Math.hypot(point[0], point[2]) - radius,
      Math.abs(point[1]) - height * 0.5,
    ];
    return Math.min(Math.max(d[0], d[1]), 0) + length2([Math.max(d[0], 0), Math.max(d[1], 0)]);
  }

  function sdTorus(point, majorRadius, minorRadius) {
    const q = [Math.hypot(point[0], point[1]) - majorRadius, point[2]];
    return length2(q) - minorRadius;
  }

  function sdCappedCone(point, radiusA, radiusB, height) {
    const q = [Math.hypot(point[0], point[2]), point[1]];
    const halfHeight = height * 0.5;
    const k1 = [radiusB, halfHeight];
    const k2 = [radiusB - radiusA, height];
    const ca = [
      q[0] - Math.min(q[0], q[1] < 0 ? radiusA : radiusB),
      Math.abs(q[1]) - halfHeight,
    ];
    const projection = clamp(dot2([k1[0] - q[0], k1[1] - q[1]], k2) / dot2(k2, k2), 0, 1);
    const cb = [
      q[0] - k1[0] + k2[0] * projection,
      q[1] - k1[1] + k2[1] * projection,
    ];
    const sign = cb[0] < 0 && ca[1] < 0 ? -1 : 1;
    return sign * Math.sqrt(Math.min(dot2(ca, ca), dot2(cb, cb)));
  }

  function rotatePoint(point, angleY, angleX, angleZ) {
    let rotated = rotateY(point, angleY);
    rotated = rotateX(rotated, angleX);
    return rotateZ(rotated, angleZ);
  }

  function rotateX(point, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [point[0], point[1] * c - point[2] * s, point[1] * s + point[2] * c];
  }

  function rotateY(point, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [point[0] * c + point[2] * s, point[1], -point[0] * s + point[2] * c];
  }

  function rotateZ(point, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [point[0] * c - point[1] * s, point[0] * s + point[1] * c, point[2]];
  }

  function readCssColor(name, fallback) {
    const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function debounce(callback, wait) {
    let timeout;

    return function debounced() {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(callback, wait);
    };
  }

  function chooseShape() {
    if (config.selectedShape && config.selectedShape !== 'auto') {
      return config.selectedShape;
    }

    const options = config.shapeOptions.filter(Boolean);
    return options[randomIndex(options.length)] || 'torus';
  }

  function randomIndex(length) {
    if (length <= 1) {
      return 0;
    }

    return Math.floor(randomUnit() * length) % length;
  }

  function randomUnit() {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] / 4294967296;
    }

    return hashString(`${config.seed}-${Date.now()}-${Math.random()}`) / 4294967296;
  }

  function hashString(value) {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function dot2(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }

  function dot3(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function length2(point) {
    return Math.hypot(point[0], point[1]);
  }

  function length3(point) {
    return Math.hypot(point[0], point[1], point[2]);
  }

  function normalize3(point) {
    const length = length3(point) || 1;
    return [point[0] / length, point[1] / length, point[2] / length];
  }
}());
