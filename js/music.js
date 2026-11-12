const music = document.getElementById('menu-music');
const turnOff = document.getElementById('music-off');
const offStatus = document.getElementById('music-off-status');
const showreel = document.getElementById('showreel');

if (music && turnOff && offStatus && showreel) {
  const storageKey = 'baddini-music-off';
  let disabled = false;
  try {
    disabled = sessionStorage.getItem(storageKey) === 'true';
  } catch {}

  function updateControl() {
    turnOff.hidden = disabled;
    offStatus.hidden = !disabled;
  }

  function playMusic() {
    if (disabled || showreel.open || !music.paused) return;
    // Browsers that block autoplay allow another attempt after a visitor interacts.
    music.play().catch(() => {});
  }

  turnOff.addEventListener('click', () => {
    disabled = true;
    music.pause();
    try {
      sessionStorage.setItem(storageKey, 'true');
    } catch {}
    updateControl();
    document.querySelector('#site-menu [data-close]')?.focus();
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
