import gulp from "gulp";
import sourcemaps from "gulp-sourcemaps";
import gulpSass from "gulp-sass";
import autoPrefixer from "gulp-autoprefixer";
import concat from "gulp-concat";
import * as sass from "sass";
import { Transform } from "stream";
import { createRequire } from "module";

const { src, dest, watch, series, parallel } = gulp;
const scss = gulpSass(sass);
const Terser = createRequire(import.meta.url)("terser");

// Minifies the project's own scripts; vendor *.min.js files pass through
// untouched (they're already minified, and newer syntax in them trips up
// the bundled terser).
function minifyJs() {
  return new Transform({
    objectMode: true,
    transform(file, enc, done) {
      if (file.isBuffer() && !file.path.endsWith(".min.js")) {
        const result = Terser.minify(file.contents.toString());
        if (result.error) return done(new Error(file.relative + ": " + result.error.message));
        file.contents = Buffer.from(result.code);
      }
      done(null, file);
    },
  });
}

// CSS: every non-partial file in scss/ is an entry — common.scss (every
// page) plus one per page or page group (home.scss, work.scss, ...).
function css() {
  return src("scss/*.scss")
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(scss({ outputStyle: "compressed" }).on("error", scss.logError))
    .pipe(autoPrefixer())
    .pipe(sourcemaps.write("."))
    .pipe(dest("css"));
}

// JS: one bundle every page loads — the libraries, then the shared modules
// (motion.js last: it boots everything on DOMContentLoaded) ...
const commonJs = [
  "js/vendor/gsap.min.js",
  "js/vendor/ScrollTrigger.min.js",
  "js/vendor/CustomEase.min.js",
  "js/vendor/lenis.min.js",
  "js/text-effects.js",
  "js/header-effects.js",
  "js/offcanvas.js",
  "js/back-to-top.js",
  "js/motion.js",
];

function jsCommon() {
  return src(commonJs).pipe(minifyJs()).pipe(concat("common.bundle.js")).pipe(dest("js/min"));
}

// ... plus a small script for the pages that need their own behavior.
function jsPages() {
  return src("js/page-js/*.js").pipe(minifyJs()).pipe(dest("js/min/page-js"));
}

const js = parallel(jsCommon, jsPages);

function watchFiles() {
  watch(["scss"], css);
  watch(["js/*.js", "js/vendor/*.js"], jsCommon);
  watch(["js/page-js/*.js"], jsPages);
}

export default series(css, js);
export { watchFiles as watch };
