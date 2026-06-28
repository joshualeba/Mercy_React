/* ===============================================
   PROYECTO: MERCY - LÓGICA PRINCIPAL (REFACTORED)
   =============================================== */

// 1. LOADER: Ocultar al cargar (Seguridad extra)
const hideLoader = () => {
    const loader = document.getElementById("loader-screen");
    if (loader && loader.style.display !== 'none') {
        loader.style.transition = "opacity 0.5s ease";
        loader.style.opacity = "0";
        setTimeout(() => {
            loader.style.display = "none";
            document.body.classList.remove('loader_bg');
        }, 500);
    }
};

window.addEventListener("load", hideLoader);
setTimeout(hideLoader, 3000); // 3s max timeout

document.addEventListener('DOMContentLoaded', () => {
    
    // 2. NAVBAR: Efecto scroll
    const navbar = document.querySelector('.navbar-custom');
    if (navbar) {
        const updateNavbar = () => {
            if (window.scrollY > 50 || window.innerWidth < 992) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', updateNavbar);
        window.addEventListener('resize', updateNavbar);
        updateNavbar();
    }

    // 3. EFECTO TYPED: Hero section
    const typedTarget = document.getElementById('typed-text');
    if (typedTarget && typeof Typed !== 'undefined') {
        try {
            new Typed('#typed-text', {
                strings: [
                    'simular tu futuro financiero',
                    'planificar tus ahorros',
                    'entender tus créditos',
                    'alcanzar tus metas',
                    'invertir con confianza',
                    'dominar tus finanzas'
                ],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 1500,
                loop: true,
                smartBackspace: true
            });
        } catch (e) {
            console.error("Error al iniciar Typed:", e);
        }
    }

    // 4. LAZY LOAD: Revelar secciones al hacer scroll
    const lazyElements = document.querySelectorAll(".lazy-load");
    if (lazyElements.length > 0 && 'IntersectionObserver' in window) {
        const observerOptions = { threshold: 0.1 };
        const lazyObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        lazyElements.forEach(el => lazyObserver.observe(el));
    }

    // 5. SWIPER: Carrusel de testimonios (Solo si existe .mySwiper)
    if (document.querySelector('.mySwiper') && typeof Swiper !== 'undefined') {
        try {
            new Swiper('.mySwiper', {
                slidesPerView: 1,
                spaceBetween: 30,
                loop: true,
                grabCursor: true,
                autoplay: { delay: 4000, disableOnInteraction: false },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                breakpoints: {
                    768: { slidesPerView: 2 },
                    992: { slidesPerView: 3 }
                }
            });
        } catch (e) {
            console.warn("Error al iniciar Swiper:", e);
        }
    }

    // 6. CARRUSEL "POR QUÉ MERCY": Lógica de elipsis/slides
    const track = document.getElementById('whyTrack');
    const dotsContainer = document.getElementById('whyDots');
    const prevBtn = document.getElementById('whyPrev');
    const nextBtn = document.getElementById('whyNext');

    if (track && dotsContainer && prevBtn && nextBtn) {
        const slides = Array.from(track.querySelectorAll('.why-slide'));
        let currentIndex = 0;

        const getSlidesVisible = () => {
            if (window.innerWidth < 768) return 1;
            if (window.innerWidth < 992) return 2;
            return 3;
        };

        const buildDots = () => {
            dotsContainer.innerHTML = '';
            const pages = Math.ceil(slides.length / getSlidesVisible());
            for (let i = 0; i < pages; i++) {
                const dot = document.createElement('button');
                dot.className = 'why-dot' + (i === 0 ? ' active' : '');
                dot.addEventListener('click', () => { currentIndex = i * getSlidesVisible(); updateCarousel(); });
                dotsContainer.appendChild(dot);
            }
        };

        const updateCarousel = () => {
            const sv = getSlidesVisible();
            const maxIndex = slides.length - sv;
            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const slideWidth = slides[0].offsetWidth + 24; // 24px is gap
            track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
            
            // Update dots
            const pageIndex = Math.floor(currentIndex / sv);
            dotsContainer.querySelectorAll('.why-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === pageIndex);
            });
        };

        nextBtn.addEventListener('click', () => {
            const sv = getSlidesVisible();
            if (currentIndex < slides.length - sv) currentIndex++;
            else currentIndex = 0;
            updateCarousel();
        });

        prevBtn.addEventListener('click', () => {
            const sv = getSlidesVisible();
            if (currentIndex > 0) currentIndex--;
            else currentIndex = slides.length - sv;
            updateCarousel();
        });

        window.addEventListener('resize', () => { buildDots(); updateCarousel(); });
        buildDots();
        updateCarousel();
    }

    // 7. MODALES Y OTROS (Checks de existencia)
    const setupModal = (btnId, modalId, closeId) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        const close = document.getElementById(closeId);
        if (btn && modal) {
            btn.addEventListener('click', () => modal.style.display = 'flex');
            if (close) close.addEventListener('click', () => modal.style.display = 'none');
            window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
        }
    };

    setupModal('btn-info', 'info-modal', 'btn-ok');
    setupModal('termsLink', 'terms-modal', 'btn-terms-ok');

    // Modal de features individuales (Ver más)
    const featureModal = document.getElementById('feature-detail-modal');
    if (featureModal) {
        document.querySelectorAll('.feature-more-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const title = document.getElementById('feature-modal-title');
                const desc = document.getElementById('feature-modal-desc');
                if (title) title.textContent = btn.getAttribute('data-title');
                if (desc) desc.textContent = btn.getAttribute('data-desc');
                featureModal.style.display = 'flex';
            });
        });
        const closeBtns = ['close-feature-modal', 'close-feature-modal-btn'];
        closeBtns.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', () => featureModal.style.display = 'none');
        });
    }

    // 8. CHATBOT LANDING
    const chatTrigger = document.getElementById('landingChatbotTriggerBtn');
    const chatContainer = document.getElementById('landingChatbotContainer');
    const chatClose = document.getElementById('closeLandingChatbotBtn');
    
    if (chatTrigger && chatContainer) {
        chatTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            chatContainer.classList.toggle('d-none');
        });
        if (chatClose) chatClose.addEventListener('click', () => chatContainer.classList.add('d-none'));
    }
});
