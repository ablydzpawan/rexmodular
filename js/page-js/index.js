/* =========================================================
   HOME — intro preloader, "assembling the tower" (first visit
   per session only):

   1. on a dark stage, modules drop into a tower silhouette (podium,
      shaft, crown) bottom up, like a crane placing them, then fill blue
   2. the logo wipes in while the counter and progress line run
      to 90, then a few windows flicker on across the tower
   3. once the page has loaded (or MAX_WAIT has passed) the count
      finishes, the stage lifts and the dark columns slide away one
      after another, uncovering the hero, whose shared timeline
      (js/motion.js, handed over via Rex.beforeHero) plays as they go

   Plus, on every visit, the stronger hero for this page: the
   headline as a character cascade (Rex.heroStyle), and on desktop
   the hero copy drifting up and fading as the page scrolls away
   from it (and back as you return).
   ========================================================= */

(function (Rex) {
    if (Rex.reduceMotion) return;
    Rex.heroStyle = "chars";

    document.addEventListener("DOMContentLoaded", function () {
        var copy = document.querySelector(".hero-section .hero-content");
        if (!copy) return;
        gsap.matchMedia().add("(min-width: 992px)", function () {
            // the copy is centred with translateY(-50%) in CSS at this size: restate
            // it as yPercent so the scroll offset (y) adds to it instead of replacing it
            gsap.set(copy, { yPercent: -50 });
            gsap.to(copy, {
                y: -140,
                opacity: 0,
                ease: "none",
                scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom 30%", scrub: true },
            });
        });
    });
})(window.Rex);

(function (Rex) {
    var root = document.documentElement;
    var preloader = document.querySelector(".preloader");
    // CSS already hides it for repeat visits, reduced motion and no-JS
    if (!preloader || Rex.reduceMotion || root.classList.contains("intro-seen")) return;

    // the tower, top row first, as [first column, last column] on a 6-column grid:
    // a two-module crown, a four-module shaft and a full-width podium
    var ROWS = [[3, 4], [2, 5], [2, 5], [2, 5], [2, 5], [1, 6]];
    var BRAND = "#1177DD";
    var LIT = "#8CC8FF";
    var MAX_WAIT = 4000;

    function buildTower() {
        var tower = preloader.querySelector(".preloader-tower");
        var html = "";
        ROWS.forEach(function (span, row) {
            for (var col = span[0]; col <= span[1]; col++) {
                html += '<span class="preloader-module" style="grid-area:' + (row + 1) + "/" + col + '"' +
                    ' data-order="' + ((ROWS.length - 1 - row) * 0.14 + (col - 1) * 0.04) + '"></span>';
            }
        });
        tower.innerHTML = html;
        return Array.prototype.slice.call(tower.children);
    }

    function pageLoaded() {
        return new Promise(function (resolve) {
            if (document.readyState === "complete") return resolve();
            window.addEventListener("load", resolve, { once: true });
            setTimeout(resolve, MAX_WAIT);
        });
    }

    Rex.beforeHero = function (heroTl) {
        var modules = buildTower();
        var count = preloader.querySelector(".preloader-count-num");
        var counter = { value: 0 };
        var renderCount = function () { count.textContent = String(Math.round(counter.value)).padStart(3, "0"); };

        document.body.style.overflow = "hidden";
        if (Rex.lenis) Rex.lenis.stop();

        // podium first, then up the shaft to the crown; left to right within a row
        var placeOrder = function (i, el) { return parseFloat(el.dataset.order); };
        var lights = gsap.utils.shuffle(modules.slice()).slice(0, 7);

        var build = gsap.timeline({ defaults: { ease: "power3.out" } })
            .from(".preloader-tag, .preloader-count", { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, 0)
            .from(".preloader-ground", { scaleX: 0, duration: 0.9, ease: "expo.out" }, 0.1)
            .from(modules, { y: -70, opacity: 0, duration: 0.55, ease: "back.out(1.6)", stagger: placeOrder }, 0.2)
            .to(modules, { backgroundColor: BRAND, borderColor: BRAND, duration: 0.3, ease: "power1.out", stagger: placeOrder }, 0.5)
            .fromTo(".preloader-logo",
                { clipPath: "inset(0% 100% 0% 0%)" },
                { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "expo.out" }, 0.7)
            .to(counter, { value: 90, duration: 1.8, ease: "power1.inOut", onUpdate: renderCount }, 0.2)
            .to(".preloader-progress span", { scaleX: 0.9, duration: 1.8, ease: "power1.inOut" }, 0.2)
            // windows flicker on and stay lit (an odd number of yoyo passes ends "on")
            .to(lights, { backgroundColor: LIT, borderColor: LIT, duration: 0.08, ease: "none", repeat: 2, yoyo: true, stagger: 0.07 }, ">-0.2");

        function exit() {
            gsap.timeline({ onComplete: function () { preloader.remove(); } })
                .to(counter, { value: 100, duration: 0.4, ease: "power2.out", onUpdate: renderCount })
                .to(".preloader-progress span", { scaleX: 1, duration: 0.4, ease: "power2.out" }, "<")
                .to(".preloader-stage, .preloader-meta, .preloader-progress", {
                    y: -40, opacity: 0, duration: 0.5, ease: "power2.in", stagger: 0.05,
                }, "+=0.15")
                .to(".preloader-panels span", { yPercent: -100, duration: 1, ease: "expo.inOut", stagger: 0.07 }, "-=0.2")
                .call(function () {
                    document.body.style.overflow = "";
                    if (Rex.lenis) Rex.lenis.start();
                    heroTl.play();
                }, null, "-=0.6");
        }

        Promise.all([build.then(), pageLoaded()]).then(exit);
    };
})(window.Rex);
