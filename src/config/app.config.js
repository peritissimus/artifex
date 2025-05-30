export const APP_CONFIG = {
  animation: {
    durations: {
      fast: 300,
      medium: 600,
      slow: 1000,
      extraSlow: 1500
    },
    easings: {
      smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      linear: 'linear',
      easeInOut: 'ease-in-out'
    },
    delays: {
      stagger: 100,
      section: 200
    }
  },
  
  layout: {
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1200,
      wide: 1440
    },
    spacing: {
      xs: 8,
      sm: 16,
      md: 24,
      lg: 32,
      xl: 48,
      xxl: 64
    },
    containerWidth: {
      mobile: '100%',
      tablet: '90%',
      desktop: '1200px'
    }
  },
  
  performance: {
    particleCount: {
      mobile: 10,
      desktop: 15,
      high: 25
    },
    debounceTime: {
      scroll: 100,
      resize: 200,
      input: 300
    },
    intersectionThreshold: 0.1,
    lazyLoadOffset: '50px'
  },
  
  cube: {
    size: {
      mobile: 60,
      desktop: 80
    },
    speed: {
      rotation: 0.005,
      drift: 0.02
    },
    colors: {
      primary: '#FFD700',
      secondary: '#0066FF',
      accent: '#FF6B6B'
    }
  },
  
  navigation: {
    sections: ['home', 'projects', 'about', 'skills', 'contact'],
    smoothScrollDuration: 800,
    activeThreshold: 0.5
  }
};

export default APP_CONFIG;