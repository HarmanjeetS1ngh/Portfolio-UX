document.addEventListener("DOMContentLoaded", () => {
  'use strict';

 
  
  
  
  
  
  
  
  
  
  
  requestAnimationFrame(() => {

 
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

 
  const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (document.querySelector('.cs-meta-outer')) {
    heroTL.from('.cs-meta-outer', { opacity: 0, y: 20, duration: 0.6, delay: 0.3 });
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
        bar.style.setProperty('--progress', (self.progress * 100) + '%');
      }
    });
  }

 
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

 
  const comicContainer = document.getElementById('comic-container');

  if (comicContainer) {
    const slides   = comicContainer.querySelectorAll('.comic-slide');
    const overlay  = document.getElementById('comic-overlay');
    const dotsWrap = document.getElementById('comic-dots');
    let current      = 0;
    let unlocked     = false;
    let transitioning = false;

    
    slides.forEach((slide, i) => {
      gsap.set(slide, {
        x: i === 0 ? '0%' : '100%',
        opacity: 1,
        visibility: i === 0 ? 'visible' : 'hidden',
        pointerEvents: i === 0 ? 'auto' : 'none',
      });
      
      slide.classList.remove('active');
    });

   const syncButtons = () => {
      
      document.querySelectorAll('.prev-btn').forEach(btn => btn.disabled = current === 0);
      document.querySelectorAll('.next-btn').forEach(btn => btn.disabled = current === slides.length - 1);
    };

   
    const goTo = (idx) => {
      if (!unlocked || transitioning || idx < 0 || idx >= slides.length || idx === current) return;
      transitioning = true;

      const dir      = idx > current ? 1 : -1; 
      const outSlide = slides[current];
      const inSlide  = slides[idx];

      
      gsap.set(inSlide, { x: `${dir * 100}%`, visibility: 'visible', pointerEvents: 'none', filter: 'blur(0px)' });
      gsap.set(outSlide, { filter: 'blur(0px)' }); 

      const tl = gsap.timeline({
        onComplete: () => {
          
          gsap.set(outSlide, { visibility: 'hidden', pointerEvents: 'none', filter: 'blur(0px)' });
          gsap.set(inSlide, { filter: 'blur(0px)' });
          inSlide.style.pointerEvents = 'auto';

          
          if (dotsWrap) {
            if (dotsWrap.children[current]) dotsWrap.children[current].classList.remove('active');
            if (dotsWrap.children[idx])     dotsWrap.children[idx].classList.add('active');
          }
          current = idx;
          transitioning = false;
          syncButtons();
        }
      });

      
      tl.to(outSlide, {
        x: `${-dir * 100}%`,
        duration: 0.45,
        ease: 'power3.inOut',
      }, 0);

      tl.to(inSlide, {
        x: '0%',
        duration: 0.45,
        ease: 'power3.inOut',
      }, 0);

      
      
      tl.to([outSlide, inSlide], {
        filter: 'blur(2px)', 
        duration: 0.125,     
        ease: 'power1.in',   
        yoyo: true,          
        repeat: 1            
      }, 0);
    };

    
    if (dotsWrap) {
      slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = `comic-dot${i === 0 ? ' active' : ''}`;
        dot.addEventListener('click', () => { if (unlocked) goTo(i); });
        dotsWrap.appendChild(dot);
      });
    }

    
    const dismissOverlay = () => {
      if (unlocked) return; 
      unlocked = true;
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.4,
          onComplete: () => {
            overlay.style.visibility  = 'hidden';
            overlay.style.pointerEvents = 'none';
          }
        });
      }
      syncButtons();
    };

    if (overlay) {
      overlay.addEventListener('click', dismissOverlay);
    }

  document.querySelectorAll('.prev-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        
        if (!unlocked) { dismissOverlay(); return; }
        goTo(current - 1);
      })
    );

    document.querySelectorAll('.next-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        
        if (!unlocked) { dismissOverlay(); return; }
        goTo(current + 1);
      })
    );

    
    document.addEventListener('keydown', (e) => {
      const rect   = comicContainer.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft'  || e.key === 'ArrowUp') {
        e.preventDefault();

        if (!unlocked) {
          
          dismissOverlay();
          return;
        }

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1);
        else goTo(current - 1);
      }
    });

    
    let touchStartX = 0;
    let touchStartY = 0;
    
    comicContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    
    comicContainer.addEventListener('touchmove', (e) => {
      if (!touchStartX || !touchStartY) return;

      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;

      
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        
        e.preventDefault(); 
      }
    }, { passive: false });

    comicContainer.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      
      
      if (Math.abs(dx) > 40) {
        
        if (!unlocked) {
          dismissOverlay();
          touchStartX = 0; touchStartY = 0; 
          return;
        }
        
        
        goTo(dx < 0 ? current + 1 : current - 1);
      }
      
      
      touchStartX = 0;
      touchStartY = 0;
    }, { passive: true });

    syncButtons();
  }

 
  
  document.querySelectorAll('.stat-pill-num[data-count-pct]').forEach(el => {
    const target  = parseInt(el.getAttribute('data-count-pct'), 10);
    const digits  = String(target).split('');
    const rawFs   = parseFloat(getComputedStyle(el).fontSize);
    const DIGIT_H = (rawFs > 0 ? rawFs : 24) * 1.15;

    el.textContent = '';
    el.style.cssText = `display:inline-flex; align-items:flex-start; gap:0px; overflow:hidden; height:${DIGIT_H}px; vertical-align:middle;`;

    const columns = digits.map(d => {
      const col = document.createElement('span');
      col.style.cssText = 'display:inline-flex; flex-direction:column; flex-shrink:0; will-change:transform;';
      for (let i = 0; i <= 9; i++) {
        const cell = document.createElement('span');
        cell.style.cssText = `display:block; height:${DIGIT_H}px; line-height:${DIGIT_H}px; text-align:center; font-variant-numeric:tabular-nums;`;
        cell.textContent = i;
        col.appendChild(cell);
      }
      el.appendChild(col);
      return { col, digitTarget: parseInt(d, 10) };
    });

    const suffixStr = el.getAttribute('data-suffix') || '%';
    const pct = document.createElement('span');
    pct.textContent = suffixStr;
    pct.style.cssText = `font-size:1.1em; font-weight:800; color:inherit; margin-left:2px; align-self:flex-end; line-height:1; padding-bottom:1px; opacity:0; display:inline-block;`;
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
          gsap.fromTo(col, { y: 0 }, {
            y: -(digitTarget * DIGIT_H),
            duration: 1.1 + idx * 0.07,
            ease: 'power4.out',
            delay: idx * 0.05,
          });
        });
        gsap.to(pct, { opacity: 1, duration: 0.25, delay: 0.65, ease: 'power2.out' });
      }
    });
  });

  
  document.querySelectorAll('.stat-value[data-count-to]').forEach(el => {
    const from   = parseFloat(el.getAttribute('data-count-from') || '0');
    const to     = parseFloat(el.getAttribute('data-count-to'));
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
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
            el.textContent = prefix + (isInt ? Math.round(v) : v.toFixed(1)) + suffix;
          },
          onComplete: () => { el.textContent = prefix + to + suffix; }
        });
      }
    });
  });

  }); 

 
  gsap.registerPlugin(ScrollTrigger); 


  gsap.registerPlugin(ScrollTrigger); 

document.querySelectorAll('.reveal-up, .reveal-scale').forEach(el => {
    
    const delay = parseFloat(el.getAttribute('data-delay') || '0');

    gsap.fromTo(el,
      { y: 16, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        delay: delay,
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