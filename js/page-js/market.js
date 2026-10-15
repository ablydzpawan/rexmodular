/* =========================================================
   MARKET — the 01–05 section tab bar: smooth-scrolls to its
   section (through Lenis when it's running) and highlights the
   section being read. One scroll listener decides the active
   tab, so a long jump can't leave a stale highlight.
   ========================================================= */

(function (Rex) {
    var nav = document.querySelector(".anchor-nav");
    if (!nav) return;

    var list = nav.querySelector(".anchor-nav-list");
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var sections = links.map(function (link) { return document.querySelector(link.getAttribute("href")); });
    var current = null;

    function setActive(link) {
        links.forEach(function (l) {
            l.classList.toggle("active", l === link);
            if (l === link) l.setAttribute("aria-current", "true");
            else l.removeAttribute("aria-current");
        });
        // keep the active tab visible when the strip scrolls sideways on small screens
        if (link && list.scrollWidth > list.clientWidth) {
            list.scrollTo({ left: link.parentElement.offsetLeft - 16, behavior: "smooth" });
        }
    }

    function update() {
        var line = window.innerHeight * 0.4;
        var index = sections.findIndex(function (section) {
            if (!section) return false;
            var r = section.getBoundingClientRect();
            return r.top <= line && r.bottom > line;
        });
        var link = links[index] || null;
        if (link !== current) setActive((current = link));
    }

    window.addEventListener("scroll", update, { passive: true });
    update();

    links.forEach(function (link) {
        link.addEventListener("click", function (e) {
            var target = document.querySelector(link.getAttribute("href"));
            if (!target) return;
            e.preventDefault();
            var offset = -nav.offsetHeight;
            if (Rex.lenis) Rex.lenis.scrollTo(target, { offset: offset });
            else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
            history.replaceState(null, "", link.getAttribute("href"));
        });
    });
})(window.Rex);
