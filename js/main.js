import { localize, translate } from './language.js?v=guts';
import './hero.js?v=guts';
import { loadProjects, assetPath } from './projects.js';

const menu = document.getElementById('site-menu');
const reel = document.getElementById('showreel');
const video = document.getElementById('reel-video');

document.querySelectorAll('[data-year]').forEach((year) => {
  year.textContent = new Date().getFullYear();
});

document.querySelectorAll('[data-open]').forEach((button) => {
  const dialog = document.getElementById(button.dataset.open);
  if (!dialog) return;
  button.addEventListener('click', () => {
    dialog.showModal();
    if (dialog === reel) playReel();
  });
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog || dialog === menu) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menu.close();
  const anchor = link.getAttribute('href');
  if (anchor.startsWith('#')) {
    const section = document.querySelector(anchor);
    section?.setAttribute('tabindex', '-1');
    section?.focus({ preventScroll: true });
  }
}));

document.addEventListener('keydown', (event) => {
  if (!menu || event.key.toLowerCase() !== 'm' || event.repeat || event.altKey ||
      event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable]')) return;
  if (reel?.open) return;
  if (menu.open) menu.close();
  else menu.showModal();
});

async function playReel() {
  try {
    await video.play();
  } catch {
    if (video.error) {
      const message = document.getElementById('reel-status');
      message.hidden = false;
      message.textContent = 'Não foi possível carregar o showreel.';
    }
  }
}

if (reel && video) {
  const play = document.getElementById('reel-toggle');
  const progress = document.getElementById('reel-progress');
  const time = document.getElementById('reel-time');
  const fullscreen = document.getElementById('reel-fullscreen');
  const formatTime = (value) => {
    const seconds = Math.floor(value);
    return [Math.floor(seconds / 60), seconds % 60].map((unit) => String(unit).padStart(2, '0')).join(':');
  };
  const updateControls = () => {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    progress.disabled = !duration;
    progress.max = duration || 1;
    progress.value = video.currentTime;
    time.value = formatTime(video.currentTime) + ' / ' + (duration ? formatTime(duration) : '––:––');
    const label = translate(video.paused ? 'Reproduzir' : 'Pausar');
    if (play.textContent !== label) play.textContent = label;
  };
  document.addEventListener('baddini:language', updateControls);
  video.controls = false;
  reel.querySelector('.reel-controls').hidden = false;
  fullscreen.hidden = !video.requestFullscreen && !video.webkitEnterFullscreen;
  fullscreen.addEventListener('click', () => {
    if (video.requestFullscreen) video.requestFullscreen().catch(() => {});
    else video.webkitEnterFullscreen?.();
  });
  reel.addEventListener('close', () => video.pause());
  play.addEventListener('click', () => video.paused ? playReel() : video.pause());
  progress.addEventListener('input', () => { video.currentTime = Number(progress.value); });
  ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended'].forEach((name) => {
    video.addEventListener(name, updateControls);
  });
}

const list = document.getElementById('projects');

function makeText(tag, className, value) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  return element;
}

function attachPreview() {
  const preview = document.querySelector('.project-preview');
  const image = preview.querySelector('img');
  const canHover = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let activeRow;
  let frame = 0;
  let point;
  const hide = () => {
    activeRow = undefined;
    preview.classList.remove('is-active');
  };
  list.addEventListener('pointermove', (event) => {
    const row = event.target.closest('.project-row');
    if (!row || !canHover.matches || event.pointerType === 'touch') return hide();
    if (activeRow !== row) {
      activeRow = row;
      image.src = row.dataset.cover;
    }
    point = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!activeRow) return;
      preview.classList.add('is-active');
      const width = preview.offsetWidth;
      const height = preview.offsetHeight;
      const { x, y } = point;
      const left = x + width + 28 < innerWidth ? x + 28 : Math.max(10, x - width - 28);
      const top = Math.max(10, Math.min(y - height / 2, innerHeight - height - 10));
      preview.style.setProperty('--x', left + 'px');
      preview.style.setProperty('--y', top + 'px');
      preview.style.setProperty('--cursor-x', (x - left) + 'px');
      preview.style.setProperty('--cursor-y', (y - top) + 'px');
    });
  });
  list.addEventListener('pointerleave', hide);
  window.addEventListener('scroll', hide, { passive: true });
  return hide;
}

async function renderWork() {
  const filters = document.getElementById('filters');
  const status = document.getElementById('projects-status');
  try {
    const projects = await loadProjects();
    if (!projects.length) throw new Error('Lista vazia');
    const hidePreview = attachPreview();
    const rows = projects.map((project, index) => {
      const item = document.createElement('li');
      item.dataset.category = project.category || 'Geral';
      const row = document.createElement('a');
      row.className = 'project-row';
      row.href = './case-study.html?id=' + encodeURIComponent(project.id);
      row.dataset.cover = assetPath(project.cover || 'images/brand/Baddini_Avatar_1080x1080.png');
      const indexLabel = makeText('span', 'mono', String(index + 1).padStart(2, '0'));
      const arrow = makeText('span', 'arrow', '↗');
      indexLabel.setAttribute('aria-hidden', 'true');
      arrow.setAttribute('aria-hidden', 'true');
      row.append(indexLabel, makeText('h3', '', project.title),
        makeText('span', 'project-category mono', item.dataset.category),
        makeText('span', 'project-year mono', project.year || ''), arrow);
      item.append(row);
      return item;
    });
    list.replaceChildren(...rows);
    const categories = [...new Set(rows.map((item) => item.dataset.category))];
    if (categories.length > 1) {
      const buttons = ['Todos', ...categories].map((category, index) => {
        const button = makeText('button', '', category);
        button.type = 'button';
        button.setAttribute('aria-pressed', String(index === 0));
        button.addEventListener('click', () => {
          hidePreview();
          buttons.forEach((filter) => filter.setAttribute('aria-pressed', String(filter === button)));
          rows.forEach((row) => { row.hidden = index > 0 && row.dataset.category !== category; });
        });
        return button;
      });
      filters.replaceChildren(...buttons);
    }
  } catch {
    const fallback = makeText('a', '', 'Ver trabalhos no Behance ↗');
    fallback.href = 'https://www.behance.net/brunobaddini';
    status.replaceChildren('Não foi possível carregar os projetos. ', fallback);
  } finally {
    localize();
    list.setAttribute('aria-busy', 'false');
  }
}

if (list) renderWork();
