/* =========================================================
   OFFCANVAS — the mobile menu drawer. Vanilla replacement for
   Bootstrap's offcanvas JS (same data-bs-toggle / data-bs-target /
   data-bs-dismiss markup, same .show / .hiding classes the styles
   in scss/layout/_offcanvas-menu.scss already use), so the ~90KB
   Bootstrap bundle isn't needed.

   Opening stops Lenis and the page scroll behind the drawer, flags
   <html class="menu-open"> (keeps the header from hiding), moves
   focus into the drawer and staggers the menu items in. Escape, a
   click outside or the close button shut it; focus returns to the
   trigger. Also wires the "Our Work" submenu toggle.
   Part of js/min/common.bundle.js; exposes Rex.initOffcanvas.
   ========================================================= */

(function (Rex) {
    var open = null;
    var openTrigger = null;

    function onKeydown(e) {
        if (e.key === "Escape" && open) hide(open);
    }

    function onOutsideClick(e) {
        if (open && !open.contains(e.target) && !(openTrigger && openTrigger.contains(e.target))) hide(open);
    }

    function show(panel, trigger) {
        if (panel.classList.contains("show")) return;
        open = panel;
        openTrigger = trigger || null;

        document.body.style.overflow = "hidden";
        document.documentElement.classList.add("menu-open");
        if (Rex.lenis) Rex.lenis.stop();
        if (trigger) trigger.setAttribute("aria-expanded", "true");

        panel.classList.add("show");
        panel.focus();
        document.addEventListener("keydown", onKeydown);
        document.addEventListener("click", onOutsideClick);

        if (!Rex.reduceMotion) {
            gsap.fromTo(panel.querySelectorAll(".menu > li"),
                { opacity: 0, x: 40 },
                { opacity: 1, x: 0, duration: 0.6, ease: Rex.ease, stagger: 0.06, delay: 0.15, clearProps: "transform,opacity" });
        }
    }

    function hide(panel) {
        if (!panel.classList.contains("show")) return;
        panel.classList.add("hiding");
        panel.classList.remove("show");

        document.body.style.overflow = "";
        document.documentElement.classList.remove("menu-open");
        if (Rex.lenis) Rex.lenis.start();
        if (openTrigger) openTrigger.setAttribute("aria-expanded", "false");

        var onEnd = function (e) {
            if (e.target !== panel || e.propertyName !== "transform") return;
            panel.removeEventListener("transitionend", onEnd);
            panel.classList.remove("hiding");
        };
        panel.addEventListener("transitionend", onEnd);

        document.removeEventListener("keydown", onKeydown);
        document.removeEventListener("click", onOutsideClick);
        if (openTrigger) openTrigger.focus();
        open = null;
        openTrigger = null;
    }

    Rex.initOffcanvas = function () {
        document.querySelectorAll('[data-bs-toggle="offcanvas"]').forEach(function (trigger) {
            trigger.setAttribute("aria-expanded", "false");
            trigger.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                var panel = document.querySelector(trigger.getAttribute("data-bs-target"));
                if (!panel) return;
                if (panel.classList.contains("show")) hide(panel);
                else show(panel, trigger);
            });
        });

        document.querySelectorAll('[data-bs-dismiss="offcanvas"]').forEach(function (button) {
            button.addEventListener("click", function () {
                var panel = button.closest(".offcanvas");
                if (panel) hide(panel);
            });
        });

        // "Our Work" submenu inside the drawer
        document.querySelectorAll(".menu-sub-toggle").forEach(function (toggle) {
            toggle.addEventListener("click", function () {
                toggle.setAttribute("aria-expanded", toggle.getAttribute("aria-expanded") !== "true");
            });
        });

        // the menu button only exists below lg; don't leave the drawer open past it
        var desktop = window.matchMedia("(min-width: 992px)");
        desktop.addEventListener("change", function (e) {
            if (e.matches && open) hide(open);
        });
    };
})(window.Rex = window.Rex || {});
