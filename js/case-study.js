import { localize, translate } from './language.js';
import { loadProjects, assetPath, escapeHtml as html } from './projects.js';

const root = document.getElementById('case');
const projectId = new URLSearchParams(location.search).get('id') || 'weirdo';
const defaultCover = 'images/brand/Baddini_Avatar_1080x1080.png';
const mascot = {
  id: 'weirdo',
  title: 'The Weirdo',
  category: 'Identidade visual',
  role: 'Ilustração e identidade visual',
  client: 'Baddini Motion',
  cover: 'images/brand/baddini_the_weirdo_1920x1080.svg',
  description: 'O mascote da Baddini Motion em três aplicações da identidade: assinatura, cabeça e avatar.'
};
const variants = [
  ['Assinatura', 'images/brand/baddini-weirdo-transparente.svg'],
  ['Cabeça', 'images/brand/Baddini_Cabeca_Transparente.png'],
  ['Avatar', defaultCover]
];

document.querySelector('[data-year]').textContent = new Date().getFullYear();

function projectPath(id) {
  return './case-study.html?id=' + encodeURIComponent(id);
}

function renderGallery(module) {
  const items = Array.isArray(module.items) ? module.items : [];
  if (!items.length) return '';
  const count = items.length;
  const columns = module.uniform ? Math.min(count, 3) : count === 4 ? 3 : count === 3 ? 2 : Math.min(count, 3);
  const layout = module.uniform ? 'columns-' + columns + ' gallery--uniform' : count === 3 || count === 4 ? 'gallery--mixed' : 'columns-' + columns;
  const media = items.map((item) => {
    const src = html(assetPath(item.src));
    const label = html(item.alt);
    const orientation = html(item.orientation);
    if (item.type === 'image') {
      return `<img src="${src}" alt="${label}" loading="lazy" data-orientation="${orientation}">`;
    }
    return `<video src="${src}" aria-label="${label || 'Animação do projeto'}" data-orientation="${orientation}" autoplay loop muted playsinline preload="metadata"></video>`;
  }).join('');
  return `<div class="project-gallery ${layout}" data-item-count="${count}" style="--gallery-columns:${columns}">${media}</div>`;
}

function renderModule(module) {
  if (!module?.type) return '';
  const src = html(assetPath(module.src));
  switch (module.type) {
    case 'text':
      return `<section class="project-copy"><h2>${html(module.heading)}</h2><p>${html(module.credit)}</p></section>`;
    case 'prose':
      return '<p class="project-prose">' + html(module.text) + '</p>';
    case 'image':
      if (module.title) {
        return '<figure class="project-process"><img src="' + src + '" alt="' + html(module.alt) + '" loading="lazy"><figcaption>' + html(module.title) + '</figcaption></figure>';
      }
      return '<img class="project-still" src="' + src + '" alt="' + html(module.alt) + '" loading="lazy">';
    case 'gallery':
      return renderGallery(module);
    case 'video':
      return `<figure class="project-video"><video src="${src}" poster="${html(assetPath(module.poster))}" controls playsinline preload="metadata"></video>${module.title ? '<figcaption>' + html(module.title) + '</figcaption>' : ''}</figure>`;
    case 'embed':
      return `<iframe class="embed" src="${src}" title="${html(module.title || 'Vídeo do projeto')}" allow="autoplay; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    case 'link':
      return `<p class="project-social-link"><a href="${src}" target="_blank" rel="noopener">${html(module.label || 'Abrir publicação')} ↗</a></p>`;
    default:
      return `<img class="project-still" src="${src}" alt="${html(module.alt)}" loading="lazy">`;
  }
}

function classifyGalleries() {
  root.querySelectorAll('.project-gallery:not(.gallery--uniform)').forEach((gallery) => {
    const items = [...gallery.children];
    const count = items.length;
    const classify = () => {
      const orientations = items.map((media) => {
        let shape = media.dataset.orientation;
        if (!['landscape', 'portrait', 'square'].includes(shape)) {
          const width = media.naturalWidth || media.videoWidth;
          const height = media.naturalHeight || media.videoHeight;
          if (!width || !height) return '';
          const ratio = width / height;
          shape = ratio > 1.05 ? 'landscape' : ratio < .95 ? 'portrait' : 'square';
        }
        media.dataset.shape = shape;
        return shape;
      });
      if ((count !== 3 && count !== 4) || orientations.includes('')) return;
      let layout = 'gallery--mixed';
      if (orientations.every((shape) => shape === 'landscape')) layout = 'gallery--' + count + '-landscape';
      if (orientations.every((shape) => shape === 'portrait')) layout = 'gallery--portrait';
      gallery.className = 'project-gallery ' + layout;
    };
    items.forEach((media) => media.addEventListener(media.tagName === 'IMG' ? 'load' : 'loadedmetadata', classify));
    classify();
  });
}

function renderMascotProcess() {
  return `<section class="case-process"><h2>Da ilustração à marca</h2>
    <ol><li><strong>Silhueta</strong>A forma da cabeça define o recorte do mascote.</li><li><strong>Expressão</strong>Os olhos vermelhos e o traço contrastam com a tipografia.</li><li><strong>Aplicações</strong>A assinatura, a cabeça e o avatar adaptam a identidade a diferentes formatos.</li></ol>
  </section>
  <section class="pose-picker"><h2>Variações do mascote</h2>
    <figure><img id="pose-image" src="${assetPath(variants[0][1])}" alt="The Weirdo — ${variants[0][0]}"></figure>
    <div class="filters mono" role="group" aria-label="Variações do mascote">${variants.map(([label], index) => `<button type="button" data-variant="${index}" aria-pressed="${index === 0}">${label}</button>`).join('')}</div>
  </section>`;
}

function renderProject(project, next) {
  const { title, category, year, client, role, tools, description } = project;
  const isPodkisses = project.layout === 'podkisses';
  root.classList.toggle('is-podkisses', isPodkisses);
  const isDotEnergy = project.layout === 'dot-energy';
  root.classList.toggle('is-dot-energy', isDotEnergy);
  const showBanner = !isPodkisses && !isDotEnergy && project.id !== 'bruno-baddini-portfolio-motion-designer-animator-2d-bruno-baddini-portfolio-motion-designer-animator-2d';
  root.classList.toggle('is-weirdo', project === mascot);
  const specs = [['Função', role], ['Cliente', client], ['Ano', year], ['Ferramentas', tools]].filter(([, value]) => value);
  const modules = Array.isArray(project.modules) ? project.modules : [];
  const link = assetPath(project.behance);
  const content = modules.map(renderModule).join('');
  const updateTitle = () => { document.title = translate(title) + ' — BADDINI'; };
  updateTitle();
  document.addEventListener('baddini:language', updateTitle);
  root.innerHTML = `
    <header class="case-head">
      <p class="section-label mono">${html(category || 'Estudo de caso')}</p>
      <h1>${html(title)}</h1>
      ${description ? '<p>' + html(description) + '</p>' : ''}
      ${showBanner ? `<img class="case-banner" src="${html(assetPath(project.cover || defaultCover))}" alt="${html(title)}">` : ''}
    </header>
    ${specs.length ? '<dl class="case-meta">' + specs.map(([label, value]) => `<div><dt class="mono">${label}</dt><dd>${html(value)}</dd></div>`).join('') + '</dl>' : ''}
    ${project === mascot ? renderMascotProcess() : ''}
    ${content ? '<div class="modules">' + content + '</div>' : ''}
    <nav class="case-foot mono" aria-label="Links do projeto">
      <a href="./index.html#work">← Todos os trabalhos</a>
      ${link ? `<a href="${html(link)}" target="_blank" rel="noopener">Ver no Behance ↗</a>` : ''}
      ${next ? `<a href="${projectPath(next.id)}">Próximo: ${html(next.title)} ↗</a>` : ''}
    </nav>`;
  classifyGalleries();
  const pose = document.getElementById('pose-image');
  const buttons = [...root.querySelectorAll('[data-variant]')];
  let selectedVariant = 0;
  const updatePoseLabel = () => { pose.alt = translate('The Weirdo — ' + variants[selectedVariant][0]); };
  if (pose) document.addEventListener('baddini:language', updatePoseLabel);
  buttons.forEach((button) => button.addEventListener('click', () => {
    selectedVariant = Number(button.dataset.variant);
    pose.src = assetPath(variants[selectedVariant][1]);
    updatePoseLabel();
    buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  }));
}

try {
  const projects = projectId === mascot.id ? [] : await loadProjects();
  const index = projects.findIndex((project) => project.id === projectId);
  if (projectId === mascot.id) renderProject(mascot);
  else if (index >= 0) renderProject(projects[index], projects[index + 1] || mascot);
  else root.innerHTML = '<div class="case-head"><h1>Projeto não encontrado.</h1><p><a href="./index.html#work">Voltar aos trabalhos</a></p></div>';
} catch {
  root.innerHTML = '<div class="case-head"><h1>Projeto indisponível.</h1><p><a href="./index.html#work">Voltar aos trabalhos</a></p></div>';
} finally {
  localize(root);
  root.setAttribute('aria-busy', 'false');
}
