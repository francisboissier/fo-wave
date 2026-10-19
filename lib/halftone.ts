type Pixi = Awaited<typeof import("pixi.js")>["default"];
type PixiObject = ReturnType<Pixi["autoDetectRenderer"]>;

export type HalftoneImages = {
  lowresUrl: string;
  hiresUrl: string;
  maskUrl: string;
  width: number;
  height: number;
};

const settings = {
  dot_scale: 0,
  dot_gain: 200,
  undercolor_removal: 95,
  c_rand_offset_x: 0.89148018555716,
  c_rand_offset_y: -0.034963104873896,
  m_rand_offset_x: -0.45742203574628,
  m_rand_offset_y: -0.1833441699855,
  y_rand_offset_x: 0.60032634017989,
  y_rand_offset_y: 0.83121883729473,
  color_shift: 94,
  cyan: true,
  cyan_halftone: true,
  c_opacity: 87,
  c_rotation: 140,
  c_rot_speed: -10,
  magenta: true,
  magenta_halftone: true,
  m_opacity: 69,
  m_rotation: 42,
  m_rot_speed: 10,
  yellow: true,
  yellow_halftone: true,
  y_opacity: 99,
  y_rotation: 59,
  y_rot_speed: 5,
  black: true,
  black_halftone: true,
  k_opacity: 27,
  k_rotation: 45,
  k_rot_speed: 0,
  hex: "#333333",
  alpha: 0,
  mouse_interaction: true,
  scroll_interaction: true,
};

const shaderHeader = `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTextureCoord;
uniform float imgAspect;
uniform float c_opacity;
uniform float m_opacity;
uniform float y_opacity;
uniform float k_opacity;
uniform vec2 move_offset;
uniform vec2 c_rand_offset;
uniform vec2 m_rand_offset;
uniform vec2 y_rand_offset;
uniform int c_on;
uniform int m_on;
uniform int y_on;
uniform int k_on;
uniform float undercolor;
uniform sampler2D uSampler;
`;

const inkColors = `
  vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 cyan = vec4(0.0, 0.686, 0.925, 1.0);
  vec4 magenta = vec4(0.917, 0.078, 0.54, 1.0);
  vec4 yellow = vec4(1.0, 0.941, 0.164, 1.0);

  vec4 rgbscreen = mix(white, yellow, y);
  rgbscreen = rgbscreen * mix(white, magenta, m);
  rgbscreen = rgbscreen * mix(white, cyan, c);
  rgbscreen = rgbscreen * mix(white, black, k);
`;

const cmykSeparateShader = `${shaderHeader}
void main() {
  vec3 texcolor = texture2D(uSampler, vTextureCoord).rgb;
  vec3 c_texcolor = texture2D(uSampler, vTextureCoord + vec2(c_rand_offset.x, c_rand_offset.y)).rgb;
  vec3 m_texcolor = texture2D(uSampler, vTextureCoord + vec2(m_rand_offset.x, m_rand_offset.y)).rgb;
  vec3 y_texcolor = texture2D(uSampler, vTextureCoord + vec2(y_rand_offset.x, y_rand_offset.y)).rgb;

  float c = 0.0;
  if (c_on > 0) {
    vec4 c_cmyk;
    c_cmyk.xyz = 1.0 - c_texcolor;
    c_cmyk.w = min(c_cmyk.x, min(c_cmyk.y, c_cmyk.z)) * undercolor;
    c_cmyk.xyz -= c_cmyk.w;
    c = c_cmyk.x * c_opacity;
  };

  float m = 0.0;
  if (m_on > 0) {
    vec4 m_cmyk;
    m_cmyk.xyz = 1.0 - m_texcolor;
    m_cmyk.w = min(m_cmyk.x, min(m_cmyk.y, m_cmyk.z)) * undercolor;
    m_cmyk.xyz -= m_cmyk.w;
    m = m_cmyk.y * m_opacity;
  };

  float y = 0.0;
  if (y_on > 0) {
    vec4 y_cmyk;
    y_cmyk.xyz = 1.0 - y_texcolor;
    y_cmyk.w = min(y_cmyk.x, min(y_cmyk.y, y_cmyk.z)) * undercolor;
    y_cmyk.xyz -= y_cmyk.w;
    y = y_cmyk.z * y_opacity;
  };

  float k = 0.0;
  if (k_on > 0) {
    vec4 cmyk;
    cmyk.xyz = 1.0 - texcolor;
    cmyk.w = min(cmyk.x, min(cmyk.y, cmyk.z));
    cmyk.xyz -= cmyk.w;
    k = cmyk.w * k_opacity;
  };
${inkColors}
  rgbscreen = 1.0 - rgbscreen;
  gl_FragColor = rgbscreen;
}`;

const halfTonerShader = `${shaderHeader}
uniform vec2 dimensions;
uniform vec4 filterArea;
uniform float c_angle;
uniform float m_angle;
uniform float y_angle;
uniform float k_angle;
uniform float dot_gain;
uniform float frequency;

float aastep(float threshold, float value) {
  float afwidth = (frequency * .0015);
  return smoothstep(threshold - afwidth, threshold + afwidth, value);
}

void main() {
  vec2 mapCoord = vTextureCoord * (filterArea.xy / dimensions.xy);
  vec2 st2 = mapCoord + vec2(-0.5, -0.5);
  if (imgAspect < 1.0) {
    st2 = st2 * mat2(imgAspect, 0.0, 0.0, 1.0);
  } else {
    st2 = st2 * mat2(1.0, 0.0, 0, 1.0 / imgAspect);
  };

  vec2 Kst = st2 + move_offset;
  vec2 Cst = st2 + move_offset * 0.8;
  vec2 Mst = st2 + move_offset * 0.6;
  vec2 Yst = st2 + move_offset * 0.4;

  vec3 texcolor = texture2D(uSampler, vTextureCoord).rgb;
  vec3 c_texcolor = texture2D(uSampler, clamp(vTextureCoord + vec2(c_rand_offset.x, c_rand_offset.y), vec2(0.005, 0.005), vTextureCoord.xy)).rgb;
  vec3 m_texcolor = texture2D(uSampler, clamp(vTextureCoord + vec2(m_rand_offset.x, m_rand_offset.y), vec2(0.005, 0.005), vTextureCoord.xy)).rgb;
  vec3 y_texcolor = texture2D(uSampler, clamp(vTextureCoord + vec2(y_rand_offset.x, y_rand_offset.y), vec2(0.005, 0.005), vTextureCoord.xy)).rgb;

  float c = 0.0;
  if (c_on > 0) {
    vec4 c_cmyk;
    c_cmyk.xyz = 1.0 - c_texcolor;
    c_cmyk.w = min(c_cmyk.x, min(c_cmyk.y, c_cmyk.z)) * undercolor;
    c_cmyk.xyz -= (c_cmyk.w + .01);
    Cst = frequency * mat2(cos(c_angle), sin(c_angle), sin(c_angle) * -1.0, cos(c_angle)) * Cst;
    vec2 Cuv = 2.0 * fract(Cst) - 1.0;
    c = aastep(0.0, sqrt(c_cmyk.x) * dot_gain - length(Cuv)) * c_opacity;
  };

  float m = 0.0;
  if (m_on > 0) {
    vec4 m_cmyk;
    m_cmyk.xyz = 1.0 - m_texcolor;
    m_cmyk.w = min(m_cmyk.x, min(m_cmyk.y, m_cmyk.z)) * undercolor;
    m_cmyk.xyz -= (m_cmyk.w + .01);
    Mst = frequency * mat2(cos(m_angle), sin(m_angle), sin(m_angle) * -1.0, cos(m_angle)) * Mst;
    vec2 Muv = 2.0 * fract(Mst) - 1.0;
    m = aastep(0.0, sqrt(m_cmyk.y) * dot_gain - length(Muv)) * m_opacity;
  };

  float y = 0.0;
  if (y_on > 0) {
    vec4 y_cmyk;
    y_cmyk.xyz = 1.0 - y_texcolor;
    y_cmyk.w = min(y_cmyk.x, min(y_cmyk.y, y_cmyk.z)) * undercolor;
    y_cmyk.xyz -= (y_cmyk.w + .01);
    Yst = frequency * mat2(cos(y_angle), sin(y_angle), sin(y_angle) * -1.0, cos(y_angle)) * Yst;
    vec2 Yuv = 2.0 * fract(Yst) - 1.0;
    y = aastep(0.0, sqrt(y_cmyk.z) * dot_gain - length(Yuv)) * y_opacity;
  };

  float k = 0.0;
  if (k_on > 0) {
    vec4 cmyk;
    cmyk.xyz = 1.0 - texcolor;
    cmyk.w = min(cmyk.x, min(cmyk.y, cmyk.z)) - 0.01;
    cmyk.xyz -= cmyk.w;
    Kst = frequency * 1.05 * mat2(cos(k_angle), sin(k_angle), sin(k_angle) * -1.0, cos(k_angle)) * Kst;
    vec2 Kuv = 2.0 * fract(Kst) - 1.0;
    k = (aastep(0.0, sqrt(cmyk.w) * dot_gain * (undercolor + .01) - length(Kuv))) * k_opacity;
  };
${inkColors}
  rgbscreen.rgb = 1.0 - rgbscreen.rgb;
  gl_FragColor = rgbscreen;
}`;

const sharedUniforms = () => ({
  imgAspect: { type: "f", value: 1.333 },
  c_opacity: { type: "f", value: 0 },
  m_opacity: { type: "f", value: 0 },
  y_opacity: { type: "f", value: 0 },
  k_opacity: { type: "f", value: 0 },
  c_on: { type: "i", value: 1 },
  m_on: { type: "i", value: 1 },
  y_on: { type: "i", value: 1 },
  k_on: { type: "i", value: 1 },
  undercolor: { type: "f", value: 1.0 },
  c_rand_offset: { type: "v2", value: new Float32Array([0.0, 0.0]) },
  m_rand_offset: { type: "v2", value: new Float32Array([0.0, 0.0]) },
  y_rand_offset: { type: "v2", value: new Float32Array([0.0, 0.0]) },
  move_offset: { type: "v2", value: new Float32Array([0.0, 0.0]) },
});

const channelState = (enabled: boolean, halftone: boolean) => ({
  halftone: enabled && halftone ? 1 : 0,
  key: enabled && !halftone ? 1 : 0,
});

const toRadians = (degrees: number) => degrees * (Math.PI / 180);

const loadTexture = (PIXI: Pixi, src: string) =>
  new Promise<PixiObject>((resolve, reject) => {
    const texture = PIXI.Texture.fromImage(src, true);
    if (texture.baseTexture.hasLoaded) {
      resolve(texture);
      return;
    }
    texture.baseTexture.once("loaded", () => resolve(texture));
    texture.baseTexture.once("error", reject);
  });

export function mountHalftone(host: HTMLElement, images: HalftoneImages) {
  let destroyed = false;
  let cleanup = () => {};

  import("pixi.js").then(async (module) => {
    if (destroyed) return;
    const PIXI: Pixi = module.default ?? module;
    PIXI.utils.skipHello();
    cleanup = await startHalftone(PIXI, host, images, () => destroyed);
    if (destroyed) cleanup();
  });

  return () => {
    destroyed = true;
    cleanup();
  };
}

async function startHalftone(
  PIXI: Pixi,
  host: HTMLElement,
  images: HalftoneImages,
  isDestroyed: () => boolean,
) {
  const data = {
    counter: 0,
    cmykRotSpeed: { c: 0, m: 0, y: 0, k: 0 },
    imageSize: { width: images.width, height: images.height },
    scrollPosition: { x: 0, y: 0 },
    mouseOffset: { top: 0, left: 0 },
    stageSize: { w: 800, h: 600 },
    mousePrev: { x: -1, y: -1 },
    mouseCur: { x: 0, y: 0 },
    mouseCalced: false,
    queuedResize: null as [number, number] | null,
    drawFrameId: 0,
  };

  const renderer: PixiObject = PIXI.autoDetectRenderer(800, 600, { resolution: window.devicePixelRatio });
  renderer.backgroundColor = 0xffffff;
  renderer.view.classList.add("halftone-canvas");
  host.appendChild(renderer.view);

  const [lowresTexture, hiresTexture, maskTexture] = await Promise.all([
    loadTexture(PIXI, images.lowresUrl),
    loadTexture(PIXI, images.hiresUrl),
    loadTexture(PIXI, images.maskUrl),
  ]);

  if (isDestroyed()) {
    renderer.destroy(true);
    return () => {};
  }

  const stageWrapper: PixiObject = new PIXI.Container();
  const stage: PixiObject = new PIXI.Container();
  const stageFore: PixiObject = new PIXI.Container();
  const bgMask: PixiObject = new PIXI.Sprite(maskTexture);
  const blurSprite: PixiObject = new PIXI.Sprite(lowresTexture);
  const hiresSprite: PixiObject = new PIXI.Sprite(hiresTexture);
  blurSprite.filters = [new PIXI.filters.BlurFilter()];

  const renderTexture: PixiObject = PIXI.RenderTexture.create(blurSprite.width, blurSprite.height);
  const sprite: PixiObject = new PIXI.Sprite(renderTexture);

  const foregroundMultiplier: PixiObject = new PIXI.Graphics();
  foregroundMultiplier.beginFill(0xffffff);
  foregroundMultiplier.drawRect(0, 0, 1, 1);
  foregroundMultiplier.endFill();
  foregroundMultiplier.tint = parseInt(settings.hex.replace("#", ""), 16);
  foregroundMultiplier.alpha = settings.alpha;
  foregroundMultiplier.blendMode = PIXI.BLEND_MODES.MULTIPLY;

  const resizeImage = () => {
    const offset = 4;
    const parent = { h: data.stageSize.h + offset, w: data.stageSize.w + offset };
    const ratio = {
      y: data.imageSize.width / data.imageSize.height,
      x: data.imageSize.height / data.imageSize.width,
    };
    const isTall = parent.w / parent.h < ratio.y;
    const height = isTall ? Math.ceil(parent.h) : Math.ceil(parent.w * ratio.x);
    const width = isTall ? Math.ceil(parent.h * ratio.y) : Math.ceil(parent.w);
    const marginTop = Math.ceil((parent.h - height) / 2 - offset / 2);
    const marginLeft = Math.ceil((parent.w - width) / 2 - offset / 2);

    foregroundMultiplier.width = data.stageSize.w;
    foregroundMultiplier.height = data.stageSize.h;

    for (const target of [bgMask, sprite, hiresSprite]) {
      target.width = width;
      target.height = height;
      target.x = marginLeft;
      target.y = marginTop;
    }
  };

  stage.addChild(bgMask);
  stage.addChild(sprite);
  stage.addChild(hiresSprite);
  stageFore.addChild(foregroundMultiplier);
  stageWrapper.addChild(stage);
  stageWrapper.addChild(stageFore);

  const cmykSeparate: PixiObject = new PIXI.Filter("", cmykSeparateShader, sharedUniforms());
  const halfToner: PixiObject = new PIXI.Filter("", halfTonerShader, {
    ...sharedUniforms(),
    frequency: { type: "f", value: 100.0 },
    c_angle: { type: "f", value: 0 },
    m_angle: { type: "f", value: 0 },
    y_angle: { type: "f", value: 0 },
    k_angle: { type: "f", value: 0 },
    dot_gain: { type: "f", value: 1 },
    dimensions: { type: "v2", value: new PIXI.Matrix() },
  });

  halfToner.apply = function (filterManager: PixiObject, input: PixiObject, output: PixiObject, clear: boolean) {
    this.uniforms.dimensions[0] = data.stageSize.w;
    this.uniforms.dimensions[1] = data.stageSize.h;
    filterManager.applyFilter(this, input, output, clear);
  };

  sprite.filters = [halfToner];
  hiresSprite.filters = [cmykSeparate];

  const invert: PixiObject = new PIXI.filters.ColorMatrixFilter();
  invert.matrix = [-1, 0, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, 1, 0];
  stage.filters = [invert];

  const applyShaderValues = () => {
    const toSpeed = (speed: number) => toRadians(speed) * -0.016;
    data.cmykRotSpeed = {
      c: toSpeed(settings.c_rot_speed),
      m: toSpeed(settings.m_rot_speed),
      y: toSpeed(settings.y_rot_speed),
      k: toSpeed(settings.k_rot_speed),
    };

    const channels = {
      c: channelState(settings.cyan, settings.cyan_halftone),
      m: channelState(settings.magenta, settings.magenta_halftone),
      y: channelState(settings.yellow, settings.yellow_halftone),
      k: channelState(settings.black, settings.black_halftone),
    };

    const screenSize = settings.dot_scale * 0.01;
    const blur = blurSprite.filters[0];
    blur.passes = Math.floor(5 * screenSize * screenSize) + 1;
    blur.blur = Math.floor(2 * screenSize ** 5) + 0.5;
    blur.padding = 0;
    renderer.render(blurSprite, renderTexture, undefined, undefined, true);

    const halftoneUniforms = halfToner.uniforms;
    const separateUniforms = cmykSeparate.uniforms;

    halftoneUniforms.imgAspect = data.stageSize.w / data.stageSize.h;
    separateUniforms.imgAspect = data.stageSize.w / data.stageSize.h;
    halftoneUniforms.dot_gain = settings.dot_gain / 100 + 1.01;

    halftoneUniforms.c_on = channels.c.halftone;
    halftoneUniforms.m_on = channels.m.halftone;
    halftoneUniforms.y_on = channels.y.halftone;
    halftoneUniforms.k_on = channels.k.halftone;
    halftoneUniforms.undercolor = settings.undercolor_removal * 0.01;

    separateUniforms.c_on = channels.c.key;
    separateUniforms.m_on = channels.m.key;
    separateUniforms.y_on = channels.y.key;
    separateUniforms.k_on = channels.k.key;

    halftoneUniforms.c_opacity = settings.c_opacity * 0.01;
    halftoneUniforms.m_opacity = settings.m_opacity * 0.01;
    halftoneUniforms.y_opacity = settings.y_opacity * 0.01;
    halftoneUniforms.k_opacity = settings.k_opacity * 0.01;

    separateUniforms.c_opacity = halftoneUniforms.c_opacity;
    separateUniforms.m_opacity = halftoneUniforms.m_opacity;
    separateUniforms.y_opacity = halftoneUniforms.y_opacity;
    separateUniforms.k_opacity = halftoneUniforms.k_opacity;
    separateUniforms.undercolor = settings.undercolor_removal * 0.01;
  };

  const updateShaderAnimation = () => {
    const halftoneUniforms = halfToner.uniforms;
    const separateUniforms = cmykSeparate.uniforms;
    const { w, h } = data.stageSize;
    const dotScaleDown = settings.dot_scale * 0.0015 + 0.01;

    halftoneUniforms.move_offset = settings.mouse_interaction
      ? new Float32Array([
          data.scrollPosition.x * 0.0005 + (data.mousePrev.x * -dotScaleDown) / w,
          data.scrollPosition.y * 0.0005 + (data.mousePrev.y * -dotScaleDown) / h,
        ])
      : new Float32Array([0, 1]);

    const relativeX = (data.mousePrev.x / w - 0.5) * (w / window.innerWidth);
    const relativeY = (data.mousePrev.y / h - 0.5) * (h / window.innerHeight);
    const shiftX = Math.cos((1.6 * relativeY - 0.4 * relativeX) * Math.PI);
    const shiftY = Math.cos(shiftX) * (1.6 * relativeX - 0.4 * relativeY);

    const colorShift = (100 - settings.color_shift) * 0.00075;
    const randOffset = (x: number, y: number) => new Float32Array([x * colorShift * shiftX, y * colorShift * shiftY]);

    halftoneUniforms.c_rand_offset = randOffset(settings.c_rand_offset_x, settings.c_rand_offset_y);
    halftoneUniforms.m_rand_offset = randOffset(settings.m_rand_offset_x, settings.m_rand_offset_y);
    halftoneUniforms.y_rand_offset = randOffset(settings.y_rand_offset_x, settings.y_rand_offset_y);
    separateUniforms.c_rand_offset = randOffset(settings.c_rand_offset_x, settings.c_rand_offset_y);
    separateUniforms.m_rand_offset = randOffset(settings.m_rand_offset_x, settings.m_rand_offset_y);
    separateUniforms.y_rand_offset = randOffset(settings.y_rand_offset_x, settings.y_rand_offset_y);

    halftoneUniforms.imgAspect = w / h;
    halftoneUniforms.c_angle = toRadians(settings.c_rotation) + data.cmykRotSpeed.c * data.counter;
    halftoneUniforms.m_angle = toRadians(settings.m_rotation) + data.cmykRotSpeed.m * data.counter;
    halftoneUniforms.y_angle = toRadians(settings.y_rotation) + data.cmykRotSpeed.y * data.counter;
    halftoneUniforms.k_angle = toRadians(settings.k_rotation) + data.cmykRotSpeed.k * data.counter;
    halftoneUniforms.frequency = (100 - settings.dot_scale) * 1.9 + 10;

    separateUniforms.imgAspect = halftoneUniforms.imgAspect;
    separateUniforms.frequency = halftoneUniforms.frequency;
  };

  const updateMouseOffset = (event?: PointerEvent) => {
    if (!settings.mouse_interaction) return;
    if (event) {
      data.mouseCur = {
        x: event.clientX - data.mouseOffset.left,
        y: event.clientY - data.mouseOffset.top,
      };
    }
    data.mousePrev = {
      x: data.mouseCur.x * 0.05 + data.mousePrev.x * 0.95,
      y: data.mouseCur.y * 0.05 + data.mousePrev.y * 0.95,
    };
    data.mouseCalced = true;
  };

  const updateScrollOffset = () => {
    const scrollTop = window.scrollY * 0.1;
    const scrollLeft = window.scrollX * 0.1;
    if (scrollTop !== 0) data.scrollPosition.y = scrollTop;
    if (scrollLeft !== 0) data.scrollPosition.x = scrollLeft;
  };

  const queueResize = () => {
    const resolution = window.devicePixelRatio;
    let width = host.clientWidth;
    let height = host.clientHeight;
    const pixels = width * resolution * height * resolution;
    const hdPixels = 1920 * 1080 * 3;
    if (pixels > hdPixels) {
      const scaleDown = Math.sqrt(hdPixels / pixels);
      width = Math.ceil(width * scaleDown);
      height = Math.ceil(height * scaleDown);
    }
    if (data.stageSize.w !== width || data.stageSize.h !== height) {
      data.queuedResize = [width, height];
    }
  };

  const draw = () => {
    data.drawFrameId = requestAnimationFrame(() => {
      if (data.queuedResize) {
        const [width, height] = data.queuedResize;
        data.mouseOffset.top = width;
        data.mouseOffset.left = height;
        data.stageSize.w = width;
        data.stageSize.h = height;
        resizeImage();
        renderer.resize(width, height);
        data.queuedResize = null;
      }

      draw();

      data.counter++;
      if (!data.mouseCalced) updateMouseOffset();
      data.mouseCalced = false;

      updateShaderAnimation();
      renderer.render(stageWrapper);
      host.dataset.loaded = "true";
    });
  };

  resizeImage();
  applyShaderValues();
  queueResize();

  const resizeObserver = new ResizeObserver(queueResize);
  resizeObserver.observe(host);
  window.addEventListener("pointermove", updateMouseOffset);
  if (settings.scroll_interaction) window.addEventListener("scroll", updateScrollOffset, { passive: true });

  draw();

  return () => {
    cancelAnimationFrame(data.drawFrameId);
    resizeObserver.disconnect();
    window.removeEventListener("pointermove", updateMouseOffset);
    window.removeEventListener("scroll", updateScrollOffset);
    renderer.destroy(true);
  };
}
