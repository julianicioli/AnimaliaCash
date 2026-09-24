# Animalia Cash

Sistema responsivo para gestão e apuração de custos de clínicas veterinárias.

## Desenvolvimento local

Pré-requisito: Node.js.

```bash
npm install
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`.

Cada módulo funciona como uma página HTML independente:

- `http://localhost:3000/banho-tosa.html`
- `http://localhost:3000/cirurgia.html`
- `http://localhost:3000/internacao.html`
- `http://localhost:3000/insumos.html`
- `http://localhost:3000/configuracoes.html`

Isso permite conectar cada tela a um endpoint de backend próprio futuramente.

## Outros comandos

```bash
npm run lint
npm run build
npm run preview
```
