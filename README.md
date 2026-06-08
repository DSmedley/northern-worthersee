# Northern Wörthersee Website

Static site for [Northern Wörthersee](https://northernworthersee.com), an annual European car show held in Frankenmuth, Michigan. Built with [Hugo](https://gohugo.io) and the [Blowfish](https://blowfish.page) theme. Deployed automatically to GitHub Pages on every push to `main`.

## Prerequisites

- [mise](https://mise.jdx.dev): manages all tool versions (Hugo, Go, Node, etc.)
- [git](https://git-scm.com)

## Setup

```sh
git clone --recurse-submodules https://github.com/your-org/northern-worthersee.git
cd northern-worthersee
mise install
mise run setup      # installs git hooks via lefthook
npm ci              # installs Playwright (for e2e tests)
```

> [!IMPORTANT]
> The `--recurse-submodules` flag is required. The Blowfish theme lives at `themes/blowfish/` as a git submodule. If you forgot it, run `git submodule update --init --recursive` after cloning.

Git LFS is used for binary assets (images, logos). After cloning, LFS files are pulled automatically if `git-lfs` is installed (mise handles this).

## Running locally

```sh
hugo server
```

The site will be available at `http://localhost:1313` with live reload. Hugo watches for file changes and rebuilds automatically.

To preview the production build exactly as it will be deployed:

```sh
hugo --environment production --minify
```

## Site structure

```
assets/
  css/          # custom CSS overrides
  gallery/      # photo galleries, one subfolder per year (2021, 2022, …)
  img/          # static hero and page images
  js/           # custom javascript additions
  sponsors/     # sponsor logo files
config/
  _default/     # base Hugo configuration (hugo.toml, params.toml, menus, etc.)
  development/  # config overrides for local dev
  production/   # config overrides for production builds
content/
  _index.md     # home page content
  awards/       # awards page
  contact/      # contact page
  event/        # event info page
  gallery/      # gallery index and page generation template
  sponsors/     # sponsors page
data/
  event.json    # all event details (date, location, schedule, admission)
  awards.json   # award class definitions
  sponsors.json # sponsor list and logo references
layouts/
  shortcodes/   # Hugo shortcodes used in content files
  partials/     # Hugo partial templates
themes/
  blowfish/     # Blowfish theme (git submodule, do not edit)
static/         # favicons and other static files served as-is
```

## Making edits

### Updating event details

Nearly everything about the current year's event lives in [data/event.json](data/event.json). Edit this file to update:

- `edition`: the ordinal edition number (e.g. `"13th"`)
- `date`: the event date in `YYYY-MM-DD` format
- `registrationUrl`: link to the pre-registration store page
- `email`: contact email address
- `location`: venue name, address, and Google Maps link
- `schedule`: array of schedule items with times and descriptions
- `admission`: spectator, pre-registration, and day-of pricing details

All of these values are pulled into the site automatically via shortcodes, so you do not need to edit any content files for routine event updates.

### Updating award classes

Edit [data/awards.json](data/awards.json) to add, remove, or rename award categories. Each entry has:

- `name`: displayed class name
- `description`: short description shown on the awards page
- `singleAward`: `true` if only one winner is given (e.g. "Most Unique"), `false` for classes with multiple tiers

### Updating sponsors

Edit [data/sponsors.json](data/sponsors.json) to add or remove sponsors. Each entry needs:

- `name`: sponsor display name
- `link`: URL to the sponsor's website or social page
- `image`: filename of their logo in `assets/sponsors/` (dont include the path, just the file)

Add the logo file to `assets/sponsors/` alongside the JSON update.

### Editing page content

The content files in `content/` use Hugo shortcodes to pull in data from the `data/` directory. Avoid hardcoding event details directly in Markdown. The shortcodes available include `{{< eventyear >}}`, `{{< eventdate >}}`, `{{< eventedition >}}`, `{{< location >}}`, `{{< schedule >}}`, `{{< admission >}}`, `{{< registerbutton >}}`, and `{{< email >}}`.

For most years, the only content file you might need to edit is [content/event/index.md](content/event/index.md) if you want to change the narrative text around the shortcodes. Everything was built in such a way that editing the content files should rarely happen.

## Adding a photo gallery for a new year

1. Create a new folder under `assets/gallery/` named with the four-digit year (e.g. `assets/gallery/2026/`).
2. Drop the photos into that folder. Any common image format works (JPG, PNG, WebP, etc.).
3. Hugo generates the gallery page automatically from the folder contents.

**Feature image selection:** The gallery index and social preview image for each year is chosen automatically:

- If any image filename starts with `feature` (e.g. `feature.jpg`, `feature-photo.jpg`), that image is used.
- Otherwise, the first image in the directory (alphabetically) is used.

To control which photo is featured, either name it with a `feature` prefix or name your files so the desired one sorts first alphabetically.

**Before the current year's event:** If the gallery folder for the current event year does not exist yet, the gallery page for that year shows a "check back after the event" placeholder automatically. Once you create the folder and add photos, the placeholder is replaced.

## Validation and linting

The following checks run automatically as pre-commit hooks and in CI:

```sh
mise run check          # markdown lint, spell check, TOML validation
mise run check-links    # build site and check for broken links (offline)
```

Spell check uses [cspell](https://cspell.org). If you need to add a word to the allowed list, see [cspell.json](cspell.json).

## End-to-end tests

Playwright tests live in [e2e/](e2e/) and cover all major pages.

```sh
npm run test:e2e        # run all tests headlessly
npm run test:ui         # open Playwright UI for interactive debugging
npm run test:report     # view the last test report in a browser
```

Tests also run in CI on every PR and push to `main`.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which:

1. Lints Markdown and validates TOML config
2. Builds the site with Hugo
3. Checks for broken links (offline)
4. Runs Playwright e2e tests
5. Deploys to GitHub Pages (only on push to `main`, not on PRs)

The site is hosted on GitHub Pages. No manual deployment steps are needed.

## Theme

The site uses the [Blowfish](https://blowfish.page) Hugo theme, pinned as a git submodule at `themes/blowfish/`. Do not edit files inside `themes/blowfish/`. Customizations belong in `layouts/`, `assets/css/custom.css`, and `config/`. To update the theme, run:

```sh
git submodule update --remote themes/blowfish
```

Then commit the updated submodule reference.
