import { eventBus } from './eventBus.js';

export function initProjectInteractions() {
  const projectItems = document.querySelectorAll('.project-list-item');
  
  projectItems.forEach(item => {
    item.addEventListener('click', () => {
      const projectId = item.dataset.project;
      
      // Navigate to individual project page
      if (projectId) {
        window.location.href = `/${projectId}.html`;
      }
    });
  });
}

function getProjectData(projectId) {
  const projectsData = {
    'shikatanakunai': {
      title: '#Shikatanakunai',
      subtitle: '#NotInevitable - Let\'s Defeat',
      description: 'A powerful campaign challenging the notion that negative outcomes are inevitable. This project explores how design and technology can be used to create positive change and challenge defeatist thinking.',
      image: '/project-shikatanakunai.jpg',
      technologies: ['Campaign Design', 'Web Development', 'Social Media', 'Branding'],
      liveUrl: '#',
      githubUrl: '#'
    },
    'yuragi-kabe': {
      title: 'Yuragi Kabe TOU',
      subtitle: 'Bringing Organic Motion',
      description: 'An interactive installation that brings organic, fluid motion to digital spaces. This project explores the intersection of natural movement patterns and digital interfaces.',
      image: '/project-yuragi.jpg',
      technologies: ['Interactive Design', 'Motion Graphics', 'WebGL', 'Three.js'],
      liveUrl: '#',
      githubUrl: '#'
    },
    'hanamurasaki': {
      title: 'HANAMURASAKI',
      subtitle: 'Rebranding a Historic Ryokan',
      description: 'A comprehensive rebranding project for a traditional Japanese inn, bridging centuries-old hospitality traditions with contemporary design sensibilities.',
      image: '/project-hanamurasaki.jpg',
      technologies: ['Branding', 'Web Design', 'Print Design', 'Photography'],
      liveUrl: '#',
      githubUrl: '#'
    },
    'bpass': {
      title: 'Bpass',
      subtitle: 'Digital Exploring New Paths for Resources',
      description: 'A digital platform that helps users discover alternative pathways and resources, emphasizing sustainable and innovative approaches to resource management.',
      image: '/project-bpass.jpg',
      technologies: ['React', 'Node.js', 'Database Design', 'API Development'],
      liveUrl: '#',
      githubUrl: '#'
    },
    'tearoom': {
      title: 'A Tearoom Without Language',
      subtitle: 'Words Are',
      description: 'An experimental space that explores communication beyond words, using design, atmosphere, and sensory experiences to create meaningful connections.',
      image: '/project-tearoom.jpg',
      technologies: ['Spatial Design', 'Experience Design', 'Interactive Media'],
      liveUrl: '#'
    },
    'idea-arena': {
      title: 'IDEA ARENA',
      subtitle: 'A Voting-Based Idea Competition Platform',
      description: 'A democratic platform where ideas compete through community voting, fostering innovation and collective decision-making in creative projects.',
      image: '/project-idea-arena.jpg',
      technologies: ['Vue.js', 'Firebase', 'Real-time Updates', 'Voting Systems'],
      liveUrl: '#',
      githubUrl: '#'
    },
    'amazon-bar': {
      title: 'Amazon Bar',
      subtitle: 'A Bar Without a Menu',
      description: 'An innovative hospitality concept that creates personalized experiences without traditional menus, using conversation and preference discovery.',
      image: '/project-amazon-bar.jpg',
      technologies: ['Experience Design', 'Service Design', 'Customer Journey Mapping'],
      liveUrl: '#'
    },
    'onomatopoeic': {
      title: 'Onomatopoeic Treats',
      subtitle: 'Fun & Delicious',
      description: 'A playful culinary project that translates sound words into edible experiences, exploring the synesthetic relationship between sound and taste.',
      image: '/project-onomatopoeic.jpg',
      technologies: ['Product Design', 'Culinary Arts', 'Branding', 'Photography'],
      liveUrl: '#'
    },
    'space-foodsphere': {
      title: 'SPACE FOODSPHERE',
      subtitle: 'Saving Earth\'s Food from',
      description: 'An ambitious project addressing global food sustainability through innovative space-age solutions and circular economy principles.',
      image: '/project-space-foodsphere.jpg',
      technologies: ['Research', 'Sustainability', 'System Design', 'Innovation'],
      liveUrl: '#'
    },
    'log-flower': {
      title: 'Log Flower',
      subtitle: 'A Digital Plant That Grows with You',
      description: 'An interactive digital companion that evolves based on user behavior and growth, creating a personal connection between humans and digital nature.',
      image: '/project-log-flower.jpg',
      technologies: ['Interactive Design', 'AI/ML', 'Data Visualization', 'Mobile App'],
      liveUrl: '#',
      githubUrl: '#'
    }
  };
  
  return projectsData[projectId] || null;
}