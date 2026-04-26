export type CommandFn = () => string | string[];

export const COMMANDS: Record<string, CommandFn> = {
  help: () => [
    'available commands:',
    '',
    '  whoami      quick intro',
    '  about       longer bio',
    '  work        career timeline',
    '  stack       tech specs',
    '  contact     get in touch',
    '  github      open github',
    '  linkedin    open linkedin',
    '  resume      open resume',
    '  blog        open blog',
    '  clear       clear screen',
  ],
  whoami: () => 'kushal patankar · founding engineer @ zoca · bengaluru, in',
  about: () => [
    'kushal patankar',
    '────────────────',
    'founding engineer & system architect.',
    'currently building next-gen ai products at zoca.',
    '',
    'previously dubverse, brihaspati, simplesound.',
    'iit kharagpur · 4+ companies built · 0→1 specialist.',
  ],
  work: () => [
    'experience:',
    '',
    '  zoca         ·  nov 2024 — now',
    '  dubverse     ·  ai-driven media dubbing',
    '  brihaspati   ·  consumer app',
    '  simplesound  ·  audio synthesis',
    '  catrovacer   ·  callcenter analysis',
  ],
  stack: () => [
    'frontend     react · typescript · html/css/js',
    'backend      python · django · fastapi · nestjs · node',
    'data         postgres · redis · prisma',
    'infra        aws · gcp · docker · terraform · gh actions',
    'mobile       flutter · react-native · dart · firebase',
  ],
  contact: () => [
    'email      149.kush@gmail.com',
    'github     github.com/peritissimus',
    'linkedin   linkedin.com/in/peritissimus',
    'location   bengaluru, ka, india',
  ],
  github: () => {
    window.open('https://github.com/peritissimus', '_blank', 'noopener');
    return 'opening github.com/peritissimus →';
  },
  linkedin: () => {
    window.open('https://linkedin.com/in/peritissimus', '_blank', 'noopener');
    return 'opening linkedin.com/in/peritissimus →';
  },
  blog: () => {
    window.location.href = '/blog';
    return 'navigating to /blog →';
  },
  resume: () => {
    window.open('/resume.pdf', '_blank', 'noopener');
    return 'opening resume.pdf →';
  },
  ls: () => 'about  work  stack  contact  github  linkedin  resume  blog',
  pwd: () => '/home/agent/peritissimus',
  date: () => new Date().toString(),
  exit: () => 'cannot exit · this is home.',
};
