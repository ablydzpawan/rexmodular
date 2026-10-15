/* =========================================================
   HEADER EFFECTS — the header motion:

   - the bar is fixed; past TOP_ZONE it turns solid (.is-scrolled)
   - scrolling down past HIDE_AFTER slides it up out of view
     (.is-hidden); scrolling back up SHOW_AFTER_UP slides it back in.
     No entrance animation on load. The 0.75s ease slide itself is
     a CSS transition (scss/layout/_header.scss)
   - nav links: a 1px underline slides in from the left on hover
     and carries on out to the right on leave
   - "Our Work" dropdown: CSS opens it on hover/focus; this adds
     click/tap and Escape, and keeps the bar shown while it's open

   It never hides while the mobile menu is open, while keyboard
   focus is inside it, or under reduced motion.
   Part of js/min/common.bundle.js; exposes Rex.initHeader.
   ========================================================= */

(function (Rex) {
    var TOP_ZONE = 10;      // past this the bar turns solid
    var HIDE_AFTER = 50;    // scrolling down past this hides it (eloqwnt: ~50px)
    var SHOW_AFTER_UP = 25; // scrolling back up this far brings it back (eloqwnt: ~25px)

    function initDropdowns(header) {
        var dropdowns = header.querySelectorAll(".has-dropdown");
        var closeAll = function (except) {
            dropdowns.forEach(function (item) {
                if (item === except) return;
                item.classList.remove("open");
                item.querySelector(".main-nav-toggle").setAttribute("aria-expanded", "false");
            });
        };

        dropdowns.forEach(function (item) {
            var toggle = item.querySelector(".main-nav-toggle");
            toggle.addEventListener("click", function (e) {
                e.stopPropagation();
                var isOpen = item.classList.toggle("open");
                toggle.setAttribute("aria-expanded", isOpen);
                closeAll(item);
            });
            item.addEventListener("mouseleave", function () { closeAll(); });
        });

        document.addEventListener("click", function () { closeAll(); });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeAll();
        });
        return closeAll;
    }

    // underline exits to the right, then snaps back (unseen) to its start
    function initUnderlines(header) {
        header.querySelectorAll(".main-nav-link:not(.main-nav-toggle)").forEach(function (link) {
            link.addEventListener("mouseleave", function () {
                if (link.classList.contains("active")) return;
                link.classList.add("is-leaving");
            });
            link.addEventListener("mouseenter", function () {
                link.classList.remove("is-leaving");
            });
            link.addEventListener("transitionend", function () {
                if (!link.classList.contains("is-leaving")) return;
                link.classList.add("no-transition");
                link.classList.remove("is-leaving");
                link.offsetWidth; // apply the reset before transitions come back
                link.classList.remove("no-transition");
            });
        });
    }

    Rex.initHeader = function (lenis) {
        var header = document.querySelector(".header");
        if (!header) return;

        var root = document.documentElement;
        var canHide = !Rex.reduceMotion;
        var closeDropdowns = initDropdowns(header);
        initUnderlines(header);

        var hidden = false;
        var current = function () { return lenis ? lenis.scroll : window.scrollY; };
        var last = current();
        var goingDown = true;
        var turnedAt = last;

        // sticky elements (the market tab bar) sit below the header while it's shown
        function publishOffset() {
            root.style.setProperty("--header-visible-h", hidden ? "0px" : header.offsetHeight + "px");
        }

        function setHidden(value) {
            if (hidden === value) return;
            hidden = value;
            header.classList.toggle("is-hidden", value);
            if (value) closeDropdowns();
            publishOffset();
        }

        function update() {
            var y = current();
            header.classList.toggle("is-scrolled", y > TOP_ZONE);
            if (y === last) return;
            var down = y > last;
            if (down !== goingDown) turnedAt = last; // where the reader changed direction
            goingDown = down;
            last = y;

            if (!canHide) return;
            var keepShown = root.classList.contains("menu-open") || header.contains(document.activeElement);
            if (keepShown || y < HIDE_AFTER) setHidden(false);
            else if (down) setHidden(true);
            else if (turnedAt - y >= SHOW_AFTER_UP) setHidden(false);
        }

        if (lenis) lenis.on("scroll", update);
        else window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", publishOffset);
        update();
        publishOffset();

        // tabbing into a hidden header brings it back
        header.addEventListener("focusin", function () { setHidden(false); });
    };
})(window.Rex = window.Rex || {});
