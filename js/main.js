/* ============================================================
   LOW JING HONG — Portfolio
   ASCII 3D sculpture (Three.js -> live ASCII) · GSAP · Lenis
   CRT cream aesthetic · reference: kvs.services
   ============================================================ */
(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  /* ----------------------------------------------------------
     ASCII 3D SCULPTURE
     Renders a rotating WebGL mesh, downsamples each frame to a
     character grid, and writes it into the <pre id="ascii">.
     ---------------------------------------------------------- */
  function initAscii() {
    if (!window.THREE) return;
    const out = document.getElementById("ascii");
    if (!out) return;

    // Character ramp: space (empty/cream) -> dense (dark ink)
    const RAMP = " .'`^,:;Il!i><~+?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
    const RW = RAMP.length - 1;

    // --- offscreen WebGL renderer (never added to DOM) ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    // --- the sculpture: interwoven torus-knot, organic + dense ---
    const group = new THREE.Group();
    scene.add(group);

    // MeshNormalMaterial -> wide luminance variation -> delicate, scattered
    // ASCII texture (dense rim, sparse interior) like the reference sculpture.
    const geo = new THREE.TorusKnotGeometry(2.0, 0.66, 240, 30, 2, 3);
    const knot = new THREE.Mesh(geo, new THREE.MeshNormalMaterial({ flatShading: false }));
    group.add(knot);

    // a second, smaller inner form for depth/detail
    const geo2 = new THREE.IcosahedronGeometry(1.2, 1);
    const knot2 = new THREE.Mesh(geo2, new THREE.MeshNormalMaterial({ flatShading: true }));
    group.add(knot2);

    // --- 2D sampling canvas ---
    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true });

    let cols = 96, rows = 60, reveal = 0;

    function layout() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const phone = vw < 700;
      const tablet = vw >= 700 && vw < 1100;
      const landscape = vw > vh && vh < 820;   // short landscape (iPad land)
      const box = landscape
        ? Math.min(vw * 0.5, vh * 0.5, 520)     // leave room for bottom name block
        : phone
          ? Math.min(vw * 0.96, vh * 0.5, 560)  // phones: fill width, cap height
          : tablet
            ? Math.min(vw * 0.86, vh * 0.58, 680) // iPad portrait: larger presence
            : Math.min(vw * 0.78, vh * 0.64, 700);
      // monospace cell aspect ~0.56 (w/h). keep sculpture square-ish.
      cols = Math.max(64, Math.min(150, Math.round(box / 7)));
      rows = Math.round(cols * 0.52);
      sampler.width = cols; sampler.height = rows;

      const fs = box / cols;                 // px per column
      const lh = box / rows;                 // px per row
      out.style.fontSize = fs.toFixed(2) + "px";
      out.style.lineHeight = lh.toFixed(2) + "px";

      const rpx = Math.max(220, Math.round(box * 0.6));
      renderer.setSize(rpx, Math.round(rpx * (rows / cols) / 0.52), false);
      camera.aspect = 1;
      // pull the camera closer on smaller screens so the knot fills the
      // frame with the same presence it has on desktop.
      camera.position.z = phone ? 6.6 : tablet ? 7.4 : 9;
      camera.updateProjectionMatrix();
    }
    layout();
    window.addEventListener("resize", layout);

    const clock = new THREE.Clock();
    function frame() {
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      group.rotation.y = t * 0.4 + mouse.x * 0.6;
      group.rotation.x = Math.sin(t * 0.3) * 0.35 + mouse.y * 0.4;
      group.rotation.z = Math.sin(t * 0.18) * 0.2;
      knot2.rotation.y = -t * 0.6;
      knot2.rotation.x = t * 0.3;
      const breathe = 1 + Math.sin(t * 0.8) * 0.04;
      group.scale.setScalar(breathe);

      renderer.render(scene, camera);

      // downsample webgl canvas into char grid
      sctx.clearRect(0, 0, cols, rows);
      sctx.drawImage(renderer.domElement, 0, 0, cols, rows);
      const data = sctx.getImageData(0, 0, cols, rows).data;

      const revealCols = Math.round(cols * reveal);
      let str = "";
      for (let y = 0; y < rows; y++) {
        let line = "";
        for (let x = 0; x < cols; x++) {
          if (x > revealCols) { line += " "; continue; }
          const i = (y * cols + x) * 4;
          const a = data[i + 3];
          if (a < 18) { line += " "; continue; }
          // luminance
          const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
          const idx = Math.min(RW, Math.max(0, Math.round(lum * RW)));
          line += RAMP[idx];
        }
        str += line + "\n";
      }
      out.textContent = str;

      requestAnimationFrame(frame);
    }
    frame();

    if (window.gsap) gsap.to({ v: 0 }, { v: 1, duration: 2.2, ease: "power2.inOut", onUpdate: function () { reveal = this.targets()[0].v; }, delay: 0.1 });
    else reveal = 1;

    if (!isTouch) {
      window.addEventListener("mousemove", (e) => {
        mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      });
    }
  }

  /* ----------------------------------------------------------
     LOADER
     ---------------------------------------------------------- */
  function initLoader(done) {
    const loader = document.getElementById("loader");
    const pct = document.getElementById("loaderPct");
    if (!loader) { done(); return; }
    let n = 0;
    const tick = () => {
      n += Math.random() * 13 + 5;
      if (n >= 100) n = 100;
      pct.textContent = Math.floor(n);
      if (n < 100) setTimeout(tick, 85);
      else if (window.gsap) gsap.to(loader, { opacity: 0, duration: 0.8, ease: "power2.inOut", delay: 0.3, onComplete: () => { loader.style.display = "none"; done(); } });
      else { loader.style.display = "none"; done(); }
    };
    setTimeout(tick, 220);
  }

  /* ----------------------------------------------------------
     LENIS
     ---------------------------------------------------------- */
  let lenis = null;
  function initLenis() {
    if (reduced || typeof Lenis === "undefined") return;
    lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ----------------------------------------------------------
     TEXT SCRAMBLE
     ---------------------------------------------------------- */
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/<>*0123456789";
  function scramble(el, delay) {
    const final = el.dataset.final || el.textContent;
    el.dataset.final = final;
    let frame = 0;
    const total = 16 + final.length;
    setTimeout(() => {
      const id = setInterval(() => {
        let out = "";
        for (let i = 0; i < final.length; i++) {
          if (final[i] === " " || final[i] === "\u00a0") { out += final[i]; continue; }
          const start = (i / final.length) * total * 0.5;
          if (frame > start + 7) out += final[i];
          else if (frame > start) out += CHARS[Math.floor(Math.random() * CHARS.length)];
          else out += "";
        }
        el.textContent = out;
        frame++;
        if (frame > total) { el.textContent = final; clearInterval(id); }
      }, 33);
    }, delay || 0);
  }

  /* ----------------------------------------------------------
     GSAP ANIMATIONS
     ---------------------------------------------------------- */
  function initAnimations() {
    if (!window.gsap) {
      document.querySelectorAll("[data-reveal]").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    // hero text in
    gsap.from(".hero__center > *", { opacity: 0, y: 24, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.3 });
    document.querySelectorAll(".hero [data-scramble]").forEach((el, i) => { el.dataset.final = el.textContent; setTimeout(() => scramble(el, 0), 500 + i * 160); });

    if (!window.ScrollTrigger) { document.querySelectorAll("[data-reveal]").forEach((el) => gsap.to(el, { opacity: 1, y: 0, duration: 0.8 })); return; }

    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });

    gsap.utils.toArray("[data-scramble]").forEach((el) => {
      if (el.closest(".hero")) return;
      el.dataset.final = el.textContent;
      ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => scramble(el, 0) });
    });

    gsap.utils.toArray(".stat__num").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || "0", 10);
      const suf = el.dataset.suf || "";
      const obj = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => gsap.to(obj, { v: target, duration: 2, ease: "power2.out", onUpdate: () => { el.textContent = obj.v.toFixed(dec) + suf; } }) });
    });
  }

  /* ----------------------------------------------------------
     NAV + UI
     ---------------------------------------------------------- */
  function initNav() {
    const menuBtn = document.getElementById("navMenu");
    const menu = document.getElementById("menu");
    if (menuBtn && menu) {
      menuBtn.addEventListener("click", () => { const o = menu.classList.toggle("open"); menu.setAttribute("aria-hidden", String(!o)); });
      menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => menu.classList.remove("open")));
    }
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href"); if (id.length < 2) return;
        const target = document.querySelector(id); if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { duration: 1.3 }); else target.scrollIntoView({ behavior: "smooth" });
      });
    });
    if (window.ScrollTrigger) {
      document.querySelectorAll("main section[id]").forEach((sec) => {
        ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (s) => { const l = document.querySelector('.nav__links a[href="#' + sec.id + '"]'); if (l) l.classList.toggle("is-active", s.isActive); } });
      });
    }
  }

  /* ----------------------------------------------------------
     SHOWREEL — scroll-scrubbed, seamless playback
     Maps the monitor's scroll progress to video.currentTime and
     lerps toward it each frame so scrubbing stays buttery smooth.
     ---------------------------------------------------------- */
  function initShowreel() {
    const video = document.getElementById("showreel");
    const monitor = document.querySelector(".monitor");
    if (!video || !monitor) return;

    let duration = 0, target = 0, current = 0, raf = 0;

    const lerp = () => {
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.001) current = target;
      if (duration && isFinite(current)) {
        try { video.currentTime = current * duration; } catch (e) {}
      }
      raf = requestAnimationFrame(lerp);
    };

    const onMeta = () => {
      duration = video.duration || 0;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(lerp);
    };
    if (video.readyState >= 1) onMeta();
    else video.addEventListener("loadedmetadata", onMeta);

    const setProgress = (p) => { target = Math.max(0, Math.min(1, p)); };

    if (window.gsap && window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: monitor,
        start: "top 85%",
        end: "bottom 15%",
        scrub: true,
        onUpdate: (self) => setProgress(self.progress),
      });
    } else {
      const onScroll = () => {
        const r = monitor.getBoundingClientRect();
        const vh = window.innerHeight;
        setProgress((vh - r.top) / (vh + r.height));
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  function initClock() {
    const els = [document.getElementById("footClock"), document.getElementById("hudClock")].filter(Boolean);
    if (!els.length) return;
    const upd = () => {
      const d = new Date();
      const s = [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
      els.forEach((el) => { el.textContent = el.id === "hudClock" ? s + " MYT" : s; });
    };
    upd(); setInterval(upd, 1000);
  }

  /* ----------------------------------------------------------
     BOOT
     ---------------------------------------------------------- */
  function start() {
    initAscii();
    initLenis();
    initNav();
    initClock();
    initShowreel();
    initLoader(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); initAnimations(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
