/* =========================================================
   TEXT EFFECTS — shared heading/paragraph reveals, so every
   heading and paragraph on the site animates the same way
   (the rentify-mkt treatment):

   - Headings ("Fade Up Words"): split into words, each rising
     from behind a masked wrapper while fading in, staggered
     start-to-end.

   - Paragraphs ("Line Reveal"): each line rises from behind a
     mask with a soft fade, line after line.

   Part of js/min/common.bundle.js; exposes Rex.revealHeading and
   Rex.revealParagraph.
   ========================================================= */

(function (Rex) {
    // Replaces every word in `el` via `wordFn(word)`, leaving tags
    // (<br>, <em>) and the whitespace between words untouched.
    function splitTokens(el, wordFn) {
        el.innerHTML = el.innerHTML.replace(/(<[^>]+>)|([^<\s]+)/g, function (m, tag, word) {
            return tag ? tag : wordFn(word);
        });
    }

    function headingWords(el) {
        if (!el.dataset.wordSplit) {
            el.dataset.wordSplit = "1";
            splitTokens(el, function (word) {
                return '<span class="word-wrap"><span class="word">' + word + "</span></span>";
            });
        }
        return el.querySelectorAll(".word");
    }

    /* ---------- "Fade Up Words" ----------
       opts.timeline + opts.position: splice into an existing timeline
       (the hero, which plays on load). Omit them for an independent,
       scroll-triggered reveal (every other heading). */
    Rex.revealHeading = function (el, opts) {
        if (!el) return null;
        var words = headingWords(el);
        if (!words.length) return null;
        opts = opts || {};

        var vars = Object.assign({
            yPercent: 120,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: { each: 0.08, from: "start" },
        }, opts.vars || {});

        if (opts.timeline) {
            return opts.timeline.from(words, vars, opts.position != null ? opts.position : 0);
        }

        vars.scrollTrigger = Object.assign({
            trigger: opts.trigger || el,
            start: "top 80%",
            toggleActions: "play none none reverse",
        }, opts.scrollTrigger || {});

        return gsap.from(words, vars);
    };

    /* ---------- "Character Cascade" (the home hero headline) ----------
       Words keep their masks; inside each, every letter rises with a
       slight tilt that straightens as it lands, in one wave across the
       line. Always part of a timeline (it's a load-time intro). */
    Rex.revealChars = function (el, opts) {
        if (!el) return null;
        if (!el.dataset.charSplit) {
            el.dataset.charSplit = "1";
            splitTokens(el, function (word) {
                // keep entities like &amp; whole: split on characters, not on "&", "a", "m"...
                var chars = word.match(/&[a-z#0-9]+;|./gi) || [];
                return '<span class="word-wrap"><span class="word">' + chars.map(function (c) {
                    return '<span class="char">' + c + "</span>";
                }).join("") + "</span></span>";
            });
        }
        var chars = el.querySelectorAll(".char");
        opts = opts || {};
        return opts.timeline.from(chars, Object.assign({
            yPercent: 115,
            rotate: 12,
            opacity: 0,
            transformOrigin: "0% 100%",
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.022,
        }, opts.vars || {}), opts.position != null ? opts.position : 0);
    };

    /* ---------- "Blur In" (eyebrow labels, .section-text-super) ----------
       Each letter starts blurred, transparent and a little low, then
       sharpens into place in a quick left-to-right wave. No masks here,
       so the blur isn't clipped; words stay unbreakable (.blur-word).
       opts.timeline + opts.position: splice into the page entrance.
       Otherwise it plays on scroll and reverses when you scroll back up. */
    Rex.revealBlur = function (el, opts) {
        if (!el) return null;
        if (!el.dataset.blurSplit) {
            el.dataset.blurSplit = "1";
            splitTokens(el, function (word) {
                var chars = word.match(/&[a-z#0-9]+;|./gi) || [];
                return '<span class="blur-word">' + chars.map(function (c) {
                    return '<span class="char">' + c + "</span>";
                }).join("") + "</span>";
            });
        }
        var chars = el.querySelectorAll(".char");
        opts = opts || {};

        var from = { opacity: 0, filter: "blur(12px)", yPercent: 40 };
        var to = Object.assign({
            opacity: 1,
            filter: "blur(0px)",
            yPercent: 0,
            duration: 0.9,
            ease: "power2.out",
            stagger: 0.03,
        }, opts.vars || {});

        if (opts.timeline) return opts.timeline.fromTo(chars, from, to, opts.position != null ? opts.position : 0);
        to.scrollTrigger = Object.assign({
            trigger: opts.trigger || el,
            start: "top 85%",
            toggleActions: "play none none reverse",
        }, opts.scrollTrigger || {});
        return gsap.fromTo(chars, from, to);
    };

    // Line number of each word, from where it sits right now (so it's
    // always correct for the current width, measured when the reveal plays).
    function lineIndexes(words) {
        var tops = [];
        return Array.prototype.map.call(words, function (word) {
            var top = Math.round(word.parentNode.offsetTop);
            var i = tops.indexOf(top);
            if (i < 0) { tops.push(top); i = tops.length - 1; }
            return i;
        });
    }

    /* ---------- "Line Reveal" ----------
       Each line rises from behind a mask with a soft fade, one line
       after the other. The words keep their own masks (the paragraph
       stays a normal block, so justified text still justifies); words
       on the same line just move together.
       opts.timeline + opts.position: splice into the hero timeline.
       Otherwise it plays when the paragraph scrolls in and reverses
       when you scroll back above it. */
    var LINE_FROM = { yPercent: 110, opacity: 0 };

    function lineTween(words, vars) {
        var lines = lineIndexes(words);
        return Object.assign({
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            ease: Rex.ease,
            delay: function (i) { return lines[i] * 0.08; },
        }, vars || {});
    }

    Rex.revealParagraph = function (el, opts) {
        if (!el) return null;
        var words = headingWords(el);
        if (!words.length) return null;
        opts = opts || {};

        if (opts.timeline) {
            return opts.timeline.fromTo(words, LINE_FROM, lineTween(words, opts.vars), opts.position);
        }

        gsap.set(words, LINE_FROM);
        var tween = null;
        return ScrollTrigger.create(Object.assign({
            trigger: opts.trigger || el,
            start: "top 85%",
            onEnter: function () {
                if (tween) tween.kill();
                tween = gsap.to(words, lineTween(words, opts.vars));
            },
            onLeaveBack: function () {
                if (tween) tween.reverse();
            },
        }, opts.scrollTrigger || {}));
    };
})(window.Rex = window.Rex || {});
