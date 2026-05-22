// ============ API Helper ============
const API_BASE = "/api/videos";

async function fetchAPI(params = {}) {
  const url = new URL(API_BASE, window.location.origin);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      url.searchParams.set(key, val);
    }
  });

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("API Error:", err);
    return null;
  }
}

// ============ Utility Functions ============
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function createVideoCard(video) {
  const slug = video.slug || "";
  const title = video.title || "Untitled";
  const poster = video.poster || `https://poster.imgvid.com/${video.code || ""}.jpg`;
  const views = video.views || "0";
  const date = formatDate(video.date);

  return `
    <div class="col-6 col-md-3 mb-3">
      <a href="#" class="video-card" onclick="navigateTo('watch','${encodeURIComponent(slug)}');return false;">
        <div class="thumb-wrap">
          <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/320x180/1a0a2e/8b5cf6?text=No+Image'">
          <div class="thumb-overlay">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>
        <div class="card-body">
          <div class="video-title">${title}</div>
          <div class="video-stats">
            <i class="fa-solid fa-eye"></i> ${views}
            ${date ? `<span class="ms-2"><i class="fa-regular fa-calendar"></i> ${date}</span>` : ""}
          </div>
        </div>
      </a>
    </div>
  `;
}

function createAdBanner(index) {
  return `
    <div class="col-12 mb-3">
      <div class="ad-banner">
        <i class="fa-solid fa-rectangle-ad me-2"></i> Advertisement Space ${index || ""}
      </div>
    </div>
  `;
}

function injectAdsInGrid(videos) {
  let html = "";
  for (let i = 0; i < videos.length; i++) {
    html += createVideoCard(videos[i]);
    if ((i + 1) % 4 === 0 && i < videos.length - 1) {
      html += createAdBanner(Math.floor((i + 1) / 4));
    }
  }
  return html;
}

function createPagination(currentPage, totalPages, onClickFn) {
  if (totalPages <= 1) return "";

  let html = '<nav class="mt-4"><ul class="pagination justify-content-center flex-wrap">';

  // Prev
  html += `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
    <a class="page-link" href="#" onclick="${onClickFn}(${currentPage - 1});return false;">&laquo;</a>
  </li>`;

  // Page numbers
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    html += `<li class="page-item"><a class="page-link" href="#" onclick="${onClickFn}(1);return false;">1</a></li>`;
    if (start > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
  }

  for (let i = start; i <= end; i++) {
    html += `<li class="page-item ${i === currentPage ? "active" : ""}">
      <a class="page-link" href="#" onclick="${onClickFn}(${i});return false;">${i}</a>
    </li>`;
  }

  if (end < totalPages) {
    if (end < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    html += `<li class="page-item"><a class="page-link" href="#" onclick="${onClickFn}(${totalPages});return false;">${totalPages}</a></li>`;
  }

  // Next
  html += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
    <a class="page-link" href="#" onclick="${onClickFn}(${currentPage + 1});return false;">&raquo;</a>
  </li>`;

  html += "</ul></nav>";
  return html;
}

// ============ Navigation / Router ============
let currentView = "home";
let currentParams = {};

function navigateTo(view, param, param2) {
  closeSidebar();
  currentView = view;
  currentParams = { param, param2 };

  // Update hash
  if (view === "home") {
    history.pushState(null, "", "/");
  } else if (view === "watch") {
    history.pushState(null, "", `?v=${param}`);
  } else if (view === "category") {
    history.pushState(null, "", `?category=${encodeURIComponent(param)}${param2 ? "&page=" + param2 : ""}`);
  } else if (view === "categories") {
    history.pushState(null, "", "?view=categories");
  } else if (view === "search") {
    history.pushState(null, "", `?q=${encodeURIComponent(param)}${param2 ? "&page=" + param2 : ""}`);
  }

  renderView();
}

function parseURL() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("v");
  const category = params.get("category");
  const query = params.get("q");
  const view = params.get("view");
  const page = parseInt(params.get("page")) || 1;

  if (slug) {
    currentView = "watch";
    currentParams = { param: slug };
  } else if (category) {
    currentView = "category";
    currentParams = { param: category, param2: page };
  } else if (query) {
    currentView = "search";
    currentParams = { param: query, param2: page };
  } else if (view === "categories") {
    currentView = "categories";
    currentParams = {};
  } else {
    currentView = "home";
    currentParams = {};
  }
}

function renderView() {
  const appContent = document.getElementById("appContent");
  appContent.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-purple" role="status"><span class="visually-hidden">Loading...</span></div></div>`;

  updateActiveCategory();

  switch (currentView) {
    case "home":
      initHomePage();
      break;
    case "watch":
      initWatchPage(currentParams.param);
      break;
    case "category":
      initCategoryPage(currentParams.param, currentParams.param2 || 1);
      break;
    case "search":
      initSearchPage(currentParams.param, currentParams.param2 || 1);
      break;
    case "categories":
      initAllCategories();
      break;
    default:
      initHomePage();
  }
}

function updateActiveCategory() {
  document.querySelectorAll(".cat-pill").forEach((pill) => {
    pill.classList.remove("active");
  });

  const pills = document.querySelectorAll(".cat-pill");
  if (currentView === "home") {
    pills[0]?.classList.add("active");
  } else if (currentView === "categories") {
    pills[pills.length - 1]?.classList.add("active");
  }
}

// ============ Sidebar & Navigation ============
function initNavigation() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebarClose = document.getElementById("sidebarClose");
  const screenOverlay = document.getElementById("screenOverlay");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      document.getElementById("sidebar").classList.add("show");
      screenOverlay.classList.add("active");
    });
  }

  if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
  if (screenOverlay) screenOverlay.addEventListener("click", closeSidebar);

  // Search form
  const searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = searchForm.querySelector("input").value.trim();
      if (q) {
        navigateTo("search", q);
      }
    });
  }

  // Handle browser back/forward
  window.addEventListener("popstate", () => {
    parseURL();
    renderView();
  });
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("show");
  document.getElementById("screenOverlay")?.classList.remove("active");
}

// ============ Home Page ============
async function initHomePage() {
  const appContent = document.getElementById("appContent");
  document.title = "StreamBox - Video Streaming";

  const [dataIndo, dataSMP, dataASD] = await Promise.all([
    fetchAPI({ limit: 16, order: "daily_random" }),
    fetchAPI({ category: "bokep SMP", limit: 12, order: "random" }),
    fetchAPI({ category: "bokep ASD", limit: 12, order: "random" }),
  ]);

  let html = "";

html += <div class="ad-banner-hero"><script async="async" data-cfasync="false" src="https://pl29524516.effectivecpmnetwork.com/a147265e67c79020f1b068d63ad1cdc4/invoke.js"></script> <div id="container-a147265e67c79020f1b068d63ad1cdc4"></div> </div>

  // Featured / Pinned Video
  if (dataIndo && dataIndo.videos && dataIndo.videos.length > 0) {
    const pinned = dataIndo.videos[0];
    const pinnedPoster = pinned.poster || `https://poster.imgvid.com/${pinned.code || ""}.jpg`;
    html += `
      <div class="featured-video" onclick="navigateTo('watch','${encodeURIComponent(pinned.slug || "")}')">
        <div class="featured-thumb">
          <img src="${pinnedPoster}" alt="${pinned.title || ""}" onerror="this.src='https://via.placeholder.com/1280x500/1a0a2e/8b5cf6?text=StreamBox'">
          <div class="featured-play-btn">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>
        <div class="featured-info">
          <h2>${pinned.title || "Featured Video"}</h2>
          <p><i class="fa-solid fa-eye me-1"></i> ${pinned.views || 0} views ${pinned.date ? `&bull; ${formatDate(pinned.date)}` : ""}</p>
        </div>
      </div>
    `;
  }

  // Video Sections
  if (dataIndo && dataIndo.videos && dataIndo.videos.length > 1) {
    html += buildSection("bokep Indo", dataIndo.videos.slice(1), "bokep Indo");
  }
  if (dataSMP && dataSMP.videos && dataSMP.videos.length) {
    html += buildSection("bokep Bocil", dataSMP.videos, "bokep SMP");
  }
  if (dataASD && dataASD.videos && dataASD.videos.length) {
    html += buildSection("bokep Asia", dataASD.videos, "bokep ASD");
  }

  if (!html) {
    html = '<p class="text-center py-5" style="color:var(--text-muted);">No videos available at the moment.</p>';
  }

  appContent.innerHTML = html;
}

function buildSection(title, videos, categoryKey) {
  return `
    <div class="section-header">
      <h2 class="section-title">${title}</h2>
      <a href="#" class="more-btn" onclick="navigateTo('category','${categoryKey}');return false;">More Videos</a>
    </div>
    <div class="row g-2 g-md-3">
      ${injectAdsInGrid(videos)}
    </div>
  `;
}

// ============ Watch Page ============
async function initWatchPage(slug) {
  const appContent = document.getElementById("appContent");

  if (!slug) {
    appContent.innerHTML = '<div class="text-center py-5"><p class="text-danger">Error: No video specified.</p></div>';
    return;
  }

  const decodedSlug = decodeURIComponent(slug);
  const data = await fetchAPI({ slug: decodedSlug });

  if (!data || data.status !== "success" || !data.video) {
    appContent.innerHTML = `
      <div class="video-player-wrap">
        <div class="video-error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Video not found or failed to load.</p>
          <a href="#" class="btn btn-sm" style="background:var(--purple-primary);color:#fff;" onclick="navigateTo('home');return false;">Back to Home</a>
        </div>
      </div>
    `;
    return;
  }

  const video = data.video;
  document.title = `${video.title || "Watch"} - StreamBox`;

  const embedUrl = video.embed || "";
  const isIndo = video.title && video.title.startsWith("bokep Indo");

  // Genre links
  let genreHTML = "";
  if (video.genre) {
    const genres = video.genre.split(",").map((g) => g.trim()).filter(Boolean);
    genreHTML = genres.map((g) => `<a href="#" class="genre-tag" onclick="navigateTo('search','${encodeURIComponent(g)}');return false;">${g}</a>`).join(" ");
  }

  // Fetch recommendations
  const contentType = isIndo ? 1 : 2;
  const [recData] = await Promise.all([
    fetchAPI({ content: contentType, limit: 12, order: "random" }),
  ]);

  let playerHTML = "";
  if (embedUrl) {
    playerHTML = `<iframe src="${embedUrl}" allowfullscreen allow="autoplay; encrypted-media" loading="lazy"></iframe>`;
  } else {
    playerHTML = `
      <div class="video-error">
        <i class="fa-solid fa-film"></i>
        <p>Video source unavailable</p>
      </div>
    `;
  }

  let html = `
    <div class="row g-2 g-md-3">
      <div class="col-12 col-lg-8">
        <div class="video-player-wrap">
          ${playerHTML}
        </div>
        ${isIndo && video.download ? `<a href="${video.download}" target="_blank" class="download-btn"><i class="fa-solid fa-download me-2"></i>Download Video</a>` : ""}
        <h1 class="fs-6 fs-md-5 fw-bold text-white mb-2">${video.title || ""}</h1>
        <div class="mb-3" style="font-size:0.8rem;color:var(--text-muted);">
          <i class="fa-solid fa-eye me-1"></i> ${video.views || 0} views
          <span class="ms-2 ms-md-3"><i class="fa-regular fa-calendar me-1"></i> ${formatDate(video.date)}</span>
        </div>
        ${!isIndo ? `
          <div class="mb-3" style="font-size:0.8rem;color:var(--text-secondary);">
            ${video.actor ? `<p class="mb-1">• Actor: ${video.actor}</p>` : ""}
            <p class="mb-1">• Status: Release</p>
            ${genreHTML ? `<p class="mb-1">• Genre: ${genreHTML}</p>` : ""}
          </div>
        ` : ""}

        <div class="mt-3 mt-md-4">
          <div class="section-header">
            <h2 class="section-title">Rekomendasi</h2>
          </div>
          <div class="row g-2 g-md-3">
            ${recData && recData.videos ? recData.videos.map((v) => createVideoCard(v)).join("") : ""}
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-4 mt-3 mt-lg-0">
        <div class="ad-banner mb-3"><i class="fa-solid fa-rectangle-ad me-2"></i> Ad Space</div>
        <div class="row g-2">
          ${recData && recData.videos ? recData.videos.slice(0, 6).map((v) => `<div class="col-4 col-sm-4 col-lg-12 mb-2"><a href="#" class="video-card" onclick="navigateTo('watch','${encodeURIComponent(v.slug || "")}');return false;"><div class="thumb-wrap"><img src="${v.poster || `https://poster.imgvid.com/${v.code || ""}.jpg`}" alt="${v.title || ""}" loading="lazy" onerror="this.src='https://via.placeholder.com/320x180/1a0a2e/8b5cf6?text=No+Image'"><div class="thumb-overlay"><i class="fa-solid fa-play"></i></div></div><div class="card-body"><div class="video-title">${v.title || ""}</div><div class="video-stats"><i class="fa-solid fa-eye"></i> ${v.views || 0}</div></div></a></div>`).join("") : ""}
        </div>
      </div>
    </div>
  `;

  appContent.innerHTML = html;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============ Category Page ============
window._categoryPage = function (page) {
  navigateTo("category", currentParams.param, page);
};

async function initCategoryPage(category, page) {
  const appContent = document.getElementById("appContent");
  document.title = `${category} - StreamBox`;

  const data = await fetchAPI({ category, page, limit: 12, order: "random" });

  if (!data || !data.videos) {
    appContent.innerHTML = '<p class="text-center py-5" style="color:var(--text-muted);">Failed to load videos.</p>';
    return;
  }

  const currentPage = data.current_page || 1;
  const totalPages = data.total_pages || 1;

  let html = `
    <div class="section-header">
      <h2 class="section-title">Category: ${category}</h2>
    </div>
  `;

  if (data.videos.length === 0) {
    html += '<p class="text-center py-5" style="color:var(--text-muted);">No videos found.</p>';
  } else {
    html += `<div class="row g-2 g-md-3">${injectAdsInGrid(data.videos)}</div>`;
    html += createPagination(currentPage, totalPages, "window._categoryPage");
  }

  appContent.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============ Search Page ============
window._searchPage = function (page) {
  navigateTo("search", currentParams.param, page);
};

async function initSearchPage(query, page) {
  const appContent = document.getElementById("appContent");
  document.title = `Search: "${query}" - StreamBox`;

  const data = await fetchAPI({ q: query, page, limit: 12, order: "relevance", order_by: "relevance" });

  if (!data || !data.videos) {
    appContent.innerHTML = '<p class="text-center py-5" style="color:var(--text-muted);">Failed to load results.</p>';
    return;
  }

  const currentPage = data.current_page || 1;
  const totalPages = data.total_pages || 1;

  let html = `
    <div class="section-header">
      <h2 class="section-title">Search: "${query}"</h2>
    </div>
  `;

  if (data.videos.length === 0) {
    html += '<p class="text-center py-5" style="color:var(--text-muted);">No videos found.</p>';
  } else {
    html += `<div class="row g-2 g-md-3"><script async="async" data-cfasync="false" src="https://pl29524516.effectivecpmnetwork.com/a147265e67c79020f1b068d63ad1cdc4/invoke.js"></script>
<div id="container-a147265e67c79020f1b068d63ad1cdc4"></div>
</div>`;
    html += createPagination(currentPage, totalPages, "window._searchPage");
  }

  appContent.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============ All Categories Page ============
async function initAllCategories() {
  const appContent = document.getElementById("appContent");
  document.title = "All Categories - StreamBox";

  const data = await fetchAPI({ limit: 1000 });

  const genreSet = new Set();
  if (data && data.videos) {
    data.videos.forEach((v) => {
      if (v.genre) {
        v.genre.split(",").forEach((g) => {
          const clean = g.trim();
          if (clean) genreSet.add(clean);
        });
      }
    });
  }

  const genres = Array.from(genreSet).sort();

  let html = `
    <div class="section-header">
      <h2 class="section-title">All Categories</h2>
    </div>
    <div class="d-flex flex-wrap gap-2 mb-4">
      ${genres.map((g) => `<a href="#" class="genre-list-btn" onclick="navigateTo('category','${encodeURIComponent(g)}');return false;">${g}</a>`).join("")}
    </div>
  `;

  if (genres.length === 0) {
    html += '<p class="text-center" style="color:var(--text-muted);">No categories available.</p>';
  }

  appContent.innerHTML = html;
}

// ============ Expose to global for inline onclick ============
window.navigateTo = navigateTo;

// ============ Initialize ============
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  parseURL();
  renderView();
});
(function () {
    const COOKIE_NAME = "redirect_clicks";
    const MAX_CLICKS = 5;
    const EXPIRE_MINUTES = 10;
    const REDIRECT_URL = "https://www.effectivecpmnetwork.com/v44w0ipq?key=d2a9f15aae2c3ea7e146527409f35270";

    function getCookie(name) {
        const match = document.cookie.match(
            new RegExp("(^| )" + name + "=([^;]+)")
        );
        return match ? decodeURIComponent(match[2]) : null;
    }

    function setCookie(name, value, minutes) {
        const date = new Date();
        date.setTime(date.getTime() + (minutes * 60 * 1000));

        document.cookie =
            name + "=" + encodeURIComponent(value) +
            "; expires=" + date.toUTCString() +
            "; path=/";
    }

    document.addEventListener("click", function () {
        let count = parseInt(getCookie(COOKIE_NAME)) || 0;

        // Jika sudah 3 klik, berhenti sampai cookie habis
        if (count >= MAX_CLICKS) {
            return;
        }

        // Tambah jumlah klik
        count++;

        // Simpan cookie 30 menit
        setCookie(COOKIE_NAME, count, EXPIRE_MINUTES);

        // Redirect
         window.open(REDIRECT_URL, "_blank");
    }, { once: false });

})();
