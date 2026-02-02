let instance: any = null;

interface Dot {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  brightness: number;
  size: number;
}

export function initGridBackground(): void {
  if (instance) return;

  const container = document.getElementById('grid-background');
  if (!container) return;
  if (container.querySelector('canvas')) return;

  instance = createGridScene(container);
}

function createGridScene(container: HTMLElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  container.appendChild(canvas);

  // Config
  const gridSize = 40;
  const dots: Map<string, Dot> = new Map();

  let mouseX = -1000;
  let mouseY = -1000;
  let time = 0;

  // Resize canvas
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initDots();
  }

  // Initialize dots
  function initDots() {
    dots.clear();
    const width = canvas.width;
    const height = canvas.height;

    for (let gx = 0; gx < width + gridSize; gx += gridSize) {
      for (let gy = 0; gy < height + gridSize; gy += gridSize) {
        const key = `${gx},${gy}`;
        dots.set(key, {
          x: gx,
          y: gy,
          baseX: gx,
          baseY: gy,
          brightness: 0,
          size: 1,
        });
      }
    }
  }

  // Animation loop
  function animate() {
    if (!ctx) return;

    time += 0.016; // ~60fps

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and render dots
    dots.forEach((dot) => {
      // Calculate distance to mouse
      const dx = dot.x - mouseX;
      const dy = dot.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Brightness based on distance to mouse
      const maxDist = 200;
      if (dist < maxDist) {
        dot.brightness = 1 - (dist / maxDist);
      } else {
        dot.brightness *= 0.95; // Fade out smoothly
      }

      // Add subtle pulse
      const pulse = Math.sin(time + dist * 0.01) * 0.1;
      const finalBrightness = Math.max(0, Math.min(1, dot.brightness + pulse));

      // Base opacity
      let opacity = 0.15;

      // Add brightness
      opacity += finalBrightness * 0.6;

      // Color: grey to white based on brightness
      const colorValue = Math.floor(130 + finalBrightness * 125);

      // Draw dot
      ctx.fillStyle = `rgba(${colorValue}, ${colorValue}, ${colorValue}, ${opacity})`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw lines between nearby dots
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.1)';
    ctx.lineWidth = 0.5;

    dots.forEach((dot, key) => {
      const [gx, gy] = key.split(',').map(Number);

      // Draw lines to right and bottom neighbors only (avoid duplicates)
      const rightKey = `${gx + gridSize},${gy}`;
      const bottomKey = `${gx},${gy + gridSize}`;

      const rightDot = dots.get(rightKey);
      const bottomDot = dots.get(bottomKey);

      // Line to right
      if (rightDot) {
        const avgBrightness = (dot.brightness + rightDot.brightness) / 2;
        const lineOpacity = 0.1 + avgBrightness * 0.3;
        ctx.strokeStyle = `rgba(150, 150, 150, ${lineOpacity})`;

        ctx.beginPath();
        ctx.moveTo(dot.x, dot.y);
        ctx.lineTo(rightDot.x, rightDot.y);
        ctx.stroke();
      }

      // Line to bottom
      if (bottomDot) {
        const avgBrightness = (dot.brightness + bottomDot.brightness) / 2;
        const lineOpacity = 0.1 + avgBrightness * 0.3;
        ctx.strokeStyle = `rgba(150, 150, 150, ${lineOpacity})`;

        ctx.beginPath();
        ctx.moveTo(dot.x, dot.y);
        ctx.lineTo(bottomDot.x, bottomDot.y);
        ctx.stroke();
      }
    });

    requestAnimationFrame(animate);
  }

  // Event listeners
  const handleResize = () => {
    resize();
  };

  const handleMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };

  const handleMouseLeave = () => {
    mouseX = -1000;
    mouseY = -1000;
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseleave', handleMouseLeave);

  // Initialize
  resize();
  animate();

  return {
    destroy: () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
      instance = null;
    }
  };
}
