// ============================================================
// shaders/phong/fragment.glsl
// Phong fragment shader — Person B (Nazrin)
//
// Receives interpolated world-space position and normal from
// the vertex shader, then computes Blinn-Phong lighting
// (ambient + diffuse + specular) per pixel.
//
// This shader serves as a standalone reference / test.
// In production, Teammate A's terrain fragment shader will
// use its own height-based colors with inline lighting.
// ============================================================

precision highp float;

// --- Shared project uniforms (from Day-1 contract) ---
uniform float uTime;
uniform vec2  uResolution;
uniform vec3  uLightPos;
uniform vec3  uCameraPos;

// --- Extra Phong uniforms ---
uniform vec3  uLightColor;
uniform vec3  uAmbientColor;
uniform float uShininess;

// --- Varyings from vertex shader ---
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;

// ---- Ambient component ----
vec3 calcAmbient(vec3 lightColor, vec3 surfaceColor, float ka) {
    return ka * lightColor * surfaceColor;
}

// ---- Diffuse component (Lambertian) ----
vec3 calcDiffuse(vec3 N, vec3 L, vec3 lightColor, vec3 surfaceColor, float kd) {
    float diff = max(dot(N, L), 0.0);
    return kd * diff * lightColor * surfaceColor;
}

// ---- Specular component (Blinn-Phong) ----
vec3 calcSpecular(vec3 N, vec3 L, vec3 V, float shininess, vec3 lightColor, float ks) {
    vec3  H    = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), shininess);
    return ks * spec * lightColor;
}

void main() {
    // Re-normalize after interpolation (GPU interpolates varyings
    // linearly, which can shorten the normal vector)
    vec3 N = normalize(vNormal);

    // Direction toward the light
    vec3 L = normalize(uLightPos - vWorldPosition);

    // Direction toward the camera
    vec3 V = normalize(uCameraPos - vWorldPosition);

    // Default surface color (white).
    // In the real terrain shader, Teammate A replaces this with
    // a height-based color (grass/rock/snow).
    vec3 surfaceColor = vec3(1.0);

    // Material coefficients
    float ka = 0.15;   // ambient strength
    float kd = 0.70;   // diffuse strength
    float ks = 0.50;   // specular strength

    // Three lighting components
    vec3 ambient  = calcAmbient(uAmbientColor, surfaceColor, ka);
    vec3 diffuse  = calcDiffuse(N, L, uLightColor, surfaceColor, kd);
    vec3 specular = calcSpecular(N, L, V, uShininess, uLightColor, ks);

    vec3 litColor = ambient + diffuse + specular;

    // Clamp so bloom pass (Teammate C) gets clean input
    litColor = clamp(litColor, 0.0, 1.0);

    gl_FragColor = vec4(litColor, 1.0);
}
