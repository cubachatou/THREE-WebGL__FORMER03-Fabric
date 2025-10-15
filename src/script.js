import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import waterVertexFragment from './shaders/water/fragment.glsl'
import waterVertexShader from './shaders/water/vertex.glsl'

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

/**
 * Water
 */
// Geometry
const waterGeometry = new THREE.PlaneGeometry(2, 2, 512, 512)

// 7 Fabric Colors
debugObject.color1 = '#ff6b9d'
debugObject.color2 = '#c651ff'
debugObject.color3 = '#4e9fff'
debugObject.color4 = '#00d4ff'
debugObject.color5 = '#5fffd4'
debugObject.color6 = '#9dff00'
debugObject.color7 = '#00ff88'

// Material
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterVertexFragment,
  transparent: true,
  side: THREE.DoubleSide,
  depthTest: true,
  depthWrite: false,
  blending: THREE.NormalBlending,
  premultipliedAlpha: false,
  uniforms: {
    uTime: { value: 0 },

    uBugWavesElevation: { value: 0.2 },
    uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
    uBigWavesSpeed: { value: 0.5 },

    uSmallWavesElevation: { value: 0.15 },
    uSmallWavesFrequency: { value: 3 },
    uSmallWavesSpeed: { value: 0.15 },
    uSmallWavesIterations: { value: 4 },

    uFabricStiffness: { value: 1.0 },
    uFabricDrape: { value: 0.05 },

    // PBR Textures
    uDiffuseTexture: { value: null },
    uNormalTexture: { value: null },
    uAoRoughMetalTexture: { value: null },
    uUseDiffuseTexture: { value: 0.0 },
    uUseNormalTexture: { value: 0.0 },
    uUseAoRoughMetalTexture: { value: 0.0 },
    uDiffuseOpacity: { value: 1.0 },
    uNormalStrength: { value: 1.0 },
    uRoughnessStrength: { value: 1.0 },
    uMetalnessStrength: { value: 0.0 },
    uAoStrength: { value: 1.0 },
    uDebugMode: { value: 0.0 },

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
    uColorCenter2: { value: new THREE.Vector2(0.5, 0.1) },
    uColorCenter3: { value: new THREE.Vector2(0.9, 0.1) },
    uColorCenter4: { value: new THREE.Vector2(0.25, 0.5) },
    uColorCenter5: { value: new THREE.Vector2(0.75, 0.5) },
    uColorCenter6: { value: new THREE.Vector2(0.3, 0.9) },
    uColorCenter7: { value: new THREE.Vector2(0.7, 0.9) },

    uColorRadius: { value: 0.6 },
    uFabricOpacity: { value: 0.85 },
    uBorderRadius: { value: 0.05 },
    uDepthDarkening: { value: 0.3 },
    
    // Lighting controls that actually affect the shader
    uBrightness: { value: 1.0 },
    uAmbientColor: { value: new THREE.Color('#ffffff') },
    uAmbientStrength: { value: 0.3 }
  }
})

// Debug - Fabric Movement
const fabricFolder = gui.addFolder('Fabric Movement')
fabricFolder.add(waterMaterial.uniforms.uBugWavesElevation, 'value').min(0).max(1).step(0.001).name('Wave Elevation')
fabricFolder.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x').min(0).max(10).step(0.001).name('Wave Frequency X')
fabricFolder.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y').min(0).max(10).step(0.001).name('Wave Frequency Y')
fabricFolder.add(waterMaterial.uniforms.uBigWavesSpeed, 'value').min(0).max(3).step(0.001).name('Wave Speed')
fabricFolder.add(waterMaterial.uniforms.uSmallWavesElevation, 'value').min(0).max(1).step(0.001).name('Ripple Elevation')
fabricFolder.add(waterMaterial.uniforms.uSmallWavesFrequency, 'value').min(0).max(30).step(0.001).name('Ripple Frequency')
fabricFolder.add(waterMaterial.uniforms.uSmallWavesSpeed, 'value').min(0).max(4).step(0.001).name('Ripple Speed')
fabricFolder.add(waterMaterial.uniforms.uSmallWavesIterations, 'value').min(0).max(5).step(1).name('Ripple Iterations')
fabricFolder.add(waterMaterial.uniforms.uFabricStiffness, 'value').min(0).max(2).step(0.01).name('Fabric Stiffness')
fabricFolder.add(waterMaterial.uniforms.uFabricDrape, 'value').min(0).max(0.5).step(0.001).name('Fabric Drape')

// Reset fabric movement
debugObject.resetFabricMovement = () => {
  waterMaterial.uniforms.uBugWavesElevation.value = 0.2
  waterMaterial.uniforms.uBigWavesFrequency.value.set(4, 1.5)
  waterMaterial.uniforms.uBigWavesSpeed.value = 0.5
  waterMaterial.uniforms.uSmallWavesElevation.value = 0.15
  waterMaterial.uniforms.uSmallWavesFrequency.value = 3
  waterMaterial.uniforms.uSmallWavesSpeed.value = 0.15
  waterMaterial.uniforms.uSmallWavesIterations.value = 4
  waterMaterial.uniforms.uFabricStiffness.value = 1.0
  waterMaterial.uniforms.uFabricDrape.value = 0.05
}
fabricFolder.add(debugObject, 'resetFabricMovement').name('Reset Fabric Movement')

// Debug - Appearance
const appearanceFolder = gui.addFolder('Appearance')
appearanceFolder.add(waterMaterial.uniforms.uFabricOpacity, 'value').min(0).max(1).step(0.01).name('Opacity')
appearanceFolder.add(waterMaterial.uniforms.uBorderRadius, 'value').min(0).max(0.5).step(0.001).name('Border Radius')
appearanceFolder.add(waterMaterial.uniforms.uColorRadius, 'value').min(0.1).max(2).step(0.01).name('Color Blend Radius')
appearanceFolder.add(waterMaterial.uniforms.uDepthDarkening, 'value').min(0).max(1).step(0.01).name('Depth Darkening')

// Debug - Lighting & Environment Controls (affects shader directly)
const lightingFolder = gui.addFolder('Lighting & Environment')

// Overall brightness
lightingFolder.add(waterMaterial.uniforms.uBrightness, 'value').min(0).max(3).step(0.1).name('Brightness')

// Ambient lighting
lightingFolder.add(waterMaterial.uniforms.uAmbientStrength, 'value').min(0).max(1).step(0.01).name('Ambient Strength')
debugObject.ambientColor = '#ffffff'
lightingFolder.addColor(debugObject, 'ambientColor').name('Ambient Color')
  .onChange(() => waterMaterial.uniforms.uAmbientColor.value.set(debugObject.ambientColor))

// Background color
lightingFolder.addColor(debugObject, 'backgroundColor').name('Background Color')
  .onChange(() => scene.background.set(debugObject.backgroundColor))

// PBR Texture controls
debugObject.loadDiffuseTexture = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,.exr'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('Loading Diffuse texture:', file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const textureLoader = new THREE.TextureLoader()
        textureLoader.load(
          event.target.result,
          (texture) => {
            console.log('Diffuse texture loaded successfully!', texture)
            waterMaterial.uniforms.uDiffuseTexture.value = texture
            waterMaterial.uniforms.uUseDiffuseTexture.value = 1.0
          },
          undefined,
          (error) => {
            console.error('Error loading Diffuse texture:', error)
          }
        )
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

debugObject.loadNormalTexture = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,.exr'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('Loading Normal texture:', file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const exrLoader = new EXRLoader()
        exrLoader.load(
          event.target.result,
          (texture) => {
            console.log('Normal texture loaded successfully!', texture)
            waterMaterial.uniforms.uNormalTexture.value = texture
            waterMaterial.uniforms.uUseNormalTexture.value = 1.0
          },
          undefined,
          (error) => {
            console.error('Error loading Normal texture:', error)
          }
        )
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

debugObject.loadAoRoughMetalTexture = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,.exr'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('Loading AO/Rough/Metal texture:', file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const exrLoader = new EXRLoader()
        exrLoader.load(
          event.target.result,
          (texture) => {
            console.log('AO/Rough/Metal texture loaded successfully!', texture)
            waterMaterial.uniforms.uAoRoughMetalTexture.value = texture
            waterMaterial.uniforms.uUseAoRoughMetalTexture.value = 1.0
            console.log('Texture uniform set:', waterMaterial.uniforms.uUseAoRoughMetalTexture.value)
          },
          undefined,
          (error) => {
            console.error('Error loading AO/Rough/Metal texture:', error)
          }
        )
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

debugObject.removeDiffuseTexture = () => {
  waterMaterial.uniforms.uDiffuseTexture.value = null
  waterMaterial.uniforms.uUseDiffuseTexture.value = 0.0
}

debugObject.removeNormalTexture = () => {
  waterMaterial.uniforms.uNormalTexture.value = null
  waterMaterial.uniforms.uUseNormalTexture.value = 0.0
}

debugObject.removeAoRoughMetalTexture = () => {
  waterMaterial.uniforms.uAoRoughMetalTexture.value = null
  waterMaterial.uniforms.uUseAoRoughMetalTexture.value = 0.0
}

const texturesFolder = gui.addFolder('Textures')

// Quick load preset textures
debugObject.loadPresetTextures = () => {
  const textureLoader = new THREE.TextureLoader()
  
  console.log('Loading preset textures...')
  
  // Load Diffuse (PNG)
  textureLoader.load(
    './textures/crepe_satin_diff_1k.png',
    (texture) => {
      console.log('Diffuse loaded!')
      waterMaterial.uniforms.uDiffuseTexture.value = texture
      waterMaterial.uniforms.uUseDiffuseTexture.value = 1.0
    },
    undefined,
    (err) => console.error('Diffuse load error:', err)
  )
  
  // Load Normal (PNG)
  textureLoader.load(
    './textures/crepe_satin_nor_dx_1k.png',
    (texture) => {
      console.log('Normal loaded!')
      waterMaterial.uniforms.uNormalTexture.value = texture
      waterMaterial.uniforms.uUseNormalTexture.value = 1.0
    },
    undefined,
    (err) => console.error('Normal load error:', err)
  )
  
  // Load AO/Rough/Metal (PNG - combined texture)
  textureLoader.load(
    './textures/crepe_satin_arm_1k.png',
    (texture) => {
      console.log('AO/Rough/Metal loaded!')
      waterMaterial.uniforms.uAoRoughMetalTexture.value = texture
      waterMaterial.uniforms.uUseAoRoughMetalTexture.value = 1.0
    },
    undefined,
    (err) => {
      console.error('AO/Rough/Metal load error:', err)
      console.log('Skipping AO/Rough/Metal texture - using diffuse and normal only')
    }
  )
}

texturesFolder.add(debugObject, 'loadPresetTextures').name('⚡ Load Preset Textures')

texturesFolder.add(waterMaterial.uniforms.uDiffuseOpacity, 'value').min(0).max(1).step(0.01).name('Diffuse Opacity').listen()

texturesFolder.add(debugObject, 'loadNormalTexture').name('Load Normal Texture')
texturesFolder.add(debugObject, 'removeNormalTexture').name('Remove Normal')
texturesFolder.add(waterMaterial.uniforms.uNormalStrength, 'value').min(0).max(2).step(0.01).name('Normal Strength').listen()

texturesFolder.add(debugObject, 'loadAoRoughMetalTexture').name('Load AO/Rough/Metal')
texturesFolder.add(debugObject, 'removeAoRoughMetalTexture').name('Remove AO/Rough/Metal')
texturesFolder.add(waterMaterial.uniforms.uAoStrength, 'value').min(0).max(1).step(0.01).name('AO Strength').listen()
texturesFolder.add(waterMaterial.uniforms.uRoughnessStrength, 'value').min(0).max(1).step(0.01).name('Roughness Strength').listen()
texturesFolder.add(waterMaterial.uniforms.uMetalnessStrength, 'value').min(0).max(1).step(0.01).name('Metalness Strength').listen()

// Debug visualization modes
debugObject.debugModes = {
  'Off': 0,
  'Show AO Only': 1,
  'Show Roughness Only': 2,
  'Show Metalness Only': 3,
  'Show Normal Map': 4
}
debugObject.currentDebugMode = 'Off'
texturesFolder.add(debugObject, 'currentDebugMode', Object.keys(debugObject.debugModes)).name('Debug View').listen()
  .onChange((value) => {
    const modeValue = debugObject.debugModes[value];
    waterMaterial.uniforms.uDebugMode.value = modeValue;
    console.log('Debug mode changed to:', value, 'value:', modeValue);
    if (value !== 'Off') {
      console.log('⚠️ Debug mode active - texture sliders will not affect appearance until you set Debug View to "Off"');
    }
  })

// Reset appearance
debugObject.resetAppearance = () => {
  waterMaterial.uniforms.uFabricOpacity.value = 0.85
  waterMaterial.uniforms.uBorderRadius.value = 0.05
  waterMaterial.uniforms.uColorRadius.value = 0.6
  waterMaterial.uniforms.uDepthDarkening.value = 0.3
  // Renderer exposure is reset in a separate function after renderer is created
}

// Reset lighting
debugObject.resetLighting = () => {
  waterMaterial.uniforms.uBrightness.value = 1.0
  waterMaterial.uniforms.uAmbientStrength.value = 0.3
  debugObject.ambientColor = '#ffffff'
  waterMaterial.uniforms.uAmbientColor.value.set(debugObject.ambientColor)
  debugObject.backgroundColor = '#000000'
  scene.background.set(debugObject.backgroundColor)
}
lightingFolder.add(debugObject, 'resetLighting').name('Reset Lighting')
appearanceFolder.add(debugObject, 'resetAppearance').name('Reset Appearance')

// Reset textures
debugObject.resetTextures = () => {
  waterMaterial.uniforms.uDiffuseOpacity.value = 1.0
  waterMaterial.uniforms.uNormalStrength.value = 1.0
  waterMaterial.uniforms.uRoughnessStrength.value = 1.0
  waterMaterial.uniforms.uMetalnessStrength.value = 0.0
  waterMaterial.uniforms.uAoStrength.value = 1.0
  waterMaterial.uniforms.uDebugMode.value = 0.0
  debugObject.currentDebugMode = 'Off'
}
texturesFolder.add(debugObject, 'resetTextures').name('Reset Texture Settings')



// Debug - Colors
const colorsFolder = gui.addFolder('Colors')
colorsFolder.addColor(debugObject, 'color1').name('Color 1').onChange(() => waterMaterial.uniforms.uColor1.value.set(debugObject.color1))
colorsFolder.addColor(debugObject, 'color2').name('Color 2').onChange(() => waterMaterial.uniforms.uColor2.value.set(debugObject.color2))
colorsFolder.addColor(debugObject, 'color3').name('Color 3').onChange(() => waterMaterial.uniforms.uColor3.value.set(debugObject.color3))
colorsFolder.addColor(debugObject, 'color4').name('Color 4').onChange(() => waterMaterial.uniforms.uColor4.value.set(debugObject.color4))
colorsFolder.addColor(debugObject, 'color5').name('Color 5').onChange(() => waterMaterial.uniforms.uColor5.value.set(debugObject.color5))
colorsFolder.addColor(debugObject, 'color6').name('Color 6').onChange(() => waterMaterial.uniforms.uColor6.value.set(debugObject.color6))
colorsFolder.addColor(debugObject, 'color7').name('Color 7').onChange(() => waterMaterial.uniforms.uColor7.value.set(debugObject.color7))

// Reset colors
debugObject.resetColors = () => {
  debugObject.color1 = '#ff6b9d'
  debugObject.color2 = '#c651ff'
  debugObject.color3 = '#4e9fff'
  debugObject.color4 = '#00d4ff'
  debugObject.color5 = '#5fffd4'
  debugObject.color6 = '#9dff00'
  debugObject.color7 = '#00ff88'
  waterMaterial.uniforms.uColor1.value.set(debugObject.color1)
  waterMaterial.uniforms.uColor2.value.set(debugObject.color2)
  waterMaterial.uniforms.uColor3.value.set(debugObject.color3)
  waterMaterial.uniforms.uColor4.value.set(debugObject.color4)
  waterMaterial.uniforms.uColor5.value.set(debugObject.color5)
  waterMaterial.uniforms.uColor6.value.set(debugObject.color6)
  waterMaterial.uniforms.uColor7.value.set(debugObject.color7)
}
colorsFolder.add(debugObject, 'resetColors').name('Reset Colors')

// Debug - Color Centers
const centersFolder = gui.addFolder('Color Centers')
centersFolder.add(waterMaterial.uniforms.uColorCenter1.value, 'x').min(0).max(1).step(0.01).name('Center 1 X')
centersFolder.add(waterMaterial.uniforms.uColorCenter1.value, 'y').min(0).max(1).step(0.01).name('Center 1 Y')
centersFolder.add(waterMaterial.uniforms.uColorCenter2.value, 'x').min(0).max(1).step(0.01).name('Center 2 X')
centersFolder.add(waterMaterial.uniforms.uColorCenter2.value, 'y').min(0).max(1).step(0.01).name('Center 2 Y')
centersFolder.add(waterMaterial.uniforms.uColorCenter3.value, 'x').min(0).max(1).step(0.01).name('Center 3 X')
centersFolder.add(waterMaterial.uniforms.uColorCenter3.value, 'y').min(0).max(1).step(0.01).name('Center 3 Y')
centersFolder.add(waterMaterial.uniforms.uColorCenter4.value, 'x').min(0).max(1).step(0.01).name('Center 4 X')
centersFolder.add(waterMaterial.uniforms.uColorCenter4.value, 'y').min(0).max(1).step(0.01).name('Center 4 Y')
centersFolder.add(waterMaterial.uniforms.uColorCenter5.value, 'x').min(0).max(1).step(0.01).name('Center 5 X')
centersFolder.add(waterMaterial.uniforms.uColorCenter5.value, 'y').min(0).max(1).step(0.01).name('Center 5 Y')
centersFolder.add(waterMaterial.uniforms.uColorCenter6.value, 'x').min(0).max(1).step(0.01).name('Center 6 X')
centersFolder.add(waterMaterial.uniforms.uColorCenter6.value, 'y').min(0).max(1).step(0.01).name('Center 6 Y')
centersFolder.add(waterMaterial.uniforms.uColorCenter7.value, 'x').min(0).max(1).step(0.01).name('Center 7 X')
centersFolder.add(waterMaterial.uniforms.uColorCenter7.value, 'y').min(0).max(1).step(0.01).name('Center 7 Y')

// Reset color centers
debugObject.resetColorCenters = () => {
  waterMaterial.uniforms.uColorCenter1.value.set(0.1, 0.1)
  waterMaterial.uniforms.uColorCenter2.value.set(0.5, 0.1)
  waterMaterial.uniforms.uColorCenter3.value.set(0.9, 0.1)
  waterMaterial.uniforms.uColorCenter4.value.set(0.25, 0.5)
  waterMaterial.uniforms.uColorCenter5.value.set(0.75, 0.5)
  waterMaterial.uniforms.uColorCenter6.value.set(0.3, 0.9)
  waterMaterial.uniforms.uColorCenter7.value.set(0.7, 0.9)
}
centersFolder.add(debugObject, 'resetColorCenters').name('Reset Color Centers')

// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = - Math.PI * 0.5
scene.add(water)

// Debug - Object Transform
const transformFolder = gui.addFolder('Object Transform')

// Position controls
transformFolder.add(water.position, 'x').min(-5).max(5).step(0.01).name('Position X')
transformFolder.add(water.position, 'y').min(-5).max(5).step(0.01).name('Position Y')
transformFolder.add(water.position, 'z').min(-5).max(5).step(0.01).name('Position Z')

// Rotation controls (in addition to the initial rotation)
debugObject.rotationX = - Math.PI * 0.5
debugObject.rotationY = 0
debugObject.rotationZ = 0

transformFolder.add(debugObject, 'rotationX').min(-Math.PI).max(Math.PI).step(0.01).name('Rotation X')
  .onChange(() => { water.rotation.x = debugObject.rotationX })
transformFolder.add(debugObject, 'rotationY').min(-Math.PI).max(Math.PI).step(0.01).name('Rotation Y')
  .onChange(() => { water.rotation.y = debugObject.rotationY })
transformFolder.add(debugObject, 'rotationZ').min(-Math.PI).max(Math.PI).step(0.01).name('Rotation Z')
  .onChange(() => { water.rotation.z = debugObject.rotationZ })

// Scale controls
transformFolder.add(water.scale, 'x').min(0.1).max(5).step(0.01).name('Scale X')
transformFolder.add(water.scale, 'y').min(0.1).max(5).step(0.01).name('Scale Y')
transformFolder.add(water.scale, 'z').min(0.1).max(5).step(0.01).name('Scale Z')

// Uniform scale
debugObject.uniformScale = 1
transformFolder.add(debugObject, 'uniformScale').min(0.1).max(5).step(0.01).name('Uniform Scale')
  .onChange(() => {
    water.scale.set(debugObject.uniformScale, debugObject.uniformScale, debugObject.uniformScale)
  })

// Reset transform button
debugObject.resetTransform = () => {
  water.position.set(0, 0, 0)
  water.rotation.set(-Math.PI * 0.5, 0, 0)
  water.scale.set(1, 1, 1)
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
camera.position.set(1, 1, 1)
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
  camera.position.set(1, 1, 1)
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
  renderer.toneMappingExposure = 1.0
  // physicallyCorrectLights was removed in r150+
  if (renderer.physicallyCorrectLights !== undefined) {
    renderer.physicallyCorrectLights = true
  }
  // Use useLegacyLights = false for newer versions
  if (renderer.useLegacyLights !== undefined) {
    renderer.useLegacyLights = false
  }
} catch (e) {
  console.warn('Some renderer properties not available in this Three.js version:', e)
}

// Add tone mapping control to GUI (after renderer is created)
appearanceFolder.add(renderer, 'toneMappingExposure').min(0.5).max(2).step(0.1).name('Exposure')

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

    // Update water
    waterMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()