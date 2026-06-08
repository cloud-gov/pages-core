# Svelte 5 Migration Plan - Admin UI

## Migration Status

- [x] **Phase 1:** Preparation & Audit
- [x] **Phase 2:** Dependencies Update
- [x] **Phase 3:** Build Configuration Migration
- [x] **Phase 4:** Component Migration
- [x] **Phase 5:** Testing & Verification
- [x] **Phase 6:** Production Readiness
- [ ] **Phase 7:** Gradual Runes Adoption (Future/Optional)

## Current State

### Before Migration
- **Svelte Version:** 3.59.2
- **Build Tool:** Rollup
- **Components:** 69 .svelte files (~2,650 LOC)
- **Dependencies:** svelecte v3.17.2, USWDS v3.8.2
- **Test Framework:** Vitest + @testing-library/svelte v4
- **Location:** `/admin-client/`

### After Migration
- **Svelte Version:** 5.0.0
- **Build Tool:** Vite 6.4.3
- **Components:** 72 .svelte files (all migrated)
- **Dependencies:** svelecte v5.3.0, USWDS v3.8.2
- **Test Framework:** Vitest + @testing-library/svelte v5
- **Compatibility Mode:** Legacy (componentApi: 4)

## Migration Strategy

- **Minimize breaking changes** - Use Svelte 5's legacy compatibility mode
- **Migrate to Vite** - Better DX and official Svelte 5 support
- **Check dependency compatibility** - svelecte v5.3.0 supports Svelte 5
- **Update tests during migration** - Ensure stability at each phase
- **Use legacy mode first** - Defer runes adoption to future work

## Phase-by-Phase Migration Plan

### Phase 1: Preparation & Audit (1-2 hours)

1. **Create migration branch**
   ```bash
   git checkout -b svelte-5-migration
   ```

2. **Audit current code for breaking changes**
   - Search for deprecated Svelte 3 patterns:
     - `on:` event handlers (still work but can be improved)
     - `bind:this` usage
     - Component lifecycle hooks (`onMount`, `onDestroy`, etc.)
     - Store subscriptions (`$store` syntax)
   
3. **Document current functionality**
   - Take screenshots of key UI sections
   - Run existing tests and document results
   - Note any existing warnings/errors

4. **Backup current build configuration**
   - Save `rollup.config.js` for reference

### Phase 2: Dependencies Update (1-2 hours)

1. **Update Svelte core dependencies**
   ```bash
   cd admin-client
   npm install svelte@^5 --save
   ```

2. **Update build tooling - migrate to Vite**
   ```bash
   npm install -D vite@latest @sveltejs/vite-plugin-svelte@^4 vite-plugin-static-copy
   npm uninstall rollup rollup-plugin-svelte rollup-plugin-terser @rollup/plugin-commonjs @rollup/plugin-node-resolve @rollup/plugin-replace rollup-plugin-copy rollup-plugin-livereload
   ```

3. **Update svelecte**
   ```bash
   npm install svelecte@^5.3.0 --save
   ```

4. **Update testing dependencies**
   ```bash
   npm install -D @testing-library/svelte@^5
   ```

5. **Update linting**
   ```bash
   npm install -D eslint-plugin-svelte@latest
   ```

### Phase 3: Build Configuration Migration (2-3 hours)

1. **Create `vite.config.js`**
   
   Create a new file in `/admin-client/vite.config.js`:
   
   ```javascript
   import { defineConfig } from 'vite';
   import { svelte } from '@sveltejs/vite-plugin-svelte';
   import { viteStaticCopy } from 'vite-plugin-static-copy';

   export default defineConfig(({ mode }) => ({
     plugins: [
       svelte({
         compilerOptions: {
           // Enable legacy mode for Svelte 3 compatibility
           compatibility: {
             componentApi: 4
           }
         }
       }),
       viteStaticCopy({
         targets: [
           {
             src: 'node_modules/@uswds/uswds/dist/img',
             dest: 'assets/uswds'
           },
           {
             src: 'node_modules/@uswds/uswds/dist/fonts',
             dest: 'assets/uswds'
           }
         ]
       })
     ],
     build: {
       outDir: 'public/build',
       sourcemap: mode === 'development',
       rollupOptions: {
         output: {
           entryFileNames: 'bundle.js',
           assetFileNames: 'bundle.css'
         }
       }
     },
     server: {
       port: 5173,
       strictPort: false
     },
     define: {
       'process.env.NODE_ENV': JSON.stringify(mode)
     }
   }));
   ```

2. **Update `package.json` scripts**
   
   Replace the scripts section:
   
   ```json
   {
     "scripts": {
       "build": "vite build",
       "dev": "vite",
       "preview": "vite preview",
       "test": "vitest run",
       "test:watch": "vitest",
       "lint": "eslint src --ext .js,.svelte"
     }
   }
   ```

3. **Update `index.html`**
   
   Move `public/index.html` to `admin-client/index.html` and update:
   
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset='utf-8'>
     <meta name='viewport' content='width=device-width,initial-scale=1'>
     <title>Pages Admin</title>
     <link rel='stylesheet' href='/global.css'>
   </head>
   <body>
     <script type="module" src="/src/main.js"></script>
   </body>
   </html>
   ```

4. **Update `vitest.config.mjs`**
   
   Update the Vitest config to use the new Vite setup:
   
   ```javascript
   import { defineConfig } from 'vitest/config';
   import { svelte } from '@sveltejs/vite-plugin-svelte';

   export default defineConfig({
     plugins: [
       svelte({
         compilerOptions: {
           compatibility: {
             componentApi: 4
           }
         },
         hot: false
       })
     ],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: ['./src/setupTests.js']
     }
   });
   ```

5. **Test basic build**
   ```bash
   npm run dev  # Verify dev server works
   npm run build  # Verify production build works
   ```

### Phase 4: Component Migration (3-5 hours)

Migrate components in order of complexity (simple → complex):

#### Low Risk (Start here):
- [ ] Alert
- [ ] Banner
- [ ] LabeledItem
- [ ] ExternalLink
- [ ] PageTitle
- [ ] SectionHeader
- [ ] GridContainer
- [ ] GridRow

#### Medium Risk:
- [ ] Form components (TextInput, NumberInput, RadioInput, SelectInput)
- [ ] Select (update svelecte v5 API)
- [ ] Tables (DataTable, BuildTable, EventTable, etc.)
- [ ] SiteCard
- [ ] Modal
- [ ] Accordion
- [ ] Hero
- [ ] Nav components

#### High Risk (Do last):
- [ ] App.svelte
- [ ] Router.svelte
- [ ] Store-dependent components
- [ ] Complex lifecycle components

**For each component:**
1. Run dev server and check for deprecation warnings
2. Test component functionality manually
3. Fix any breaking issues
4. Run component tests
5. Move to next component

**Common Issues to Fix:**
- Update svelecte v3 → v5 API changes (check their migration guide)
- Address any prop passing changes
- Fix slot syntax if needed (legacy mode should help)

### Phase 5: Testing & Verification (2-4 hours)

1. **Update test configuration**
   - Verify all tests run with new setup
   - Update `@testing-library/svelte` v5 API if needed

2. **Fix failing tests**
   ```bash
   npm run test
   ```
   
   Common test fixes:
   - Update component rendering API
   - Fix query selectors if needed
   - Update event simulation

3. **Manual testing checklist**
   - [ ] Login flow
   - [ ] Site management (create, edit, delete)
   - [ ] Build management (view builds, details)
   - [ ] User management (invite, edit, roles)
   - [ ] Organization management (create, edit)
   - [ ] Domain management (create, edit, DNS)
   - [ ] Navigation between all pages
   - [ ] All forms (submission and validation)
   - [ ] Tables (sorting, pagination, filtering)
   - [ ] Modals open and close correctly
   - [ ] Accordions expand/collapse
   - [ ] USWDS styling intact
   - [ ] Search/filter functionality
   - [ ] Task management
   - [ ] Events viewing
   - [ ] File storage actions

4. **Cross-browser testing**
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Edge
   - Check console for errors in each

### Phase 6: Production Readiness (1-2 hours)

1. **Performance audit**
   ```bash
   npm run build
   # Compare bundle sizes before vs after
   ```
   - Check bundle size is reasonable
   - Verify page load times
   - Ensure no performance regressions

2. **Accessibility check**
   - Run Lighthouse audit
   - Verify USWDS components still accessible
   - Check keyboard navigation
   - Test screen reader compatibility

3. **Documentation updates**
   - Update `README.md` with new dev setup
   - Document new Vite commands
   - Note any breaking changes for other developers
   - Update Docker/deployment configs if needed

4. **Create PR and request review**
   - Include migration notes
   - List all tested features
   - Note any known issues or deprecation warnings
   - Reference this migration doc

### Phase 7 (Future): Gradual Runes Adoption (Optional)

Once stable on Svelte 5 legacy mode, incrementally adopt runes:

**Runes to adopt:**
- Convert `let count = 0` → `let count = $state(0)`
- Convert `$: doubled = count * 2` → `let doubled = $derived(count * 2)`
- Convert `onMount()`/`onDestroy()` → `$effect()`
- Convert component props using `$props()`

**Strategy:**
1. Start with simple presentational components
2. Update one component at a time
3. Test thoroughly after each conversion
4. Create separate PR for runes adoption

## Key Breaking Changes to Watch For

1. **Event handlers** - `on:click` still works in legacy mode but can be replaced with `onclick`
2. **Component props** - Some prop spreading differences (legacy mode helps)
3. **Slots** - Slot syntax changes (legacy mode helps)
4. **Store subscriptions** - `$store` syntax still works
5. **Component lifecycle** - `onMount` etc. work in legacy mode
6. **Transitions** - Mostly compatible but verify complex animations
7. **svelecte API** - Check v3 → v5 migration guide for prop changes

## Estimated Timeline

- **Phase 1-2:** ~4 hours (preparation + dependencies)
- **Phase 3:** ~3 hours (build configuration)
- **Phase 4:** ~5 hours (component migration - may vary)
- **Phase 5:** ~4 hours (testing)
- **Phase 6:** ~2 hours (production readiness)

**Total: 18-20 hours** (2-3 days of focused work)

## Success Criteria

- [x] All 69 components render correctly
- [x] All existing tests pass
- [x] No console errors in production build
- [x] USWDS styling preserved
- [x] Dev experience improved (faster HMR with Vite)
- [x] Bundle size similar or smaller
- [x] All admin features functional
- [x] No accessibility regressions

## Rollback Plan

If critical issues are found:

1. **Immediate rollback:**
   ```bash
   git checkout main
   npm install
   npm run build
   ```

2. **Partial rollback:**
   - Keep Vite but revert Svelte to v3
   - Or keep Rollup and upgrade Svelte incrementally

## Useful Resources

- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Svelte 5 Release Notes](https://svelte.dev/blog/svelte-5-is-alive)
- [Vite Guide](https://vitejs.dev/guide/)
- [svelecte v5 Documentation](https://github.com/mskocik/svelecte)
- [@testing-library/svelte v5](https://testing-library.com/docs/svelte-testing-library/intro)

## Notes

- **Legacy mode** allows Svelte 3 syntax to work in Svelte 5, minimizing breaking changes
- **Vite** provides better HMR and development experience than Rollup
- **svelecte v5.3.0** is confirmed compatible with Svelte 5
- All USWDS styling should remain unchanged
- This is a **non-breaking migration** from user perspective - UI should look and behave identically

## Support

For questions or issues during migration:
- Check Svelte 5 migration guide first
- Review this document's troubleshooting section
- Consult with team members who have Svelte 5 experience
