import type { APIRoute } from 'astro';
import { link, markdownDocument, markdownResponse } from '../lib/markdown';

export const GET: APIRoute = () =>
  markdownResponse(
    markdownDocument({
      title: 'The Studio — Kushal Patankar (149.KUSH)',
      description:
        'The artwork of Kushal Patankar (@149.kush): pen-and-ink Inktober drawings, moody digital paintings, and short comics — by an artist who became an engineer.',
      path: '/studio',
      body: [
        'I started with a nib and a straight line. Now I draw systems.',
        'Not a professional — the person who could not put the pen down. Inktober drawings, moody paintings, small comics about the things that are hard to say out loud. The same hand later learned to build software. This is where the line started.',
        '## Pen & ink',
        'Real nib, real paper. The Inktober sketchbook — where a line gets one chance and you learn to mean it before you make it.',
        ...[
          ['Teeth — Inktober 2020, Day 8', '/art/inktober-day8-teeth.jpg'],
          ['Fancy — Inktober 2020, Day 7', '/art/inktober-day7-fancy.jpg'],
        ].map(([title, path]) => `- ${link(title, path)}`),
        '## Paintings & panels',
        'Mostly grey, mostly quiet.',
        ...[
          ['forget. — Digital painting, 2020', '/art/forget.jpg'],
          ['Remember? — Digital painting, 2021', '/art/remember.jpg'],
          ['yellow. — Digital painting, 2020', '/art/yellow.jpg'],
          ['Cards — I — Comic, 2020', '/art/cards1-snow.jpg'],
          ['Ding. — Comic, 2021', '/art/ding.jpg'],
          ['Poof. — Digital, 2020', '/art/poof.jpg'],
          ['Bloop. — Digital, 2021', '/art/bloop.jpg'],
        ].map(([title, path]) => `- ${link(title, path)}`),
        '## Then I became the one at the desk',
        link('Cards — II — Digital painting, 2020', '/art/cards2-desk.jpg'),
        'Somewhere between the drawings I stopped being only the artist and became the person in this painting — headphones on, lit by a screen, building past midnight. The discipline carried over intact: see the finished thing, commit the line, take it to the end.',
        'These days the marks are functions, schemas, and systems that scale. Same hand. Same refusal to leave a line half-drawn.',
        `${link('See the software', '/software')} · ${link('The résumé', '/resume')}`,
        '[More artwork on Instagram](https://instagram.com/149.kush)',
      ],
    })
  );
