const navigationType = () =>
    performance.getEntriesByType?.('navigation')?.[0]?.type || '';

const revealPage = () => {
    document.body?.classList.remove('is-leaving');
    document.documentElement.classList.add('is-loaded', 'is-ready');
    document.querySelector('.site-loader')?.remove();
};

if (navigationType() === 'back_forward') {
    revealPage();
}

window.addEventListener('pageshow', revealPage);
window.addEventListener('pagehide', revealPage);
window.addEventListener('popstate', revealPage);

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    const replayMenuFooterTitle = () => {
        navMenu?.querySelectorAll('.navbar-menu-panel .footer-title .split-word-inner').forEach((el) => {
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.removeProperty('animation');
        });
    };

    const setNavOpen = (isOpen) => {
        navMenu?.classList.toggle('is-open', isOpen);
        navToggle?.classList.toggle('is-open', isOpen);
        navbar?.classList.toggle('is-open', isOpen);
        document.body.classList.toggle('nav-open', isOpen);
        navToggle?.setAttribute('aria-expanded', String(isOpen));
        navToggle?.setAttribute('aria-label', isOpen ? 'Close menu' : 'Toggle menu');
        if (isOpen) {
            requestAnimationFrame(replayMenuFooterTitle);
        }
    };

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            setNavOpen(!navMenu.classList.contains('is-open'));
        });
    }

    const pressables = document.querySelectorAll(
        '.navbar-menu-items .button, .navbar-brand, .navbar-menu-panel .footer-link'
    );
    pressables.forEach((el) => {
        const press = (on) => el.classList.toggle('is-pressing', on);
        el.addEventListener('pointerdown', () => press(true));
        ['pointerup', 'pointercancel', 'pointerleave', 'blur'].forEach((type) => {
            el.addEventListener(type, () => press(false));
        });
    });

    const worksNavBtn = document.getElementById('worksNavBtn');
    if (worksNavBtn) {
        worksNavBtn.addEventListener('click', () => {
            setNavOpen(false);
            window.location.href = 'works.html';
        });
    }

    const filterButtons = document.querySelectorAll('.filter-button[data-filter]');
    const filterTargets = document.querySelectorAll('[data-category]');
    const worksTitle = document.querySelector('.works-title');

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');

            filterButtons.forEach((btn) => btn.classList.remove('filter-button--active'));
            button.classList.add('filter-button--active');

            filterTargets.forEach((card) => {
                const category = card.getAttribute('data-category');
                const show = filter === 'all' || category === filter;
                card.style.display = show ? '' : 'none';
            });

            const label = button.querySelector('.filter-label');
            if (worksTitle && label) {
                worksTitle.textContent = label.textContent;
            }
        });
    });

    const initialFilter = new URLSearchParams(window.location.search).get('filter');
    if (initialFilter) {
        const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(initialFilter) : initialFilter;
        const match = document.querySelector(`.filter-button[data-filter="${escaped}"]`);
        match?.click();
    }

    const tabGroups = document.querySelectorAll('[data-image-tabs]');
    tabGroups.forEach((group) => {
        const target = document.getElementById(group.getAttribute('data-image-tabs'));
        if (!target) return;

        const buttons = group.querySelectorAll('.filter-button[data-src]');
        const prefix = group.getAttribute('data-tabs-alt') || 'Design system';

        const apply = (button) => {
            buttons.forEach((btn) => btn.classList.remove('filter-button--active'));
            button.classList.add('filter-button--active');

            const sources = button.getAttribute('data-src').split('|').map((src) => src.trim()).filter(Boolean);
            const label = button.querySelector('.filter-label');
            const alt = label ? `${prefix}: ${label.textContent.trim()}` : prefix;

            if (target.tagName === 'IMG') {
                target.src = sources[0];
                target.alt = alt;
                return;
            }

            target.replaceChildren(...sources.map((src) => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = alt;
                const compact = button.getAttribute('data-ds-size') === 'compact';
                img.className = compact
                    ? 'project-image project-image--karma-ds project-image--karma-ds-compact'
                    : 'project-image project-image--karma-ds';
                return img;
            }));
        };

        buttons.forEach((button) => {
            button.addEventListener('click', () => apply(button));
        });
    });

    initProjectScrollArrows();
    initMotion();
});

const initProjectScrollArrows = () => {
    document.querySelectorAll('.project-scroll--gallery').forEach((scroller) => {
        const track = scroller.querySelector('.project-scroll-track');
        const arrow = scroller.querySelector('.project-scroll-arrow');
        if (!track || !arrow) return;

        const images = () => [...track.querySelectorAll(':scope > .project-image')];

        const markOrientation = (img) => {
            if (!img.naturalWidth) return;
            const landscape = img.naturalWidth > img.naturalHeight;
            img.classList.toggle('is-landscape', landscape);
            img.classList.toggle('is-portrait', !landscape);
        };

        images().forEach((img) => {
            if (img.complete) {
                markOrientation(img);
            } else {
                img.addEventListener('load', () => markOrientation(img), { once: true });
            }
        });

        const imageLeft = (img) => {
            const trackRect = track.getBoundingClientRect();
            const imgRect = img.getBoundingClientRect();
            return Math.round(track.scrollLeft + (imgRect.left - trackRect.left));
        };

        const getMax = () => Math.max(0, track.scrollWidth - track.clientWidth);

        const update = () => {
            arrow.hidden = getMax() <= 8;
        };

        arrow.addEventListener('click', () => {
            const max = getMax();
            if (max <= 0) return;

            const current = track.scrollLeft;
            const next = images().find((img) => imageLeft(img) > current + 12);

            if (!next || current >= max - 8) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
                return;
            }

            track.scrollTo({ left: imageLeft(next), behavior: 'smooth' });
        });

        track.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    });
};

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const hasFinePointer = () =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const initMotion = () => {
    if (prefersReducedMotion()) {
        document.documentElement.classList.add('is-loaded', 'is-ready');
        return;
    }

    document.documentElement.classList.add('js-motion');
    initSplitWords();
    initReveals();
    initNavHide();
    initLoader();

    if (hasFinePointer()) {
        initCursor();
    }
};

const initLoader = () => {
    if (navigationType() === 'back_forward' || document.querySelector('.site-loader')) {
        revealPage();
        return;
    }

    const loader = document.createElement('div');
    loader.className = 'site-loader';
    loader.setAttribute('aria-hidden', 'true');
    document.body.prepend(loader);

    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        document.documentElement.classList.add('is-loaded');
        window.setTimeout(() => {
            document.documentElement.classList.add('is-ready');
        }, 180);
        const remove = () => loader.remove();
        loader.addEventListener('transitionend', remove, { once: true });
        window.setTimeout(remove, 800);
    };

    const started = performance.now();
    const release = () => {
        const remaining = Math.max(0, 280 - (performance.now() - started));
        window.setTimeout(finish, remaining);
    };

    if (document.readyState === 'complete') {
        release();
    } else {
        window.addEventListener('load', release, { once: true });
    }
    window.setTimeout(finish, 900);
};

const initNavHide = () => {
    const nav = document.querySelector('.navbar');
    if (!nav) return;

    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
        const y = window.scrollY;
        const goingDown = y > lastY + 2;
        const goingUp = y < lastY - 2;

        if (nav.classList.contains('is-open') || y < 24) {
            nav.classList.remove('is-hidden');
        } else if (goingDown && y > 80) {
            nav.classList.add('is-hidden');
        } else if (goingUp) {
            nav.classList.remove('is-hidden');
        }

        lastY = y;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }, { passive: true });
};

const initReveals = () => {
    const selector = [
        '.hero-quicklinks',
        '.project-card',
        '.explore-section',
        '.works-head',
        '.works-card',
        '.about-hero',
        '.info-section',
        '.contact-body',
        '.project-hero',
        '.project-intro',
        '.project-block',
        '.project-media',
        '.project-next-section',
        '.footer',
    ].join(', ');

    const nodes = [...document.querySelectorAll(selector)];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-inview');
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    nodes.forEach((el, index) => {
        el.classList.add('reveal');
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.92;

        if (inView) {
            el.style.setProperty('--reveal-delay', `${Math.min(index, 6) * 80}ms`);
            requestAnimationFrame(() => el.classList.add('is-inview'));
        } else {
            observer.observe(el);
        }
    });
};

const initCursor = () => {
    const cursor = document.createElement('div');
    cursor.className = 'site-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<div class="site-cursor-dot"><span class="site-cursor-label">Explore</span></div>';
    document.body.appendChild(cursor);

    document.documentElement.classList.add('has-cursor');

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { x: mouse.x, y: mouse.y };
    let visible = false;

    const viewSelector = [
        '.project-card-link',
        '.works-card',
        '.project-next-card',
    ].join(', ');

    const hoverSelector = [
        'a',
        'button',
        '.filter-button',
        '.navbar-toggle',
        'label',
        '[role="button"]',
    ].join(', ');

    const onMove = (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        if (!visible) {
            pos.x = mouse.x;
            pos.y = mouse.y;
            visible = true;
            cursor.classList.add('is-visible');
        }
    };

    const onOver = (event) => {
        const view = event.target.closest(viewSelector);
        const hover = event.target.closest(hoverSelector);
        cursor.classList.toggle('is-view', Boolean(view));
        cursor.classList.toggle('is-hover', Boolean(hover) && !view);
    };

    const tick = () => {
        pos.x += (mouse.x - pos.x) * 0.22;
        pos.y += (mouse.y - pos.y) * 0.22;
        cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        requestAnimationFrame(tick);
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
    document.addEventListener('mouseenter', () => {
        if (visible) cursor.classList.add('is-visible');
    });

    tick();
};

const initSplitWords = () => {
    const nodes = [
        ...document.querySelectorAll('[data-split-words]'),
        ...document.querySelectorAll('.footer .footer-title, .navbar-menu-panel .footer-title'),
    ];

    nodes.forEach((el) => {
        if (el.dataset.splitReady) return;

        const text = el.textContent.replace(/\s+/g, ' ').trim();
        if (!text) return;

        el.dataset.splitReady = 'true';
        el.setAttribute('aria-label', text);
        let index = 0;
        el.innerHTML = text
            .split(' ')
            .map((word) => {
                const html = `<span class="split-word"><span class="split-word-inner" style="--i:${index}">${word}</span></span>`;
                index += 1;
                return html;
            })
            .join(' ');
    });
};
