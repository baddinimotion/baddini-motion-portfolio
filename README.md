# Baddini Portfolio

Site estático do portfólio de BADDINI, com lista editorial de projetos e estudos de caso gerados a partir de `projects.json`.

## Como rodar localmente

Abra a pasta do projeto no VS Code e use **Open with Live Server** em `index.html`. Outra opção é executar `npm run dev` e acessar http://localhost:8000. O site não exige instalação de dependências para rodar.

## GitHub Pages

1. Vá em Settings → Pages.
2. Em Source, escolha GitHub Actions.
3. Faça push na branch `main`.
4. O workflow `.github/workflows/deploy.yml` publica a pasta estática automaticamente. Se a fonte acabou de ser ativada, o workflow também pode ser iniciado manualmente pela aba Actions.

## Editar o projects.json à mão

O arquivo `projects.json` usa esta estrutura:

```json
[
  {
    "id": "slug-do-projeto",
    "title": "Título do projeto",
    "category": "Motion Design",
    "year": "2026",
    "client": "Cliente",
    "tools": "After Effects, Premiere Pro",
    "description": "Descrição do projeto",
    "cover": "images/projects/slug-do-projeto/cover.jpg",
    "behance": "https://www.behance.net/brunobaddini/slug-do-projeto",
    "modules": [
      { "type": "image", "src": "images/projects/slug-do-projeto/01.jpg" },
      { "type": "video", "src": "https://player.vimeo.com/video/000000" }
    ],
    "manual": true
  }
]
```

- `manual: true` impede que o script de sincronização sobrescreva aquele projeto.
- Se faltarem dados, deixe o campo vazio e não invente projetos.

## Sincronização do Behance

### Modo automático no GitHub Actions

- O workflow `sync-behance.yml` roda a cada 6 horas e por `workflow_dispatch`.
- O script `scripts/sync-behance.mjs` tenta buscar projetos públicos de `brunobaddini`.
- Se a API ou o HTML do Behance bloquear a requisição, o script não sobrescreve o JSON e grava um log explicando o motivo.

### Modo local

```bash
npm run sync
```

Esse modo é útil para testar em um computador local antes de commitar as imagens e o JSON atualizado.

## Domínio próprio

O site usa caminhos relativos e não depende de URLs absolutas em `/`. Isso permite hospedar em `https://usuario.github.io/repo/` ou em domínio próprio com a mesma estrutura de arquivos.

## O que precisa ser ajustado manualmente

- Conferir os dados de contato e a biografia antes da publicação

## Mapa de assets

| Origem | Uso |
| --- | --- |
| `images/brand/logo-preto.png` e `logo-offwhite.png` | Cabeçalho claro e menu escuro |
| `images/brand/baddini-weirdo-transparente.svg` | Hero e variação de assinatura no estudo de caso The Weirdo |
| `images/brand/baddini_the_weirdo_1920x1080.svg` | Banner de The Weirdo |
| `images/brand/Baddini_Cabeca_Transparente.png` | Banner de contato e variação de cabeça |
| `images/brand/Baddini_Avatar_1080x1080.png` | Favicon, capa de reserva e variação de avatar |
| `videos/baddini-showreel-full.mp4` e `images/hero-poster.jpg` | Player do showreel completo (65 s) e imagem de abertura |
| `projects.json` · `cover`, `description`, metadados e `modules` | Capas na lista, descrições, créditos, GIFs, MP4, galerias e links nas páginas de projeto |
| `videos/hero.mp4` e `videos/hero-mobile.mp4` | Trechos do showreel preservados na pasta de mídia |
| `videos/baddini-showreel-original.mp4` | Fonte local de exportação, ignorada pelo Git por exceder 100 MB |

Os links antigos em `project.html?id=…` continuam a abrir o estudo de caso correspondente.

## Observação sobre o Behance

O Behance pode bloquear ou limitar a coleta automática de dados em servidores de CI ou em ambientes sem autenticação. Quando isso ocorrer, o script preserva os dados atuais e registra o erro em log, em vez de quebrar a publicação.
