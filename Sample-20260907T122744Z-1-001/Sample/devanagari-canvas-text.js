/*
 * Correct Devanagari text rendering for jsPDF
 * -------------------------------------------------------------
 * WHY THIS FILE EXISTS:
 * jsPDF draws text glyph-by-glyph in raw Unicode order with no
 * "text shaping" step. Devanagari (like other Indic scripts) needs
 * shaping: the vowel sign f["i"] (U+093F) is stored in Unicode AFTER
 * its consonant but must be DISPLAYED before it, and many consonant
 * clusters form conjunct ligatures. Without shaping, jsPDF scrambles
 * any word containing these - e.g. "मिति" comes out as "मतिि",
 * "सिफारिस" comes out as "सफिारसि". The letters are all there, just
 * in the wrong visual order - which looks exactly like spelling
 * mistakes, even though the source text was correct all along.
 *
 * Real browsers DO shape Devanagari correctly in <canvas> text
 * rendering (they use the OS's text engine under the hood). This
 * file renders each line of Devanagari text to an off-screen canvas
 * using the browser's own correct shaping, then hands jsPDF a
 * ready-made image to place on the page - sidestepping jsPDF's
 * missing shaping engine entirely.
 *
 * USAGE (already wired into script.js's createWardNibedanPdf()):
 *   await DevanagariPdfText.drawText(doc, "मिति", 20, 30, { fontSizePt: 11 });
 *   const lines = await DevanagariPdfText.wrapText(longText, 172, 11, false);
 *
 * Depends on notosansdevanagari-font.js being loaded first (reuses
 * the same embedded font data via window.__NOTO_DEVANAGARI_BASE64__
 * so the font bytes are not duplicated in two files).
 */
(function () {
    "use strict";

    var CANVAS_FONT_FAMILY = "NotoDevanagariCanvas";
    var SCALE = 4; // oversample for crisp text at print resolution
    var PX_PER_PT_96DPI = 96 / 72;
    var MM_PER_PX_AT_SCALE = 25.4 / (96 * SCALE);
    var MM_PER_PX_UNSCALED = 25.4 / 96;

    var fontLoadPromise = null;

    function ensureFontLoaded() {
        if (fontLoadPromise) return fontLoadPromise;

        fontLoadPromise = new Promise(function (resolve, reject) {
            if (typeof window === "undefined" || typeof document === "undefined") {
                reject(new Error("[devanagari-canvas-text.js] Not running in a browser."));
                return;
            }
            var b64 = window.__NOTO_DEVANAGARI_BASE64__;
            if (!b64) {
                reject(new Error(
                    "[devanagari-canvas-text.js] Font data not found on window.__NOTO_DEVANAGARI_BASE64__. " +
                    "Make sure notosansdevanagari-font.js is loaded BEFORE this file."
                ));
                return;
            }
            if (typeof FontFace === "undefined") {
                reject(new Error("[devanagari-canvas-text.js] This browser does not support the FontFace API."));
                return;
            }

            var face = new FontFace(CANVAS_FONT_FAMILY, "url(data:font/ttf;base64," + b64 + ")");
            face.load().then(function (loadedFace) {
                document.fonts.add(loadedFace);
                resolve();
            }).catch(reject);
        });

        return fontLoadPromise;
    }

    function fontString(fontPx, bold) {
        return (bold ? "bold " : "") + fontPx + "px " + CANVAS_FONT_FAMILY;
    }

    // Renders one line of text to a tightly-cropped canvas.
    // Returns the canvas plus pixel metrics needed to place it in the PDF.
    function renderLineToCanvas(text, fontPx, bold, color) {
        var measureCanvas = document.createElement("canvas");
        var mctx = measureCanvas.getContext("2d");
        mctx.font = fontString(fontPx, bold);
        var metrics = mctx.measureText(text);

        var ascent = metrics.actualBoundingBoxAscent;
        var descent = metrics.actualBoundingBoxDescent;
        if (!ascent && ascent !== 0) ascent = fontPx * 0.85;
        if (!descent && descent !== 0) descent = fontPx * 0.3;

        var width = Math.max(1, Math.ceil(metrics.width) + 4);
        var height = Math.max(1, Math.ceil(ascent + descent) + 2);

        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.font = fontString(fontPx, bold);
        ctx.fillStyle = color || "#000000";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(text, 2, ascent);

        return { canvas: canvas, width: width, height: height, ascentPx: ascent };
    }

    /**
     * Draws one line of Devanagari (or any) text into a jsPDF document,
     * with correct Indic shaping, as an image.
     *
     * @param {jsPDF} doc
     * @param {string} text
     * @param {number} xMM - x position in mm. Meaning depends on `align`.
     * @param {number} yMM - baseline y position in mm (matches jsPDF's doc.text() convention).
     * @param {object} opts
     *   fontSizePt {number} default 11
     *   bold {boolean} default false
     *   align {"left"|"center"|"right"} default "left"
     *   color {string} default "#000000"
     * @returns {Promise<{widthMM:number, heightMM:number}>}
     */
    async function drawText(doc, text, xMM, yMM, opts) {
        opts = opts || {};
        if (!text) return { widthMM: 0, heightMM: 0 };

        await ensureFontLoaded();

        var fontSizePt = opts.fontSizePt || 11;
        var bold = !!opts.bold;
        var align = opts.align || "left";
        var color = opts.color || "#000000";

        var fontPx = fontSizePt * PX_PER_PT_96DPI * SCALE;
        var rendered = renderLineToCanvas(text, fontPx, bold, color);

        var widthMM = rendered.width * MM_PER_PX_AT_SCALE;
        var heightMM = rendered.height * MM_PER_PX_AT_SCALE;
        var ascentMM = rendered.ascentPx * MM_PER_PX_AT_SCALE;

        var drawX = xMM;
        if (align === "center") drawX = xMM - widthMM / 2;
        else if (align === "right") drawX = xMM - widthMM;

        var drawY = yMM - ascentMM;

        var dataUrl = rendered.canvas.toDataURL("image/png");
        doc.addImage(dataUrl, "PNG", drawX, drawY, widthMM, heightMM, undefined, "FAST");

        return { widthMM: widthMM, heightMM: heightMM };
    }

    /**
     * Measures the rendered width (in mm) of a line at a given font size,
     * using the same shaping-correct canvas measurement.
     */
    async function measureWidthMM(text, fontSizePt, bold) {
        await ensureFontLoaded();
        var fontPx = (fontSizePt || 11) * PX_PER_PT_96DPI;
        var c = document.createElement("canvas");
        var ctx = c.getContext("2d");
        ctx.font = fontString(fontPx, !!bold);
        return ctx.measureText(text).width * MM_PER_PX_UNSCALED;
    }

    /**
     * Word-wraps `text` to fit within `maxWidthMM`, mirroring the shape of
     * jsPDF's doc.splitTextToSize() but measuring with the real shaped font.
     * Returns an array of lines (always at least one, possibly empty string).
     */
    async function wrapText(text, maxWidthMM, fontSizePt, bold) {
        await ensureFontLoaded();
        if (!text) return [""];

        var words = text.split(/(\s+)/);
        var lines = [];
        var current = "";

        for (var i = 0; i < words.length; i += 1) {
            var chunk = words[i];
            var candidate = current + chunk;
            var trimmedCandidate = candidate.trim();
            var w = trimmedCandidate ? await measureWidthMM(trimmedCandidate, fontSizePt, bold) : 0;

            if (w > maxWidthMM && current.trim() !== "") {
                lines.push(current.trim());
                current = chunk.replace(/^\s+/, "");
            } else {
                current = candidate;
            }
        }
        if (current.trim() !== "") lines.push(current.trim());

        return lines.length ? lines : [""];
    }

    window.DevanagariPdfText = {
        drawText: drawText,
        wrapText: wrapText,
        measureWidthMM: measureWidthMM,
        ensureFontLoaded: ensureFontLoaded
    };
})();