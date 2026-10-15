/* =========================================================
   BACK TO TOP — the fixed round button: shows after SHOW_AFTER
   of scroll, its ring fills with page progress, and clicking it
   scrolls back up (through Lenis when it's running, so Lenis's
   virtual scroll doesn't desync from the real one).
   Part of js/min/common.bundle.js; exposes Rex.initBackToTop.
   ========================================================= */

(function (Rex) {
    var SHOW_AFTER = 50;
    var RADIUS = 22;

    Rex.initBackToTop = function (lenis) {
        var button = document.querySelector(".back-top");
        var ring = document.querySelector(".back-top svg circle:nth-child(2)");
        if (!button || !ring) return;

        var circumference = 2 * Math.PI * RADIUS;
        ring.style.strokeDasharray = circumference;

        function update() {
            var y = lenis ? lenis.scroll : window.scrollY;
            var max = document.documentElement.scrollHeight - window.innerHeight;
            ring.style.strokeDashoffset = circumference * (1 - (max > 0 ? y / max : 0));
            button.classList.toggle("back-top-show", y > SHOW_AFTER);
        }

        if (lenis) lenis.on("scroll", update);
        else window.addEventListener("scroll", update, { passive: true });
        update();

        button.addEventListener("click", function () {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: "smooth" });
        });
    };
})(window.Rex = window.Rex || {});
