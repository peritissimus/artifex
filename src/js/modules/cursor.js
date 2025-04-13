/**
 * Custom cursor functionality
 * Creates and manages the custom cursor behavior
 */

import { passiveListener } from './utils.js';

/**
 * Initialize custom cursor with smooth movement and hover effects
 */
export function initCursor() {
  const cursor = document.querySelector(".cursor");
  
  if (!cursor) return; // Guard clause
  
  // Use RAF for smoother cursor movement
  let cursorX = 0;
  let cursorY = 0;
  let requestId;

  const renderCursor = () => {
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    requestId = requestAnimationFrame(renderCursor);
  };
  
  requestId = requestAnimationFrame(renderCursor);

  // Optimize mousemove with RAF
  document.addEventListener("mousemove", (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
  }, passiveListener);

  // Cursor effects on hover - use event delegation for better performance
  document.addEventListener("mouseover", (e) => {
    const target = e.target;
    if (target.matches("a, button, .project-image")) {
      cursor.classList.add("cursor-hover");
    }
  }, passiveListener);

  document.addEventListener("mouseout", (e) => {
    const target = e.target;
    if (target.matches("a, button, .project-image")) {
      cursor.classList.remove("cursor-hover");
    }
  }, passiveListener);

  // Hide cursor when leaving window
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) {
      cursor.style.opacity = "0";
    }
  }, passiveListener);

  document.addEventListener("mouseover", () => {
    cursor.style.opacity = "1";
  }, passiveListener);
}
