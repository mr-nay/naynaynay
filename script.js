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
    <a href="/watch.html?v=${encodeURIComponent(slug)}" class="video-card">
      <div class="thumb-wrap">
        <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/320x180/222/666?text=No+Image'">
        <div class="thumb-overlay">
          <i class="fa-solid fa-play"></i>
        </div>
      </div>
      <div class="video-meta">
        <div class="video-title">${title}</div>
        <div class="video-stats">
          <i class="uil uil-eye"></i> ${views}
          ${date ? `<span style="margin-left:8px"><i class="uil uil-calendar-alt"></i> ${date}</span>` : ""}
        </div>
      </div>
    </a>
  `;
}

function createPagination(currentPage, totalPages, baseUrl) {
  if (totalPages <= 1) return "";

  let html = '<div class="pagination-wrap">';

  // First page
  html += `<a href="${baseUrl}&page=1" class="page-btn ${currentPage === 1 ? "active" : ""}">1</a>`;

  if (currentPage > 4) {
    html += `<span class="page-btn">...</span>`;
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    html += `<a href="${baseUrl}&page=${i}" class="page-btn ${i === currentPage ? "active" : ""}">${i}</a>`;
  }

  if (currentPage < totalPages - 3) {
    html += `<span class="page-btn">...</span>`;
  }

  if (totalPages > 1) {
    html += `<a href="${baseUrl}&page=${totalPages}" class="page-btn ${currentPage === totalPages ? "active" : ""}">${totalPages}</a>`;
  }

  html += "</div>";
  return html;
}

// ============ Sidebar & Navigation ============
function initNavigation() {
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menuToggle");
  const sidebarClose = document.getElementById("sidebarClose");
  const screenOverlay = document.getElementById("screenOverlay");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.add("show");
      screenOverlay.classList.add("active");
    });
  }

  function closeSidebar() {
    sidebar.classList.remove("show");
    screenOverlay.classList.remove("active");
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
        window.location.href = `/categories.html?q=${encodeURIComponent(q)}`;
      }
    });
  }
}

// ============ Home Page ============
async function initHomePage() {
  const sectionsEl = document.getElementById("videoSections");
  const sliderWrapper = document.getElementById("sliderWrapper");
  if (!sectionsEl) return;

  // Fetch videos for different sections
  const [dataIndo, dataSMP, dataASD] = await Promise.all([
    fetchAPI({ limit: 12, order: "daily_random" }),
    fetchAPI({ category: "sapi SMP", limit: 12, order: "random" }),
    fetchAPI({ category: "sapi ASD", limit: 12, order: "random" }),
  ]);

  // Populate slider
  if (sliderWrapper && dataIndo && dataIndo.videos) {
    sliderWrapper.innerHTML = dataIndo.videos
      .slice(0, 8)
      .map(
        (v) => `
      <div class="swiper-slide">
        <a href="/watch.html?v=${encodeURIComponent(v.slug || "")}">
          <img src="https://poster.imgvid.com/${v.code || ""}.jpg" alt="${v.title || ""}" loading="lazy">
          <div class="slide-title">${v.title || ""}</div>
        </a>
      </div>
    `
      )
      .join("");

    // Initialize Swiper
    new Swiper("#heroSwiper", {
      slidesPerView: 1,
      spaceBetween: 12,
      loop: true,
      autoplay: { delay: 3000, disableOnInteraction: false },
      speed: 1500,
      breakpoints: {
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
        1280: { slidesPerView: 4 },
      },
    });
  }

  // Build sections
  let sectionsHTML = "";

  if (dataIndo && dataIndo.videos && dataIndo.videos.length) {
    sectionsHTML += buildSection("Sapi Indo", dataIndo.videos, "/categories.html?category=sapi+Indo");
  }
  if (dataSMP && dataSMP.videos && dataSMP.videos.length) {
    sectionsHTML += buildSection("Sapi Bocil", dataSMP.videos, "/categories.html?category=sapi+SMP");
  }
  if (dataASD && dataASD.videos && dataASD.videos.length) {
    sectionsHTML += buildSection("Sapi Asia", dataASD.videos, "/categories.html?category=sapi+ASD");
  }

  if (!sectionsHTML) {
    sectionsHTML = '<p style="text-align:center;color:#999;padding:40px;">No videos available at the moment.</p>';
  }

  sectionsEl.innerHTML = sectionsHTML;
}

function buildSection(title, videos, moreLink) {
  return `
    <div class="section-header">
      <h2 class="section-title">${title}</h2>
      <a href="${moreLink}" class="more-btn">More Videos</a>
    </div>
    <div class="video-grid">
      ${videos.map((v) => createVideoCard(v)).join("")}
    </div>
  `;
}

// ============ Watch Page ============
async function initWatchPage() {
  const watchContent = document.getElementById("watchContent");
  if (!watchContent) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("v");

  if (!slug) {
    watchContent.innerHTML = '<p style="text-align:center;color:#f66;padding:40px;">Error: No video specified.</p>';
    return;
  }

  const data = await fetchAPI({ slug });

  if (!data || data.status !== "success" || !data.video) {
    watchContent.innerHTML = '<p style="text-align:center;color:#f66;padding:40px;">Video not found.</p>';
    return;
  }

  const video = data.video;
  document.title = `${video.title} - StreamBox`;

  // Determine content type for recommendations
  const contentType = video.title && video.title.startsWith("sapi Indo") ? 1 : 2;

  // Fetch recommendations
  const [recLeft, recRight] = await Promise.all([
    fetchAPI({ content: contentType, limit: 12, order: "random" }),
    fetchAPI({ content: contentType, limit: 6, order: "random" }),
  ]);

  const isIndo = video.title && video.title.startsWith("sapi Indo");

  // Build genre links
  let genreHTML = "";
  if (video.genre) {
    const genres = video.genre.split(",").map((g) => g.trim()).filter(Boolean);
    genreHTML = genres
      .map((g) => `<a href="/categories.html?q=${encodeURIComponent(g)}" class="genre-btn" style="font-size:0.75rem;padding:4px 10px;">${g}</a>`)
      .join(" ");
  }

  let html = `
    <div class="watch-container">
      <div class="watch-main">
        <div class="video-player">
          <iframe src="${video.embed || ""}" allowfullscreen></iframe>
        </div>
        ${isIndo && video.download ? `<a href="${video.download}" target="_blank" class="download-btn"><i class="fa-solid fa-download"></i> Download Video</a>` : ""}
        <h1 class="video-detail-title">${video.title || ""}</h1>
        <div class="video-detail-stats">
          <i class="uil uil-eye"></i> ${video.views || 0} views
          <span style="margin-left:16px"><i class="uil uil-calendar-alt"></i> ${formatDate(video.date)}</span>
        </div>
        ${!isIndo ? `
          <div class="video-description">
            ${video.actor ? `<p>• Actor: ${video.actor}</p>` : ""}
            <p>• Status: Release</p>
            ${genreHTML ? `<p>• Genre: ${genreHTML}</p>` : ""}
          </div>
        ` : ""}

        <div style="margin-top:30px;">
          <div class="section-header">
            <h2 class="section-title">Rekomendasi</h2>
          </div>
          <div class="video-grid">
            ${recLeft && recLeft.videos ? recLeft.videos.map((v) => createVideoCard(v)).join("") : ""}
          </div>
        </div>
      </div>

      <aside class="watch-sidebar">
        <div style="background:#222;padding:20px;text-align:center;color:#666;border-radius:8px;margin-bottom:16px;">
          Ad Space
        </div>
        <div class="video-grid" style="grid-template-columns: 1fr;">
          ${recRight && recRight.videos ? recRight.videos.map((v) => createVideoCard(v)).join("") : ""}
        </div>
      </aside>
    </div>
  `;

  watchContent.innerHTML = html;
}

// ============ Categories Page ============
async function initCategoriesPage() {
  const categoriesContent = document.getElementById("categoriesContent");
  if (!categoriesContent) return;

  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const query = params.get("q");
  const page = parseInt(params.get("page")) || 1;

  // If no category or query, show genre list
  if (!category && !query) {
    document.title = "All Categories - StreamBox";
    await showGenreList(categoriesContent);
    return;
  }

  // Fetch videos
  const apiParams = { page, limit: 12, order: "random" };
  let pageTitle = "Categories";

  if (category) {
    apiParams.category = category;
    pageTitle = `Category: ${category}`;
  } else if (query) {
    apiParams.q = query;
    apiParams.order = "relevance";
    apiParams.order_by = "relevance";
    pageTitle = `Search: "${query}"`;
  }

  document.title = `${pageTitle} - StreamBox`;

  const data = await fetchAPI(apiParams);

  if (!data || !data.videos) {
    categoriesContent.innerHTML = '<p style="text-align:center;color:#f66;padding:40px;">Failed to load videos.</p>';
    return;
  }

  const currentPage = data.current_page || 1;
  const totalPages = data.total_pages || 1;

  // Highlight active category
  highlightCategory(category);

  let baseUrl = `/categories.html?${category ? "category=" + encodeURIComponent(category) : "q=" + encodeURIComponent(query || "")}`;

  let html = `
    <div class="section-header">
      <h2 class="section-title">${pageTitle}</h2>
    </div>
  `;

  if (data.videos.length === 0) {
    html += '<p style="text-align:center;color:#999;padding:40px;">No videos found.</p>';
  } else {
    html += `<div class="video-grid">${data.videos.map((v) => createVideoCard(v)).join("")}</div>`;
    html += createPagination(currentPage, totalPages, baseUrl);
  }

  categoriesContent.innerHTML = html;
}

async function showGenreList(container) {
  // Fetch all videos to extract genres
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
    <div class="genre-list">
      ${genres.map((g) => `<a href="/categories.html?category=${encodeURIComponent(g)}" class="genre-btn">${g}</a>`).join("")}
    </div>
  `;

  if (genres.length === 0) {
    html += '<p style="text-align:center;color:#999;">No categories available.</p>';
  }

  container.innerHTML = html;
}

function highlightCategory(category) {
  if (!category) return;
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active");
    const href = btn.getAttribute("href") || "";
    if (href.includes(`category=${encodeURIComponent(category)}`) || href.includes(`category=${category.replace(/ /g, "+")}`)) {
      btn.classList.add("active");
    }
  });
}

// ============ Initialize ============
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();

  const path = window.location.pathname;

  if (path === "/" || path === "/index.html") {
    initHomePage();
  } else if (path === "/watch.html") {
    initWatchPage();
  } else if (path === "/categories.html") {
    initCategoriesPage();
  }
});