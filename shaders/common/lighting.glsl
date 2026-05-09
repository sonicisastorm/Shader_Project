// ================================================================
// lighting.glsl — shared Phong lighting helpers
// Used by shaders/phong/fragment.glsl and any shader needing lighting.
// ================================================================

vec3 ambientLight(vec3 lightColor, vec3 albedo, float ka) {
    return ka * lightColor * albedo;
}

vec3 diffuseLight(vec3 L, vec3 N, vec3 lightColor, vec3 albedo, float kd) {
    float diff = max(dot(normalize(N), normalize(L)), 0.0);
    return kd * diff * lightColor * albedo;
}

vec3 specularLight(vec3 L, vec3 V, vec3 N, vec3 lightColor, float shininess, float ks) {
    vec3 R    = reflect(-normalize(L), normalize(N));
    float spec = pow(max(dot(normalize(V), R), 0.0), shininess);
    return ks * spec * lightColor;
}

// Full Phong in one call — use this in fragment shaders.
vec3 phong(vec3 L, vec3 V, vec3 N,
           vec3 lightColor, vec3 albedo,
           float ka, float kd, float ks, float shininess) {
    return ambientLight(lightColor, albedo, ka)
         + diffuseLight(L, N, lightColor, albedo, kd)
         + specularLight(L, V, N, lightColor, shininess, ks);
}
