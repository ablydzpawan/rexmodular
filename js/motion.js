/* =========================================================
   MOTION — the shared motion layer every page runs (the
   rentify-mkt system): Lenis smooth scroll wired into GSAP's
   ticker, the page entrance (header items first, then the hero
   piece by piece), and one consistent set of scroll reveals
   applied site-wide by class:

   - headings          word fade-up            (text-effects.js)
   - paragraphs, leads line-by-line reveal     (text-effects.js)
   - eyebrows          letter blur-in          (text-effects.js)
   - supporting copy   fade-up per text block  (lists,
                       buttons)
   - images            clip-path wipe + settle
   - card groups       staggered rise

   Every reveal past the hero is scroll-triggered and plays back
   in reverse when you scroll up past it.

   Page scripts (js/page-js/*.js) load after this bundle and may
   set Rex.beforeHero(heroTimeline) to run their own intro first
   (the home preloader) — they get the paused hero timeline and
   play it when ready.

   The <head> flag script adds html.js only when motion is
   allowed (no prefers-reduced-motion); without it nothing here
   animates and all content simply renders.
   Part of js/min/common.bundle.js.
   ========================================================= */

(function (Rex) {
    var root = document.documentElement;
    var REVERSE = "play none none reverse";

    var HEADINGS = ".hero-content-heading, .page-title, .section-text-h2, .section-text-h4, .section-text-h6";
    var SUPPORTING = ".rex-vida-logo, .feature-num, .title-rule, " +
        ".feature-list-title, .dash-list li, .btn, .app-actions";
    var TEXT_BLOCK = ".section-text, .cms, .section-head-end, .section";
    var HEADER_ITEMS = ".header .logo, .header .main-nav-item, .header .menu-button";

    Rex.reduceMotion = !root.classList.contains("js");
    Rex.ease = "power3.out";
    Rex.lenis = null;
    Rex.beforeHero = Rex.beforeHero || null;
    window.rexMotion = true; // tells the <head> failsafe the script booted

    /* ---------- reusable reveals ---------- */

    // Every item in a container fades + rises in, staggered, as the container enters.
    Rex.revealGroup = function (containerSelector, itemSelector, vars) {
        document.querySelectorAll(containerSelector).forEach(function (container) {
            var items = container.querySelectorAll(itemSelector);
            if (!items.length) return;
            gsap.from(items, Object.assign({
                opacity: 0,
                y: 40,
                duration: 0.9,
                ease: Rex.ease,
                stagger: 0.08,
                scrollTrigger: { trigger: container, start: "top 85%", toggleActions: REVERSE },
            }, vars || {}));
        });
    };

    // The mask rises to uncover the image while it settles from a slight zoom.
    Rex.revealImage = function (el, opts) {
        opts = opts || {};
        var from = { clipPath: "inset(100% 0% 0% 0%)", scale: opts.scale != null ? opts.scale : 1.12 };
        var to = { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.3, ease: "power4.out" };
        if (opts.timeline) return opts.timeline.fromTo(el, from, to, opts.position);
        to.scrollTrigger = { trigger: opts.trigger || el, start: "top 80%", toggleActions: REVERSE };
        return gsap.fromTo(el, from, to);
    };

    var iconPop = {
        opacity: 0,
        y: 0,
        scale: 0.4,
        rotate: -18,
        transformOrigin: "50% 50%",
        duration: 0.75,
        delay: 0.15,
        ease: "back.out(2.2)",
        stagger: 0.12,
    };

    /* ---------- hero: plays on load, text first, then the image ---------- */

    // The page entrance, in order: the header items drop in one after
    // another, then the hero content follows piece by piece (video,
    // eyebrow, heading, rule, paragraphs, buttons, then the image).
    function heroTimeline(hero) {
        var q = function (selector) { return hero.querySelectorAll(selector); };
        var tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
        var heading = hero.querySelector(HEADINGS);

        // 1. header (pre-hidden in CSS, so it doesn't flash before this runs)
        var headerItems = document.querySelectorAll(HEADER_ITEMS);
        if (headerItems.length) {
            tl.fromTo(headerItems, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.07, clearProps: "transform" }, 0);
        }
        // 2. the hero starts as the header settles
        tl.addLabel("content", headerItems.length ? "-=0.45" : 0);

        var video = hero.querySelector(".hero-video");
        if (video) tl.fromTo(video, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" }, "content");

        // a page can ask for the stronger character cascade (the home hero: Rex.heroStyle = "chars")
        var cascade = Rex.heroStyle === "chars";
        q(".section-text-super").forEach(function (el) {
            Rex.revealBlur(el, { timeline: tl, position: "content" });
        });
        var eyebrow = q(".rex-vida-logo, .hero-content-tag");
        if (eyebrow.length && cascade) {
            eyebrow.forEach(function (el) {
                Rex.revealHeading(el, { timeline: tl, position: "content", vars: { yPercent: 100, duration: 0.8 } });
            });
        } else if (eyebrow.length) {
            tl.from(eyebrow, { y: 12, opacity: 0, duration: 0.5 }, "content");
        }
        if (heading && cascade) Rex.revealChars(heading, { timeline: tl, position: "content+=0.35" });
        else if (heading) Rex.revealHeading(heading, { timeline: tl, position: "content+=0.15" });

        var rule = q(".title-rule");
        if (rule.length) tl.from(rule, { scaleX: 0, transformOrigin: "left center", duration: 0.6 }, "-=0.6");

        q(".section-text-desc").forEach(function (desc, i) {
            Rex.revealParagraph(desc, { timeline: tl, position: i ? "<0.15" : "-=0.5" });
        });

        var ctas = q(".btn");
        if (ctas.length) {
            tl.from(ctas, {
                y: cascade ? 30 : 16, opacity: 0, scale: 0.9, duration: cascade ? 0.7 : 0.5, ease: "back.out(1.7)", stagger: 0.08, clearProps: "transform",
            }, cascade ? "-=0.8" : "-=0.35");
        }

        q(".reveal .image-wrap img").forEach(function (img, i) {
            Rex.revealImage(img, { timeline: tl, position: i ? "<" : heading ? ">" : "content" });
        });

        // the CSS pre-hide (scss/components/_motion.scss) can lift now that GSAP holds the start states
        var preHidden = q(".hero-content, .section-text");
        if (preHidden.length) gsap.set(preHidden, { visibility: "visible" });
        return tl;
    }

    /* ---------- scroll reveals ---------- */

    function initReveals(hero) {
        var outsideHero = function (el) { return !hero || !hero.contains(el); };

        gsap.utils.toArray(HEADINGS).filter(outsideHero).forEach(function (el) { Rex.revealHeading(el); });
        gsap.utils.toArray(".section-text-desc, .feature-lead").filter(outsideHero).forEach(function (el) { Rex.revealParagraph(el); });
        gsap.utils.toArray(".section-text-super").filter(outsideHero).forEach(function (el) { Rex.revealBlur(el); });

        // supporting copy rises in together with the text block it belongs to
        var blocks = new Map();
        gsap.utils.toArray(SUPPORTING).filter(outsideHero).forEach(function (el) {
            var block = el.closest(TEXT_BLOCK) || el.parentElement;
            if (!blocks.has(block)) blocks.set(block, []);
            blocks.get(block).push(el);
        });
        blocks.forEach(function (items, block) {
            gsap.from(items, {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: Rex.ease,
                stagger: 0.08,
                clearProps: "transform", // don't leave a stray inline translate behind
                scrollTrigger: { trigger: block, start: "top 85%", toggleActions: REVERSE },
            });
        });

        gsap.utils.toArray(".reveal .image-wrap img").filter(outsideHero).forEach(function (img) {
            Rex.revealImage(img, { trigger: img.closest(".reveal") });
        });
        // full-bleed band, diagrams and the slider: wipe only, scaling them would spill out
        gsap.utils.toArray(".bg-buildings, .about-image, .featured-end .project-slider").forEach(function (el) {
            Rex.revealImage(el, { scale: 1 });
        });

        // service cards: a blue bar wipes the title in, then a light sweep uncovers its copy
        gsap.utils.toArray(".services-data").forEach(function (card) {
            var tl = gsap.timeline({
                scrollTrigger: { trigger: card, start: "top 85%", toggleActions: REVERSE },
            });
            Rex.revealWipe(card.querySelector(".h3"), { timeline: tl });
            card.querySelectorAll("p").forEach(function (p) {
                Rex.revealSweep(p, { timeline: tl, position: "-=0.7" });
            });
        });
        Rex.revealGroup(".services", ".icon img, .icon .svg", iconPop);
        Rex.revealGroup(".ecosystem", ".ecosystem-item", { y: 50 });
        Rex.revealGroup(".ecosystem", ".ecosystem-icon img", iconPop);
        // stat labels blur in letter by letter, one after another, as their counters run
        gsap.utils.toArray(".stats").forEach(function (stats) {
            var tl = gsap.timeline({
                scrollTrigger: { trigger: stats, start: "top 85%", toggleActions: REVERSE },
            });
            stats.querySelectorAll(".stats-key").forEach(function (key, i) {
                Rex.revealBlur(key, { timeline: tl, position: i * 0.2 });
            });
        });
        Rex.revealGroup(".form-contact", ".form-group", { y: 30 });
        Rex.revealGroup(".anchor-nav-list", "li", { y: 20, duration: 0.7, stagger: 0.05 });
        Rex.revealGroup(".lets-connect", ".footer-logo img", { y: 60 });
    }

    /* ---------- boot ---------- */

    function initLenis() {
        Rex.lenis = new Lenis({
            duration: 1.15,
            easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
            smoothWheel: true,
        });
        Rex.lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(function (time) { Rex.lenis.raf(time * 1000); });
        // Lenis already smooths the frame timing; let GSAP defer to it
        gsap.ticker.lagSmoothing(0);
        window.lenis = Rex.lenis;
    }

    function init() {
        gsap.registerPlugin(ScrollTrigger, CustomEase);
        try {
            sessionStorage.setItem("rex-intro-seen", "1");
        } catch (e) {}

        if (!Rex.reduceMotion) {
            // softened expo-out, the signature ease of Framer-style reveals
            CustomEase.create("framerReveal", "0.16, 1, 0.3, 1");
            Rex.ease = "framerReveal";
            initLenis();
        }

        Rex.initHeader(Rex.lenis);
        Rex.initOffcanvas();
        Rex.initBackToTop(Rex.lenis);
        if (Rex.reduceMotion) return;

        var hero = document.querySelector("main > section:first-child");
        var heroTl = hero ? heroTimeline(hero) : null;
        if (!hero) gsap.set(HEADER_ITEMS, { opacity: 1 }); // no entrance to wait for
        initReveals(hero);

        if (heroTl && typeof Rex.beforeHero === "function") Rex.beforeHero(heroTl);
        else if (heroTl) heroTl.play();

        // images and the slider shift section positions as they load: re-measure
        window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    }

    document.addEventListener("DOMContentLoaded", function () {
        try {
            init();
        } catch (err) {
            // never leave content hidden: finish every animation and drop the pre-hide
            console.error(err);
            root.classList.remove("js");
            gsap.globalTimeline.getChildren(true, true, true).forEach(function (anim) { anim.progress(1); });
        }
    });
})(window.Rex = window.Rex || {});
