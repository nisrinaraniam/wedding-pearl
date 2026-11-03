'use strict';
// Independent translate/scale properties preserve the authored collage transforms.
(() => {
  const main = document.querySelector('main');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (!main || !('IntersectionObserver' in window)) return;
  const groups = '.couple-portrait, .photo-button, .keepsake-item, .closing-medallion, .reveal-frame-container';
  const selector = `${groups}, .ornament, .small-symbol, .hanging-fixture, .rsvp-seal, .dress-fan, .portrait-flower, .closing-fan, p, h1, h2, h3, h4, blockquote, .couple-and, .fine-rule, .ornamental-rule, .swatches > div, .countdown-grid > div, form > label, fieldset, form > input, form > select, form > textarea, .button, .text-link`;
  const items = [...main.querySelectorAll(selector)].filter(el => {
    const parent = el.parentElement?.closest(groups);
    return !parent && !el.closest('.guestbook-list, #gift-details');
  });
  items.forEach((el, index) => {
    el.classList.add('scroll-enter');
    el.style.setProperty('--enter-delay', `${(index % 3) * 65}ms`);
    if (el.matches('.ornament, .keepsake-item, .hanging-fixture, .small-symbol, .rsvp-seal, .dress-fan')) {
      el.style.setProperty('--enter-x', index % 2 ? '20px' : '-20px');
      el.style.setProperty('--enter-y', '22px');
      el.style.setProperty('--enter-scale', '.94');
    }
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting, boundingClientRect}) => {
      if (isIntersecting) target.dataset.entered = 'true';
      else if (boundingClientRect.bottom <= 0 || boundingClientRect.top >= innerHeight) {
        target.dataset.entered = 'false';
      }
    });
  }, {threshold: .05, rootMargin: '0px 0px -20px 0px'});
  function refresh() {
    observer.disconnect();
    const active = !preference.matches && !main.inert;
    main.classList.toggle('motion-enabled', active);
    // Legacy scene transitions yield to these individually observed elements.
    main.classList.add('motion-ready');
    main.querySelectorAll('.reveal, .reveal-scale').forEach(el => el.classList.add('visible'));
    document.querySelector('#keepsake-collage')?.classList.add('in-view');
    items.forEach(el => {
      el.dataset.entered = active ? 'false' : 'true';
      if (active) observer.observe(el);
    });
  }
  new MutationObserver(refresh).observe(main, {attributes: true, attributeFilter: ['inert']});
  preference.addEventListener('change', refresh);
  // Keyboard navigation always reveals its destination immediately.
  main.addEventListener('focusin', e => {
    e.target.closest('.scroll-enter')?.setAttribute('data-entered', 'true');
  });
  refresh();
})();
