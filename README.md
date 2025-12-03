# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## AI Compare — Local dev and Cloudflare Worker

This repository was extended with a minimal "AI Compare" demo and a Cloudflare Worker endpoint.

- Frontend: Vite + React (in `src/`) with a small `CompareForm` and `ComparisonCard`.
- Worker: `cloudflare-worker/compare.ts` implements a POST `/api/compare` that calls OpenAI and returns structured JSON.

Quick start (install deps and run dev):

```powershell
npm install
npm run dev
```

Deploy the worker (Cloudflare Wrangler required):

1. Install Wrangler globally: `npm install -g wrangler`.
2. From `cloudflare-worker/` run: `wrangler publish` (you must set secrets first).
3. Add secret: `wrangler secret put OPENAI_API_KEY` and optionally `OPENAI_MODEL`.

The worker expects a secret `OPENAI_API_KEY`. In production set that via Wrangler or Cloudflare dashboard.

Notes:
- The worker calls OpenAI's chat completions API. Adjust the model via `OPENAI_MODEL` or modify the worker code.
- For local dev the frontend posts to `/api/compare`. You can set `VITE_WORKER_URL` in `.env` to point to an externally deployed worker URL.
