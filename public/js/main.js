/* ============================================================
   哈尔滨理工大学光线独立游戏制作社团 · 交互与渲染脚本
   数据源：js/content.js 中的 window.CLUB_DATA
   ============================================================ */
(function () {
  "use strict";

  var DATA = window.CLUB_DATA || {};
  var SITE = DATA.site || {};
  var ARTICLES = window.CLUB_ARTICLES || {};

  /* ---------- 工具函数 ---------- */
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // 光谱渐变色（与 logo 色带一致：深绿→深蓝→浅蓝→白→淡黄→橙→红→暗紫）
  var SPECTRUM_STOPS = [
    ["#2f5c47", "0"], ["#2e4f7f", "0.18"], ["#74aecd", "0.36"], ["#ffffff", "0.5"],
    ["#ecdfaf", "0.64"], ["#e0a163", "0.78"], ["#c96969", "0.9"], ["#7d3f6d", "1"]
  ];

  // 无图时生成「光线」风格占位图（黑底 + 光谱色带 + 白色描边文字）
  function placeholder(label, seed) {
    var stops = SPECTRUM_STOPS.map(function (s) {
      return '<stop offset="' + s[1] + '" stop-color="' + s[0] + '"/>';
    }).join("");
    var text = esc((label || "LIGHTRAY").toUpperCase());
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
      '<defs>' +
      '<linearGradient id="spec" x1="0" y1="0" x2="1" y2="0">' + stops + '</linearGradient>' +
      '<radialGradient id="glow" cx=".5" cy=".5" r=".5">' +
      '<stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="800" height="450" fill="#060708"/>' +
      '<g stroke="rgba(255,255,255,.05)"><path d="M0 90H800M0 180H800M0 270H800M0 360H800"/><path d="M160 0V450M320 0V450M480 0V450M640 0V450"/></g>' +
      '<rect x="0" y="0" width="800" height="450" fill="url(#glow)"/>' +
      '<rect x="60" y="212" width="680" height="6" rx="3" fill="url(#spec)"/>' +
      '<circle cx="400" cy="215" r="90" fill="#ffffff" opacity=".06"/>' +
      '<text x="400" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" letter-spacing="6" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1">' +
      text + '</text>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------- 加载动画 ---------- */
  function initLoader() {
    var loader = $("#loader");
    window.addEventListener("load", function () {
      setTimeout(function () { loader && loader.classList.add("is-done"); }, 2200);
    });
    // 兜底：即使 load 事件延迟也关闭
    setTimeout(function () { loader && loader.classList.add("is-done"); }, 3200);
  }

  /* ---------- 自定义光标 ---------- */
  function initCursor() {
    var c = $("#cursor");
    if (!c) return;
    var x = window.innerWidth / 2, y = window.innerHeight / 2, cx = x, cy = y;
    document.addEventListener("mousemove", function (e) {
      x = e.clientX; y = e.clientY;
    });
    // 平滑跟随（仅用 transform 定位，避免与 left/top 叠加偏移）
    (function loop() {
      cx += (x - cx) * 0.25; cy += (y - cy) * 0.25;
      c.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(loop);
    })();
    // 悬停可交互元素时放大
    var hoverables = "a, button, .menubox__item, .k-card, .work, .act, .news-card, .share-card, .chip";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(hoverables)) c.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(hoverables)) c.classList.remove("is-hover");
    });
    document.addEventListener("mousedown", function () { c.classList.add("is-down"); });
    document.addEventListener("mouseup", function () { c.classList.remove("is-down"); });
  }

  /* ---------- 全屏菜单 ---------- */
  var menuItems = [
    { en: "ABOUT", zh: "简介", num: "01", id: "intro" },
    { en: "TIMELINE", zh: "时间线", num: "02", id: "timeline" },
    { en: "WORKS", zh: "作品", num: "03", id: "works" },
    { en: "KNOWLEDGE", zh: "知识库", num: "04", id: "knowledge" },
    { en: "ACTIVITIES", zh: "活动", num: "05", id: "activities" },
    { en: "NEWS", zh: "资讯", num: "06", id: "news" },
    { en: "SHARING", zh: "分享", num: "07", id: "shares" }
  ];
  function initMenu() {
    var list = $("#menuList");
    var html = "";
    menuItems.forEach(function (m, i) {
      html += '<li class="menubox__item" style="transition-delay:' + (i * 60) + 'ms">' +
        '<a href="#' + m.id + '" data-scroll>' +
        '<span class="menubox__item-zh">' + esc(m.zh) + '</span>' +
        '<span class="menubox__item-en">' + esc(m.en) + '</span>' +
        '<span class="menubox__item-num">' + esc(m.num) + '</span>' +
        '</a></li>';
    });
    list.innerHTML = html;

    var menu = $("#menubox");
    var btn = $("#menuBtn");

    function toggle(open) {
      var willOpen = open == null ? !menu.classList.contains("is-open") : open;
      menu.classList.toggle("is-open", willOpen);
      btn.classList.toggle("is-open", willOpen);
      document.body.classList.toggle("is-menu-open", willOpen);
      menu.setAttribute("aria-hidden", String(!willOpen));
    }
    btn.addEventListener("click", function () { toggle(); });
    // 点击菜单项后关闭
    list.addEventListener("click", function (e) {
      if (e.target.closest("a")) setTimeout(function () { toggle(false); }, 120);
    });
    // ESC 关闭
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) toggle(false);
    });
  }

  /* ---------- 平滑滚动 ---------- */
  function initScroll() {
    $$("a[data-scroll]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id && id.indexOf("#") === 0) {
          var target = $(id);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth" });
          }
        }
      });
    });
  }

  /* ---------- 滚动显现 ---------- */
  var revealIO = null;
  function initReveal() {
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); revealIO.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    }
    $$("[data-reveal]").forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- 光线粒子画布 ---------- */
  function initParticles() {
    var canvas = $("#lightCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W, H, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var parts = [];
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      W = canvas.width = Math.floor(window.innerWidth * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    function spawn() {
      var count = Math.min(90, Math.floor(window.innerWidth / 14));
      parts = [];
      for (var i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: (Math.random() * 1.6 + 0.4) * dpr,
          vx: (Math.random() - 0.5) * 0.12 * dpr,
          vy: -(Math.random() * 0.3 + 0.1) * dpr,
          hue: [210, 200, 150, 45, 30, 8][Math.floor(Math.random() * 6)],
          a: Math.random() * 0.5 + 0.15,
          tw: Math.random() * Math.PI * 2
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy; p.tw += 0.02;
        if (p.y < -20 * dpr) { p.y = H + 20 * dpr; p.x = Math.random() * W; }
        if (p.x < -20 * dpr) p.x = W + 20 * dpr;
        if (p.x > W + 20 * dpr) p.x = -20 * dpr;
        var alpha = p.a * (0.6 + 0.4 * Math.sin(p.tw));
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        glow.addColorStop(0, "hsla(" + p.hue + ",45%,85%," + alpha + ")");
        glow.addColorStop(1, "hsla(" + p.hue + ",45%,85%,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "hsla(" + p.hue + ",15%,96%," + alpha + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) requestAnimationFrame(draw);
    }
    resize();
    spawn();
    window.addEventListener("resize", function () { resize(); spawn(); });
    if (!reduced) requestAnimationFrame(draw);
  }

  /* ============================================================
     配置驱动渲染
     ============================================================ */
  function renderSite() {
    $("#heroName").textContent = SITE.shortName || "光线";
    $("#heroNameEn").textContent = SITE.shortEn || "LIGHT RAY";
    $("#heroSlogan").textContent = SITE.slogan || "";
    $("#heroSloganEn").textContent = SITE.sloganEn || "";
    $("#heroFounded").textContent = SITE.founded || "";
    $("#menuFootEn").textContent = SITE.shortEn || "";
    $("#menuFootZh").textContent = SITE.slogan || "";
    $("#footName").textContent = SITE.name || "";
    $("#footSlogan").textContent = SITE.slogan || "";
    $("#footLocation").textContent = SITE.location || "";
    var mail = $("#footEmail");
    mail.textContent = SITE.email || "";
    mail.href = SITE.email ? "mailto:" + SITE.email : "#";
    $("#footYear").textContent = new Date().getFullYear();
    $("#footCopy").textContent = SITE.name || "";

    var soc = $("#footSocial");
    var socialHtml = "";
    (SITE.social || []).forEach(function (s) {
      socialHtml += '<a href="' + esc(s.url || "#") + '"' + (s.url ? ' target="_blank" rel="noopener"' : "") + ">" + esc(s.label) + "</a>";
    });
    soc.innerHTML = socialHtml;
    document.title = (SITE.name || "光线独立游戏开发社团") + " · " + (SITE.nameEn || "");
  }

  function renderIntro() {
    var intro = DATA.intro || {};
    $("#introLead").textContent = intro.lead || "";
    var paras = (intro.paragraphs || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    $("#introParas").innerHTML = paras;
    var stats = (intro.stats || []).map(function (s) {
      return '<div class="intro__stat" data-reveal><div class="intro__stat-num">' + esc(s.num) + '</div><div class="intro__stat-label">' + esc(s.label) + "</div></div>";
    }).join("");
    $("#introStats").innerHTML = stats;
    var focus = (intro.focus || []).map(function (f) { return '<span class="chip">' + esc(f) + "</span>"; }).join("");
    $("#introFocus").innerHTML = focus;
  }

  function renderTimeline() {
    var items = DATA.timeline || [];
    var cardsHtml = items.map(function (t, i) {
      var img = t.image ? '<img class="timeline__thumb" src="' + esc(t.image) + '" alt="' + esc(t.title) + '" loading="lazy">'
                       : '<div class="timeline__thumb" style="background-image:url(\'' + placeholder(t.title, t.date) + '\');background-size:cover;background-position:center"></div>';
      return '<article class="timeline__item' + (i === 0 ? " is-active" : "") + '" data-index="' + i + '" data-reveal>' +
        '<div class="timeline__card">' + img +
        '<div class="timeline__content"><div class="timeline__date">' + esc(t.date) + "</div>" +
        '<h3 class="timeline__title">' + esc(t.title) + '</h3><p class="timeline__text">' + esc(t.text) + "</p></div>" +
        "</div></article>";
    }).join("");
    var nodesHtml = items.map(function (t, i) {
      var progress = items.length > 1 ? (i / (items.length - 1)) * 100 : 0;
      return '<button class="timeline__node' + (i === 0 ? " is-active" : "") + '" type="button" data-index="' + i + '" style="left:' + progress + '%" aria-label="' + esc(t.date + " " + t.title) + '">' +
        '<span></span><em>' + esc(t.date) + "</em></button>";
    }).join("");
    $("#timelineList").innerHTML =
      '<div class="timeline__stage" data-reveal>' +
        '<div class="timeline__viewport" tabindex="0" aria-label="横向社团时间线">' +
          '<div class="timeline__track">' + cardsHtml + "</div>" +
        "</div>" +
        '<div class="timeline__axis-wrap" aria-label="停留并滚动鼠标滚轮以浏览时间线">' +
          '<div class="timeline__axis">' +
            '<span class="timeline__ray"></span>' + nodesHtml +
          "</div>" +
          '<div class="timeline__hint">HOVER SPECTRUM + WHEEL TO SCRUB</div>' +
        "</div>" +
      "</div>";
    initTimelineScrubber();
  }

  function initTimelineScrubber() {
    var root = $("#timelineList .timeline__stage");
    if (!root) return;
    var viewport = root.querySelector(".timeline__viewport");
    var track = root.querySelector(".timeline__track");
    var axis = root.querySelector(".timeline__axis-wrap");
    var ray = root.querySelector(".timeline__ray");
    var items = Array.prototype.slice.call(root.querySelectorAll(".timeline__item"));
    var nodes = Array.prototype.slice.call(root.querySelectorAll(".timeline__node"));
    var index = 0;

    function clamp(n) {
      return Math.max(0, Math.min(items.length - 1, n));
    }

    function update(next) {
      if (!items.length) return;
      index = clamp(next);
      items.forEach(function (el, i) { el.classList.toggle("is-active", i === index); });
      nodes.forEach(function (el, i) { el.classList.toggle("is-active", i === index); });

      var active = items[index];
      var target = viewport.clientWidth / 2 - (active.offsetLeft + active.offsetWidth / 2);
      track.style.transform = "translate3d(" + target + "px,0,0)";

      var currentNode = nodes[index];
      var nextNode = nodes[Math.min(index + 1, nodes.length - 1)];
      var axisBox = currentNode.parentElement.getBoundingClientRect();
      var currentBox = currentNode.getBoundingClientRect();
      var nextBox = nextNode.getBoundingClientRect();
      var start = currentBox.left + currentBox.width / 2 - axisBox.left;
      var end = nextBox.left + nextBox.width / 2 - axisBox.left;
      root.style.setProperty("--timeline-progress", items.length > 1 ? String(index / (items.length - 1)) : "0");
      root.style.setProperty("--ray-left", start + "px");
      root.style.setProperty("--ray-width", Math.max(0, end - start) + "px");
      root.classList.toggle("is-final", index === items.length - 1);
      if (ray) {
        ray.classList.remove("is-shooting");
        void ray.offsetWidth;
        ray.classList.add("is-shooting");
      }
    }

    axis.addEventListener("wheel", function (e) {
      if (!items.length) return;
      e.preventDefault();
      var dir = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
      update(index + dir);
    }, { passive: false });

    nodes.forEach(function (node) {
      node.addEventListener("click", function () {
        update(Number(node.getAttribute("data-index")) || 0);
      });
    });

    window.addEventListener("resize", function () { update(index); });
    update(0);
  }

  function renderWorks() {
    var html = (DATA.works || []).map(function (w, i) {
      var img = w.cover ? '<img src="' + esc(w.cover) + '" alt="' + esc(w.name) + '" loading="lazy">'
                       : '<img src="' + placeholder(w.nameEn || w.name, w.name) + '" alt="' + esc(w.name) + '" loading="lazy">';
      var statusCls = w.status && (w.status.indexOf("开发") >= 0 || w.status.toLowerCase().indexOf("dev") >= 0) ? " work__status--dev" : "";
      var tags = (w.tags || []).map(function (t) { return '<span class="work__tag">' + esc(t) + "</span>"; }).join("");
      var links = (w.links || []).map(function (l) {
        var isPlay = (l.type || "download").toLowerCase() === "play";
        var cls = isPlay ? "work__link work__link--play" : "work__link";
        var icon = isPlay ? "▶ " : "⬇ ";
        return '<a class="' + cls + '" href="' + esc(l.url || "#") + '"' + (l.url ? ' target="_blank" rel="noopener"' : "") + ">" + icon + esc(l.label) + "</a>";
      }).join("");
      return '<article class="work" data-reveal>' +
        '<div class="work__media">' + img +
        '<span class="work__status' + statusCls + '">' + esc(w.status || "") + "</span>" +
        '<h3 class="work__name">' + esc(w.name) + '</h3>' +
        '<span class="work__name-en">' + esc(w.nameEn || "") + "</span></div>" +
        '<div class="work__body">' +
        '<div class="work__tags">' + tags + "</div>" +
        '<p class="work__desc">' + esc(w.desc) + "</p>" +
        '<div class="work__links">' + links + "</div>" +
        "</div></article>";
    }).join("");
    $("#worksList").innerHTML = html;
  }

  function renderKnowledge() {
    var items = DATA.knowledge || [];

    // 知识库 PDF 目录里的模块，按出现顺序去重生成栏目标签
    var cats = [];
    items.forEach(function (k) {
      var c = k.category || "其他";
      if (cats.indexOf(c) < 0) cats.push(c);
    });

    var tabsHtml = '<div class="knowledge__tabs" role="tablist" aria-label="知识库分类">' +
      '<button class="knowledge__tab is-active" type="button" data-cat="">全部</button>' +
      cats.map(function (c) {
        return '<button class="knowledge__tab" type="button" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
      }).join("") + "</div>";

    var cardsHtml = items.map(function (k) {
      var tags = (k.tags || []).map(function (t) { return '<span class="k-card__tag">' + esc(t) + "</span>"; }).join("");
      var hasArticle = !!(k.articleId && ARTICLES[k.articleId]);
      var cover = hasArticle && ARTICLES[k.articleId].cover ? '<img class="k-card__cover" src="' + esc(ARTICLES[k.articleId].cover) + '" alt="" loading="lazy">' : "";
      var metaRight = hasArticle ? '<span class="k-card__more">阅读全文 →</span>' : '<span>' + esc(k.date || "") + "</span>";
      return '<article class="k-card' + (hasArticle ? " k-card--link" : "") + '"' +
        (hasArticle ? ' data-article-id="' + esc(k.articleId) + '"' : "") +
        ' data-cat="' + esc(k.category || "其他") + '" data-reveal>' + cover +
        '<div class="k-card__cat">' + esc(k.category || "") + "</div>" +
        '<h3 class="k-card__title">' + esc(k.title) + "</h3>" +
        '<p class="k-card__desc">' + esc(k.desc) + "</p>" +
        '<div class="k-card__tags">' + tags + "</div>" +
        '<div class="k-card__meta"><span>' + esc(k.author || "") + "</span>" + metaRight + "</div>" +
        "</article>";
    }).join("");

    var root = $("#knowledgeList");
    root.innerHTML = tabsHtml + '<div class="knowledge__grid">' + cardsHtml + "</div>";

    // 点击栏目标签，筛选对应分类的卡片
    var tabs = Array.prototype.slice.call(root.querySelectorAll(".knowledge__tab"));
    var cards = Array.prototype.slice.call(root.querySelectorAll(".k-card"));
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        var cat = tab.getAttribute("data-cat") || "";
        cards.forEach(function (card) {
          card.classList.toggle("k-card--hidden", !!(cat && card.getAttribute("data-cat") !== cat));
        });
      });
    });
  }

  function renderActivities() {
    var html = (DATA.activities || []).map(function (a) {
      var link = a.link ? '<a class="work__link" href="' + esc(a.link) + '" target="_blank" rel="noopener">了解详情</a>' : "";
      return '<article class="act" data-reveal>' +
        '<div class="act__side"><span class="act__type">' + esc(a.type || "") + '</span><span class="act__date">' + esc(a.date || "") + "</span></div>" +
        '<div><h3 class="act__name">' + esc(a.name) + "</h3>" +
        '<p class="act__desc">' + esc(a.desc) + "</p>" +
        '<p class="act__result">✦ ' + esc(a.result || "") + "</p>" + link + "</div>" +
        "</article>";
    }).join("");
    $("#activitiesList").innerHTML = html;
  }

  function renderNews() {
    var html = (DATA.news || []).map(function (n) {
      var link = n.link ? '<a class="news-card__link" href="' + esc(n.link) + '" target="_blank" rel="noopener">阅读全文 →</a>' : "";
      return '<article class="news-card" data-reveal>' +
        '<div class="news-card__top"><span class="news-card__date">' + esc(n.date || "") + '</span><span class="news-card__source">' + esc(n.source || "") + "</span></div>" +
        '<h3 class="news-card__title">' + esc(n.title) + "</h3>" +
        '<p class="news-card__summary">' + esc(n.summary) + "</p>" + link +
        "</article>";
    }).join("");
    $("#newsList").innerHTML = html;
  }

  function renderShares() {
    var html = (DATA.shares || []).map(function (s) {
      var hasArticle = !!(s.articleId && ARTICLES[s.articleId]);
      var cover = hasArticle && ARTICLES[s.articleId].cover ? '<img class="share-card__cover" src="' + esc(ARTICLES[s.articleId].cover) + '" alt="" loading="lazy">' : "";
      var link = hasArticle ? '<span class="share-card__link">阅读全文 →</span>'
        : (s.link ? '<a class="share-card__link" href="' + esc(s.link) + '" target="_blank" rel="noopener">查看分享 →</a>' : "");
      return '<article class="share-card' + (hasArticle ? " share-card--link" : "") + '"' +
        (hasArticle ? ' data-article-id="' + esc(s.articleId) + '"' : "") + ' data-reveal>' +
        '<span class="share-card__topic">' + esc(s.topic || "") + "</span>" + cover +
        '<div class="share-card__meta"><span class="share-card__author">' + esc(s.author || "") + '</span><span>' + esc(s.date || "") + "</span></div>" +
        '<h3 class="share-card__title">' + esc(s.title) + "</h3>" +
        '<p class="share-card__desc">' + esc(s.desc) + "</p>" + link +
        "</article>";
    }).join("");
    $("#sharesList").innerHTML = html;
  }

  /* ---------- 文章阅读弹窗 ---------- */
  function initReader() {
    var reader = document.createElement("div");
    reader.className = "reader";
    reader.id = "reader";
    reader.setAttribute("aria-hidden", "true");
    reader.innerHTML =
      '<div class="reader__backdrop" data-reader-close></div>' +
      '<div class="reader__panel" role="dialog" aria-modal="true" aria-label="文章阅读">' +
        '<header class="reader__head">' +
          '<span class="reader__cat" id="readerCat"></span>' +
          '<button class="reader__close" id="readerClose" aria-label="关闭">关闭 ✕</button>' +
        '</header>' +
        '<div class="reader__scroll">' +
          '<h2 class="reader__title" id="readerTitle"></h2>' +
          '<div class="reader__meta"><span class="reader__author" id="readerAuthor"></span><span class="reader__date" id="readerDate"></span></div>' +
          '<div class="reader__body" id="readerBody"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(reader);

    function close() {
      reader.classList.remove("is-open");
      reader.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-reader-open");
    }
    function open(article) {
      if (!article) return;
      $("#readerCat").textContent = article.category || "";
      $("#readerTitle").textContent = article.title || "";
      $("#readerAuthor").textContent = article.author || "";
      $("#readerDate").textContent = article.date || "";
      var bodyHtml = "";
      if (article.body_html) {
        // 后台保存的预渲染 HTML（已在后台用 DOMPurify 消毒）
        bodyHtml = '<div class="reader__html">' + article.body_html + "</div>";
      } else {
        bodyHtml = (article.body || []).map(function (b) {
          if (b.t === "h") return '<h4 class="reader__h">' + esc(b.text) + "</h4>";
          if (b.t === "code") return '<pre class="reader__code"><code>' + esc(b.text) + "</code></pre>";
          return '<p class="reader__p">' + esc(b.text) + "</p>";
        }).join("");
      }
      var coverHtml = article.cover ? '<img class="reader__cover" src="' + esc(article.cover) + '" alt="" loading="lazy">' : "";
      $("#readerBody").innerHTML = coverHtml + bodyHtml;
      reader.classList.add("is-open");
      reader.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-reader-open");
      reader.querySelector(".reader__scroll").scrollTop = 0;
    }

    reader.addEventListener("click", function (e) {
      if (e.target.closest("[data-reader-close]") || (e.target && e.target.id === "readerClose")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && reader.classList.contains("is-open")) close();
    });

    return { open: open, close: close, el: reader };
  }

  function initArticleClicks(reader) {
    ["#knowledgeList", "#sharesList"].forEach(function (sel) {
      var list = $(sel);
      if (!list) return;
      list.addEventListener("click", function (e) {
        var card = e.target.closest("[data-article-id]");
        if (!card) return;
        var article = ARTICLES[card.getAttribute("data-article-id")];
        if (article) reader.open(article);
      });
    });
  }

  /* ---------- 渲染（本地默认内容 / 远程内容合并后统一调用） ---------- */
  function renderAll() {
    renderSite();
    renderIntro();
    renderTimeline();
    renderWorks();
    renderKnowledge();
    renderActivities();
    renderNews();
    renderShares();
    initReveal();
  }

  /* 从 Supabase 拉取管理员保存过的内容，覆盖本地默认值后重新渲染 */
  function loadRemoteContent() {
    var cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey || cfg.url.indexOf(".supabase.co") < 0) return; // 未配置则保持默认内容
    var base = cfg.url.replace(/\/+$/, "");
    var headers = { "apikey": cfg.anonKey, "Authorization": "Bearer " + cfg.anonKey };
    Promise.all([
      fetch(base + "/rest/v1/content?select=data&id=eq.main", { headers: headers }),
      fetch(base + "/rest/v1/articles?select=*", { headers: headers })
    ]).then(function (responses) {
      return Promise.all(responses.map(function (r) { return r.ok ? r.json() : null; }));
    }).then(function (results) {
      var contentRows = results[0];
      var articleRows = results[1];
      var remoteData = (contentRows && contentRows.length && contentRows[0].data) ? contentRows[0].data : null;
      if (remoteData && typeof remoteData === "object") {
        for (var k in remoteData) {
          if (Object.prototype.hasOwnProperty.call(remoteData, k)) DATA[k] = remoteData[k];
        }
      }
      if (articleRows && articleRows.length) {
        var articles = {};
        articleRows.forEach(function (a) { articles[a.id] = a; });
        ARTICLES = articles;
      }
      renderAll();
    }).catch(function () { /* 接口不可用时保持本地默认内容 */ });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    renderAll();
    initLoader();
    initCursor();
    initMenu();
    initScroll();
    initParticles();
    var reader = initReader();
    initArticleClicks(reader);
    loadRemoteContent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
