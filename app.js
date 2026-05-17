/* ============================================
   StreamBox - Main Application Module
   Handles routing, pagination, theme, UI
   ============================================ */

// Configuration
const POSTS_PER_PAGE = 12;
const AD_INTERVAL = 2;

let currentPage = 1;
let allVideos = [];
let filteredVideos = [];

/* ============================================
   Theme Management
   ============================================ */

function initTheme() {

    const savedTheme =
        localStorage.getItem('streambox-theme') || 'dark';

    applyTheme(savedTheme);
}

function applyTheme(theme) {

    document.documentElement.setAttribute(
        'data-theme',
        theme
    );

    localStorage.setItem(
        'streambox-theme',
        theme
    );

    updateThemeIcon(theme);
}

function toggleTheme() {

    const current =
        document.documentElement.getAttribute('data-theme');

    const newTheme =
        current === 'dark'
            ? 'light'
            : 'dark';

    applyTheme(newTheme);
}

function updateThemeIcon(theme) {

    const icon =
        document.getElementById('themeIcon');

    if (icon) {
        icon.textContent =
            theme === 'dark'
                ? '🌙'
                : '☀️';
    }
}

/* ============================================
   Homepage
   ============================================ */

async function initHomepage() {

    const videoGrid =
        document.getElementById('videoGrid');

    if (!videoGrid) return;

    showLoadingGrid(videoGrid);

    try {

        const ids = getVideoIds();

        const videos =
            await fetchMultipleVideos(ids);

        // HANYA DATA VALID
        allVideos = videos.filter(Boolean);

        // JIKA API GAGAL
        if (allVideos.length === 0) {

            videoGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Gagal memuat video dari API
                    </div>
                </div>
            `;

            return;
        }

        filteredVideos = [...allVideos];

        // PINNED POST
        if (allVideos[0]) {
            renderPinnedPost(allVideos[0]);
        }

        renderVideoGrid();

        renderPagination();

    } catch (error) {

        console.error(
            'Homepage error:',
            error
        );

        videoGrid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Terjadi kesalahan saat memuat data
                </div>
            </div>
        `;
    }
}

/**
 * Loading skeleton
 */
function showLoadingGrid(container) {

    let html = '';

    for (let i = 0; i < 6; i++) {

        html += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="video-card">

                    <div class="skeleton"
                        style="aspect-ratio:16/9;">
                    </div>

                    <div class="card-body">

                        <div class="skeleton"
                            style="height:16px;margin-bottom:8px;">
                        </div>

                        <div class="skeleton"
                            style="height:12px;width:60%;">
                        </div>

                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

/**
 * Render pinned post
 */
function renderPinnedPost(video) {

    const container =
        document.getElementById('pinnedPost');

    if (!container || !video) return;

    container.innerHTML = `
        <div class="col-12">

            <a href="view.html?id=${video.code}"
               class="text-decoration-none">

                <div class="pinned-card position-relative fade-in">

                    <div class="row g-0">

                        <div class="col-md-6">

                            <div class="position-relative"
                                style="aspect-ratio:16/9;overflow:hidden;">

                                <span class="pinned-badge">
                                    <i class="bi bi-pin-fill me-1"></i>
                                    Pilihan
                                </span>

                                <img
                                    src="${video.poster}"
                                    alt="${video.title}"
                                    class="w-100 h-100"
                                    style="object-fit:cover;"
                                    loading="lazy"
                                    onerror="this.src='https://via.placeholder.com/640x360/1a1d24/6c63ff?text=StreamBox'"
                                >

                            </div>
                        </div>

                        <div class="col-md-6 d-flex align-items-center">

                            <div class="p-4">

                                <h3 class="fw-bold mb-2"
                                    style="color:var(--text-primary);">

                                    ${video.title || 'Untitled'}

                                </h3>

                                <p class="mb-2"
                                   style="color:var(--text-secondary);font-size:0.9rem;">

                                    ${video.description || ''}

                                </p>

                                <div class="d-flex gap-2 flex-wrap">

                                    <span class="badge bg-accent">

                                        <i class="bi bi-eye me-1"></i>

                                        ${formatViews(video.views)}

                                    </span>

                                    <span class="badge bg-secondary">

                                        ${video.date || '-'}

                                    </span>

                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    `;
}

/**
 * Render video grid
 */
function renderVideoGrid() {

    const container =
        document.getElementById('videoGrid');

    if (!container) return;

    const start =
        (currentPage - 1) * POSTS_PER_PAGE;

    const end =
        start + POSTS_PER_PAGE;

    const pageVideos =
        filteredVideos.slice(start, end);

    let html = '';

    pageVideos.forEach((video, index) => {

        // INLINE ADS
        if (
            index > 0 &&
            index % AD_INTERVAL === 0
        ) {

            html += `
                <div class="col-12 ad-slot-inline">

                    <div class="ad-banner text-center">

                        <div class="ad-placeholder">
                            <span>Advertisement</span>
                        </div>

                    </div>
                </div>
            `;
        }

        html += `
            <div class="col-6 col-md-4 col-lg-3 fade-in">

                <a href="view.html?id=${video.code}"
                   class="text-decoration-none">

                    <div class="video-card">

                        <div class="card-img-wrapper">

                            <img
                                src="${video.poster}"
                                alt="${video.title}"
                                loading="lazy"

                                onerror="
                                    this.src='https://via.placeholder.com/320x180/1a1d24/6c63ff?text=StreamBox'
                                "
                            >

                            <div class="play-overlay">
                                <i class="bi bi-play-circle-fill"></i>
                            </div>

                        </div>

                        <div class="card-body">

                            <h3 class="card-title">
                                ${video.title || 'Untitled'}
                            </h3>

                            <div class="card-meta">

                                <i class="bi bi-eye me-1"></i>

                                ${formatViews(video.views)}

                                •

                                ${video.date || '-'}

                            </div>

                        </div>
                    </div>
                </a>
            </div>
        `;
    });

    container.innerHTML = html;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Pagination
 */
function renderPagination() {

    const container =
        document.getElementById('pagination');

    if (!container) return;

    const totalPages =
        Math.ceil(
            filteredVideos.length /
            POSTS_PER_PAGE
        );

    if (totalPages <= 1) {

        container.innerHTML = '';

        return;
    }

    let html = '';

    // PREV
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link"
               href="#"
               onclick="goToPage(${currentPage - 1});return false;">
                ←
            </a>
        </li>
    `;

    // PAGES
    for (let i = 1; i <= totalPages; i++) {

        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link"
                   href="#"
                   onclick="goToPage(${i});return false;">
                    ${i}
                </a>
            </li>
        `;
    }

    // NEXT
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link"
               href="#"
               onclick="goToPage(${currentPage + 1});return false;">
                →
            </a>
        </li>
    `;

    container.innerHTML = html;
}

/**
 * Go to page
 */
function goToPage(page) {

    const totalPages =
        Math.ceil(
            filteredVideos.length /
            POSTS_PER_PAGE
        );

    if (
        page < 1 ||
        page > totalPages
    ) return;

    currentPage = page;

    renderVideoGrid();

    renderPagination();
}

/* ============================================
   Search
   ============================================ */

function initSearch() {

    const searchInput =
        document.getElementById('searchInput');

    const searchBtn =
        document.getElementById('searchBtn');

    if (
        searchInput &&
        searchBtn
    ) {

        searchBtn.addEventListener(
            'click',
            performSearch
        );

        searchInput.addEventListener(
            'keypress',
            (e) => {

                if (e.key === 'Enter') {
                    performSearch();
                }
            }
        );
    }
}

function performSearch() {

    const query =
        document.getElementById('searchInput')
        ?.value
        .trim()
        .toLowerCase();

    if (!query) {

        filteredVideos = [...allVideos];

    } else {

        filteredVideos = allVideos.filter(v =>

            (v.title || '')
                .toLowerCase()
                .includes(query)

            ||

            (v.genre || '')
                .toLowerCase()
                .includes(query)

            ||

            (v.actor || '')
                .toLowerCase()
                .includes(query)
        );
    }

    currentPage = 1;

    renderVideoGrid();

    renderPagination();
}

/* ============================================
   Utilities
   ============================================ */

function formatViews(views) {

    if (!views) return '0';

    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    }

    if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }

    return views.toString();
}

/* ============================================
   Initialization
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    initTheme();

    const themeToggle =
        document.getElementById('themeToggle');

    if (themeToggle) {

        themeToggle.addEventListener(
            'click',
            toggleTheme
        );
    }

    initSearch();

    const isViewPage =
        window.location.pathname.includes('view.html') ||
        document.getElementById('videoIframe');

    if (isViewPage) {

        if (typeof initViewPage === 'function') {
            initViewPage();
        }

    } else {

        initHomepage();
    }
});
