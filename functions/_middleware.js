/**
 * Cloudflare Pages middleware: serves each page as HTML or markdown depending
 * on the request's Accept header. The logic lives in ./lib/negotiation.js.
 *
 * public/_routes.json keeps static assets (images, fonts, feeds) off this
 * Function, so they stay free static requests.
 */
import { negotiate } from './lib/negotiation.js';

export const onRequest = ({ request, env, next }) => negotiate(request, env, next);
