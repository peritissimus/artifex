document.addEventListener("DOMContentLoaded", () => {
  const name = document.querySelector(".name");
  const profession = document.querySelector(".profession");

  // Create additional clouds dynamically
  createClouds();

  // Subtle hover effect
  document.body.addEventListener("mousemove", (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;

    name.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
    profession.style.transform = `translate(${x * -10}px, ${y * -10}px)`;
  });
});

// Create additional random clouds
function createClouds() {
  const numberOfClouds = 6;
  const body = document.body;

  for (let i = 0; i < numberOfClouds; i++) {
    const cloud = document.createElement("div");

    cloud.className = "cloud";

    const width = Math.floor(Math.random() * 150) + 100; // 100px to 250px
    const height = Math.floor(width * 0.3);
    const top = Math.floor(Math.random() * 80); // 0% to 80%
    const left = Math.floor(Math.random() * 100); // 0% to 100%
    const duration = Math.floor(Math.random() * 20) + 30; // 30s to 50s
    const delay = Math.floor(Math.random() * 15); // 0s to 15s
    const opacity = Math.random() * 0.4 + 0.4; // 0.4 to 0.8

    cloud.style.cssText = `
      width: ${width}px;
      height: ${height}px;
      top: ${top}%;
      left: ${left - 20}%;
      animation: floatCloud ${duration}s linear infinite;
      animation-delay: -${delay}s;
      opacity: ${opacity};
    `;

    body.appendChild(cloud);
  }
}
