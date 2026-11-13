const music = document.getElementById('site-music');
const toggle = document.getElementById('music-off');
const onLabel = document.getElementById('music-on-label');
const offLabel = document.getElementById('music-off-label');
const showreel = document.getElementById('showreel');

if (music && toggle && onLabel && offLabel && showreel) {
  let muted = false;

  function updateControl() {
    toggle.hidden = false;
    const inactive = music.paused;
    toggle.toggleAttribute('data-muted', inactive);
    onLabel.hidden = !inactive;
    offLabel.hidden = inactive;
    toggle.setAttribute('aria-labelledby', inactive ? onLabel.id : offLabel.id);
  }

  function playMusic() {
    if (muted || showreel.open || !music.paused) return;
    // Browsers that block autoplay allow another attempt after a visitor interacts.
    music.play().catch(updateControl);
  }

  toggle.addEventListener('click', () => {
    muted = !music.paused;
    if (muted) music.pause();
    else playMusic();
    updateControl();
  });

  // Keep the showreel's own soundtrack clear.
  new MutationObserver(() => {
    if (showreel.open) music.pause();
  }).observe(showreel, { attributes: true, attributeFilter: ['open'] });
  showreel.addEventListener('close', playMusic);
  document.addEventListener('click', (event) => {
    if (!toggle.contains(event.target)) playMusic();
  });
  document.addEventListener('keydown', playMusic);

  for (const event of ['play', 'pause', 'error']) {
    music.addEventListener(event, updateControl);
  }
  updateControl();
  playMusic();
}
