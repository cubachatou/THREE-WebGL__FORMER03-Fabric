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

// PBR Textures
uniform sampler2D uDiffuseTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uAoRoughMetalTexture;
uniform float uUseDiffuseTexture;
uniform float uUseNormalTexture;
uniform float uUseAoRoughMetalTexture;
uniform float uDiffuseOpacity;
uniform float uNormalStrength;
uniform float uRoughnessStrength;
uniform float uMetalnessStrength;
uniform float uAoStrength;

// Debug visualization modes
uniform float uDebugMode; // 0=off, 1=AO only, 2=Roughness only, 3=Metalness only, 4=Normal

varying float vElevation;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  // Calculate border radius effect (corner clipping for circular shape)
  vec2 centerDist = abs(vUv - 0.5);
  
  // Distance from center to corner
  float cornerDist = length(max(centerDist - vec2(0.5 - uBorderRadius), 0.0));
  
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
  
  // Debug mode check FIRST - show texture channels directly if in debug mode
  if(uDebugMode > 0.5) {
    // Debug modes for AO/Rough/Metal texture
    if(uUseAoRoughMetalTexture > 0.5) {
      vec4 armTexture = texture2D(uAoRoughMetalTexture, vUv);
      
      if(uDebugMode < 1.5) {
        // Show AO only (Red channel)
        finalColor = vec3(armTexture.r);
      } else if(uDebugMode < 2.5) {
        // Show Roughness only (Green channel)
        finalColor = vec3(armTexture.g);
      } else if(uDebugMode < 3.5) {
        // Show Metalness only (Blue channel)
        finalColor = vec3(armTexture.b);
      }
    } else {
      // No texture loaded - show fallback patterns
      if(uDebugMode < 1.5) {
        // Show AO fallback (gradient)
        finalColor = vec3(vUv.x * 0.5 + 0.5);
      } else if(uDebugMode < 2.5) {
        // Show Roughness fallback (gradient)
        finalColor = vec3(vUv.y * 0.5 + 0.5);
      } else if(uDebugMode < 3.5) {
        // Show Metalness fallback (gradient)
        finalColor = vec3((vUv.x + vUv.y) * 0.25 + 0.5);
      }
    }
    
    // Debug mode for Normal texture
    if(uDebugMode > 3.5 && uDebugMode < 4.5) {
      if(uUseNormalTexture > 0.5) {
        vec4 normalColor = texture2D(uNormalTexture, vUv);
        finalColor = normalColor.rgb;
      } else {
        // No normal texture - show UV coordinates as color
        finalColor = vec3(vUv.x, vUv.y, 0.5);
      }
    }
  } else {
    // Normal rendering mode - apply all effects
    
    // Apply diffuse texture if available
    if(uUseDiffuseTexture > 0.5) {
      vec4 diffuseColor = texture2D(uDiffuseTexture, vUv);
      // Mix texture with gradient colors based on diffuse opacity
      // Make this effect much more visible
      finalColor = mix(finalColor, diffuseColor.rgb, uDiffuseOpacity);
      // Add a debug tint to show when diffuse is active
      if(uDiffuseOpacity > 0.1) {
        finalColor.r += 0.1 * uDiffuseOpacity; // Slight red tint to show it's working
      }
    }
    
    // Apply normal map (much more dramatic effect)
    if(uUseNormalTexture > 0.5 && uNormalStrength > 0.0) {
      vec4 normalColor = texture2D(uNormalTexture, vUv);
      
      // Convert normal map to perturbation (from 0-1 to -1 to 1)
      vec3 normalVariation = (normalColor.rgb - 0.5) * 2.0;
      // Apply VERY strong color variation based on normals
      finalColor += normalVariation * 0.5 * uNormalStrength;
      // Also affect brightness dramatically
      float normalInfluence = (normalVariation.b + 1.0) * 0.5; // Use blue channel
      finalColor *= mix(1.0, normalInfluence * 2.0 + 0.3, uNormalStrength);
    }
    
    // Apply AO/Roughness/Metalness texture
    if(uUseAoRoughMetalTexture > 0.5) {
      vec4 armTexture = texture2D(uAoRoughMetalTexture, vUv);
      float ao = armTexture.r;
      float roughness = armTexture.g;
      float metalness = armTexture.b;
      
      // AO: Creates VERY deep shadows in occluded areas
      if(uAoStrength > 0.0) {
        float aoDarkening = mix(1.0, ao * 0.05 + 0.02, uAoStrength); // Even more dramatic
        finalColor *= aoDarkening;
        // Add debug tint
        if(uAoStrength > 0.1) {
          finalColor.b += 0.2 * uAoStrength; // Blue tint to show AO is working
        }
      }
      
      // Roughness: EXTREMELY affects surface brightness
      if(uRoughnessStrength > 0.0) {
        float smoothness = 1.0 - roughness;
        // Smooth = up to 5x brighter, Rough = down to 0.05x brightness
        float roughnessFactor = mix(1.0, pow(smoothness, 1.0) * 5.0 + 0.05, uRoughnessStrength);
        finalColor *= roughnessFactor;
        // Add debug tint
        if(uRoughnessStrength > 0.1) {
          finalColor.g += 0.15 * uRoughnessStrength; // Green tint to show roughness is working
        }
      }
      
      // Metalness: Creates VERY strong metallic appearance
      if(uMetalnessStrength > 0.0 && metalness > 0.01) {
        float metalFactor = metalness * uMetalnessStrength;
        
        // Metallic surfaces are highly reflective
        vec3 metallicTint = vec3(1.5, 1.6, 1.7); // Even stronger cool metallic sheen
        
        // Calculate luminance for desaturation
        float lum = dot(finalColor, vec3(0.299, 0.587, 0.114));
        
        // Metals are highly reflective and desaturated
        vec3 desaturatedColor = mix(finalColor, vec3(lum), metalFactor);
        vec3 metallicColor = desaturatedColor * metallicTint * (4.0 + metalFactor * 3.0);
        
        // Strong blend based on metalness
        finalColor = mix(finalColor, metallicColor, metalFactor);
        
        // Add debug tint
        if(uMetalnessStrength > 0.1) {
          finalColor.r += 0.1 * uMetalnessStrength; // Red tint to show metalness is working
        }
      }
    }
  }
  
  // Calculate depth-based darkening (closer to camera = darker for more natural layering)
  float depth = length(vViewPosition);
  float depthFactor = 1.0 - smoothstep(0.5, 3.0, depth) * uDepthDarkening;
  finalColor *= depthFactor;
  
  // Apply lighting controls (ambient + brightness)
  vec3 ambientLight = uAmbientColor * uAmbientStrength;
  finalColor = finalColor * uBrightness + ambientLight;
  
  // Apply smoother color transitions using smoothstep
  // This reduces harsh color boundaries
  float edgeSmoothness = 0.15;
  float smoothBorder = smoothstep(uBorderRadius - edgeSmoothness, uBorderRadius + edgeSmoothness, cornerDist);
  float smoothBorderFactor = 1.0 - smoothBorder;
  
  // Apply border radius to opacity
  float finalOpacity = uFabricOpacity * smoothBorderFactor;
  
  gl_FragColor = vec4(finalColor, finalOpacity);
}