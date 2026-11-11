import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const jsonPath = path.join(projectRoot, 'projects.json');
const imagesRoot = path.join(projectRoot, 'images', 'projects');
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 BaddiniSync/1.0';
const RATE_LIMIT_MS = 1000;

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw new Error(`Falha ao ler ${filePath}: ${error.message}`);
  }
}

async function persistJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': userAgent,
      'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ao acessar ${url}`);
  }

  return response.text();
}

function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120) || 'projeto';
}

function sanitizeUrl(value) {
  if (!value) return '';
  return value.trim().replace(/\?.*$/, '');
}

function extractProjectLinks(html) {
  const found = [...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map(([, href]) => {
    let url;
    try {
      url = new URL(href, 'https://www.behance.net');
    } catch {
      return '';
    }

    if (url.hostname !== 'www.behance.net' || !/^\/gallery\/\d+(?:\/|$)/i.test(url.pathname)) {
      return '';
    }

    return `${url.origin}${url.pathname}`;
  });

  return [...new Set(found.filter(Boolean))];
}

function extractProfileProjects(html) {
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']*\/gallery\/\d+[^"']*)["'][^>]*>/gi)];
  const projects = [];
  const seen = new Set();

  for (const match of anchors) {
    const projectUrl = new URL(match[1], 'https://www.behance.net').href;
    if (seen.has(projectUrl)) continue;
    seen.add(projectUrl);

    const titleMatch = match[0].match(/\btitle=["'](?:Link to project|Link para o projeto) - ([^"']+)/i);
    const previousHtml = html.slice(Math.max(0, match.index - 12000), match.index);
    const imageTags = [...previousHtml.matchAll(/<img\b[^>]*class=["'][^"']*ProjectCoverNeue-image[^"']*["'][^>]*>/gi)];
    const imageTag = imageTags.at(-1)?.[0] || '';
    const coverMatch = imageTag.match(/\bsrc=["']([^"']+)/i);

    projects.push({
      url: projectUrl,
      title: titleMatch ? titleMatch[1].replace(/&amp;/g, '&').trim() : '',
      cover: coverMatch ? coverMatch[1] : ''
    });
  }

  return projects;
}

function repairMojibake(value) {
  if (!/[ÃÂ]/.test(value)) return value;
  const repaired = Buffer.from(value, 'latin1').toString('utf8');
  return repaired.includes('\uFFFD') ? value : repaired;
}

function extractMeta(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1].replace(/&amp;/g, '&').trim();
    }
  }

  return '';
}

function extractTitle(html, fallbackUrl) {
  const title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title');
  if (title) return title.replace(/\s*\|\s*Behance.*$/i, '').trim();

  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (match) return match[1].replace(/\s*\|\s*Behance.*$/i, '').trim();

  return fallbackUrl.split('/').filter(Boolean).pop() || 'Projeto sem título';
}

function extractDescription(html) {
  return extractMeta(html, 'og:description') || extractMeta(html, 'description') || '';
}

function extractCategory(html) {
  const category = extractMeta(html, 'article:section') || extractMeta(html, 'product:brand');
  if (category) return category.trim();

  const match = html.match(/"category":"([^"]+)"/i) || html.match(/<span[^>]*>\s*Categoria\s*<\/span>\s*<span[^>]*>([^<]+)<\/span>/i);
  return match ? (match[1] || '').trim() : '';
}

function extractCover(html, fallback = '') {
  const matches = [...html.matchAll(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?[^\s"'<>]*)?/gi)];
  if (!matches.length) return fallback;

  const candidates = matches.map((match) => match[0]);
  return candidates.find((candidate) => !candidate.includes('behance.net') || candidate.includes('img')) || candidates[0];
}

async function downloadAsset(url, targetPath) {
  const response = await fetch(url, {
    headers: { 'user-agent': userAgent }
  });

  if (!response.ok) {
    throw new Error(`Erro ao baixar asset ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, buffer);
  return targetPath;
}

function buildModulesFromHtml(html) {
  const modules = [];

  const imgMatches = [...html.matchAll(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?[^\s"'<>]*)?/gi)];
  for (const match of imgMatches) {
    const src = match[0].replace(/\?.*$/, '');
    if (!src) continue;
    modules.push({ type: 'image', src });
  }

  const vimeoPatterns = [
    /https?:\/\/player\.vimeo\.com\/video\/\d+/gi,
    /https?:\/\/vimeo\.com\/(\d+)/gi,
    /https?:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]+)/gi,
    /https?:\/\/youtu\.be\/([A-Za-z0-9_-]+)/gi
  ];

  for (const pattern of vimeoPatterns) {
    const found = html.match(pattern);
    if (found) {
      modules.push({ type: 'embed', src: found[0] });
    }
  }

  return modules.slice(0, 12);
}

async function syncBehanceProjects() {
  const existingProjects = await readJsonFile(jsonPath);
  const safeExisting = Array.isArray(existingProjects) ? existingProjects : [];

  const baseUrl = 'https://www.behance.net/brunobaddini';
  const profileHtml = await fetchText(baseUrl);
  const profileProjects = extractProfileProjects(profileHtml);
  const projectLinks = profileProjects.length ? profileProjects.map((project) => project.url) : extractProjectLinks(profileHtml);

  if (!projectLinks.length) {
    throw new Error('Nenhum projeto público encontrado no perfil do Behance. O HTML do perfil não expôs links válidos.');
  }

  const collected = [];

  for (const link of projectLinks.slice(0, 10)) {
    await delay(RATE_LIMIT_MS);

    try {
      const profileProject = profileProjects.find((project) => project.url === link);
      let html = '';
      try {
        html = await fetchText(link);
      } catch (error) {
        console.warn(`[sync] Detalhes bloqueados para ${link}: ${error.message}. Usando os dados públicos do perfil.`);
      }

      const projectUrl = sanitizeUrl(link);
      const title = repairMojibake(html ? extractTitle(html, projectUrl) : profileProject?.title || '');
      const description = html ? extractDescription(html) : '';
      const publishedAt = html ? extractMeta(html, 'article:published_time') : '';
      const year = publishedAt ? new Date(publishedAt).getFullYear().toString() : '';
      const category = (html ? extractCategory(html) : '') || 'Motion Design';
      const slug = normalizeSlug(`${title}-${projectUrl.split('/').filter(Boolean).pop() || 'projeto'}`);

      if (!title || title.toLowerCase().includes('behance')) {
        continue;
      }

      const existingProject = safeExisting.find((project) => project && project.behance === projectUrl);
      const existingManual = existingProject && existingProject.manual === true ? existingProject : null;
      if (existingManual) {
        collected.push(existingManual);
        continue;
      }

      const coverUrl = extractCover(html, profileProject?.cover || 'images/brand/Baddini_Avatar_1080x1080.png');
      const safeCover = sanitizeUrl(coverUrl);
      const fileExtension = safeCover.includes('.png') ? '.png' : safeCover.includes('.webp') ? '.webp' : safeCover.includes('.gif') ? '.gif' : safeCover.includes('.jpeg') ? '.jpeg' : '.jpg';
      const localCoverName = `cover${fileExtension}`;
      const localCoverPath = path.join(imagesRoot, slug, localCoverName);
      const localCoverRelative = `images/projects/${slug}/${localCoverName}`;

      try {
        await downloadAsset(safeCover, localCoverPath);
      } catch (assetError) {
        console.warn(`[sync] Não foi possível baixar a capa de ${title}: ${assetError.message}`);
      }

      const modules = html ? buildModulesFromHtml(html) : [];
      const normalizedModules = modules.map((module, index) => {
        const src = sanitizeUrl(module.src);
        if (!src) return null;
        return {
          type: module.type || 'image',
          src: src.startsWith('http') ? src : `images/projects/${slug}/${index + 1}${path.extname(src) || '.jpg'}`
        };
      }).filter(Boolean);

      if (!normalizedModules.length && safeCover) {
        normalizedModules.push({ type: 'image', src: localCoverRelative });
      }

      const project = {
        id: slug,
        title,
        category,
        year,
        client: '',
        tools: '',
        description: description || '',
        cover: localCoverRelative,
        behance: projectUrl,
        modules: normalizedModules,
        ...(existingProject && existingProject.external ? { external: true } : {})
      };

      if (!project.title || !project.behance || !project.cover) {
        continue;
      }

      collected.push(project);
    } catch (error) {
      console.warn(`[sync] Projeto ignorado: ${link} -> ${error.message}`);
    }
  }

  const merged = [...safeExisting.filter((item) => item && item.manual === true), ...collected];

  if (!merged.length) {
    throw new Error('Nenhum projeto válido foi coletado. O arquivo atual foi preservado.');
  }

  await persistJson(jsonPath, merged);
  console.log(`[sync] ${merged.length} projeto(s) sincronizados com sucesso em ${jsonPath}`);
}

try {
  await syncBehanceProjects();
} catch (error) {
  console.error('\n[sync] Falha ao sincronizar com o Behance.');
  console.error(error.message);
  console.error('O arquivo projects.json foi mantido sem alterações.');
  process.exitCode = 1;
}
