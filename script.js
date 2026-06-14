





function initFooterWebGL() {
    const canvas = document.getElementById('footer-glcanvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    const vertexShaderSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;

        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            st.x *= u_resolution.x / u_resolution.y;

            float t = u_time * 1.25;

            vec2 move1 = vec2(sin(t * 0.5), cos(t * 0.3)) * 0.5;
            vec2 move2 = vec2(cos(t * 0.4), sin(t * 0.6)) * 0.5;

            vec3 colorDark = vec3(0.00, 0.02, 0.15);
            vec3 colorMid = vec3(0.00, 0.20, 0.60);
            vec3 colorBright = vec3(0.00, 0.55, 1.0);

            float dist1 = length(st - (vec2(0.2, 0.5) + move1));
            float dist2 = length(st - (vec2(1.5, 0.5) + move2));

            float intensity = smoothstep(1.5, 0.0, dist1) * 0.8;
            intensity += smoothstep(2.0, 0.0, dist2) * 0.5;

            vec3 finalColor = mix(colorDark, colorMid, st.y * 0.5 + intensity * 0.5);
            finalColor = mix(finalColor, colorBright, intensity * 0.6);

            float noise = (random(gl_FragCoord.xy) - 0.5) * 0.015;
            finalColor += noise;

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
        return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");

    function resizeCanvas() {
        const displayWidth  = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width  = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
    }

    
    
    let isRendering = false;
    ScrollTrigger.create({
        trigger: ".footer",
        start: "top 100%", 
        onEnter: () => isRendering = true,
        onLeave: () => isRendering = false,
        onEnterBack: () => isRendering = true,
        onLeaveBack: () => isRendering = false
    });

    function render(time) {
        if (!isRendering) {
            requestAnimationFrame(render);
            return;
        }
        
        time *= 0.001; 
        resizeCanvas();
        
        gl.useProgram(program);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(timeUniformLocation, time);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function initNavIndicator() {
    const container  = document.querySelector('.nav-toggle-container');
    const buttons    = document.querySelectorAll('.toggle-btn');
    const indicator  = document.getElementById('activeIndicator');

    if (!container || !buttons.length || !indicator) return;

    function snapToActive() {
        let activeIdx = 0;
        buttons.forEach((btn, i) => { if (btn.classList.contains('active')) activeIdx = i; });
        const activeBtn = buttons[activeIdx];
        if (!activeBtn) return;
        
        indicator.style.transition = 'none';
        indicator.style.transform = `translateX(${activeBtn.offsetLeft - buttons[0].offsetLeft}px)`;
        indicator.style.width = `${activeBtn.offsetWidth}px`;
        indicator.style.visibility = 'visible';
    }

    if (!window._ptNavSynced) {
      snapToActive();
    }

    window._navIndicatorSnap = snapToActive;

    document.fonts.ready.then(() => {
        if (!window._ptReady && window._ptNavSynced) return;
        if (window._navIndicatorSnap) window._navIndicatorSnap();
    });
}

function switchTab(clickedButton, index) {
    const buttons = document.querySelectorAll('.toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');

    const indicator = document.getElementById('activeIndicator');
    if (indicator) {
        gsap.to(indicator, {
            x: clickedButton.offsetLeft - buttons[0].offsetLeft,
            width: clickedButton.offsetWidth,
            duration: 0.36,
            ease: 'power3.out',
            overwrite: true,
        });
    }
}


let menuTimeline = null;

function initMenuAnimation() {
    menuTimeline = gsap.timeline({ 
        paused: true,
        onReverseComplete: () => {
            gsap.set(".mobile-overlay", { visibility: "hidden", pointerEvents: "none" });
        }
    });

    menuTimeline.set(".mobile-overlay", { visibility: "visible", pointerEvents: "auto" });
    
    menuTimeline.to(".mobile-overlay", {
        opacity: 1,
        duration: 0.25,
        ease: "power2.out"
    });

    menuTimeline.fromTo(".mobile-link, .mobile-resume-btn", 
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.2, stagger: 0.03, ease: "power2.out" },
        "-=0.15"
    );
}

function toggleMobileMenu() {
    const navbar = document.getElementById('navbar');
    const navbarShell = document.getElementById('navbarShell'); 
    
    if (!menuTimeline) initMenuAnimation();

    navbar.classList.toggle('menu-open');
    navbarShell.classList.toggle('shell-menu-open');
    
    if (navbar.classList.contains('menu-open')) {
        document.body.style.overflow = 'hidden';
        if (window.lenis) window.lenis.stop(); 
        menuTimeline.play();
    } else {
        document.body.style.overflow = '';
        if (window.lenis) window.lenis.start(); 
        menuTimeline.reverse();
    }
}

function switchMobileTab(clickedLink) {
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.classList.remove('active');
    });
    clickedLink.classList.add('active');
    toggleMobileMenu();
}


function initViewToggles() {
    const listBtn = document.getElementById('listViewBtn');
    const gridBtn = document.getElementById('gridViewBtn');
    const container = document.getElementById('caseStudiesContainer');

    if (!listBtn || !gridBtn || !container) return;

    listBtn.addEventListener('click', () => {
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        container.classList.remove('grid-view');
        container.classList.add('list-view');
        
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 50);
    });

    gridBtn.addEventListener('click', () => {
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        container.classList.remove('list-view');
        container.classList.add('grid-view');
        
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 50);
    });
}


function initCaseStudyScroll() {
    const cards = document.querySelectorAll('.case-card');
    if (!cards.length) return;

    const revealBatch = (batch, baseDelay = 0) => {
        gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.1,
            delay: baseDelay,
            onComplete: () => {
                gsap.set(batch, { clearProps: 'all' });
                batch.forEach(card => {
                    card.style.removeProperty('pointer-events');
                });
            }
        });

        batch.forEach((card, i) => {
            const textEls = card.querySelectorAll('.line-inner');
            if (!textEls.length) return;
            gsap.to(textEls, {
                y: '0%',
                opacity: 1,
                duration: 0.7,
                stagger: 0.07,
                ease: "power3.out",
                delay: baseDelay + 0.08 + i * 0.1,
                clearProps: 'all'
            });
        });
    };

    const alreadyVisible = [];
    const needsTrigger   = [];

    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.88) {
            alreadyVisible.push(card);
        } else {
            needsTrigger.push(card);
        }
    });

    if (alreadyVisible.length) {
        revealBatch(alreadyVisible, 0.05);
    }

    if (needsTrigger.length) {
        ScrollTrigger.batch(needsTrigger, {
            start: "top 88%",
            once: true,
            onEnter: (batch) => revealBatch(batch)
        });
    }
}


function initStandardHover() {
    const cards = document.querySelectorAll('.case-card');
    cards.forEach(card => {
        card.removeEventListener('mouseenter', card._hoverEnter);
        card.removeEventListener('mouseleave', card._hoverLeave);

        card._hoverEnter = () => { card.classList.add('is-active'); };
        card._hoverLeave = () => { card.classList.remove('is-active'); };

        card.addEventListener('mouseenter', card._hoverEnter);
        card.addEventListener('mouseleave', card._hoverLeave);
        card.style.removeProperty('pointer-events');
    });
}


function initClipboardCopy() {
    const copyElements = document.querySelectorAll('.copy-click');

    function applyFeedback(el) {
        const originalTooltip = el.getAttribute('data-tooltip');
        el.setAttribute('data-tooltip', 'Copied!');
        el.classList.add('copied');
        setTimeout(() => {
            el.setAttribute('data-tooltip', originalTooltip);
            el.classList.remove('copied');
        }, 2000);
    }

    function copySync(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }

    copyElements.forEach(el => {
        const text = el.getAttribute('data-copy');

        el.addEventListener('touchend', (e) => {
            e.preventDefault(); 
            copySync(text);
            applyFeedback(el);
        }, { passive: false });

        el.addEventListener('click', async (e) => {
            if (e.sourceCapabilities && !e.sourceCapabilities.firesTouchEvents) {
                try {
                    await navigator.clipboard.writeText(text);
                } catch {
                    copySync(text); 
                }
                applyFeedback(el);
            }
        });
    });
}


function initSmoothScroll() {
    window.lenis = new Lenis({
        duration: 0.85,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        syncTouch: false,
        touchMultiplier: 1.5,
        autoRaf: false,
    });

    window.lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        window.lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
}



// --- ON-SCROLL REVEAL ANIMATIONS ---
function initScrollAnimations() {
    gsap.to('.hero-heading', { 
        y: 0, opacity: 1, duration: 1.1, ease: "power3.out", delay: 0.05, clearProps: 'all' 
    });

    const uiSectionHeader = document.querySelector('.ui-explorations .section-header');
    if (uiSectionHeader) {
        gsap.to(uiSectionHeader, {
            y: 0, opacity: 1, duration: 0.75, ease: "power3.out", clearProps: 'all',
            scrollTrigger: { trigger: uiSectionHeader, start: "top 92%", once: true }
        });
    }

    const uiCards = document.querySelectorAll('.ui-card');
    if (uiCards.length > 0) {
        // CHANGED: Animates 'x' coordinate to create a smooth slide-in from the left
        gsap.to(uiCards, { 
            x: 0, opacity: 1, duration: 0.85, stagger: 0.1, ease: "power3.out", clearProps: 'all',
            scrollTrigger: { trigger: ".ui-grid", start: "top 88%", once: true }
        });
    }

    const selectionWrapper = document.querySelector('.selection-wrapper');
    if (selectionWrapper) {
        const hlTl = gsap.timeline({ delay: 1.2 }); 
        
        // Ensure handles are visibly restored right before animation starts to avoid flicker
        gsap.set(['.handle-left', '.handle-left-mob'], { y: -10, opacity: 0, visibility: 'visible' });
        gsap.set(['.handle-right', '.handle-right-mob'], { y: 10, opacity: 0, visibility: 'visible' });
        gsap.set('.selection-bg', { width: '0%' }); 
        gsap.set(['.bg-1', '.bg-2'], { width: '0%' }); 
        
        hlTl.to(['.handle-left', '.handle-left-mob'], { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(2)' })
            .to('.selection-bg', { width: 'calc(100% + 12px)', duration: 0.85, ease: 'power2.inOut' }, '-=0.1')
            .to('.bg-1', { width: 'calc(100% + 4px)', duration: 0.6, ease: 'none' }, '<')
            .to('.bg-2', { width: 'calc(100% + 8px)', duration: 0.25, ease: 'none' }, '>')
            .to(['.handle-right', '.handle-right-mob'], { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, '-=0.2')
            .to(['.selection-bg', '.bg-1', '.bg-2', '.handle-left', '.handle-right', '.handle-left-mob', '.handle-right-mob'], { 
                opacity: 0, duration: 0.6, ease: 'power2.inOut' 
            }, '+=4'); 
    }

    const footerContent = document.querySelector('.footer-content');
    if (footerContent) {
        gsap.to(footerContent, {
            y: 0, opacity: 1, duration: 0.9, ease: "power3.out", clearProps: 'all',
            scrollTrigger: { trigger: ".footer", start: "top 88%", once: true }
        });
    }
}


function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    ScrollTrigger.create({
        start: '80px top',
        onEnter:      () => navbar.classList.add('is-scrolled'),
        onLeaveBack:  () => navbar.classList.remove('is-scrolled'),
    });
}


function initDividerAnimations() {
    const lines = document.querySelectorAll('.horizontal-line');
    lines.forEach(line => {
        gsap.to(line, {
            scaleX: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: { trigger: line, start: "top 95%", once: true }
        });
    });
}


function initFooterHeadingReveal() {
    const heading = document.querySelector('.footer-heading');
    if (!heading) return;

    const rawHTML = heading.innerHTML;
    const lines = rawHTML.split(/<br\s*\/?>/i);

    const wrappedLines = lines.map(line => {
        const words = line.trim().split(/\s+/).filter(Boolean);
        return words.map(word =>
            `<span class="word-wrapper"><span class="word-inner">${word}</span></span>`
        ).join(' ');
    });

    heading.innerHTML = wrappedLines.join('<br>');

    const wordInners = heading.querySelectorAll('.word-inner');

    gsap.fromTo(wordInners,
        { y: '110%', opacity: 0 },
        {
            y: '0%',
            opacity: 1,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.06,
            scrollTrigger: { trigger: heading, start: 'top 88%', once: true }
        }
    );
}


function initCaseNumberCounters() {
    function animateCounters() {
        const numbers = document.querySelectorAll('.list-view .case-number');
        numbers.forEach((el, i) => {
            const target = i + 1;
            gsap.fromTo({ val: 0 },
                { val: 0 },
                {
                    val: target,
                    duration: 0.6,
                    ease: 'power2.out',
                    delay: i * 0.1,
                    onUpdate: function () { el.textContent = '#' + Math.round(this.targets()[0].val); },
                    onComplete: function () { el.textContent = '#' + target; }
                }
            );
        });
    }

    const listBtn = document.getElementById('listViewBtn');
    if (listBtn) {
        listBtn.addEventListener('click', () => { setTimeout(animateCounters, 60); });
    }
}


function initListTagStagger() {
    const gridBtn = document.getElementById('gridViewBtn');
    if (gridBtn) {
        gridBtn.addEventListener('click', () => {
            document.querySelectorAll('.case-card').forEach(card => {
                card.classList.remove('tags-revealed');
            });
        });
    }
}


function initCardNavigation() {
    function attachCardListeners() {
        document.querySelectorAll('.case-card').forEach(card => {
            card.removeEventListener('click', card._navHandler);
            card._navHandler = function (e) {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                const href = card.getAttribute('data-href');
                if (href) {
                    e.preventDefault();
                    if (typeof window.triggerPageTransition === 'function') {
                        window.triggerPageTransition(href);
                    } else {
                        window.location.href = href;
                    }
                }
            };
            card.addEventListener('click', card._navHandler);
        });
    }

    attachCardListeners();

    const listBtn = document.getElementById('listViewBtn');
    const gridBtn = document.getElementById('gridViewBtn');
    if (listBtn) listBtn.addEventListener('click', () => setTimeout(attachCardListeners, 80));
    if (gridBtn) gridBtn.addEventListener('click', () => setTimeout(attachCardListeners, 80));
}


function initComicScroll() {
    const container = document.getElementById('comicContainer');
    const slides = document.querySelectorAll('.comic-slide');
    const overlay = document.getElementById('comicOverlay');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtnMobile = document.querySelector('.prev-btn-mobile');
    const nextBtnMobile = document.querySelector('.next-btn-mobile');
    
    if (!container || slides.length === 0) return;

    let currentIndex = 0;
    let overlayHidden = false;
    let isTransitioning = false;

    gsap.set(slides[currentIndex], { opacity: 1, visibility: 'visible', pointerEvents: 'auto', xPercent: 0 });

    if (prevBtn) gsap.set(prevBtn, { opacity: 0, pointerEvents: 'none' });
    if (prevBtnMobile) gsap.set(prevBtnMobile, { opacity: 0, pointerEvents: 'none' });

    function hideOverlay() {
        if (!overlayHidden && overlay) {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            overlay.style.pointerEvents = 'none';
            overlayHidden = true;
        }
    }

    if (overlay) {
        overlay.addEventListener('click', hideOverlay);
        overlay.addEventListener('touchend', (e) => {
            e.preventDefault();
            hideOverlay();
        }, { passive: false });
    }

    function updateNavButtons(idx) {
        const atStart = idx === 0;
        const atEnd = idx === slides.length - 1;

        [prevBtn, prevBtnMobile].forEach(btn => {
            if (!btn) return;
            gsap.to(btn, { opacity: atStart ? 0 : 1, duration: 0.25, ease: "power2.out" });
            btn.style.pointerEvents = atStart ? 'none' : 'auto';
        });

        [nextBtn, nextBtnMobile].forEach(btn => {
            if (!btn) return;
            gsap.to(btn, { opacity: atEnd ? 0 : 1, duration: 0.25, ease: "power2.out" });
            btn.style.pointerEvents = atEnd ? 'none' : 'auto';
        });
    }

    function updateSlides(nextIndex) {
        if (isTransitioning || nextIndex < 0 || nextIndex >= slides.length) return;
        isTransitioning = true;
        hideOverlay();

        const currentSlide = slides[currentIndex];
        const targetSlide = slides[nextIndex];
        const directionSign = nextIndex > currentIndex ? 1 : -1;

        const tl = gsap.timeline({
            onComplete: () => {
                currentIndex = nextIndex;
                isTransitioning = false;
                updateNavButtons(currentIndex);
            }
        });

        gsap.set(targetSlide, { visibility: 'visible', opacity: 1, pointerEvents: 'auto' });

        tl.to(currentSlide, {
            xPercent: -100 * directionSign,
            duration: 0.45,
            ease: "power3.inOut",
            onComplete: () => {
                gsap.set(currentSlide, { visibility: 'hidden', pointerEvents: 'none', xPercent: 0 });
            }
        }, 0); 

        tl.fromTo(targetSlide, 
            { xPercent: 100 * directionSign },
            { xPercent: 0, duration: 0.45, ease: "power3.inOut" },
            0 
        );
    }

    function handleKeyDown(e) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            const rect = container.getBoundingClientRect();
            const isInView = (rect.top >= -200 && rect.bottom <= window.innerHeight + 200);
            
            if (isInView) {
                e.preventDefault();
                if (e.key === "ArrowRight") {
                    updateSlides(currentIndex + 1);
                } else {
                    updateSlides(currentIndex - 1);
                }
            }
        }
    }

    if (nextBtn) nextBtn.addEventListener('click', () => updateSlides(currentIndex + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => updateSlides(currentIndex - 1));
    if (nextBtnMobile) nextBtnMobile.addEventListener('click', () => updateSlides(currentIndex + 1));
    if (prevBtnMobile) prevBtnMobile.addEventListener('click', () => updateSlides(currentIndex - 1));

    window.addEventListener('keydown', handleKeyDown);
}


let currentUiIndex = 0;
let uiImages = [];

function initUiViewer() {
    const uiCards = document.querySelectorAll('.ui-card');
    if (!uiCards.length) return;

    uiCards.forEach((card, index) => {
        const img = card.querySelector('img');
        const titleEl = card.querySelector('.ui-card-title');
        if (img) {
            uiImages.push({
                src: img.src,
                alt: titleEl ? titleEl.textContent : (img.alt || 'UI Exploration')
            });
        }
        card.addEventListener('click', () => openUiViewerModal(index));
    });

    const counter = document.getElementById('uiCounter');
    if (counter) {
        uiImages.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'ui-dot' + (i === 0 ? ' active' : '');
            counter.appendChild(dot);
        });
    }

    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('uiViewerModal');
        if (modal && modal.classList.contains('is-active')) {
            if (e.key === 'ArrowRight') nextUiImage();
            if (e.key === 'ArrowLeft') prevUiImage();
            if (e.key === 'Escape') closeUiViewerModal();
        }
    });

    const modal = document.getElementById('uiViewerModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeUiViewerModal();
        });
    }
}

function syncUiDots() {
    const dots = document.querySelectorAll('#uiCounter .ui-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentUiIndex);
    });
}

function openUiViewerModal(index) {
    const modal = document.getElementById('uiViewerModal');
    if (!modal || uiImages.length === 0) return;

    currentUiIndex = index;
    updateUiViewerContent(false);
    syncUiDots();

    const container = modal.querySelector('.glass-modal-container');
    gsap.killTweensOf([modal, container]);
    gsap.set(modal, { clearProps: 'opacity' });
    gsap.set(container, { clearProps: 'all' });

    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    if (window.lenis) window.lenis.stop();
}

function closeUiViewerModal() {
    const modal = document.getElementById('uiViewerModal');
    if (!modal || !modal.classList.contains('is-active')) return;

    const container = modal.querySelector('.glass-modal-container');

    const tl = gsap.timeline({
        onComplete: () => {
            modal.classList.remove('is-active');
            gsap.set(container, { clearProps: 'all' });
            document.body.style.overflow = '';
            if (window.lenis) window.lenis.start();
        }
    });

    tl.to(modal, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0);
    tl.to(container, { opacity: 0, y: 16, scale: 0.98, duration: 0.25, ease: 'power2.in' }, 0);
}

function updateUiViewerContent(animate = true, direction = -1) {
    const imgEl   = document.getElementById('uiViewerImg');
    const titleEl = document.getElementById('uiViewerTitle');

    if (!imgEl || !uiImages[currentUiIndex]) return;

    const updateDOM = () => {
        imgEl.src = uiImages[currentUiIndex].src;
        imgEl.alt = uiImages[currentUiIndex].alt;
        if (titleEl) titleEl.textContent = uiImages[currentUiIndex].alt;
        syncUiDots();
    };

    if (animate) {
        // Kill active tweens so fast clicking doesn't cause glitches
        gsap.killTweensOf(imgEl);
        
        // Slide out and fade to 0
        gsap.to(imgEl, {
            x: 60 * direction, // Slide out in the direction of the press
            opacity: 0,
            duration: 0.15,
            ease: 'power2.in',
            onComplete: () => {
                updateDOM();
                // Snap the image to the opposite side while invisible
                gsap.set(imgEl, { x: -60 * direction });
                
                // Slide in and fade to 1
                gsap.to(imgEl, {
                    x: 0,
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        });
    } else {
        // Initial load (no animation)
        gsap.killTweensOf(imgEl);
        gsap.set(imgEl, { x: 0, opacity: 1 });
        updateDOM();
    }
}

function nextUiImage() {
    if (uiImages.length === 0) return;
    currentUiIndex = (currentUiIndex + 1) % uiImages.length;
    // Pass -1 to slide the sequence Left
    updateUiViewerContent(true, -1); 
}

function prevUiImage() {
    if (uiImages.length === 0) return;
    currentUiIndex = (currentUiIndex - 1 + uiImages.length) % uiImages.length;
    // Pass 1 to slide the sequence Right
    updateUiViewerContent(true, 1); 
}

function nextUiImage() {
    if (uiImages.length === 0) return;
    currentUiIndex = (currentUiIndex + 1) % uiImages.length;
    updateUiViewerContent(true);
}

function prevUiImage() {
    if (uiImages.length === 0) return;
    currentUiIndex = (currentUiIndex - 1 + uiImages.length) % uiImages.length;
    updateUiViewerContent(true);
}



document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);


    gsap.set('.hero-heading', { y: 40, opacity: 0, visibility: 'hidden' });
    gsap.set('.case-card', { y: 60, opacity: 0, visibility: 'hidden' });
    gsap.set('.case-card .line-inner', { y: '100%', opacity: 0 });
    gsap.set('.ui-explorations .section-header', { y: 30, opacity: 0, visibility: 'hidden' });
    
  
    gsap.set('.ui-card', { x: -60, opacity: 0, visibility: 'hidden' }); 
    
    gsap.set('.footer-content', { y: 50, opacity: 0, visibility: 'hidden' });

  
    document.body.classList.add('js-ready');


    initSmoothScroll();           
    initMenuAnimation();          
    initViewToggles();            
    initStandardHover();          
    initNavIndicator();           
    initClipboardCopy();          
    initCaseNumberCounters();     
    initListTagStagger();         
    initCardNavigation();         
    initComicScroll();            
    initUiViewer();               


    const initHeavyLifters = () => {
        gsap.set([
            '.hero-heading', 
            '.case-card', 
            '.ui-explorations .section-header', 
            '.ui-card', 
            '.footer-content'
        ], { visibility: 'visible' });

        initNavbarScroll();           
        initDividerAnimations();      
        initScrollAnimations();       
        initCaseStudyScroll();        
        initFooterHeadingReveal();    
        
        setTimeout(() => {
            initFooterWebGL();
        }, 1000); 
    };

    if (window._ptReady) {
        initHeavyLifters();
    } else {
        document.addEventListener('pt:ready', initHeavyLifters, { once: true });
    }
});


function openResumeModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('resumeModal');
    if (modal) {
        modal.classList.add('is-active');
        document.body.style.overflow = 'hidden';
        if (window.lenis) window.lenis.stop();
    }
}

function closeResumeModal() {
    const modal = document.getElementById('resumeModal');
    if (modal) {
        modal.classList.remove('is-active');
        setTimeout(() => {
            document.body.style.overflow = '';
            if (window.lenis) window.lenis.start();
        }, 250);
    }
}

document.addEventListener('click', (e) => {
    const modal = document.getElementById('resumeModal');
    if (modal && modal.classList.contains('is-active')) {
        if (e.target === modal) {
            closeResumeModal();
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeResumeModal();
    }
});

window.addEventListener('load', () => {

    ScrollTrigger.refresh();
});