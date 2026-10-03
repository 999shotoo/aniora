# Aniora

<p align="center">
  <strong>A focused anime streaming experience built for people who want to watch, track, and get back to the story.</strong>
</p>

<p align="center">
  <a href="https://aniora.qzz.io">Live site</a>
  ·
  <a href="https://github.com/999shotoo/anilist-dream-stream/issues">Report an issue</a>
</p>

Aniora is a fast, dark-mode anime discovery and streaming app with optional AniList synchronization. Browse seasonal and popular titles, watch in sub or dub, keep a local history, save a wishlist, and manage your anime progress from one place.

## Highlights

- Browse popular, trending, seasonal, TV, and movie anime
- Search titles and open detailed anime pages
- Watch episodes with sub and dub options
- Track progress, status, score, and favourites with AniList
- Keep a local watch history and wishlist
- Responsive layouts for desktop and mobile
- Keyboard shortcuts, smooth scrolling, and persistent query caching
- Lightweight design system powered by Tailwind CSS and Radix UI

## Tech stack

- [React](https://react.dev/) 19
- [TanStack Start](https://tanstack.com/start)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [AniList GraphQL API](https://docs.anilist.co/)

## Getting started

### Requirements

- Node.js 20 or newer
- Bun 1.1 or newer

### Install

```bash
bun install
```

### Run locally

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
bun run build
bun run preview
```

### Available scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the Vite development server |
| `bun run build` | Build the production application |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint |
| `bun run format` | Format the project with Prettier |

## AniList sync

AniList synchronization is optional. Use the sign-in flow in the app to connect an AniList account. Your access token is stored in the browser and used to communicate with AniList; Aniora does not require a separate account.

## Project structure

```text
src/
├── components/    Reusable UI and player components
├── lib/           API clients, state, settings, and shared helpers
├── routes/        TanStack file-based routes
├── styles.css     Global styles and design tokens
└── router.tsx     Application router setup
public/            Static assets and web app icons
```

## Content and providers

Aniora does not host video files. Playback and image content are provided by third-party services. Availability, quality, and legality may vary by region and provider. Use the service responsibly and follow the terms that apply to the content in your location.

## Contributing

Issues and focused pull requests are welcome. Before opening a change:

1. Keep the scope small and explain the user-facing impact.
2. Run `bun run build`.
3. Run `bun run lint` and fix issues introduced by your change.
4. Include screenshots or a short recording for visual changes when useful.

## License

This project does not currently include a license. Contact the repository owner before redistributing or using the code in another project.
