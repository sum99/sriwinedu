/* =========================================================
   SRI WIN EDUCATION — MAIN APPLICATION SCRIPT
   Version: 1.0.0
   Tech Stack: Vanilla JS (ES6+), GSAP, ScrollTrigger, Lenis, Three.js
   WP-Ready: Yes — modular, commented functions
   ========================================================= */

(function () {
  'use strict';

  /* -------------------------------------------------------
     TABLE OF CONTENTS
     1. Constants & Config
     2. Utility Functions
     3. Preloader (Three.js Particles)
     4. Lenis Smooth Scroll
     5. GSAP ScrollTrigger Setup
     6. Header Scroll State
     7. Mobile Navigation
     8. Magnetic Buttons
     9. Marquee Animation
     10. Stats Counter Animation
     11. Testimonials Slider
     12. Video Carousel
     13. Gallery Filter & Lightbox
     14. FAQ Accordion
     15. Contact Form Validation
     16. General Page Interactions
     17. Initialization
     ------------------------------------------------------- */

  /* =========================================================
     1. CONSTANTS & CONFIG
     ========================================================= */
  const SELECTORS = {
    preloader: '.preloader',
    preloaderProgress: '.preloader__progress-bar',
    header: '.site-header',
    hamburger: '.hamburger',
    mobileNav: '.mobile-nav',
    mobileNavLinks: '.mobile-nav__link',
    marqueeTrack: '.marquee__track',
    statNumbers: '.stat-item__number',

    videoTrack: '.video-carousel__track',
    videoPrev: '.video-carousel__btn--prev',
    videoNext: '.video-carousel__btn--next',
    galleryFilter: '.gallery-filter',
    galleryItems: '.gallery-item',
    lightbox: '.lightbox',
    lightboxImg: '.lightbox__img',
    lightboxClose: '.lightbox__close',
    lightboxPrev: '.lightbox__prev',
    lightboxNext: '.lightbox__next',
    lightboxCaption: '.lightbox__caption',
    faqItems: '.faq-item',
    animatedElements: '[data-animate]',
    magneticButtons: '.btn--magnetic',
    contactForm: '.contact-form',
  };

  const CONFIG = {
    preloaderDuration: 2000,
    marqueeSpeed: 40, // pixels per second
    statsDuration: 2.5,
  };

  const STATE = {
    isLoaded: false,

    videoIndex: 0,
    lightboxIndex: 0,
    galleryFiltered: [],
    lenis: null,
  };

  /* =========================================================
     2. UTILITY FUNCTIONS
     ========================================================= */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  function getElement(selector) {
    return $(selector);
  }

  function getElements(selector) {
    return $$(selector);
  }

  /* =========================================================
     3. PRELOADER — Three.js Particle Field
     ========================================================= */
  function initPreloader() {
    const preloader = getElement(SELECTORS.preloader);
    const progressBar = getElement(SELECTORS.preloaderProgress);
    if (!preloader) return;

    // Three.js setup for particle background
    const canvas = preloader.querySelector('canvas');
    if (canvas && typeof THREE !== 'undefined') {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Particles
      const particleCount = 120;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const primaryColor = new THREE.Color(0xcc1111);
      const secondaryColor = new THREE.Color(0xf1c02a);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

        const mixRatio = Math.random();
        const c = primaryColor.clone().lerp(secondaryColor, mixRatio);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });

      const particles = new THREE.Points(geometry, material);
      scene.add(particles);

      camera.position.z = 4;

      let animationId;
      function animateParticles() {
        animationId = requestAnimationFrame(animateParticles);
        particles.rotation.y += 0.0015;
        particles.rotation.x += 0.0008;
        renderer.render(scene, camera);
      }
      animateParticles();

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // Clean up after load
      window.addEventListener('preloaderDone', () => {
        cancelAnimationFrame(animationId);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
      }, { once: true });
    }

    // Progress simulation
    let progress = 0;
    const startTime = performance.now();

    function updateProgress() {
      const elapsed = performance.now() - startTime;
      progress = Math.min((elapsed / CONFIG.preloaderDuration) * 100, 100);
      if (progressBar) progressBar.style.width = progress + '%';

      if (progress < 100 && !STATE.isLoaded) {
        requestAnimationFrame(updateProgress);
      }
    }
    updateProgress();

    function completePreloader() {
      STATE.isLoaded = true;
      if (progressBar) progressBar.style.width = '100%';

      setTimeout(() => {
        if (typeof gsap !== 'undefined') {
          gsap.to(preloader, {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
              preloader.style.visibility = 'hidden';
              preloader.style.pointerEvents = 'none';
              window.dispatchEvent(new CustomEvent('preloaderDone'));
              initHeroAnimations();
              initScrollAnimations();
            },
          });
        } else {
          preloader.style.opacity = '0';
          preloader.style.visibility = 'hidden';
          window.dispatchEvent(new CustomEvent('preloaderDone'));
          initHeroAnimations();
          initScrollAnimations();
        }
      }, 400);
    }

// On window load, complete and fade out
    window.addEventListener('load', () => {
      completePreloader();
    });

// Fallback timeout in case window load fires before progress completes
    setTimeout(() => {
      if (!STATE.isLoaded) completePreloader();
    }, CONFIG.preloaderDuration + 500);
  }

  /* =========================================================
     4. LENIS SMOOTH SCROLL
     ========================================================= */
  function initLenis() {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    STATE.lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Handle anchor links (same-page and cross-page)
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -80 });
        }
      });
    });
  }

  /* =========================================================
     5. HASH SCROLL (immediate on page load)
     ========================================================= */
  function initHashScroll() {
    const hash = window.location.hash;
    if (!hash) return;
    const target = document.querySelector(hash);
    if (!target) return;

    const doScroll = () => {
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    };

    if (document.readyState === 'complete') {
      doScroll();
    } else {
      window.addEventListener('load', doScroll, { once: true });
    }
  }

  /* =========================================================
     5. GSAP SCROLLTRIGGER SETUP
     ========================================================= */
  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Generic fade-up animations for data-animate elements
    const animateElements = getElements(SELECTORS.animatedElements);
    animateElements.forEach((el) => {
      const type = el.dataset.animate || 'fade-up';
      let fromVars = { opacity: 0, y: 24 };

      if (type === 'fade') fromVars = { opacity: 0 };
      if (type === 'slide-left') fromVars = { opacity: 0, x: -40 };
      if (type === 'slide-right') fromVars = { opacity: 0, x: 40 };
      if (type === 'scale') fromVars = { opacity: 0, scale: 0.95 };

      gsap.fromTo(
        el,
        fromVars,
        {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Staggered line reveals for section titles
    getElements('.section__header').forEach((header) => {
      gsap.fromTo(
        header.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 85%',
          },
        }
      );
    });

    // Parallax backgrounds
    getElements('[data-parallax]').forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.3;
      gsap.to(el, {
        yPercent: speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    // Service cards stagger
    getElements('.service-card').forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 40, rotateX: 5 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
          delay: (i % 3) * 0.1,
        }
      );
    });

    // Destination cards stagger
    getElements('.destination-card').forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, scale: 0.92 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
          },
          delay: (i % 4) * 0.08,
        }
      );
    });

    // Team cards
    getElements('.team-card').forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
          },
          delay: (i % 4) * 0.1,
        }
      );
    });
  }

  /* =========================================================
     6. HEADER SCROLL STATE
     ========================================================= */
  function initHeaderScroll() {
    const header = getElement(SELECTORS.header);
    if (!header) return;

    let lastScroll = 0;
    const scrollThreshold = 60;

    function onScroll() {
      const currentScroll = window.scrollY || window.pageYOffset;

      if (currentScroll > scrollThreshold) {
        header.classList.add('site-header--scrolled');
      } else {
        header.classList.remove('site-header--scrolled');
      }

      lastScroll = currentScroll;
    }

    // Use Lenis scroll if available, otherwise native
    if (STATE.lenis) {
      STATE.lenis.on('scroll', onScroll);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    onScroll();
  }

  /* =========================================================
     7. HERO ANIMATIONS
     ========================================================= */
  function initHeroAnimations() {
    if (typeof gsap === 'undefined') return;

    const heroLabel = $('.hero__label');
    const heroTitle = $('.hero__title');
    const heroDesc = $('.hero__desc');
    const heroActions = $('.hero__actions');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (heroLabel) {
      tl.to(heroLabel, { opacity: 1, y: 0, duration: 0.8 }, 0.2);
    }
    if (heroTitle) {
      tl.to(heroTitle, { opacity: 1, y: 0, duration: 1 }, 0.4);
    }
    if (heroDesc) {
      tl.to(heroDesc, { opacity: 1, y: 0, duration: 0.8 }, 0.7);
    }
    if (heroActions) {
      tl.to(heroActions, { opacity: 1, y: 0, duration: 0.8 }, 0.9);
    }
  }

  /* =========================================================
     8. MOBILE NAVIGATION
     ========================================================= */
  function initMobileNav() {
    const hamburger = getElement(SELECTORS.hamburger);
    const mobileNav = getElement(SELECTORS.mobileNav);
    const mobileNavLinks = getElements(SELECTORS.mobileNavLinks);
    const closeBtn = getElement('#mobile-nav-close');
    const toggleBtns = getElements('.mobile-nav__link--toggle');

    if (!hamburger || !mobileNav) return;

    function toggleNav() {
      const isOpen = mobileNav.classList.contains('mobile-nav--open');
      hamburger.classList.toggle('hamburger--active', !isOpen);
      mobileNav.classList.toggle('mobile-nav--open', !isOpen);
      document.body.style.overflow = isOpen ? '' : 'hidden';

      if (!isOpen) {
        mobileNavLinks.forEach((link, i) => {
          link.style.transitionDelay = `${0.1 + i * 0.05}s`;
        });
      } else {
        mobileNavLinks.forEach((link) => {
          link.style.transitionDelay = '0s';
        });
      }
    }

    hamburger.addEventListener('click', toggleNav);

    if (closeBtn) {
      closeBtn.addEventListener('click', toggleNav);
    }

    mobileNavLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (!link.classList.contains('mobile-nav__link--toggle')) {
          toggleNav();
        }
      });
    });

    toggleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        const subMenu = btn.nextElementSibling;
        
        btn.setAttribute('aria-expanded', !isOpen);
        subMenu.classList.toggle('mobile-nav__sub--open', !isOpen);
      });
    });
  }

  /* =========================================================
     9. MAGNETIC BUTTONS
     ========================================================= */
  function initMagneticButtons() {
    const buttons = getElements(SELECTORS.magneticButtons);
    if (!buttons.length) return;

    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* =========================================================
     10. MARQUEE ANIMATION
     ========================================================= */
  function initMarquee() {
    const track = getElement(SELECTORS.marqueeTrack);
    if (!track) return;

    const content = track.querySelector('.marquee__content');
    if (!content) return;

    // Clone content for seamless loop
    const clone = content.cloneNode(true);
    track.appendChild(clone);

    let xPos = 0;
    const contentWidth = content.offsetWidth;
    let lastTime = performance.now();
    let isPaused = false;

    const parent = track.closest('.marquee');
    if (parent) {
      parent.addEventListener('mouseenter', () => { isPaused = true; });
      parent.addEventListener('mouseleave', () => { isPaused = false; });
    }

    function animate() {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!isPaused) {
        xPos -= CONFIG.marqueeSpeed * delta;
        if (Math.abs(xPos) >= contentWidth) {
          xPos = 0;
        }
      }

      track.style.transform = `translateX(${xPos}px)`;
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* =========================================================
     11. STATS COUNTER ANIMATION
     ========================================================= */
  function initStatsCounters() {
    const statNumbers = getElements(SELECTORS.statNumbers);
    if (!statNumbers.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const finalText = el.dataset.target || el.textContent;
            const numericValue = parseFloat(finalText.replace(/[^0-9.]/g, ''));
            const suffix = finalText.replace(/[0-9.]/g, '');
            const isDecimal = finalText.includes('.');

            if (typeof gsap !== 'undefined') {
              const animObj = { val: 0 };
              gsap.to(animObj, {
                val: numericValue,
                duration: CONFIG.statsDuration,
                ease: 'power2.out',
                onUpdate: () => {
                  if (isDecimal) {
                    el.textContent = animObj.val.toFixed(0) + suffix;
                  } else {
                    el.textContent = Math.floor(animObj.val) + suffix;
                  }
                },
              });
            } else {
              // Fallback without GSAP
              let current = 0;
              const step = numericValue / (CONFIG.statsDuration * 60);
              const timer = setInterval(() => {
                current += step;
                if (current >= numericValue) {
                  current = numericValue;
                  clearInterval(timer);
                }
                el.textContent = Math.floor(current) + suffix;
              }, 1000 / 60);
            }

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    statNumbers.forEach((num) => {
      // Store final value
      if (!num.dataset.target) num.dataset.target = num.textContent;
      num.textContent = '0' + num.textContent.replace(/[0-9.]/g, '');
      observer.observe(num);
    });
  }

  /* =========================================================
     12. VIDEO CAROUSEL
     ========================================================= */
  function initVideoCarousel() {
    const track = getElement(SELECTORS.videoTrack);
    const prevBtn = getElement(SELECTORS.videoPrev);
    const nextBtn = getElement(SELECTORS.videoNext);
    const slides = track ? track.querySelectorAll('.video-slide') : [];

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;

    function getSlidesPerView() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }

    function updateCarousel() {
      const slidesPerView = getSlidesPerView();
      const maxIndex = Math.max(0, totalSlides - slidesPerView);
      currentIndex = clamp(currentIndex, 0, maxIndex);

      const slideWidth = slides[0].offsetWidth;
      const gap = parseFloat(getComputedStyle(track).gap) || 16;
      const offset = currentIndex * (slideWidth + gap);
      track.style.transform = `translateX(-${offset}px)`;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentIndex = Math.max(0, currentIndex - 1);
        updateCarousel();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const slidesPerView = getSlidesPerView();
        const maxIndex = Math.max(0, totalSlides - slidesPerView);
        currentIndex = Math.min(maxIndex, currentIndex + 1);
        updateCarousel();
      });
    }

    window.addEventListener('resize', updateCarousel);
    updateCarousel();
  }

  /* =========================================================
     14. GALLERY FILTER & LIGHTBOX
     ========================================================= */
  function initGallery() {
    const filterContainer = getElement(SELECTORS.galleryFilter);
    const items = getElements(SELECTORS.galleryItems);
    if (!items.length) return;

    // Filter logic
    if (filterContainer) {
      const filterBtns = filterContainer.querySelectorAll('.gallery-filter__btn');

      filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const filter = btn.dataset.filter || 'all';

          filterBtns.forEach((b) => b.classList.remove('gallery-filter__btn--active'));
          btn.classList.add('gallery-filter__btn--active');

          items.forEach((item) => {
            const category = item.dataset.category || '';
            if (filter === 'all' || category === filter) {
              item.classList.remove('gallery-item--hidden');
            } else {
              item.classList.add('gallery-item--hidden');
            }
          });
        });
      });
    }

    // Lightbox logic
    const lightbox = getElement(SELECTORS.lightbox);
    const lightboxImg = getElement(SELECTORS.lightboxImg);
    const lightboxClose = getElement(SELECTORS.lightboxClose);
    const lightboxPrev = getElement(SELECTORS.lightboxPrev);
    const lightboxNext = getElement(SELECTORS.lightboxNext);
    const lightboxCaption = getElement(SELECTORS.lightboxCaption);

    if (!lightbox || !lightboxImg) return;

    const visibleItems = () => items.filter((item) => !item.classList.contains('gallery-item--hidden'));
    let currentIndex = 0;

    function openLightbox(index) {
      const visible = visibleItems();
      if (!visible.length) return;
      currentIndex = clamp(index, 0, visible.length - 1);
      const item = visible[currentIndex];
      const img = item.querySelector('img');
      const title = item.querySelector('.gallery-item__title')?.textContent || '';
      const category = item.querySelector('.gallery-item__category')?.textContent || '';

      if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || title;
      }
      if (lightboxCaption) {
        lightboxCaption.textContent = title + (category ? ` — ${category}` : '');
      }

      lightbox.classList.add('lightbox--open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('lightbox--open');
      document.body.style.overflow = '';
    }

    function nextImage() {
      const visible = visibleItems();
      openLightbox((currentIndex + 1) % visible.length);
    }

    function prevImage() {
      const visible = visibleItems();
      openLightbox((currentIndex - 1 + visible.length) % visible.length);
    }

    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        // Find the index among visible items
        openLightbox(index);
      });
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxNext) lightboxNext.addEventListener('click', nextImage);
    if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('lightbox--open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    });
  }

  /* =========================================================
     15. FAQ ACCORDION
     ========================================================= */
  function initFaqAccordion() {
    const faqItems = getElements(SELECTORS.faqItems);
    if (!faqItems.length) return;

    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-item__question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('faq-item--open');

        // Close all others (optional accordion behavior)
        faqItems.forEach((other) => {
          if (other !== item) other.classList.remove('faq-item--open');
        });

        item.classList.toggle('faq-item--open', !isOpen);
      });
    });
  }

  /* =========================================================
     16. CONTACT FORM VALIDATION
     ========================================================= */
  function initContactForm() {
    const form = getElement(SELECTORS.contactForm);
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
      let isValid = true;

      inputs.forEach((input) => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = 'var(--color-primary)';
        } else {
          input.style.borderColor = '';
        }
      });

      const emailInput = form.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
          isValid = false;
          emailInput.style.borderColor = 'var(--color-primary)';
        }
      }

      if (isValid) {
        // Show success — in WP this will be handled by backend
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn ? btn.textContent : '';
        if (btn) {
          btn.textContent = 'Message Sent!';
          btn.disabled = true;
          btn.style.background = 'var(--color-secondary)';
          btn.style.color = 'var(--color-gray-900)';
        }

        setTimeout(() => {
          if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.background = '';
            btn.style.color = '';
          }
          form.reset();
        }, 3000);
      }
    });
  }

  /* =========================================================
     17. GENERAL PAGE INTERACTIONS
     ========================================================= */
  function initGeneralInteractions() {
    // Add hover tilt effect to cards with data-tilt
    const tiltCards = getElements('[data-tilt]');
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    if (!isTouchDevice) {
      tiltCards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      });
    }

    // Nav dropdown accessibility: close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        getElements('.main-nav__dropdown').forEach((dd) => {
          dd.style.opacity = '0';
          dd.style.visibility = 'hidden';
        });
      }
    });
  }

  /* =========================================================
     17. HERO SLIDER (Revolution-style Layer Slider)
     ========================================================= */
  function initHeroSlider() {
    const slider = document.getElementById('hero-slider');
    if (!slider) return;

    const track = document.getElementById('hero-slider-track');
    const slides = track ? track.querySelectorAll('.hero-slider__slide') : [];
    const dotsContainer = document.getElementById('hero-slider-dots');
    const contentEl = document.getElementById('hero-slider-content');
    const prevBtn = slider.querySelector('.hero-slider__arrow--prev');
    const nextBtn = slider.querySelector('.hero-slider__arrow--next');

    if (!slides.length) return;

    let currentSlide = 0;
    let autoplayTimer = null;
    const AUTOPLAY_DELAY = 6000;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero-slider__dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', function() { goToSlide(i); });
      dotsContainer.appendChild(dot);
    });

    function populateContent(index) {
      var slide = slides[index];
      var label = slide.dataset.heroLabel || '';
      var line1 = slide.dataset.heroTitleLine1 || '';
      var line2 = slide.dataset.heroTitleLine2 || '';
      var line3 = slide.dataset.heroTitleLine3 || '';
      var desc = slide.dataset.heroDesc || '';
      var btn1Text = slide.dataset.heroBtn1Text || '';
      var btn1Link = slide.dataset.heroBtn1Link || '#';
      var btn2Text = slide.dataset.heroBtn2Text || '';
      var btn2Link = slide.dataset.heroBtn2Link || '#';

      contentEl.querySelector('.hero__label').textContent = label;
      contentEl.querySelectorAll('.hero__title .line-inner')[0].innerHTML = line1;
      contentEl.querySelectorAll('.hero__title .line-inner')[1].innerHTML = line2;
      contentEl.querySelectorAll('.hero__title .line-inner')[2].innerHTML = line3;
      contentEl.querySelector('.hero__desc').textContent = desc;

      var actions = contentEl.querySelector('.hero__actions');
      actions.innerHTML = '<a href="' + btn1Link + '" class="btn btn--primary btn--lg btn--magnetic">' + btn1Text + ' <i class="ph ph-arrow-right"></i></a>' +
        '<a href="' + btn2Link + '" class="btn btn--outline-light btn--lg">' + btn2Text + '</a>';
    }

    function goToSlide(index) {
      if (index === currentSlide) return;
      slides[currentSlide].classList.remove('active');
      contentEl.classList.remove('hero-slide-in');
      setTimeout(function() {
        currentSlide = ((index % slides.length) + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        populateContent(currentSlide);
        contentEl.classList.add('hero-slide-in');
        var dots = dotsContainer.querySelectorAll('.hero-slider__dot');
        dots.forEach(function(d, i) { d.classList.toggle('active', i === currentSlide); });
      }, 50);
      resetAutoplay();
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }
    function startAutoplay() { clearInterval(autoplayTimer); autoplayTimer = setInterval(nextSlide, AUTOPLAY_DELAY); }
    function resetAutoplay() { startAutoplay(); }

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (slides.length > 1) startAutoplay();

    populateContent(0);
    slides[0].classList.add('active');
    contentEl.classList.add('hero-slide-in');
  }

  /* =========================================================
     18. INITIALIZATION
     ========================================================= */
  function init() {
    initPreloader();
    initLenis();
    initHeaderScroll();
    initMobileNav();
    initMagneticButtons();
    initMarquee();
    initStatsCounters();
    initVideoCarousel();
    initGallery();
    initFaqAccordion();
    initContactForm();
    initGeneralInteractions();
    initHeroSlider();
    initHashScroll();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
