const headlines = [
  'Building an intelligence layer.',
  'Leading UX teams into a new frontier of design.',
  'Grounding AI in human-centered research.',
  'Researching what matters most.',
  "Judging what's worth shipping.",
  'Designing where the stakes are real.',
];

const headlineElement = document.querySelector('[data-headline]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let headlineIndex = 0;
let cycleTimer;

function setStaticHeadline() {
  window.clearInterval(cycleTimer);
  headlineIndex = 0;

  if (headlineElement) {
    headlineElement.textContent = headlines[headlineIndex];
    headlineElement.classList.remove('is-fading');
  }
}

function startHeadlineCycle() {
  if (!headlineElement || prefersReducedMotion.matches) {
    setStaticHeadline();
    return;
  }

  window.clearInterval(cycleTimer);

  cycleTimer = window.setInterval(() => {
    headlineElement.classList.add('is-fading');

    window.setTimeout(() => {
      headlineIndex = (headlineIndex + 1) % headlines.length;
      headlineElement.textContent = headlines[headlineIndex];
      headlineElement.classList.remove('is-fading');
    }, 420);
  }, 5200);
}

if (headlineElement) {
  startHeadlineCycle();
}

if (typeof prefersReducedMotion.addEventListener === 'function') {
  prefersReducedMotion.addEventListener('change', startHeadlineCycle);
} else if (typeof prefersReducedMotion.addListener === 'function') {
  prefersReducedMotion.addListener(startHeadlineCycle);
}
