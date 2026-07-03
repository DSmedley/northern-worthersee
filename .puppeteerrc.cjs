/**
 * Skip puppeteer's browser downloads on install. This project never uses
 * them: the check-a11y and check-lighthouse tasks point puppeteer at the
 * Playwright-installed Chrome via PUPPETEER_EXECUTABLE_PATH.
 *
 * It also fixes a race in `npm ci`: the root puppeteer and pa11y-ci's
 * nested puppeteer both download the same Chrome build into
 * ~/.cache/puppeteer concurrently, and one fails with "browser folder
 * exists but the executable is missing".
 */
module.exports = {
  skipDownload: true,
};
