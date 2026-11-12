const music = document.getElementById('site-music');
const toggle = document.getElementById('music-off');
const onLabel = document.getElementById('music-on-label');
const offLabel = document.getElementById('music-off-label');
const showreel = document.getElementById('showreel');

if (music && toggle && onLabel && offLabel && showreel) {
  const storageKey = 'baddini-music-off';
  let muted = false;
  try {
    muted = sessionStorage.getItem(storageKey) === 'true';
  } catch {}

  function updateControl() {
    toggle.hidden = false;
    toggle.toggleAttribute('data-muted', muted);
    onLabel.hidden = !muted;
    offLabel.hidden = muted;
    toggle.setAttribute('aria-labelledby', muted ? onLabel.id : offLabel.id);
  }

  function playMusic() {
    if (muted || showreel.open || !music.paused) return;
    // Browsers that block autoplay allow another attempt after a visitor interacts.
    music.play().catch(() => {});
  }

  toggle.addEventListener('click', () => {
    muted = !muted;
    if (muted) music.pause();
    else playMusic();
    try {
      sessionStorage.setItem(storageKey, String(muted));
    } catch {}
    updateControl();
  });

  // Keep the showreel's own soundtrack clear.
  new MutationObserver(() => {
    if (showreel.open) music.pause();
  }).observe(showreel, { attributes: true, attributeFilter: ['open'] });
  showreel.addEventListener('close', playMusic);
  document.addEventListener('click', playMusic);
  document.addEventListener('keydown', playMusic);

  updateControl();
  playMusic();
}
