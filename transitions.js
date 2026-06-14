(function () {
  const CFG = {
    lateralExitDuration:  0.20,
    lateralEnterDuration: 0.30,
    lateralExitEase:  'power2.in',
    lateralEnterEase: 'power2.out',
    drillExitDuration:  0.32,
    drillEnterDuration: 0.46,
    drillExitEase:  'power3.inOut',
    drillEnterEase: 'power3.out',
    lateralOffset: 32,
    drillOffset:   28,
    curtainColor: '#111111',
    storageKey:   'pt-nav',
    directionKey: 'pt-dir',
    typeKey:      'pt-type',
    fromPageKey:  'pt-from',
    toTabKey:     'pt-totab',
  };

  function exitDuration(type)  { return type === 'lateral' ? CFG.lateralExitDuration  : CFG.drillExitDuration;  }
  function enterDuration(type) { return type === 'lateral' ? CFG.lateralEnterDuration : CFG.drillEnterDuration; }
  function exitEase(type)      { return type === 'lateral' ? CFG.lateralExitEase      : CFG.drillExitEase;      }
  function enterEase(type)     { return type === 'lateral' ? CFG.lateralEnterEase     : CFG.drillEnterEase;     }

  const PAGE_MAP = {
    'index.html':       { tab: 'work', tabIndex: 0 },
    './':               { tab: 'work', tabIndex: 0 },
    '':                 { tab: 'work', tabIndex: 0 },
    'about.html':       { tab: 'info', tabIndex: 1 },
    'crunchyroll.html': { tab: 'case', tabIndex: null },
    'epic-gains.html':  { tab: 'case', tabIndex: null },
  };

  function getFilename(href) {
    let path = (href || '').split('#')[0].split('?')[0];
    path = path.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, '');
    let name = path.split('/').pop() || '';
    if (name === '') {
      const segments = path.split('/').filter(Boolean);
      name = segments.length ? segments[segments.length - 1] : '';
    }
    if (name && !name.includes('.')) {
      name += '.html';
    }
    return name || 'index.html';
  }

  function getMeta(href) {
    return PAGE_MAP[getFilename(href)] || {};
  }

  function getTransitionType(fromHref, toHref) {
    const from = getMeta(fromHref);
    const to   = getMeta(toHref);
    if (from.tab === 'case' && to.tab === 'case') return 'lateral';
    if (to.tab   === 'case')  return 'drill-down';
    if (from.tab === 'case')  return 'drill-up';
    return 'lateral';
  }

  function getLateralDir(fromHref, toHref) {
    const fromIdx = getMeta(fromHref).tabIndex ?? 0;
    const toIdx   = getMeta(toHref).tabIndex   ?? 0;
    return toIdx > fromIdx ? 1 : -1;
  }

  function getContentTarget() {
    const main = document.querySelector('main');
    if (main) return main;

    const exclude = new Set([
      document.getElementById('navbarShell'),
      document.getElementById('cs-toc'),
      document.getElementById('cs-progress'),
      document.getElementById('resumeModal'),
      document.getElementById('mobileOverlay'),
      document.getElementById('uiViewerModal'),
      document.querySelector('.grid-lines-wrapper')
    ].filter(Boolean));

    let wrapper = document.getElementById('_pt-content-wrap');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = '_pt-content-wrap';
      wrapper.style.cssText = 'will-change:transform,opacity;';
      const children = Array.from(document.body.children)
        .filter(el => !exclude.has(el) && el.id !== '_pt-content-wrap');
      if (children.length) {
        document.body.insertBefore(wrapper, children[0]);
        children.forEach(c => wrapper.appendChild(c));
      }
    }

    const elementsToRescue = [
      document.getElementById('resumeModal'),
      document.getElementById('mobileOverlay'),
      document.getElementById('uiViewerModal'),
      document.querySelector('.grid-lines-wrapper')
    ].filter(Boolean);

    elementsToRescue.forEach(el => {
      if (el.closest('#_pt-content-wrap')) {
        document.body.appendChild(el);
      }
    });

    return wrapper;
  }

  function syncNavbarState(href) {
    const meta = getMeta(href || window.location.href);
    if (!meta || meta.tab === 'case') return;

    const indicator = document.getElementById('activeIndicator');
    const buttons   = document.querySelectorAll('.toggle-btn');

    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', i === meta.tabIndex);
    });

    if (indicator && typeof meta.tabIndex === 'number') {
      const targetBtn = buttons[meta.tabIndex];
      if (targetBtn) {
        indicator.style.transition = 'none';
        indicator.style.transform = `translateX(${targetBtn.offsetLeft - buttons[0].offsetLeft}px)`;
        indicator.style.width = `${targetBtn.offsetWidth}px`;
        indicator.style.visibility = 'visible';
      }
    }
  }

  function preCacheProfileImage() {
    const img = document.querySelector('.profile-img');
    if (!img || !img.src) return;
    try { sessionStorage.setItem('pt-profile-src', img.src); } catch (_) {}
    const preload = new window.Image();
    preload.src = img.src;
    window._ptProfilePreload = preload;
  }

  function getHomeNavEls() {
    return document.querySelectorAll('.nav-profile, .nav-toggle-container, .resume-btn, .hamburger');
  }

  function getCaseNavEls() {
    return document.querySelectorAll('.cs-back-btn, .cs-nav-title');
  }

  function fadeEls(els, toOpacity, duration, ease) {
    return new Promise(resolve => {
      if (!els || !els.length) { resolve(); return; }
      let remaining = els.length;
      els.forEach(el => {
        gsap.to(el, {
          opacity: toOpacity,
          duration,
          ease,
          onComplete: () => { if (--remaining === 0) resolve(); },
        });
      });
    });
  }

  function runExit(type, direction, toTab) {
    return new Promise(resolve => {
      const content = getContentTarget();
      const fromTab = getMeta(window.location.href).tab;
      const dur     = exitDuration(type);
      const ease    = exitEase(type);

      let navPromise = Promise.resolve();
      if (type === 'drill-down' && fromTab !== 'case') {
        navPromise = fadeEls(getHomeNavEls(), 0, dur * 0.7, 'power2.out');
      } else if (type === 'drill-up' && fromTab === 'case') {
        navPromise = fadeEls(getCaseNavEls(), 0, dur * 0.7, 'power2.out');
      }

      const tocEl = document.getElementById('cs-toc');
      if (tocEl) {
        tocEl.style.transition = 'none';
        gsap.to(tocEl, { opacity: 0, duration: dur * 0.6, ease: 'power2.out' });
      }

      let exitProps = {};
      if (type === 'lateral') {
        exitProps = {
          x: -direction * CFG.lateralOffset,
          opacity: 0,
          duration: dur,
          ease,
        };
      } else if (type === 'drill-down') {
        exitProps = {
          scale: 0.97,
          opacity: 0,
          y: -CFG.drillOffset * 0.5,
          duration: dur,
          ease,
        };
      } else if (type === 'drill-up') {
        exitProps = {
          opacity: 0,
          y: CFG.drillOffset * 0.5,
          scale: 1,
          duration: dur * 0.85,
          ease,
        };
      }

      let contentDone = false;
      let navDone     = false;
      const tryResolve = () => { if (contentDone && navDone) resolve(); };

      gsap.to(content, {
        ...exitProps,
        onComplete: () => { contentDone = true; tryResolve(); },
      });
      navPromise.then(() => { navDone = true; tryResolve(); });
    });
  }

  function runEnter(type, direction, onCompleteCallback) {
    const content = getContentTarget();
    const toTab   = getMeta(window.location.href).tab;
    const dur     = enterDuration(type);
    const ease    = enterEase(type);

    if (type === 'drill-down' && toTab === 'case') {
      gsap.set(getCaseNavEls(), { opacity: 0 });
      document.documentElement.style.removeProperty('--pt-nav-init');
      gsap.to(getCaseNavEls(), {
        opacity: 1,
        duration: dur * 0.65,
        delay:    dur * 0.3,
        ease: 'power2.out',
        stagger: 0.06,
        clearProps: 'opacity'
      });
    } else if (type === 'drill-up' && toTab !== 'case') {
      gsap.set(getHomeNavEls(), { opacity: 0 });
      document.documentElement.style.removeProperty('--pt-nav-init');
      gsap.to(getHomeNavEls(), {
        opacity: 1,
        duration: dur * 0.65,
        delay:    dur * 0.25,
        ease: 'power2.out',
        stagger: 0.04,
        clearProps: 'opacity'
      });
    }

    const tocEl = document.getElementById('cs-toc');
    if (tocEl && toTab === 'case') {
      gsap.to(tocEl, {
        opacity: 1,
        duration: dur * 0.6,
        delay:    dur * 0.2,
        ease: 'power2.out',
        onComplete: () => {
          tocEl.style.transition = '';
          tocEl.style.removeProperty('opacity');
        },
      });
    }

    let fromProps = {};
    if (type === 'lateral') {
      fromProps = { x: direction * CFG.lateralOffset, opacity: 0, scale: 1, y: 0 };
    } else if (type === 'drill-down') {
      fromProps = { scale: 0.97, opacity: 0, y: CFG.drillOffset, x: 0 };
    } else if (type === 'drill-up') {
      fromProps = { scale: 1, opacity: 0, y: -CFG.drillOffset * 0.6, x: 0 };
    }

    const sbWidthRaw = sessionStorage.getItem('pt-sb-width');
    try { sessionStorage.removeItem('pt-sb-width'); } catch (_) {}
    const sbWidth = sbWidthRaw ? parseInt(sbWidthRaw, 10) : 0;
    let sbMask = null;
    if (sbWidth > 0) {
      sbMask = document.createElement('div');
      sbMask.id = '_pt-sb-mask';
      sbMask.style.cssText = [
        'position:fixed',
        'top:0', 'right:0', 'bottom:0',
        `width:${sbWidth}px`,
        `background:${CFG.curtainColor}`,
        'z-index:1099',
        'pointer-events:none',
        'opacity:1',
      ].join(';');
      document.body.appendChild(sbMask);

      gsap.to(sbMask, { opacity: 0, duration: dur, ease });
    }

    gsap.fromTo(content, fromProps, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: dur,
      ease,
      clearProps: 'all',
      onComplete: () => {
        document.body.style.removeProperty('overflow');
        if (sbMask) sbMask.remove();

        if (content && content.id === '_pt-content-wrap') {
          content.style.removeProperty('opacity');
          content.style.removeProperty('transform');
          content.style.removeProperty('pointer-events');
        }

        document.querySelectorAll('.case-card').forEach(card => {
          card.style.removeProperty('pointer-events');
          card.style.removeProperty('opacity');
        });
        if (onCompleteCallback) onCompleteCallback();
      },
    });
  }

  function buildCurtain() {
    const c = document.createElement('div');
    c.id = '_pt-curtain';
    c.style.cssText = [
      'position:fixed', 'inset:0',
      'z-index:1100',
      'pointer-events:none',
      `background:${CFG.curtainColor}`,
      'opacity:1',
    ].join(';');
    document.body.appendChild(c);
    return c;
  }

  function removeCurtain(curtain, dur) {
    if (!curtain) return;
    gsap.to(curtain, {
      opacity: 0,
      duration: dur,
      ease: 'power2.out',
      onComplete: () => curtain.remove(),
    });
  }

  function signalReady() {
    window._ptReady = true;
    document.dispatchEvent(new CustomEvent('pt:ready'));
  }

  function handleEnter() {
    const type      = sessionStorage.getItem(CFG.typeKey)      || 'lateral';
    const direction = parseInt(sessionStorage.getItem(CFG.directionKey) || '1', 10);

    sessionStorage.removeItem(CFG.storageKey);
    sessionStorage.removeItem(CFG.typeKey);
    sessionStorage.removeItem(CFG.directionKey);
    sessionStorage.removeItem(CFG.fromPageKey);
    sessionStorage.removeItem(CFG.toTabKey);

    syncNavbarState(window.location.href);
    window._ptNavSynced = true;

    document.body.style.overflow = 'hidden';

    const curtain = buildCurtain();

    document.body.style.opacity = '1';

    const content = getContentTarget();
    let fromProps = {};
    if (type === 'lateral') {
      fromProps = { x: direction * CFG.lateralOffset, opacity: 0, scale: 1, y: 0 };
    } else if (type === 'drill-down') {
      fromProps = { scale: 0.97, opacity: 0, y: CFG.drillOffset, x: 0 };
    } else if (type === 'drill-up') {
      fromProps = { scale: 1, opacity: 0, y: -CFG.drillOffset * 0.6, x: 0 };
    }
    gsap.set(content, fromProps);

    const tocEl = document.getElementById('cs-toc');
    if (tocEl) {
      tocEl.style.transition = 'none';
      tocEl.style.opacity    = '0';
    }

    const eDur = enterDuration(type);

    if (type === 'lateral') {
      requestAnimationFrame(() => {
        document.documentElement.style.removeProperty('--pt-init');
        removeCurtain(curtain, eDur * 0.35);
        runEnter(type, direction, signalReady);
      });
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.style.removeProperty('--pt-init');
          removeCurtain(curtain, eDur * 0.5);
          runEnter(type, direction, signalReady);
        });
      });
    }
  }

  function handleDirectVisit() {
    document.body.style.opacity = '1';
    document.documentElement.style.removeProperty('--pt-init');
    syncNavbarState(window.location.href);

    document.querySelectorAll('.case-card').forEach(card => {
      card.style.removeProperty('pointer-events');
      card.style.removeProperty('opacity');
    });

    signalReady();
  }

  function preAnimateIndicator(toUrl) {
    const toMeta = getMeta(toUrl);
    if (!toMeta || toMeta.tab === 'case' || typeof toMeta.tabIndex !== 'number') return;

    const indicator = document.getElementById('activeIndicator');
    const buttons   = document.querySelectorAll('.toggle-btn');
    if (!indicator || !buttons.length) return;

    const targetBtn = buttons[toMeta.tabIndex];
    if (!targetBtn) return;

    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', i === toMeta.tabIndex);
    });

    indicator.style.transition = 'none';

    gsap.to(indicator, {
      x: targetBtn.offsetLeft - buttons[0].offsetLeft,
      width: targetBtn.offsetWidth,
      duration: CFG.lateralExitDuration * 0.85,
      ease: 'power2.inOut',
      overwrite: true
    });
  }

  window.triggerPageTransition = function (toUrl, explicitType) {
    if (window._ptRunning) return;
    window._ptRunning = true;

    const fromHref = window.location.pathname + window.location.search;
    const type     = explicitType || getTransitionType(fromHref, toUrl);
    const dir      = type === 'lateral' ? getLateralDir(fromHref, toUrl) : 1;
    const toTab    = getMeta(toUrl).tab || 'work';

    sessionStorage.setItem(CFG.storageKey,   '1');
    sessionStorage.setItem(CFG.typeKey,      type);
    sessionStorage.setItem(CFG.directionKey, String(dir));
    sessionStorage.setItem(CFG.fromPageKey,  toUrl);
    sessionStorage.setItem(CFG.toTabKey,     toTab);

    preCacheProfileImage();

    if (type === 'lateral') {
      preAnimateIndicator(toUrl);
    }

    const sbWidth = window.innerWidth - document.documentElement.clientWidth;
    if (sbWidth > 0) {
      try { sessionStorage.setItem('pt-sb-width', String(sbWidth)); } catch (_) {}

      const exitMask = document.createElement('div');
      exitMask.style.cssText = [
        'position:fixed',
        'top:0', 'right:0', 'bottom:0',
        `width:${sbWidth}px`,
        `background:${CFG.curtainColor}`,
        'z-index:1099',
        'pointer-events:none',
        'opacity:0',
      ].join(';');
      document.body.appendChild(exitMask);

      gsap.to(exitMask, {
        opacity: 1,
        duration: exitDuration(type) * 0.4,
        ease: 'power2.in',
      });
    }

    document.body.style.overflow = 'hidden';

    if (window.lenis) window.lenis.stop();
    ScrollTrigger.killAll();

    runExit(type, dir, toTab).then(() => {
      window.location.href = toUrl;
    });
  };

  function interceptLinks() {
    document.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href
        || href.startsWith('#')
        || href.startsWith('http')
        || href.startsWith('mailto')
        || href.startsWith('tel')
        || link.target === '_blank') return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;

      const currentFile = window.location.pathname.split('/').pop() || '';
      const targetFile  = getFilename(href);
      if (targetFile === currentFile || (targetFile === 'index.html' && currentFile === '')) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      window.triggerPageTransition(href);
    }, true);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem(CFG.storageKey)) {
      handleEnter();
    } else {
      handleDirectVisit();
    }
    interceptLinks();
  });

})();