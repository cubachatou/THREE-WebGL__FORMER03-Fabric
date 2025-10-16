// 7 color centers for fabric
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uColor6;
uniform vec3 uColor7;

// Color center positions
uniform vec2 uColorCenter1;
uniform vec2 uColorCenter2;
uniform vec2 uColorCenter3;
uniform vec2 uColorCenter4;
uniform vec2 uColorCenter5;
uniform vec2 uColorCenter6;
uniform vec2 uColorCenter7;

// Color influence radius
uniform float uColorRadius;

// Overall transparency
uniform float uFabricOpacity;

// Border radius effect
uniform float uBorderRadius;

// Depth darkening for natural blending
uniform float uDepthDarkening;

// Lighting controls
uniform float uBrightness;
uniform vec3 uAmbientColor;
uniform float uAmbientStrength;

// Real-time lighting
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform float uSpecularStrength;
uniform float uShininess;

// Environment lighting
uniform sampler2D uEnvironmentMap;
uniform float uUseEnvironmentLighting;
uniform float uEnvironmentIntensity;

// Grain/noise effect
uniform float uGrainStrength;
uniform float uGrainScale;
uniform float uTime;

varying float vElevation;
varying vec2 vUv;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

// Simple noise function for grain effect
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Improved 2D noise
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal noise for more organic grain
float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for(int i = 0; i < 4; i++) {
    value += amplitude * noise(st * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

void main() {
  // Calculate world space position for circular clipping
  // Plane is 2x2 units, UV 0-1 maps to -1 to 1
  vec2 worldPos = (vUv - 0.5) * 2.0;
  float distFromCenter = length(worldPos);
  
  // Map uBorderRadius (0-1) to effective radius (0 to sqrt(2) ≈ 1.414)
  float effectiveRadius = uBorderRadius * 1.414;
  
  // Discard fragments outside the circle
  if (distFromCenter > effectiveRadius) {
    discard;
  }
  
  // Calculate color based on distance from 7 color centers
  vec3 finalColor = vec3(0.0);
  float totalWeight = 0.0;
  
  // Color 1
  float dist1 = distance(vUv, uColorCenter1);
  float weight1 = max(0.0, 1.0 - dist1 / uColorRadius);
  finalColor += uColor1 * weight1;
  totalWeight += weight1;
  
  // Color 2
  float dist2 = distance(vUv, uColorCenter2);
  float weight2 = max(0.0, 1.0 - dist2 / uColorRadius);
  finalColor += uColor2 * weight2;
  totalWeight += weight2;
  
  // Color 3
  float dist3 = distance(vUv, uColorCenter3);
  float weight3 = max(0.0, 1.0 - dist3 / uColorRadius);
  finalColor += uColor3 * weight3;
  totalWeight += weight3;
  
  // Color 4
  float dist4 = distance(vUv, uColorCenter4);
  float weight4 = max(0.0, 1.0 - dist4 / uColorRadius);
  finalColor += uColor4 * weight4;
  totalWeight += weight4;
  
  // Color 5
  float dist5 = distance(vUv, uColorCenter5);
  float weight5 = max(0.0, 1.0 - dist5 / uColorRadius);
  finalColor += uColor5 * weight5;
  totalWeight += weight5;
  
  // Color 6
  float dist6 = distance(vUv, uColorCenter6);
  float weight6 = max(0.0, 1.0 - dist6 / uColorRadius);
  finalColor += uColor6 * weight6;
  totalWeight += weight6;
  
  // Color 7
  float dist7 = distance(vUv, uColorCenter7);
  float weight7 = max(0.0, 1.0 - dist7 / uColorRadius);
  finalColor += uColor7 * weight7;
  totalWeight += weight7;
  
  // Normalize color
  if(totalWeight > 0.0) {
    finalColor /= totalWeight;
  }
  
  // Apply subtle grain/noise texture for fabric realism
  vec2 grainUv = vUv * uGrainScale + uTime * 0.01;
  float grain = fbm(grainUv);
  grain = grain * 2.0 - 1.0; // Remap to -1 to 1
  
  // Apply grain to color with subtle variation
  finalColor += grain * uGrainStrength * 0.15;
  
  // Add elevation-based subtle shading for more depth
  float elevationShade = vElevation * 0.3;
  finalColor *= (1.0 + elevationShade * 0.5);
  
  // Calculate lighting with world normal
  vec3 normal = vWorldNormal;
  vec3 lightDirection = normalize(uLightPosition - vWorldPosition);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  
  // Use double-sided normal for fabric (light both sides)
  vec3 lightingNormal = normal;
  float normalDotLight = dot(lightingNormal, lightDirection);
  
  // If front face is not lit, try back face
  if (normalDotLight < 0.0) {
    lightingNormal = -normal;
    normalDotLight = -normalDotLight;
  }
  
  vec3 totalLight = vec3(0.0);
  
  // Point lighting (only when environment lighting is disabled)
  if (uUseEnvironmentLighting < 0.5) {
    // Diffuse lighting (now works from both sides)
    float diffuse = max(normalDotLight, 0.0);
    vec3 diffuseLight = uLightColor * diffuse * uLightIntensity;
    
    // Specular lighting (Blinn-Phong) - use the correct normal for specular
    vec3 halfwayDir = normalize(lightDirection + viewDirection);
    float specular = pow(max(dot(lightingNormal, halfwayDir), 0.0), uShininess);
    vec3 specularLight = uLightColor * specular * uSpecularStrength * uLightIntensity;
    
    // Combine point light
    totalLight = diffuseLight + specularLight;
  }
  
  // Add environment lighting if enabled
  if (uUseEnvironmentLighting > 0.5) {
    // Sample environment map using reflection vector
    vec3 reflectDir = reflect(-viewDirection, normal);
    vec2 envUV = vec2(
      atan(reflectDir.z, reflectDir.x) / (2.0 * 3.14159) + 0.5,
      acos(reflectDir.y) / 3.14159
    );
    vec3 envColor = texture2D(uEnvironmentMap, envUV).rgb;
    vec3 envLight = envColor * uEnvironmentIntensity;
    totalLight += envLight;
  }
  
  // Apply lighting to the color
  finalColor *= totalLight;
  
  // Calculate depth-based darkening with softer falloff
  float depth = length(vViewPosition);
  float depthFactor = 1.0 - smoothstep(0.3, 4.0, depth) * uDepthDarkening * 0.7;
  
  // Add subtle ambient occlusion based on elevation
  float ao = 1.0 - abs(vElevation) * 0.4;
  ao = smoothstep(0.5, 1.0, ao);
  
  // Combine depth and AO for softer, more natural shadows
  float shadowFactor = depthFactor * ao;
  finalColor *= shadowFactor;
  
  // Apply lighting controls (ambient + brightness) with softer effect
  vec3 ambientLight = uAmbientColor * uAmbientStrength;
  finalColor = finalColor * uBrightness + ambientLight * 0.5;
  
  // Subtle color desaturation in darker areas for realism
  float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
  float desatAmount = (1.0 - shadowFactor) * 0.3;
  finalColor = mix(finalColor, vec3(luminance), desatAmount);
  
  // Clamp to prevent overexposure
  finalColor = clamp(finalColor, 0.0, 1.0);
  
  gl_FragColor = vec4(finalColor, uFabricOpacity);
}