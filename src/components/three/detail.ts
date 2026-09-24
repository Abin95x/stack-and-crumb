import * as THREE from "three";

/**
 * Procedural micro-detail for food materials: object-space noise drives colour
 * variation, char, crumb pores, roughness breakup and a bump-mapped normal —
 * no UVs or texture files needed.
 */
export type Detail = {
  /** Noise frequency in object units. */
  scale: number;
  /** Bump height. */
  bump: number;
  /** Colour multipliers at the low and high ends of the noise. */
  tint?: [string, string];
  /** Roughness at low / high noise. */
  rough?: [number, number];
  /** Dark char patches. */
  char?: { color: string; amount: number; threshold: number };
  /** Worley-noise holes, like bread crumb or ground meat. */
  pores?: { amount: number; scale: number; depth?: number };
  /** Squash noise space per axis, e.g. streaky grill marks. */
  stretch?: [number, number, number];
  /** Scale pores by the geometry's `detailMask` attribute (crumb faces only). */
  masked?: boolean;
};

const GLSL_NOISE = /* glsl */ `
vec3 dt_mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 dt_mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 dt_perm(vec4 x){return dt_mod289(((x*34.0)+1.0)*x);}
vec4 dt_taylor(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float dt_snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=dt_mod289(i);
  vec4 p=dt_perm(dt_perm(dt_perm(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=dt_taylor(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
// Band-limited fbm: octaves finer than ~a pixel fade out instead of sparkling.
float dt_fbm(vec3 p, float fw){float s=0.0;float a=0.5;for(int i=0;i<3;i++){s+=a*dt_snoise(p)*(1.0-smoothstep(0.12,0.35,fw));p=p*2.03+17.1;fw*=2.03;a*=0.5;}return s*1.15;}
vec3 dt_hash3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453);}
// 2x2x2 cellular search: jittered points stay inside their cell, so the 8
// cells around p are enough (vs 27 for the textbook version).
float dt_worley(vec3 p){vec3 b=floor(p-0.5);float d=8.0;
  for(int x=0;x<=1;x++)for(int y=0;y<=1;y++)for(int z=0;z<=1;z++){vec3 c=b+vec3(x,y,z);vec3 r=c+0.5+(dt_hash3(c)-0.5)*0.8-p;d=min(d,dot(r,r));}
  return sqrt(d);}
`;

let uid = 0;

export function withDetail<T extends THREE.MeshStandardMaterial>(material: T, d: Detail): T {
  const key = `detail-${uid++}`;
  const tint = d.tint ?? ["#ffffff", "#ffffff"];
  const uniforms = {
    dtScale: { value: d.scale },
    dtBump: { value: d.bump },
    dtTintA: { value: new THREE.Color(tint[0]) },
    dtTintB: { value: new THREE.Color(tint[1]) },
    dtRough: { value: new THREE.Vector2(...(d.rough ?? [-1, -1])) },
    dtChar: { value: new THREE.Color(d.char?.color ?? "#000") },
    dtCharAmt: { value: d.char?.amount ?? 0 },
    dtCharT: { value: d.char?.threshold ?? 1 },
    dtPores: { value: d.pores?.amount ?? 0 },
    dtPoreScale: { value: d.pores?.scale ?? 1 },
    dtPoreDepth: { value: d.pores?.depth ?? 1 },
    dtStretch: { value: new THREE.Vector3(...(d.stretch ?? [1, 1, 1])) },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    if (d.masked) shader.defines = { ...shader.defines, DT_MASKED: "" };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vDtPos;
        #ifdef DT_MASKED
          attribute float detailMask;
          varying float vDtMask;
        #endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vDtPos = position;
        #ifdef USE_INSTANCING
          vDtPos += vec3(float(gl_InstanceID) * 7.31);
        #endif
        #ifdef DT_MASKED
          vDtMask = detailMask;
        #endif`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vDtPos;
        #ifdef DT_MASKED
          varying float vDtMask;
        #endif
        uniform float dtScale, dtBump, dtCharAmt, dtCharT, dtPores, dtPoreScale, dtPoreDepth;
        uniform vec3 dtTintA, dtTintB, dtChar, dtStretch;
        uniform vec2 dtRough;
        ${GLSL_NOISE}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 dtP = vDtPos * dtStretch * dtScale;
        float dtFw = length(fwidth(dtP));
        float dtN = dt_fbm(dtP, dtFw);
        float dtN2 = dt_snoise(dtP * 0.45 + 31.7) * 0.7;
        diffuseColor.rgb *= mix(dtTintA, dtTintB, smoothstep(-0.55, 0.55, dtN));
        float dtC = smoothstep(dtCharT, dtCharT + 0.3, dtN2) * dtCharAmt;
        diffuseColor.rgb = mix(diffuseColor.rgb, dtChar, dtC);
        float dtPoreAmt = dtPores;
        #ifdef DT_MASKED
          dtPoreAmt *= vDtMask;
        #endif
        float dtHole = 0.0;
        if (dtPoreAmt > 0.001) {
          vec3 pp = vDtPos * dtPoreScale;
          float w = dt_worley(pp);
          float fade = 1.0 - smoothstep(0.08, 0.25, length(fwidth(pp)));
          dtHole = (1.0 - smoothstep(0.08, 0.42, w)) * dtPoreAmt * fade;
          diffuseColor.rgb *= 1.0 - dtHole * 0.45;
        }
        float dtHeight = dtN * 0.6 + dtN2 * 0.4 - dtHole * dtPoreDepth + dtC * 0.3;`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        if (dtRough.x >= 0.0) roughnessFactor = mix(dtRough.x, dtRough.y, smoothstep(-0.5, 0.5, dtN2));
        roughnessFactor = clamp(roughnessFactor + dtC * 0.25 + dtHole * 0.2, 0.0, 1.0);`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        {
          vec3 sp = -vViewPosition;
          vec3 sx = dFdx(sp); vec3 sy = dFdy(sp);
          float hx = dFdx(dtHeight) * dtBump; float hy = dFdy(dtHeight) * dtBump;
          vec3 r1 = cross(sy, normal); vec3 r2 = cross(normal, sx);
          float det = dot(sx, r1) * faceDirection;
          vec3 grad = sign(det) * (hx * r1 + hy * r2);
          normal = normalize(abs(det) * normal - grad);
        }`,
      );
  };
  material.customProgramCacheKey = () => key;
  return material;
}
