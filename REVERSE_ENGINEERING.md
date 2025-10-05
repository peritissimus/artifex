# Homunculus.jp Reverse Engineering Analysis

## Architecture Overview

### Main Classes:
1. **GL_Main** - Core application controller
2. **GL_World** - WebGL world/scene manager
3. **GL_MouseEffect** - Mouse-based particle effects
4. **GL_NoiseSet** - Noise texture generation
5. **GL_ScrollMng** - Scroll management
6. **GL_PageMng** - Page/routing management
7. **GL_Display** - Main display renderer
8. **GL_MfObj** - Mouse follower object (particle spawner)
9. **GL_RingObj** - Individual ring particles

## Key Features

### 1. WebGL Canvas System
- Uses Three.js for WebGL rendering
- Orthographic camera for 2D-like presentation
- Multiple render targets for effects
- Custom shaders for visual effects

### 2. Mouse Particle System
- 50 ring particles that follow mouse movement
- Particles spawn when mouse moves > 4px
- Fade out animation with rotation
- Texture: `assets/image/texture/burash01.png`
- Scale animation: 0.2 → 6.0
- Opacity: 0.9 → 0 (fade out)

### 3. Scroll System
- Smooth scroll interpolation
- Parallax positioning
- Dynamic content show/hide based on viewport
- Top limit handling for fixed positioning

### 4. Project Items
- Grid layout (responsive)
- Hover scale effect (1.0 → 1.1)
- Click transitions with animations
- Position based on scroll

### 5. Shaders Used
- **noise_vtx.js** / **noise_frg.js** - Noise generation
- **state_vtx.js** / **state_frg.js** - State/background
- **title_vtx.js** / **title_frg.js** - Title effects
- **display_vtx.js** / **display_frg.js** - Main display
- **detailImg_vtx.js** / **detailImg_frg.js** - Detail images
- **detailMV_vtx.js** / **detailMV_frg.js** - Detail main visual

### 6. Animation System
- RequestAnimationFrame loop
- Enter frame list pattern
- Beacon pattern for animations
- TweenMax for DOM animations

## Implementation Details

### Mouse Particles (GL_RingObj)
```javascript
- Material: THREE.MeshBasicMaterial with transparency
- Geometry: THREE.PlaneGeometry(64, 64, 1, 1)
- Initial scale: 0.25
- Animation: rotation += 0.02, opacity *= 0.98, scale *= 0.982 + 6 * 0.018
```

### Scroll Smoothing
```javascript
- Uses interpolation: position = position * 0.9 + target * 0.1 (approx)
- Different speeds for different elements
```

### Responsive Breakpoints
- Desktop (> 1200px): 3 columns
- Tablet (400-1200px): 2 columns
- Mobile (< 400px): 1 column

## Technical Stack
- Three.js (WebGL)
- jQuery 3.3.1
- TweenMax (GSAP)
- Custom GLSL shaders
- Useragent detection library
