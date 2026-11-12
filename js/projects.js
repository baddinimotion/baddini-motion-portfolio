export async function loadProjects() {
  const response = await fetch(new URL('../projects.json?v=gif-covers', import.meta.url));
  if (!response.ok) throw new Error('Não foi possível carregar projects.json');
  const projects = await response.json();
  return Array.isArray(projects) ? projects.filter((project) => project?.id && project.title) : [];
}

export function assetPath(value) {
  if (!value) return '';
  if (/^https:\/\//i.test(value)) return value;
  if (/^[\w.+-]+:|^\/\//.test(value)) return '';
  return './' + value.replace(/^\.\/|^\//, '');
}

export function escapeHtml(value = '') {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (character) => entities[character]);
}
