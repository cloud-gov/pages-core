Pages Admin App
====================

## About

The Pages Admin application is built with [Svelte 5](https://svelte.dev/) and [Vite](https://vitejs.dev/), providing a modern, fast development experience for managing cloud.gov Pages sites, users, organizations, and domains.

## Tech Stack

- **Framework:** Svelte 5 (with legacy compatibility mode)
- **Build Tool:** Vite 6.x
- **Styling:** USWDS 3.8.x
- **Package Manager:** npm
- **Node Version:** >= 18.x

## Local Development

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### Installation

```bash
cd admin-client
npm install
```

### Development Server

Start the Vite dev server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:3000/`

**Note:** The dev server requires the main Pages API to be running (see main project README).

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Open Vitest UI for interactive testing
- `npm run lint` - Run ESLint

### Setting up environment variables

Set `API_URL` environment variable to point to your Pages API:

```bash
export API_URL=http://localhost:1337
npm run dev
```

## Building for Production

```bash
npm run build
```

Build output will be in `public/build/`:
- `bundle.js` - Main application bundle (~284 KB, 89 KB gzipped)
- `bundle.css` - Component styles (~10 KB, 3 KB gzipped)
- USWDS assets (fonts, images, CSS)

## Testing

The project uses [Vitest](https://vitest.dev/) and [@testing-library/svelte](https://testing-library.com/docs/svelte-testing-library/intro):

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui
```

## Project Structure

```
admin-client/
├── src/
│   ├── components/     # Reusable Svelte components
│   ├── pages/          # Page-level components (routes)
│   ├── stores/         # Svelte stores (state management)
│   ├── lib/            # Utilities and API client
│   ├── flows/          # Business logic flows
│   ├── App.svelte      # Root component
│   └── main.js         # Application entry point
├── public/             # Static assets
├── index.html          # HTML entry point
├── vite.config.mjs     # Vite configuration
└── vitest.config.mjs   # Test configuration
```

## Architecture Notes

### Svelte 5 Compatibility Mode

The application runs Svelte 5 in **legacy compatibility mode** (`componentApi: 4`), which allows Svelte 3 syntax to work without changes. This provides a smooth migration path while maintaining all existing functionality.

### Routing

Client-side routing is handled by [page.js](https://github.com/visionmedia/page.js). Routes are defined in `src/Router.svelte`.

### State Management

- **Stores:** Svelte stores for global state (session, router, notifications)
- **Component State:** Local component state using Svelte's reactive declarations

### Forms

Form components use the custom `Form.svelte` wrapper which handles:
- Submission state
- Error handling
- USWDS styling

## Contributing

See the main project [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## Migration Notes

This application was migrated from Svelte 3 + Rollup to Svelte 5 + Vite in June 2026. See `docs/ADMIN_SVELTE_UPGRADE.md` for the full migration plan and status.
