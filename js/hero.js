import { translate } from './language.js';

const hero = document.getElementById('home');

if (hero) {
  const header = document.querySelector('.top');
  const stage = hero.querySelector('.hero-pin');
  const runway = hero.querySelector('.hero-runway');
  const film = hero.querySelector('.hero-film');
  const video = hero.querySelector('#hero-video');
  const title = hero.querySelector('#hero-title');
  const lead = hero.querySelector('.hero-lead');
  const playback = hero.querySelector('.hero-video-control');
  const marquee = hero.querySelector('.hero-marquee');
  const ticker = hero.querySelector('.marquee-toggle');
  const mobilePlayback = window.matchMedia('(max-width: 760px), (pointer: coarse)');
  video.defaultMuted = true;
  video.muted = true;
  let frame = 0;
  let inPlaybackZone = false;
  let tickerPaused = false;

  function updateLabels() {
    playback.textContent = translate(video.paused ? 'Reproduzir' : 'Pausar');
    ticker.setAttribute('aria-label', translate(tickerPaused ? 'Retomar faixa' : 'Pausar faixa'));
  }

  function render() {
    frame = 0;
    const bounds = stage.getBoundingClientRect();
    const media = film.getBoundingClientRect();
    const heading = title.getBoundingClientRect();
    const subtitle = lead.getBoundingClientRect();
    const travel = media.height * .6;
    const progress = !travel ? 0 : Math.min(1, Math.max(0, -runway.getBoundingClientRect().top / travel));
    const inset = [
      header.offsetHeight,
      bounds.right - Math.max(heading.right, subtitle.right) - 12,
      media.height - (subtitle.bottom - bounds.top) - 18,
      Math.min(heading.left, subtitle.left) - bounds.left - 12
    ].map((edge) => Math.max(0, edge) * (1 - progress));
    film.style.clipPath = 'inset(' + inset.map((edge) => edge + 'px').join(' ') + ')';
    stage.style.setProperty('--hero-scrim', String(.58 * (1 - progress)));
    stage.style.setProperty('--hero-copy-opacity', String(Math.max(0, 1 - progress * 1.65)));
    stage.classList.toggle('is-film-forward', progress >= .62);

    const startProgress = mobilePlayback.matches ? .75 : 1;
    const shouldPlay = progress >= startProgress && bounds.top >= -media.height * .18 && !document.hidden;
    playback.hidden = !shouldPlay && document.activeElement !== playback;
    if (shouldPlay !== inPlaybackZone) {
      inPlaybackZone = shouldPlay;
      video.autoplay = shouldPlay;
      if (shouldPlay) video.play().catch(updateLabels);
      else video.pause();
    }
  }

  function scheduleRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  playback.addEventListener('click', () => {
    if (video.paused) video.play().catch(updateLabels);
    else {
      video.autoplay = false;
      video.pause();
    }
  });
  playback.addEventListener('blur', scheduleRender);
  video.addEventListener('play', updateLabels);
  video.addEventListener('pause', updateLabels);
  ticker.addEventListener('click', () => {
    tickerPaused = !tickerPaused;
    marquee.classList.toggle('is-paused', tickerPaused);
    ticker.textContent = tickerPaused ? '▶' : 'Ⅱ';
    updateLabels();
  });
  document.addEventListener('baddini:language', () => {
    updateLabels();
    scheduleRender();
  });
  document.addEventListener('visibilitychange', scheduleRender);
  window.addEventListener('scroll', scheduleRender, { passive: true });
  window.addEventListener('resize', scheduleRender);
  const resize = new ResizeObserver(scheduleRender);
  resize.observe(stage);
  resize.observe(title);
  resize.observe(lead);
  resize.observe(header);
  hero.classList.add('has-scroll-film');
  ticker.hidden = false;
  render();
  updateLabels();
}
