import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import gsap from 'gsap'
import fabricVertexFragment from './shaders/fabric/fragment.glsl'
import fabricVertexShader from './shaders/fabric/vertex.glsl'

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 })
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Set background color for scene
debugObject.backgroundColor = '#000000'
scene.background = new THREE.Color(debugObject.backgroundColor)

// Initialize colors
debugObject.ambientColor = '#febebe'
debugObject.lightColor = '#ffffff'

// Light helper variables (global scope)
let lightHelper = null
let lightHelperLine = null

/**
 * Fabric
 */
// Geometry
const fabricGeometry = new THREE.PlaneGeometry(2, 2, 512, 512)

// 7 Fabric Colors
debugObject.color1 = '#d95959'
debugObject.color2 = '#c651ff'
debugObject.color3 = '#4e9fff'
debugObject.color4 = '#ff6bd0'
debugObject.color5 = '#7ab8a8'
debugObject.color6 = '#fbff00'
debugObject.color7 = '#00ff88'

// Material
const fabricMaterial = new THREE.ShaderMaterial({
  vertexShader: fabricVertexShader,
  fragmentShader: fabricVertexFragment,
  transparent: true,
  side: THREE.DoubleSide,
  depthTest: true,
  depthWrite: true,
  blending: THREE.NormalBlending,
  premultipliedAlpha: false,
  uniforms: {
    uTime: { value: 0 },

    uBugWavesElevation: { value: 0.2 },
    uBigWavesFrequency: { value: new THREE.Vector2(3.75,3.75) },
    uBigWavesSpeed: { value: 0.15 },

    uSmallWavesElevation: { value: 0.15 },
    uSmallWavesFrequency: { value: 3 },
    uSmallWavesSpeed: { value: 0.15 },
    uSmallWavesIterations: { value: 2 },

    uFabricStiffness: { value: 1.0 },
    uFabricDrape: { value: 0 },

    // 7 colors
    uColor1: { value: new THREE.Color(debugObject.color1) },
    uColor2: { value: new THREE.Color(debugObject.color2) },
    uColor3: { value: new THREE.Color(debugObject.color3) },
    uColor4: { value: new THREE.Color(debugObject.color4) },
    uColor5: { value: new THREE.Color(debugObject.color5) },
    uColor6: { value: new THREE.Color(debugObject.color6) },
    uColor7: { value: new THREE.Color(debugObject.color7) },

    // Color centers (UV coordinates 0-1)
    uColorCenter1: { value: new THREE.Vector2(0.1, 0.1) },
    uColorCenter2: { value: new THREE.Vector2(0.8, 0.2) },
    uColorCenter3: { value: new THREE.Vector2(0.85, 0.5) },
    uColorCenter4: { value: new THREE.Vector2(0.25, 0.5) },
    uColorCenter5: { value: new THREE.Vector2(0.6, 0.6) },
    uColorCenter6: { value: new THREE.Vector2(0.4, 0.9) },
    uColorCenter7: { value: new THREE.Vector2(0.85, 0.85) },

    uColorRadius: { value: 0.45 },
    uFabricOpacity: { value: 0.9 },
    uBorderRadius: { value: 0.9 },
    uDepthDarkening: { value: 0.5 },
    
    // Lighting controls that actually affect the shader
    uBrightness: { value: 1 },
    uAmbientColor: { value: new THREE.Color('#febebe') },
    uAmbientStrength: { value: 0.3 },
    
    // Real-time lighting
    uLightPosition: { value: new THREE.Vector3(0, 15, 0) },
    uLightColor: { value: new THREE.Color('#ffffff') },
    uLightIntensity: { value: 1.0 },
    uSpecularStrength: { value: 0.5 },
    uShininess: { value: 32.0 },
    
    // Environment lighting
    uEnvironmentMap: { value: null },
    uUseEnvironmentLighting: { value: 0.0 },
    uEnvironmentIntensity: { value: 1.0 },
    
    // Grain/texture effect
    uGrainStrength: { value: 0.3 },
    uGrainScale: { value: 10.0 }
  }
})

// Debug - Fabric Movement
const fabricFolder = gui.addFolder('Fabric Movement')
fabricFolder.close()
fabricFolder.add(fabricMaterial.uniforms.uBugWavesElevation, 'value').min(0).max(1).step(0.001).name('Wave Elevation')
fabricFolder.add(fabricMaterial.uniforms.uBigWavesFrequency.value, 'x').min(0).max(10).step(0.001).name('Wave Frequency X')
fabricFolder.add(fabricMaterial.uniforms.uBigWavesFrequency.value, 'y').min(0).max(10).step(0.001).name('Wave Frequency Y')
fabricFolder.add(fabricMaterial.uniforms.uBigWavesSpeed, 'value').min(0).max(3).step(0.001).name('Wave Speed')
fabricFolder.add(fabricMaterial.uniforms.uSmallWavesElevation, 'value').min(0).max(1).step(0.001).name('Ripple Elevation')
fabricFolder.add(fabricMaterial.uniforms.uSmallWavesFrequency, 'value').min(0).max(30).step(0.001).name('Ripple Frequency')
fabricFolder.add(fabricMaterial.uniforms.uSmallWavesSpeed, 'value').min(0).max(4).step(0.001).name('Ripple Speed')
fabricFolder.add(fabricMaterial.uniforms.uSmallWavesIterations, 'value').min(0).max(5).step(1).name('Ripple Iterations')
fabricFolder.add(fabricMaterial.uniforms.uFabricStiffness, 'value').min(0).max(2).step(0.01).name('Fabric Stiffness')
fabricFolder.add(fabricMaterial.uniforms.uFabricDrape, 'value').min(0).max(0.5).step(0.001).name('Fabric Drape')

// Reset fabric movement
debugObject.resetFabricMovement = () => {
  fabricMaterial.uniforms.uBugWavesElevation.value = 0.2
  fabricMaterial.uniforms.uBigWavesFrequency.value.set(4, 1.5)
  fabricMaterial.uniforms.uBigWavesSpeed.value = 0.5
  fabricMaterial.uniforms.uSmallWavesElevation.value = 0.15
  fabricMaterial.uniforms.uSmallWavesFrequency.value = 3
  fabricMaterial.uniforms.uSmallWavesSpeed.value = 0.15
  fabricMaterial.uniforms.uSmallWavesIterations.value = 4
  fabricMaterial.uniforms.uFabricStiffness.value = 1.0
  fabricMaterial.uniforms.uFabricDrape.value = 0.05
}
fabricFolder.add(debugObject, 'resetFabricMovement').name('Reset Fabric Movement')

// Debug - Appearance
const appearanceFolder = gui.addFolder('Appearance')
appearanceFolder.close()
appearanceFolder.add(fabricMaterial.uniforms.uFabricOpacity, 'value').min(0).max(1).step(0.01).name('Opacity')
appearanceFolder.add(fabricMaterial.uniforms.uBorderRadius, 'value').min(0).max(1).step(0.001).name('Circle Radius')
appearanceFolder.add(fabricMaterial.uniforms.uDepthDarkening, 'value').min(0).max(1).step(0.01).name('Depth Darkening')
appearanceFolder.add(fabricMaterial.uniforms.uGrainStrength, 'value').min(0).max(1).step(0.01).name('Grain Strength')
appearanceFolder.add(fabricMaterial.uniforms.uGrainScale, 'value').min(10).max(200).step(1).name('Grain Scale')

// Debug - Lighting & Environment Controls (affects shader directly)
const lightingFolder = gui.addFolder('Lighting & Environment')
lightingFolder.close()

// Overall brightness
lightingFolder.add(fabricMaterial.uniforms.uBrightness, 'value').min(0).max(3).step(0.1).name('Brightness')

// Ambient lighting
lightingFolder.add(fabricMaterial.uniforms.uAmbientStrength, 'value').min(0).max(1).step(0.01).name('Ambient Strength')
lightingFolder.addColor(debugObject, 'ambientColor').name('Ambient Color')
  .onChange(() => fabricMaterial.uniforms.uAmbientColor.value.set(debugObject.ambientColor))

// Point lighting controls (will be shown/hidden based on environment lighting)
const lightXController = lightingFolder.add(fabricMaterial.uniforms.uLightPosition.value, 'x').min(-15).max(15).step(0.1).name('Light X')
  .onChange(() => updateLightHelper())

const lightYController = lightingFolder.add(fabricMaterial.uniforms.uLightPosition.value, 'y').min(-15).max(15).step(0.1).name('Light Y')
  .onChange(() => updateLightHelper())

const lightZController = lightingFolder.add(fabricMaterial.uniforms.uLightPosition.value, 'z').min(-15).max(15).step(0.1).name('Light Z')
  .onChange(() => updateLightHelper())

const lightIntensityController = lightingFolder.add(fabricMaterial.uniforms.uLightIntensity, 'value').min(0).max(5).step(0.1).name('Light Intensity')

const lightColorController = lightingFolder.addColor(debugObject, 'lightColor').name('Light Color')
  .onChange(() => {
    fabricMaterial.uniforms.uLightColor.value.set(debugObject.lightColor)
    updateLightHelper()
  })

const specularStrengthController = lightingFolder.add(fabricMaterial.uniforms.uSpecularStrength, 'value').min(0).max(2).step(0.01).name('Specular Strength')

const shininessController = lightingFolder.add(fabricMaterial.uniforms.uShininess, 'value').min(1).max(256).step(1).name('Shininess')

// Environment lighting controls
debugObject.useEnvironmentLighting = false
const environmentLightingController = lightingFolder.add(debugObject, 'useEnvironmentLighting').name('Use Environment Lighting')
  .onChange((value) => {
    fabricMaterial.uniforms.uUseEnvironmentLighting.value = value ? 1.0 : 0.0
    
    // Enable/disable point lighting controls based on environment lighting
    if (value) {
      // Disable point lighting controls when environment lighting is active
      lightXController.disable()
      lightYController.disable()
      lightZController.disable()
      lightIntensityController.disable()
      lightColorController.disable()
      specularStrengthController.disable()
      shininessController.disable()
      showLightHelperController.disable()
    } else {
      // Enable point lighting controls when environment lighting is inactive
      lightXController.enable()
      lightYController.enable()
      lightZController.enable()
      lightIntensityController.enable()
      lightColorController.enable()
      specularStrengthController.enable()
      shininessController.enable()
      showLightHelperController.enable()
    }
  })

const environmentIntensityController = lightingFolder.add(fabricMaterial.uniforms.uEnvironmentIntensity, 'value').min(0).max(5).step(0.1).name('Environment Intensity')

// Environment map selection
debugObject.environmentMaps = {
  'None': null,
  'Studio': 'studio',
  'Forest': 'forest', 
  'City': 'city',
  'Sunset': 'sunset',
  'Beach': 'beach',
  'Mountain': 'mountain',
  'Desert': 'desert',
  'Ocean': 'ocean',
  'Night': 'night',
  'Indoor': 'indoor',
  'Warehouse': 'warehouse',
  'Arctic': 'arctic',
  'Tropical': 'tropical'
}
debugObject.currentEnvironment = 'None'
lightingFolder.add(debugObject, 'currentEnvironment', Object.keys(debugObject.environmentMaps)).name('Environment Map')
  .onChange((value) => {
    loadEnvironmentMap(debugObject.environmentMaps[value])
  })

// Custom environment map loader
debugObject.loadCustomEnvironment = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.hdr,.exr'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('Loading custom environment map:', file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        // For simplicity, we'll use a basic loader - in production you'd want proper HDR loading
        console.log('Custom environment loading not fully implemented - use preset maps')
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}
lightingFolder.add(debugObject, 'loadCustomEnvironment').name('Load Custom Environment')

// Light helper controls
debugObject.showLightHelper = false
const showLightHelperController = lightingFolder.add(debugObject, 'showLightHelper').name('Show Light Helper').onChange((value) => {
  if (value) {
    createLightHelper()
  } else {
    removeLightHelper()
  }
})

// Background color
lightingFolder.addColor(debugObject, 'backgroundColor').name('Background Color')
  .onChange(() => scene.background.set(debugObject.backgroundColor))

// Reset appearance
debugObject.resetAppearance = () => {
  fabricMaterial.uniforms.uFabricOpacity.value = 0.85
  fabricMaterial.uniforms.uBorderRadius.value = 1.0
  fabricMaterial.uniforms.uColorRadius.value = 0.6
  fabricMaterial.uniforms.uDepthDarkening.value = 0.3
  // Renderer exposure is reset in a separate function after renderer is created
}

// Reset lighting
debugObject.resetLighting = () => {
  fabricMaterial.uniforms.uBrightness.value = 1.0
  fabricMaterial.uniforms.uAmbientStrength.value = 0.3
  debugObject.ambientColor = '#febebe'
  fabricMaterial.uniforms.uAmbientColor.value.set(debugObject.ambientColor)
  debugObject.backgroundColor = '#000000'
  scene.background.set(debugObject.backgroundColor)
  
  // Reset real-time lighting
  fabricMaterial.uniforms.uLightPosition.value.set(2, 2, 2)
  fabricMaterial.uniforms.uLightIntensity.value = 1.0
  debugObject.lightColor = '#ffffff'
  fabricMaterial.uniforms.uLightColor.value.set(debugObject.lightColor)
  fabricMaterial.uniforms.uSpecularStrength.value = 0.5
  fabricMaterial.uniforms.uShininess.value = 32.0
  
  // Update helper if visible
  updateLightHelper()
}
lightingFolder.add(debugObject, 'resetLighting').name('Reset Lighting')
appearanceFolder.add(debugObject, 'resetAppearance').name('Reset Appearance')

// Debug - Colors
const colorsFolder = gui.addFolder('Colors')
colorsFolder.close()
colorsFolder.add(fabricMaterial.uniforms.uColorRadius, 'value').min(0.1).max(2).step(0.01).name('Color Blend Radius')
colorsFolder.addColor(debugObject, 'color1').name('Color 1').onChange(() => fabricMaterial.uniforms.uColor1.value.set(debugObject.color1))
colorsFolder.add(fabricMaterial.uniforms.uColorCenter1.value, 'x').min(0).max(1).step(0.01).name('Center 1 X')
colorsFolder.add(fabricMaterial.uniforms.uColorCenter1.value, 'y').min(0).max(1).step(0.01).name('Center 1 Y')
colorsFolder.addColor(debugObject, 'color2').name('Color 2').onChange(() => fabricMaterial.uniforms.uColor2.value.set(debugObject.color2))
colorsFolder.add(fabricMaterial.uniforms.uColorCenter2.value, 'x').min(0).max(1).step(0.01).name('Center 2 X')
colorsFolder.add(fabricMaterial.uniforms.uColorCenter2.value, 'y').min(0).max(1).step(0.01).name('Center 2 Y')
colorsFolder.addColor(debugObject, 'color3').name('Color 3').onChange(() => fabricMaterial.uniforms.uColor3.value.set(debugObject.color3))
colorsFolder.add(fabricMaterial.uniforms.uColorCenter3.value, 'x').min(0).max(1).step(0.01).name('Center 3 X')
colorsFolder.add(fabricMaterial.uniforms.uColorCenter3.value, 'y').min(0).max(1).step(0.01).name('Center 3 Y')
colorsFolder.addColor(debugObject, 'color4').name('Color 4').onChange(() => fabricMaterial.uniforms.uColor4.value.set(debugObject.color4))
colorsFolder.add(fabricMaterial.uniforms.uColorCenter4.value, 'x').min(0).max(1).step(0.01).name('Center 4 X')
colorsFolder.add(fabricMaterial.uniforms.uColorCenter4.value, 'y').min(0).max(1).step(0.01).name('Center 4 Y')
colorsFolder.addColor(debugObject, 'color5').name('Color 5').onChange(() => fabricMaterial.uniforms.uColor5.value.set(debugObject.color5))
colorsFolder.add(fabricMaterial.uniforms.uColorCenter5.value, 'x').min(0).max(1).step(0.01).name('Center 5 X')
colorsFolder.add(fabricMaterial.uniforms.uColorCenter5.value, 'y').min(0).max(1).step(0.01).name('Center 5 Y')
colorsFolder.addColor(debugObject, 'color6').name('Color 6').onChange(() => fabricMaterial.uniforms.uColor6.value.set(debugObject.color6))
colorsFolder.add(fabricMaterial.uniforms.uColorCenter6.value, 'x').min(0).max(1).step(0.01).name('Center 6 X')
colorsFolder.add(fabricMaterial.uniforms.uColorCenter6.value, 'y').min(0).max(1).step(0.01).name('Center 6 Y')
colorsFolder.addColor(debugObject, 'color7').name('Color 7').onChange(() => fabricMaterial.uniforms.uColor7.value.set(debugObject.color7))
colorsFolder.add(fabricMaterial.uniforms.uColorCenter7.value, 'x').min(0).max(1).step(0.01).name('Center 7 X')
colorsFolder.add(fabricMaterial.uniforms.uColorCenter7.value, 'y').min(0).max(1).step(0.01).name('Center 7 Y')

// Reset colors
debugObject.resetColors = () => {
  debugObject.color1 = '#d95959'
  debugObject.color2 = '#c651ff'
  debugObject.color3 = '#4e9fff'
  debugObject.color4 = '#ff6bd0'
  debugObject.color5 = '#7ab8a8'
  debugObject.color6 = '#fbff00'
  debugObject.color7 = '#00ff88'
  fabricMaterial.uniforms.uColor1.value.set(debugObject.color1)
  fabricMaterial.uniforms.uColor2.value.set(debugObject.color2)
  fabricMaterial.uniforms.uColor3.value.set(debugObject.color3)
  fabricMaterial.uniforms.uColor4.value.set(debugObject.color4)
  fabricMaterial.uniforms.uColor5.value.set(debugObject.color5)
  fabricMaterial.uniforms.uColor6.value.set(debugObject.color6)
  fabricMaterial.uniforms.uColor7.value.set(debugObject.color7)
}
colorsFolder.add(debugObject, 'resetColors').name('Reset Colors')

// Reset color centers
debugObject.resetColorCenters = () => {
  fabricMaterial.uniforms.uColorCenter1.value.set(0.1, 0.1)
  fabricMaterial.uniforms.uColorCenter2.value.set(0.5, 0.1)
  fabricMaterial.uniforms.uColorCenter3.value.set(0.9, 0.1)
  fabricMaterial.uniforms.uColorCenter4.value.set(0.25, 0.5)
  fabricMaterial.uniforms.uColorCenter5.value.set(0.75, 0.5)
  fabricMaterial.uniforms.uColorCenter6.value.set(0.3, 0.9)
  fabricMaterial.uniforms.uColorCenter7.value.set(0.7, 0.9)
}
colorsFolder.add(debugObject, 'resetColorCenters').name('Reset Color Centers')



// Environment map loader
function loadEnvironmentMap(mapName) {
  if (!mapName) {
    fabricMaterial.uniforms.uEnvironmentMap.value = null
    return
  }

  // Create a simple 2D environment texture
  const texture = createEnvironmentTexture(mapName)
  fabricMaterial.uniforms.uEnvironmentMap.value = texture
}

// Create simple environment textures
function createEnvironmentTexture(type) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Create equirectangular environment map
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
  
  switch (type) {
    case 'studio':
      // Soft studio lighting
      gradient.addColorStop(0, '#606060')
      gradient.addColorStop(0.5, '#808080')
      gradient.addColorStop(1, '#606060')
      break
    case 'forest':
      // Forest environment
      gradient.addColorStop(0, '#1a4d1a')
      gradient.addColorStop(0.3, '#2d6b2d')
      gradient.addColorStop(0.7, '#4a8f4a')
      gradient.addColorStop(1, '#1a4d1a')
      break
    case 'city':
      // Urban environment
      gradient.addColorStop(0, '#2c3e50')
      gradient.addColorStop(0.4, '#34495e')
      gradient.addColorStop(0.6, '#7f8c8d')
      gradient.addColorStop(1, '#2c3e50')
      break
    case 'sunset':
      // Warm sunset
      gradient.addColorStop(0, '#e74c3c')
      gradient.addColorStop(0.3, '#f39c12')
      gradient.addColorStop(0.7, '#f1c40f')
      gradient.addColorStop(1, '#e74c3c')
      break
    case 'beach':
      // Sandy beach
      gradient.addColorStop(0, '#f4d03f')
      gradient.addColorStop(0.4, '#85c1e9')
      gradient.addColorStop(0.8, '#3498db')
      gradient.addColorStop(1, '#f4d03f')
      break
    case 'mountain':
      // Mountain landscape
      gradient.addColorStop(0, '#34495e')
      gradient.addColorStop(0.3, '#7f8c8d')
      gradient.addColorStop(0.7, '#95a5a6')
      gradient.addColorStop(1, '#34495e')
      break
    case 'desert':
      // Desert environment
      gradient.addColorStop(0, '#f39c12')
      gradient.addColorStop(0.4, '#e67e22')
      gradient.addColorStop(0.8, '#d35400')
      gradient.addColorStop(1, '#f39c12')
      break
    case 'ocean':
      // Ocean/deep sea
      gradient.addColorStop(0, '#1b4f72')
      gradient.addColorStop(0.3, '#2e86c1')
      gradient.addColorStop(0.7, '#5dade2')
      gradient.addColorStop(1, '#1b4f72')
      break
    case 'night':
      // Night sky
      gradient.addColorStop(0, '#1a1a2e')
      gradient.addColorStop(0.4, '#16213e')
      gradient.addColorStop(0.8, '#0f3460')
      gradient.addColorStop(1, '#1a1a2e')
      break
    case 'indoor':
      // Indoor lighting
      gradient.addColorStop(0, '#ecf0f1')
      gradient.addColorStop(0.5, '#bdc3c7')
      gradient.addColorStop(1, '#ecf0f1')
      break
    case 'warehouse':
      // Industrial warehouse
      gradient.addColorStop(0, '#34495e')
      gradient.addColorStop(0.3, '#2c3e50')
      gradient.addColorStop(0.7, '#1b2631')
      gradient.addColorStop(1, '#34495e')
      break
    case 'arctic':
      // Arctic/ice environment
      gradient.addColorStop(0, '#d5dbdb')
      gradient.addColorStop(0.4, '#a9cce3')
      gradient.addColorStop(0.8, '#85c1e9')
      gradient.addColorStop(1, '#d5dbdb')
      break
    case 'tropical':
      // Tropical paradise
      gradient.addColorStop(0, '#27ae60')
      gradient.addColorStop(0.3, '#2ecc71')
      gradient.addColorStop(0.7, '#58d68d')
      gradient.addColorStop(1, '#27ae60')
      break
    default:
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(1, '#ffffff')
  }

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Add some variation
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const radius = Math.random() * 100 + 20
    
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(${Math.random() * 50 + 100}, ${Math.random() * 50 + 100}, ${Math.random() * 50 + 100}, 0.1)`
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}


function createLightHelper() {
  if (lightHelper) return // Already exists

  // Create light position indicator (small sphere)
  const lightGeometry = new THREE.SphereGeometry(0.05, 8, 8)
  const lightMaterial = new THREE.MeshBasicMaterial({ 
    color: fabricMaterial.uniforms.uLightColor.value,
    transparent: true,
    opacity: 0.8
  })
  lightHelper = new THREE.Mesh(lightGeometry, lightMaterial)
  lightHelper.position.copy(fabricMaterial.uniforms.uLightPosition.value)
  scene.add(lightHelper)

  // Create line from light to fabric center
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    fabricMaterial.uniforms.uLightPosition.value,
    new THREE.Vector3(0, 0, 0) // Fabric center
  ])
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: fabricMaterial.uniforms.uLightColor.value,
    transparent: true,
    opacity: 0.6
  })
  lightHelperLine = new THREE.Line(lineGeometry, lineMaterial)
  scene.add(lightHelperLine)
}

function removeLightHelper() {
  if (lightHelper) {
    scene.remove(lightHelper)
    lightHelper.geometry.dispose()
    lightHelper.material.dispose()
    lightHelper = null
  }
  if (lightHelperLine) {
    scene.remove(lightHelperLine)
    lightHelperLine.geometry.dispose()
    lightHelperLine.material.dispose()
    lightHelperLine = null
  }
}

function updateLightHelper() {
  if (!lightHelper || !lightHelperLine) return

  // Update light position indicator
  lightHelper.position.copy(fabricMaterial.uniforms.uLightPosition.value)
  lightHelper.material.color.copy(fabricMaterial.uniforms.uLightColor.value)

  // Update line geometry
  const positions = lightHelperLine.geometry.attributes.position.array
  positions[0] = fabricMaterial.uniforms.uLightPosition.value.x
  positions[1] = fabricMaterial.uniforms.uLightPosition.value.y
  positions[2] = fabricMaterial.uniforms.uLightPosition.value.z
  positions[3] = 0 // Fabric center X
  positions[4] = 0 // Fabric center Y
  positions[5] = 0 // Fabric center Z
  lightHelperLine.geometry.attributes.position.needsUpdate = true

  // Update line color
  lightHelperLine.material.color.copy(fabricMaterial.uniforms.uLightColor.value)
}

// Mesh
const fabric = new THREE.Mesh(fabricGeometry, fabricMaterial)
fabric.rotation.x = - Math.PI * 0.5
scene.add(fabric)

// Set initial scale for appearing animation
fabric.scale.setScalar(0)

// Animate fabric appearing with GSAP
gsap.to(fabric.scale, {
  x: 1,
  y: 1,
  z: 1,
  delay: 0.4,
  duration: 7,
  ease: "back.out(1.7)"
})

// Debug - Object Transform
const transformFolder = gui.addFolder('Object Transform')
transformFolder.close()

// Position controls
transformFolder.add(fabric.position, 'x').min(-5).max(5).step(0.01).name('Position X')
transformFolder.add(fabric.position, 'y').min(-5).max(5).step(0.01).name('Position Y')
transformFolder.add(fabric.position, 'z').min(-5).max(5).step(0.01).name('Position Z')

// Rotation controls (in addition to the initial rotation)
debugObject.rotationX = - Math.PI * 0.5
debugObject.rotationY = 0
debugObject.rotationZ = 0

transformFolder.add(debugObject, 'rotationX').min(-Math.PI).max(Math.PI).step(0.01).name('Rotation X')
  .onChange(() => { fabric.rotation.x = debugObject.rotationX })
transformFolder.add(debugObject, 'rotationY').min(-Math.PI).max(Math.PI).step(0.01).name('Rotation Y')
  .onChange(() => { fabric.rotation.y = debugObject.rotationY })
transformFolder.add(debugObject, 'rotationZ').min(-Math.PI).max(Math.PI).step(0.01).name('Rotation Z')
  .onChange(() => { fabric.rotation.z = debugObject.rotationZ })

// Delay GUI scale controls initialization to prevent interference
setTimeout(() => {
  // Scale controls
  transformFolder.add(fabric.scale, 'x').min(0.1).max(5).step(0.01).name('Scale X')
  transformFolder.add(fabric.scale, 'y').min(0.1).max(5).step(0.01).name('Scale Y')
  transformFolder.add(fabric.scale, 'z').min(0.1).max(5).step(0.01).name('Scale Z')

  // Uniform scale
  debugObject.uniformScale = 1
  transformFolder.add(debugObject, 'uniformScale').min(0.1).max(5).step(0.01).name('Uniform Scale')
    .onChange(() => {
      fabric.scale.set(debugObject.uniformScale, debugObject.uniformScale, debugObject.uniformScale)
    })
}, 100)

// Reset transform button
debugObject.resetTransform = () => {
  fabric.position.set(0, 0, 0)
  fabric.rotation.set(-Math.PI * 0.5, 0, 0)
  fabric.scale.set(1, 1, 1)
  debugObject.rotationX = -Math.PI * 0.5
  debugObject.rotationY = 0
  debugObject.rotationZ = 0
  debugObject.uniformScale = 1
}
transformFolder.add(debugObject, 'resetTransform').name('Reset Transform')

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(1.65, 0, 0)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.enablePan = true // Enable right-click panning
controls.enableZoom = true // Enable mouse wheel zoom
controls.enableRotate = true // Enable left-click rotation
controls.minDistance = 0.5 // Minimum zoom distance
controls.maxDistance = 10 // Maximum zoom distance
controls.maxPolarAngle = Math.PI // Allow full rotation
controls.minPolarAngle = 0

// Debug - Camera Controls
const cameraFolder = gui.addFolder('Camera')
cameraFolder.close()

// Camera position (listen to changes)
cameraFolder.add(camera.position, 'x').min(-10).max(10).step(0.1).name('Camera X').listen()
cameraFolder.add(camera.position, 'y').min(-10).max(10).step(0.1).name('Camera Y').listen()
cameraFolder.add(camera.position, 'z').min(-10).max(10).step(0.1).name('Camera Z').listen()

// Field of view
cameraFolder.add(camera, 'fov').min(20).max(120).step(1).name('Field of View')
  .onChange(() => { camera.updateProjectionMatrix() })

// OrbitControls target (what the camera looks at)
cameraFolder.add(controls.target, 'x').min(-5).max(5).step(0.1).name('Target X').listen()
cameraFolder.add(controls.target, 'y').min(-5).max(5).step(0.1).name('Target Y').listen()
cameraFolder.add(controls.target, 'z').min(-5).max(5).step(0.1).name('Target Z').listen()

// Reset camera button
debugObject.resetCamera = () => {
  camera.position.set(3, 0, 0)
  camera.fov = 75
  camera.updateProjectionMatrix()
  controls.target.set(0, 0, 0)
  controls.update()
}
cameraFolder.add(debugObject, 'resetCamera').name('Reset Camera')

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Enable sRGB encoding and tone mapping for more natural color blending
try {
  // Three.js r152+ uses outputColorSpace instead of outputEncoding
  if (renderer.outputColorSpace !== undefined) {
    renderer.outputColorSpace = THREE.SRGBColorSpace
  } else {
    renderer.outputEncoding = THREE.sRGBEncoding
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  // physicallyCorrectLights was removed in r150+
  if (renderer.physicallyCorrectLights !== undefined) {
    renderer.physicallyCorrectLights = true
  }
  // Use useLegacy.s = false for newer versions
  if (renderer.useLegacyLights !== undefined) {
    renderer.useLegacyLights = false
  }
} catch (e) {
  console.warn('Some renderer properties not available in this Three.js version:', e)
}

// Add renderer reset function to the existing reset appearance
const originalResetAppearance = debugObject.resetAppearance
debugObject.resetAppearance = () => {
  originalResetAppearance()
  renderer.toneMappingExposure = 1.0
}

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update fabric
    fabricMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()