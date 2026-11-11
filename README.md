# Baddini Portfolio

Site estático do portfólio de BADDINI, com grid de projetos e página interna por projeto.

## Como rodar localmente

1. Abra o terminal na pasta do projeto.
2. Instale o Node 20+.
3. Execute:

```bash
npm install
npm run dev
```

Acesse http://localhost:8000.

## GitHub Pages

1. Vá em Settings → Pages.
2. Em Source, escolha GitHub Actions.
3. Faça push na branch `main`.
4. O workflow do GitHub Pages publicará a pasta estática automaticamente.

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
    "behance": "https://www.behance.net/baddinimotion/slug-do-projeto",
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
- O script `scripts/sync-behance.mjs` tenta buscar projetos públicos de `baddinimotion`.
- Se a API ou o HTML do Behance bloquear a requisição, o script não sobrescreve o JSON e grava um log explicando o motivo.

### Modo local

```bash
npm run sync
```

Esse modo é útil para testar em um computador local antes de commitar as imagens e o JSON atualizado.

## Domínio próprio

O site usa caminhos relativos e não depende de URLs absolutas em `/`. Isso permite hospedar em `https://usuario.github.io/repo/` ou em domínio próprio com a mesma estrutura de arquivos.

## O que precisa ser ajustado manualmente

- E-mail de contato
- LinkedIn
- Seção “Sobre”
- Arquivo `images/the-weirdo.svg`

## Observação sobre o Behance

O Behance pode bloquear ou limitar a coleta automática de dados em servidores de CI ou em ambientes sem autenticação. Quando isso ocorrer, o script preserva os dados atuais e registra o erro em log, em vez de quebrar a publicação.
