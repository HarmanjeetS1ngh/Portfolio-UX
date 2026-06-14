document.addEventListener("DOMContentLoaded", () => {

 
  
  
  
  
  
  gsap.registerPlugin(ScrollTrigger);


  const toc      = document.getElementById('cs-toc');
  const tocItems = document.querySelectorAll('.toc-item');
  const sections = document.querySelectorAll('section[id]');

  if (toc && !toc.querySelector('.toc-indicator')) {
    const ind = document.createElement('div');
    ind.className = 'toc-indicator';
    toc.appendChild(ind);
  }
  const tocIndicator = toc ? toc.querySelector('.toc-indicator') : null;

  if (toc && tocItems.length && sections.length) {
    const setActive = (id) => {
      tocItems.forEach(item => item.classList.toggle('toc-active', item.dataset.section === id));

      if (tocIndicator) {
        const activeItem = toc.querySelector(`.toc-item[data-section="${id}"]`);
        if (activeItem) {
          const tocRect  = toc.getBoundingClientRect();
          const itemRect = activeItem.getBoundingClientRect();
          tocIndicator.style.opacity   = '1';
          tocIndicator.style.height    = `${activeItem.offsetHeight}px`;
          tocIndicator.style.transform = `translateY(${itemRect.top - tocRect.top}px)`;
        }
      }
    };

    const updateTOC = () => {
      
      
      const viewportMid = window.scrollY + window.innerHeight * 0.35;
      let activeId = sections[0].id; 
      sections.forEach(section => {
        if (section.offsetTop <= viewportMid) { activeId = section.id; }
      });
      setActive(activeId);
    };

    
    
    toc.classList.add('toc-visible');

    window.addEventListener('scroll', updateTOC, { passive: true });
    updateTOC();

    tocItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault(); 
        const targetId = item.getAttribute('data-section');
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          
          if (window.lenis) {
            window.lenis.scrollTo(targetSection, { offset: -90 });
          } else {
            const offsetTop = targetSection.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
          }
        }
      });
    });
  }

 
  const bar = document.getElementById('cs-progress');
  const moreProjectsSection = document.querySelector('.more-projects-section');

  if (bar) {
    ScrollTrigger.create({
      trigger: document.body, 
      start: "top top", 
      endTrigger: moreProjectsSection ? ".more-projects-section" : document.body,
      end: moreProjectsSection ? "top bottom" : "bottom bottom", 
      onUpdate: (self) => {
        bar.style.setProperty('--progress-pct', (self.progress * 100) + '%');
      }
    });
  }

 
  const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (document.querySelector('.cs-hero-title')) {
      heroTL.from('.cs-hero-title', { y: 30, opacity: 0, duration: 0.8, delay: 0.2 });
  }
  
  if (document.querySelector('.cs-meta-outer')) {
      heroTL.from('.cs-meta-outer', { opacity: 0, y: 20, duration: 0.5 }, '-=0.3');
  }


 
  document.querySelectorAll('.ba-wrapper').forEach(wrapper => {
    const btns = wrapper.querySelectorAll('.ba-btn');
    
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const state = btn.getAttribute('data-state');
        wrapper.setAttribute('data-active', state);
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });


 
  (function initComicSlider() {
    const container  = document.getElementById('comic-container');
    const overlay    = document.getElementById('comic-overlay');
    const slides     = document.querySelectorAll('.comic-slide');
    const prevBtns   = document.querySelectorAll('.prev-btn');
    const nextBtns   = document.querySelectorAll('.next-btn');
    const dotsWrap   = document.getElementById('comic-dots');

    if (!container || !slides.length) return;

    let current = 0;
    const total = slides.length;
    let busy = false;

    if (dotsWrap) {
      slides.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'comic-dot' + (i === 0 ? ' active' : '');
        d.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(d);
      });
    }

    function dismissOverlay() {
      if (!overlay || overlay.style.visibility === 'hidden') return false;
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          overlay.style.visibility = 'hidden';
          overlay.style.pointerEvents = 'none';
        }
      });
      return true;
    }

    if (overlay) {
      overlay.addEventListener('click', dismissOverlay);
    }

    function updateUI() {
      if (dotsWrap) {
        dotsWrap.querySelectorAll('.comic-dot').forEach((d, i) => {
          d.classList.toggle('active', i === current);
        });
      }
      prevBtns.forEach(b => { b.disabled = current === 0; });
      nextBtns.forEach(b => { b.disabled = current === total - 1; });
    }

    
    function goTo(next) {
      if (busy || next < 0 || next >= total || next === current) return;
      busy = true;

      const dir = next > current ? 1 : -1;
      const leaving = slides[current];
      const entering = slides[next];

      
      gsap.set(entering, { visibility: 'visible', opacity: 1, xPercent: 100 * dir, filter: 'blur(0px)' });
      gsap.set(leaving, { filter: 'blur(0px)' });

      const tl = gsap.timeline({
        onComplete: () => {
          
          gsap.set(leaving, { visibility: 'hidden', xPercent: 0, filter: 'blur(0px)' });
          gsap.set(entering, { filter: 'blur(0px)' });
          current = next;
          busy = false;
          updateUI();
        }
      });

      tl.to(leaving,  { xPercent: -100 * dir, duration: 0.45, ease: 'power3.inOut' }, 0);
      tl.to(entering, { xPercent: 0,           duration: 0.45, ease: 'power3.inOut' }, 0);
      
      
      tl.to([leaving, entering], {
        filter: 'blur(2px)',
        duration: 0.125, 
        ease: 'power1.in',
        yoyo: true, 
        repeat: 1 
      }, 0);
    }

    prevBtns.forEach(b => b.addEventListener('click', () => {
      if (overlay && overlay.style.visibility !== 'hidden') { dismissOverlay(); return; }
      goTo(current - 1);
    }));

    nextBtns.forEach(b => b.addEventListener('click', () => {
      if (overlay && overlay.style.visibility !== 'hidden') { dismissOverlay(); return; }
      goTo(current + 1);
    }));

    
    let touchStartX = 0;
    let touchStartY = 0;

    container.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    
    container.addEventListener('touchmove', e => {
      if (!touchStartX || !touchStartY) return;

      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;

      
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        
        e.preventDefault(); 
      }
    }, { passive: false }); 

    container.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      
      
      if (Math.abs(dx) > 40) {
        if (overlay && overlay.style.visibility !== 'hidden') { 
            dismissOverlay(); 
            
            touchStartX = 0; touchStartY = 0; 
            return; 
        }
        goTo(dx < 0 ? current + 1 : current - 1);
      }
      
      
      touchStartX = 0;
      touchStartY = 0;
    }, { passive: true });

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') {
        if (overlay && overlay.style.visibility !== 'hidden') { dismissOverlay(); return; }
        goTo(current + 1);
      }
      if (e.key === 'ArrowLeft') {
        if (overlay && overlay.style.visibility !== 'hidden') { dismissOverlay(); return; }
        goTo(current - 1);
      }
    });

    updateUI();
  })();



  
  document.querySelectorAll('.stat-pill-num[data-count-pct]').forEach(el => {
    const target  = parseInt(el.getAttribute('data-count-pct'), 10);
    const digits  = String(target).split('');

    const rawFs   = parseFloat(getComputedStyle(el).fontSize);
    const DIGIT_H = (rawFs > 0 ? rawFs : 24) * 1.15;

    el.textContent = '';

    el.style.display        = 'inline-flex';
    el.style.alignItems     = 'flex-start';
    el.style.gap            = '0px';
    el.style.overflow       = 'hidden';
    el.style.height         = DIGIT_H + 'px';
    el.style.verticalAlign  = 'middle';

    const columns = digits.map(d => {
      const col = document.createElement('span');
      col.style.cssText = `
        display:inline-flex;
        flex-direction:column;
        flex-shrink:0;
        will-change:transform;
      `;

      for (let i = 0; i <= 9; i++) {
        const cell = document.createElement('span');
        cell.style.cssText = `
          display:block;
          height:${DIGIT_H}px;
          line-height:${DIGIT_H}px;
          text-align:center;
          font-variant-numeric:tabular-nums;
        `;
        cell.textContent = i;
        col.appendChild(cell);
      }

      el.appendChild(col);
      return { col, digitTarget: parseInt(d, 10) };
    });

    const pct = document.createElement('span');
    pct.textContent = '%';
    pct.style.cssText = `
      font-size:1.1em;
      font-weight:800;
      color:var(--cr-orange);
      margin-left:2px;
      align-self:flex-end;
      line-height:1;
      padding-bottom:1px;
      opacity:0;
      display:inline-block;
      transition:opacity 0.2s ease;
    `;
    el.parentElement.insertBefore(pct, el.nextSibling);

    let triggered = false;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        if (triggered) return;
        triggered = true;

        columns.forEach(({ col, digitTarget }, idx) => {
          gsap.fromTo(col,
            { y: 0 },
            {
              y: -(digitTarget * DIGIT_H),
              duration: 1.1 + idx * 0.07,
              ease: 'power4.out',
              delay: idx * 0.05,
            }
          );
        });

        gsap.to(pct, {
          opacity: 1,
          duration: 0.25,
          delay: 0.65,
          ease: 'power2.out',
          onComplete: () => { pct.style.transform = 'translateY(0)'; }
        });
      }
    });
  });

  
  document.querySelectorAll('.stat-value[data-count-to]').forEach(el => {
    const from   = parseFloat(el.getAttribute('data-count-from') || '0');
    const to     = parseFloat(el.getAttribute('data-count-to'));
    const suffix = el.getAttribute('data-suffix') || '';
    const isInt  = Number.isInteger(to) && Number.isInteger(from);
    let triggered = false;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        if (triggered) return;
        triggered = true;
        gsap.fromTo({ val: from }, { val: to }, {
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: function() {
            const v = this.targets()[0].val;
            el.textContent = (isInt ? Math.round(v) : v.toFixed(1)) + suffix;
          },
          onComplete: () => { el.textContent = to + suffix; }
        });
      }
    });
  });


  document.querySelectorAll('.reveal-up, .reveal-scale').forEach(el => {
    gsap.fromTo(el, 
      { y: 16, opacity: 0 }, 
      {
        y: 0,
        opacity: 1,
        duration: 0.5,       
        ease: 'power2.out',  
        scrollTrigger: {
          trigger: el,
          start: 'top 95%',  
          once: true,        
          onEnter: () => {
            el.style.pointerEvents = 'auto';
          }
        }
      }
    );
  });

});