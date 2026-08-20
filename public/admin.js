/* 光线 · 内容管理后台逻辑
 * 依赖：js/content.js（window.CLUB_DATA）、js/articles.js（window.CLUB_ARTICLES）作为种子数据
 * 后端：Netlify Functions（/api/login、/api/content）
 */
(function () {
  "use strict";

  var API_BASE = "/api";
  var TOKEN_KEY = "lr_admin_token";

  var state = { data: null, articles: null };

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------- 令牌 ---------- */
  function getToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  /* ---------- API ---------- */
  function apiLogin(password) {
    return fetch(API_BASE + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .catch(function () { return { ok: false, body: { error: "无法连接后台服务（/api 未运行）。请用 netlify dev 启动，并访问其地址（默认 http://localhost:8888/admin）" } }; });
  }

  function apiGetContent() {
    return fetch(API_BASE + "/content", { headers: { "Accept": "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function apiSaveContent(payload) {
    return fetch(API_BASE + "/content", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; }); });
  }

  /* ---------- 正文块：序列化 / 解析 ---------- */
  function serializeBody(blocks) {
    return (blocks || []).map(function (b) {
      if (b.t === "h") return "## " + b.text;
      if (b.t === "code") return "```\n" + b.text + "\n```";
      return b.text;
    }).join("\n\n");
  }

  function parseBody(text) {
    var lines = String(text || "").split("\n");
    var blocks = [];
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      var t = line.trim();
      if (t === "") { i++; continue; }
      if (t.indexOf("## ") === 0) {
        blocks.push({ t: "h", text: t.slice(3).trim() });
        i++;
      } else if (t === "```") {
        var code = [];
        i++;
        while (i < lines.length && lines[i].trim() !== "```") { code.push(lines[i]); i++; }
        i++; // 跳过闭合 ```
        blocks.push({ t: "code", text: code.join("\n") });
      } else {
        var para = [line];
        i++;
        while (i < lines.length && lines[i].trim() !== "" && lines[i].trim().indexOf("## ") !== 0 && lines[i].trim() !== "```") {
          para.push(lines[i]); i++;
        }
        blocks.push({ t: "p", text: para.join("\n") });
      }
    }
    return blocks;
  }

  /* ---------- 渲染 ---------- */
  function renderTimeline() {
    var items = state.data.timeline || [];
    var html = items.map(function (it, i) {
      return '<div class="tl-item" data-index="' + i + '">' +
        '<div class="tl-item__fields">' +
          '<div><label>日期</label><input data-field="date" value="' + esc(it.date) + '" placeholder="2025.09"></div>' +
          '<div><label>标题</label><input data-field="title" value="' + esc(it.title) + '" placeholder="标题"></div>' +
          '<div class="full"><label>正文</label><textarea data-field="text" rows="2">' + esc(it.text) + '</textarea></div>' +
          '<div class="full"><label>图片地址（可留空）</label><input data-field="image" value="' + esc(it.image || "") + '" placeholder="https://... 或 images/xxx.png"></div>' +
        '</div>' +
        '<div class="tl-item__ops">' +
          '<button class="btn-ghost" data-op="up" ' + (i === 0 ? "disabled" : "") + '>↑ 上移</button>' +
          '<button class="btn-ghost" data-op="down" ' + (i === items.length - 1 ? "disabled" : "") + '>↓ 下移</button>' +
          '<button class="btn-danger" data-op="del">删除</button>' +
        '</div>' +
      '</div>';
    }).join("");
    $("#timelineList").innerHTML = html || '<div class="err">暂无时间线条目，点击右上角「新增时间线」。</div>';
  }

  function findCard(id) {
    var cards = state.data.knowledge || [];
    for (var i = 0; i < cards.length; i++) if (cards[i].articleId === id) return cards[i];
    return null;
  }

  function renderArticles() {
    var ids = Object.keys(state.articles || {});
    var html = ids.map(function (id) {
      var a = state.articles[id];
      var card = findCard(id) || {};
      return '<details class="art-item" data-id="' + esc(id) + '">' +
        '<summary><span class="cat">' + esc(a.category || "未分类") + '</span><span class="title">' + esc(a.title || "（未命名文章）") + '</span>' +
        '<span class="ops"><button class="btn-danger" data-op="del">删除</button></span></summary>' +
        '<div class="art-item__body">' +
          '<div class="row">' +
            '<div><label>标题</label><input data-field="title" value="' + esc(a.title || "") + '"></div>' +
            '<div><label>分类</label><input data-field="category" value="' + esc(a.category || "") + '" placeholder="程序篇 / 策划篇"></div>' +
            '<div><label>作者</label><input data-field="author" value="' + esc(a.author || "") + '"></div>' +
            '<div><label>日期</label><input data-field="date" value="' + esc(a.date || "") + '" placeholder="2025.09"></div>' +
          '</div>' +
          '<div class="row">' +
            '<div class="full"><label>卡片摘要（知识库列表里展示的一句话）</label><input data-field="desc" value="' + esc(card.desc || "") + '"></div>' +
            '<div class="full"><label>标签（用逗号分隔）</label><input data-field="tags" value="' + esc((card.tags || []).join(", ")) + '"></div>' +
          '</div>' +
          '<label>正文（## 标题 / ``` 代码块 / 空行分段）</label>' +
          '<textarea class="body-ta" data-field="body">' + esc(serializeBody(a.body)) + '</textarea>' +
        '</div>' +
      '</details>';
    }).join("");
    $("#articleList").innerHTML = html || '<div class="err">暂无文章，点击右上角「新增文章」。</div>';
  }

  function renderSite() {
    var s = state.data.site || {};
    var fields = [
      ["name", "社团全称"], ["shortName", "简称"], ["nameEn", "英文全称"], ["shortEn", "英文简称"],
      ["slogan", "口号"], ["sloganEn", "英文口号"], ["founded", "成立年份"], ["location", "地点"],
      ["email", "邮箱"]
    ];
    var html = fields.map(function (f) {
      return '<div><label>' + f[1] + '</label><input data-field="' + f[0] + '" value="' + esc(s[f[0]] || "") + '"></div>';
    }).join("");
    $("#siteForm").innerHTML = html;
  }

  function render() {
    renderTimeline();
    renderArticles();
    renderSite();
  }

  /* ---------- 收集表单到 state ---------- */
  function commitForms() {
    // 时间线
    $$(".tl-item").forEach(function (el) {
      var i = parseInt(el.getAttribute("data-index"), 10);
      var it = state.data.timeline[i];
      if (!it) return;
      el.querySelectorAll("[data-field]").forEach(function (input) {
        it[input.getAttribute("data-field")] = input.value;
      });
    });
    // 文章
    $$(".art-item").forEach(function (el) {
      var id = el.getAttribute("data-id");
      var a = state.articles[id];
      if (!a) return;
      var card = findCard(id);
      el.querySelectorAll("[data-field]").forEach(function (input) {
        var field = input.getAttribute("data-field");
        var val = input.value;
        if (field === "body") {
          a.body = parseBody(val);
        } else if (field === "desc" || field === "tags") {
          if (card) {
            if (field === "desc") card.desc = val;
            else card.tags = val.split(/[,，]/).map(function (x) { return x.trim(); }).filter(Boolean);
          }
        } else {
          a[field] = val;
          if (card) card[field] = val;
        }
      });
    });
    // 站点信息
    if (state.data.site) {
      $$("#siteForm [data-field]").forEach(function (input) {
        state.data.site[input.getAttribute("data-field")] = input.value;
      });
    }
  }

  /* ---------- 结构操作 ---------- */
  function moveTimeline(i, dir) {
    var arr = state.data.timeline;
    var j = i + dir;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }

  function addTimeline() {
    commitForms();
    state.data.timeline.push({ date: "", title: "", text: "", image: "" });
    render();
  }

  function addArticle() {
    commitForms();
    var id = "article-" + Date.now();
    state.articles[id] = { title: "新文章", category: "程序篇", author: "", date: "", body: [] };
    if (!state.data.knowledge) state.data.knowledge = [];
    state.data.knowledge.push({
      category: "程序篇", title: "新文章", articleId: id, desc: "", tags: [], author: "", date: "", link: ""
    });
    render();
    var el = document.querySelector('.art-item[data-id="' + id + '"]');
    if (el) el.open = true;
  }

  function delArticle(id) {
    if (state.articles[id]) delete state.articles[id];
    state.data.knowledge = (state.data.knowledge || []).filter(function (k) { return k.articleId !== id; });
    render();
  }

  /* ---------- 登录 / 退出 ---------- */
  function showLogin() { $("#login").hidden = false; $("#app").hidden = true; }
  function showApp() { $("#login").hidden = true; $("#app").hidden = false; }

  async function bootstrap() {
    if (!getToken()) { showLogin(); return; }
    showApp();
    var remote = await apiGetContent();
    var seedData = window.CLUB_DATA || {};
    var seedArticles = window.CLUB_ARTICLES || {};
    if (remote && remote.data && typeof remote.data === "object") {
      state.data = remote.data;
      state.articles = (remote.articles && typeof remote.articles === "object") ? remote.articles : seedArticles;
    } else {
      state.data = seedData;
      state.articles = seedArticles;
    }
    render();
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    $("#loginForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      try {
        var password = $("#password").value;
        $("#loginError").textContent = "";
        var res = await apiLogin(password);
        console.log("[login] apiLogin 返回:", res);
        if (res.ok && res.body.token) {
          setToken(res.body.token);
          $("#password").value = "";
          await bootstrap();
          console.log("[login] bootstrap 完成");
        } else {
          $("#loginError").textContent = (res.body && res.body.error) || "登录失败";
        }
      } catch (err) {
        console.error("[login] 登录流程出错:", err);
        $("#loginError").textContent = "登录出错：" + (err && err.message ? err.message : err);
      }
    });

    $("#logoutBtn").addEventListener("click", function () {
      clearToken();
      state = { data: null, articles: null };
      showLogin();
    });

    $$(".app__tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        $$(".app__tab").forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        var view = tab.getAttribute("data-view");
        ["timeline", "articles", "about"].forEach(function (v) {
          $("#view-" + v).hidden = (v !== view);
        });
      });
    });

    $("#timelineList").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-op]");
      if (!btn) return;
      var item = e.target.closest(".tl-item");
      var i = parseInt(item.getAttribute("data-index"), 10);
      var op = btn.getAttribute("data-op");
      commitForms();
      if (op === "up") { moveTimeline(i, -1); }
      else if (op === "down") { moveTimeline(i, 1); }
      else if (op === "del") { state.data.timeline.splice(i, 1); }
      render();
    });
    $("#addTimelineBtn").addEventListener("click", addTimeline);

    $("#addArticleBtn").addEventListener("click", addArticle);
    $("#articleList").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-op='del']");
      if (!btn) return;
      e.preventDefault();
      var item = e.target.closest(".art-item");
      if (confirm("确定删除这篇文章？")) {
        delArticle(item.getAttribute("data-id"));
      }
    });

    $("#saveBtn").addEventListener("click", async function () {
      commitForms();
      var res = await apiSaveContent({ data: state.data, articles: state.articles });
      var st = $("#saveState");
      if (res.ok) {
        st.textContent = "已保存 ✓";
        st.style.color = "#2e7d32";
      } else if (res.status === 401) {
        clearToken();
        showLogin();
        $("#loginError").textContent = "登录已过期，请重新登录";
      } else {
        st.textContent = "保存失败：" + ((res.body && res.body.error) || res.status);
        st.style.color = "#c0392b";
      }
      setTimeout(function () { st.textContent = ""; }, 3000);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { bindEvents(); bootstrap(); });
  } else {
    bindEvents(); bootstrap();
  }
})();
