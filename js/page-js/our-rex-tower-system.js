/* =========================================================
   REX TOWER SYSTEM — the system image slider (Swiper, loaded
   just before this file) and the stat counters, which count up
   from 0 as the stats row scrolls into view.
   ========================================================= */

(function (Rex) {
    new Swiper(".project-slider-js", {
        slidesPerView: 1,
        spaceBetween: 0,
        grabCursor: true,
        pagination: { el: ".swiper-pagination", clickable: true, dynamicBullets: true },
        navigation: { prevEl: ".project-slider-prev", nextEl: ".project-slider-next" },
    });

    if (Rex.reduceMotion) return;

    // "40%" -> counts 0..40 and keeps the suffix; the final width is reserved
    // up front so the layout doesn't shift while the digits change
    document.querySelectorAll(".stats .data").forEach(function (el) {
        var match = el.textContent.trim().match(/^(\D*)([\d.,]+)(.*)$/);
        if (!match) return;
        var end = parseFloat(match[2].replace(/,/g, ""));
        el.style.display = "inline-block";
        el.style.minWidth = el.getBoundingClientRect().width + "px";
        el.style.textAlign = "end";

        var state = { value: 0 };
        var render = function () { el.textContent = match[1] + Math.round(state.value) + match[3]; };
        render();
        gsap.to(state, {
            value: end,
            duration: 1.6,
            ease: "power2.out",
            onUpdate: render,
            scrollTrigger: { trigger: ".stats", start: "top 85%", toggleActions: "play none none reverse" },
        });
    });
})(window.Rex);
