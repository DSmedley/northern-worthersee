import PhotoSwipeLightbox from 'https://cdn.jsdelivr.net/npm/photoswipe@5/dist/photoswipe-lightbox.esm.js';

const SHARE_ICON = {
  isCustomSVG: true,
  inner: '<path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" id="pswp__icn-share"/>',
  outlineID: 'pswp__icn-share',
};

function buildShareUrl(template, url, title) {
  const args = [encodeURIComponent(url), encodeURIComponent(title)];
  let i = 0;
  return template
    .replace(/%\[(\d+)\]s/g, (_, n) => args[parseInt(n) - 1] ?? '')
    .replace(/%s/g, () => args[i++] ?? '');
}

function initGallery(galleryEl) {
  const id = galleryEl.id;
  const shareTmpl = document.getElementById(id + '-share-tmpl');
  const pageTitle = galleryEl.dataset.pageTitle || document.title;
  const urlTemplates = galleryEl.dataset.sharing
    ? JSON.parse(galleryEl.dataset.sharing)
    : {};

  const lightbox = new PhotoSwipeLightbox({
    gallery: '#' + id,
    children: 'a',
    pswpModule: () => import('https://cdn.jsdelivr.net/npm/photoswipe@5/dist/photoswipe.esm.js'),
  });

  lightbox.on('change', () => {
    history.replaceState(null, '', '#photo-' + lightbox.pswp.currIndex);
  });

  lightbox.on('close', () => {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  });

  if (shareTmpl && Object.keys(urlTemplates).length > 0) {
    lightbox.on('uiRegister', () => {
      lightbox.pswp.ui.registerElement({
        name: 'share-button',
        order: 9,
        isButton: true,
        appendTo: 'bar',
        html: SHARE_ICON,
        title: 'Share photo',
        onInit: (el, pswp) => {
          const panel = document.createElement('div');
          panel.className = 'pswp__share-panel text-xl';
          panel.setAttribute('aria-hidden', 'true');
          panel.innerHTML = shareTmpl.innerHTML;
          pswp.element.appendChild(panel);

          el.addEventListener('click', () => {
            const isHidden = panel.getAttribute('aria-hidden') === 'true';
            if (isHidden) {
              const imageUrl =
                window.location.origin + window.location.pathname + '#photo-' + pswp.currIndex;
              panel.querySelectorAll('a[data-platform]').forEach(a => {
                const tmpl = urlTemplates[a.dataset.platform];
                if (tmpl) a.href = buildShareUrl(tmpl, imageUrl, pageTitle);
              });
            }
            panel.setAttribute('aria-hidden', String(!isHidden));
          });

          pswp.on('change', () => {
            panel.setAttribute('aria-hidden', 'true');
          });
        },
      });
    });
  }

  lightbox.init();
  return lightbox;
}

const galleries = document.querySelectorAll('.pswp-gallery');
const lightboxes = Array.from(galleries).map(initGallery);

const hashMatch = window.location.hash.match(/^#photo-(\d+)$/);
if (hashMatch && lightboxes.length > 0) {
  lightboxes[0].loadAndOpen(parseInt(hashMatch[1]));
}
