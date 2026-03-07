# Tailwind build & local dev

This project uses Tailwind CSS via the CLI for production builds. Below are minimal steps to build and serve the `public/` folder locally.

1) From the project root directory, install dev dependencies

```bash
cd e:\projects\BLT-Rewards
npm install
```

2) Build Tailwind CSS (one-time production build)

```bash
npm run tailwind:build
```

This generates `public/styles/tailwind.css` from `src/styles/tailwind-input.css` using `tailwind.config.cjs` to purge unused CSS.

3) Watch mode during development

```bash
npm run tailwind:watch
```

This rebuilds `public/styles/tailwind.css` automatically when source files change.

4) Serve `public/` locally (examples)

- Using Live Server (VS Code): open the `public/` folder and start Live Server.
- Using a quick static server (npm):

```bash
npx http-server public -c-1
```

5) Notes

- `public/leaderboard.html` is already updated to reference `styles/tailwind.css` and includes a `favicon.svg`.
- Remove `https://cdn.tailwindcss.com` from production HTML if present (done in `public/leaderboard.html`).
- On Windows, run all commands from the project root (`E:\projects\BLT-Rewards`) in PowerShell or CMD.
- **Important:** Do not run `npm` commands from the `public/` subfolder; always run from the project root where `package.json` is located.

## Troubleshooting

- **"could not determine executable to run"**: Make sure you ran `npm install` first from the project root.
- **"No matching version found for tailwindcss"**: Check `package.json` has a valid Tailwind version (e.g., `^3.4.1`). Update if needed and re-run `npm install`.
- **Run commands from wrong directory**: Commands like `npm run tailwind:build` must be run from the project root where `package.json` lives, not from `public/` or other subfolders.