/**
 * Personal-project lists shared by the HTML pages and their markdown twins,
 * so `/` and `/software` list the same projects in both formats.
 */

import type { CollectionEntry } from 'astro:content';

/** The homepage project deck, in deck order. */
export const featuredProjects = [
  {
    name: 'Stone',
    slug: 'stone',
    description: 'A local-first workspace for notes, meetings, and project memory.',
    blurb: 'Local-first notes and project memory.',
    className: 'project-card--stone',
    mark: 'memory' as const,
  },
  {
    name: 'Turntable',
    slug: 'turntable',
    description: 'A 3D device mockup tool for creating polished product imagery.',
    blurb: '3D mockups for polished product shots.',
    className: 'project-card--turntable',
    mark: 'form' as const,
  },
  {
    name: 'Fitroom',
    slug: 'fitroom',
    description:
      'An AI try-on studio that renders couples in chosen outfits at true relative height.',
    blurb: 'AI outfit try-on for couples.',
    className: 'project-card--fitroom',
    mark: 'fit' as const,
  },
  {
    name: 'Tabbit',
    slug: 'tabbit',
    description: 'An AI browser extension that groups and tidies crowded tab bars.',
    blurb: 'AI tidying for crowded tab bars.',
    className: 'project-card--tabbit',
    mark: 'tabs' as const,
  },
];

/** Card styling for each project on `/software`; only these projects are listed. */
export const softwareCards = {
  stone: { className: 'project-card--stone', mark: 'memory' },
  turntable: { className: 'project-card--turntable', mark: 'form' },
  birdbrain: { className: 'project-card--birdbrain', mark: 'signal' },
  tabbit: { className: 'project-card--tabbit', mark: 'tabs' },
  garatch: { className: 'project-card--garatch', mark: 'pulse' },
  fitroom: { className: 'project-card--fitroom', mark: 'fit' },
  strid: { className: 'project-card--strid', mark: 'strid' },
  kaze: { className: 'project-card--kaze', mark: 'kaze' },
  paperfolio: { className: 'project-card--paperfolio', mark: 'paperfolio' },
  dotfiles: { className: 'project-card--dotfiles', mark: 'dotfiles' },
} as const;

/** Personal projects for `/software`: Stone first, then newest first. */
export function softwareProjects(works: CollectionEntry<'work'>[]): CollectionEntry<'work'>[] {
  return works
    .filter((work) => work.data.kind === 'personal' && work.id in softwareCards)
    .sort((a, b) => {
      if (a.id === 'stone') return -1;
      if (b.id === 'stone') return 1;
      return (b.data.sortDate?.getTime() ?? 0) - (a.data.sortDate?.getTime() ?? 0);
    });
}
