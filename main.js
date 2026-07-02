/* =========================================================================
   AMEBA — interactions
   ========================================================================= */
(function () {
  "use strict";
  var docEl = document.documentElement;
  docEl.classList.remove("no-js");
  docEl.classList.add("js");

  /* ---------------------------------------------------- Growth-ring motif
     Concentric, gently off-centre ellipses — a log cross-section that
     reads as tree rings, topographic contours, and an organic "Ameba". */
  function buildRings(opts) {
    opts = opts || {};
    var count = opts.count || 14;
    var size = 600;
    // Centres drift from outer ring to the pith, like real growth rings.
    var cx0 = 296, cy0 = 304, cxN = 342, cyN = 262;
    var rMax = 286, rMin = 9;
    var parts = [];
    for (var i = 0; i < count; i++) {
      var t = i / (count - 1);
      // ease the radius so inner rings sit closer together
      var rt = t * t * 0.45 + t * 0.55;
      var r = rMax + (rMin - rMax) * rt;
      var cx = cx0 + (cxN - cx0) * t;
      var cy = cy0 + (cyN - cy0) * t;
      var ry = r * (0.93 - 0.02 * Math.sin(i)); // slight organic wobble
      var accent = (i % 5 === 3);
      var op = (0.14 + 0.5 * t).toFixed(2);
      parts.push(
        '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
        '" rx="' + r.toFixed(1) + '" ry="' + ry.toFixed(1) +
        '" fill="none" stroke="' + (accent ? "var(--ochre)" : "var(--ink)") +
        '" stroke-width="1.05" vector-effect="non-scaling-stroke" opacity="' + op + '"/>'
      );
    }
    // a couple of radial cracks, as in a dried log
    parts.push('<path d="M' + cxN + ' ' + cyN + ' L150 96" stroke="var(--ink)" stroke-width="1" vector-effect="non-scaling-stroke" opacity="0.18"/>');
    parts.push('<path d="M' + cxN + ' ' + cyN + ' L508 470" stroke="var(--ink)" stroke-width="1" vector-effect="non-scaling-stroke" opacity="0.14"/>');
    // pith
    parts.push('<circle cx="' + cxN + '" cy="' + cyN + '" r="3.6" fill="var(--ochre)"/>');

    return '<svg class="rings' + (opts.spin ? " rings--spin" : "") +
      '" viewBox="0 0 ' + size + ' ' + size +
      '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      parts.join("") + "</svg>";
  }

  var ringHosts = document.querySelectorAll("[data-rings]");
  for (var h = 0; h < ringHosts.length; h++) {
    var spin = ringHosts[h].hasAttribute("data-rings-spin");
    ringHosts[h].innerHTML = buildRings({ spin: spin });
  }

  /* ----------------------------------------------------------- Reveals */
  var revealNodes = document.querySelectorAll("[data-reveal], [data-reveal-list]");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!("IntersectionObserver" in window) || reduce) {
    for (var r = 0; r < revealNodes.length; r++) revealNodes[r].classList.add("is-in");
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    for (var n = 0; n < revealNodes.length; n++) io.observe(revealNodes[n]);
  }

  /* --------------------------------------------------- Header on scroll */
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------- Mobile nav */
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* --------------------------------------------------- Contact form */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var success = form.querySelector("[data-form-success]");
    var whatsappLink = document.getElementById("whatsapp-link");
    var contactMethodInputs = form.querySelectorAll("input[name='contact-method']");

    // Toggle WhatsApp link visibility
    contactMethodInputs.forEach(function(input) {
      input.addEventListener("change", function() {
        if (this.value === "whatsapp") {
          whatsappLink.style.display = "block";
          document.getElementById("submit-btn").style.display = "none";
        } else {
          whatsappLink.style.display = "none";
          document.getElementById("submit-btn").style.display = "inline-block";
        }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      var fields = form.querySelectorAll("input[required], textarea[required]");
      for (var f = 0; f < fields.length; f++) {
        if (!fields[f].value.trim()) {
          fields[f].classList.add("field-error");
          valid = false;
        } else {
          fields[f].classList.remove("field-error");
        }
      }
      if (!valid) return;
      // Check contact method selection
      var contactMethod = form.querySelector("input[name='contact-method']:checked").value;
      if (contactMethod === "whatsapp") {
        // If WhatsApp selected, just show the link
        window.location.href = "https://wa.me/4591442988";
        return;
      }
      // For email, submit form to Formspree
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      }
      form.submit();
    });
    form.addEventListener("input", function (e) {
      if (e.target.classList.contains("field-error") && e.target.value.trim()) {
        e.target.classList.remove("field-error");
      }
    });
  }

  /* ------------------------------------------------- Ambient footage
     Every clip plays silently while in view and pauses when scrolled
     away — atmosphere, not catalogue. Held on its first frame for
     reduced-motion users. No controls, no captions. */
  var clips = document.querySelectorAll("video[data-ambient]");
  if (clips.length) {
    for (var v = 0; v < clips.length; v++) {
      clips[v].muted = true;
      clips[v].playsInline = true;
      clips[v].setAttribute("playsinline", "");
    }
    var playClip = function (video) {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    };
    if (!reduce) {
      if ("IntersectionObserver" in window) {
        var clipIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) playClip(entry.target);
            else entry.target.pause();
          });
        }, { threshold: 0.25 });
        for (var c2 = 0; c2 < clips.length; c2++) clipIO.observe(clips[c2]);
      } else {
        for (var c3 = 0; c3 < clips.length; c3++) playClip(clips[c3]);
      }
    }
  }

  /* The About fixed background video (.about-bg) needs no JS: it sits behind
     the transparent About content and is naturally covered by the opaque CTA
     and footer once you scroll to them. */

  /* Homepage fixed background video — visible only across the Philosophy +
     About range; released before the Services section. */
  var homeBg = document.querySelector("[data-home-bg]");
  if (homeBg) {
    var startEl = document.querySelector(".pull-quote") || document.getElementById("philosophy");
    var servSec = document.getElementById("services");
    var syncHomeBg = function () {
      if (!startEl || !servSec) return;
      var vh = window.innerHeight;
      // only show once the "Arturs Mazurs — on method" pull-quote is reached
      var on = startEl.getBoundingClientRect().top < vh * 0.6 &&
               servSec.getBoundingClientRect().top > vh * 0.45;
      homeBg.classList.toggle("is-on", on);
    };
    syncHomeBg();
    window.addEventListener("scroll", syncHomeBg, { passive: true });
    window.addEventListener("resize", syncHomeBg, { passive: true });
  }
})();
