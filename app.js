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
        if (!allVideos || allVideos.length < 1) {

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

    // PAGES - show max 5 pages
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {

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
   View Page - Menampilkan detail video
   Parameter mapping dari API:
   - title       → Judul
   - description → Deskripsi
   - poster      → Thumbnail
   - embed       → Link iframe (streaming)
   - actor       → Tag
   ============================================ */

async function initViewPage() {

    const videoId = getVideoIdFromUrl();

    if (!videoId) {
        showViewError('ID video tidak ditemukan di URL.');
        return;
    }

    // Show loading state
    const titleEl = document.getElementById('videoTitle');
    const descEl = document.getElementById('videoDescription');

    if (titleEl) titleEl.textContent = 'Memuat...';
    if (descEl) descEl.textContent = 'Memuat deskripsi...';

    try {

        const video = await fetchVideo(videoId);

        if (!video) {
            showViewError('Video tidak ditemukan atau API tidak merespons.');
            return;
        }

        // === MAPPING PARAMETER ===
        // title → Judul
        if (titleEl) {
            titleEl.textContent = video.title || 'Untitled';
        }

        // description → Deskripsi
        if (descEl) {
            descEl.textContent = video.description || 'Tidak ada deskripsi.';
        }

        // poster → Thumbnail
        const posterEl = document.getElementById('videoPoster');
        if (posterEl) {
            posterEl.src = video.poster || '';
            posterEl.alt = video.title || 'Video Poster';
            posterEl.onerror = function () {
                this.src = 'https://via.placeholder.com/400x225/1a1d24/6c63ff?text=No+Poster';
            };
        }

        // embed → Link iframe (streaming player)
        const iframeEl = document.getElementById('videoIframe');
        if (iframeEl) {
            if (video.embed) {
                iframeEl.src = video.embed;
                iframeEl.title = video.title || 'Video Player';
            } else {
                iframeEl.src = '';
                const wrapper = document.getElementById('playerWrapper');
                if (wrapper) {
                    wrapper.innerHTML = `
                        <div class="alert alert-warning text-center">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Embed video tidak tersedia untuk video ini.
                        </div>
                    `;
                }
            }
        }

        // actor → Tag
        const actorEl = document.getElementById('videoActor');
        if (actorEl) {
            if (video.actor) {
                // Pisahkan actor berdasarkan koma dan tampilkan sebagai tag/badge
                const actors = video.actor.split(',').map(a => a.trim()).filter(Boolean);
                let actorHtml = '<strong><i class="bi bi-tags-fill me-1"></i>Tag:</strong> ';
                actorHtml += actors.map(actor =>
                    `<span class="badge bg-info text-dark me-1 mb-1">${actor}</span>`
                ).join('');
                actorEl.innerHTML = actorHtml;
            } else {
                actorEl.innerHTML = '<strong><i class="bi bi-tags-fill me-1"></i>Tag:</strong> <span class="text-muted">Tidak ada tag</span>';
            }
        }

        // Genre badges
        const genreEl = document.getElementById('videoGenres');
        if (genreEl && video.genre) {
            const genres = video.genre.split(',').map(g => g.trim()).filter(Boolean);
            genreEl.innerHTML = genres.map(genre =>
                `<span class="badge bg-accent me-1 mb-1">${genre}</span>`
            ).join('');
        }

        // Views
        const viewsEl = document.getElementById('videoViews');
        if (viewsEl) {
            viewsEl.innerHTML = `<i class="bi bi-eye me-1"></i>${formatViews(video.views)} views`;
        }

        // Date
        const dateEl = document.getElementById('videoDate');
        if (dateEl) {
            dateEl.innerHTML = `<i class="bi bi-calendar me-1"></i>${video.date || '-'}`;
        }

        // Download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            if (video.download) {
                downloadBtn.href = video.download;
                downloadBtn.classList.remove('disabled');
            } else {
                downloadBtn.href = '#';
                downloadBtn.classList.add('disabled');
                downloadBtn.setAttribute('aria-disabled', 'true');
            }
        }

        // Auto download button
        const autoDownloadBtn = document.getElementById('autoDownloadBtn');
        if (autoDownloadBtn) {
            autoDownloadBtn.addEventListener('click', () => {
                if (video.download) {
                    window.open(video.download, '_blank');
                } else {
                    alert('Link download tidak tersedia untuk video ini.');
                }
            });
        }

        // Update page title & meta tags
        document.title = `${video.title || 'Video'} - StreamBox`;

        // Update Open Graph meta
        updateMetaTag('og:title', video.title || 'StreamBox Video');
        updateMetaTag('og:description', video.description || 'Tonton video streaming berkualitas tinggi di StreamBox.');
        updateMetaTag('og:image', video.poster || '');
        updateMetaTag('og:url', window.location.href);
        updateMetaTag('twitter:title', video.title || 'StreamBox Video');
        updateMetaTag('twitter:description', video.description || 'Tonton video streaming berkualitas tinggi di StreamBox.');
        updateMetaTag('twitter:image', video.poster || '');

        // Update breadcrumb
        const breadcrumbTitle = document.getElementById('breadcrumbTitle');
        if (breadcrumbTitle) {
            breadcrumbTitle.textContent = video.title || 'Video';
        }

        // Update Schema.org
        updateVideoSchema(video);

    } catch (error) {

        console.error('View page error:', error);
        showViewError('Terjadi kesalahan saat memuat video.');
    }
}

/**
 * Show error on view page
 */
function showViewError(message) {

    const titleEl = document.getElementById('videoTitle');
    const descEl = document.getElementById('videoDescription');
    const wrapper = document.getElementById('playerWrapper');

    if (titleEl) titleEl.textContent = 'Error';
    if (descEl) descEl.textContent = message;

    if (wrapper) {
        wrapper.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="bi bi-exclamation-circle me-2"></i>
                ${message}
            </div>
        `;
    }
}

/**
 * Update meta tag content
 */
function updateMetaTag(property, content) {

    let meta = document.querySelector(`meta[property="${property}"]`);

    if (!meta) {
        meta = document.querySelector(`meta[name="${property}"]`);
    }

    if (meta) {
        meta.setAttribute('content', content);
    }
}

/**
 * Update Schema.org VideoObject
 */
function updateVideoSchema(video) {

    const schemaEl = document.getElementById('videoSchema');

    if (schemaEl) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": video.title || '',
            "description": video.description || '',
            "thumbnailUrl": video.poster || '',
            "uploadDate": video.date || '',
            "embedUrl": video.embed || ''
        };

        schemaEl.textContent = JSON.stringify(schema);
    }

    // Update breadcrumb schema
    const breadcrumbSchema = document.getElementById('breadcrumbSchema');
    if (breadcrumbSchema) {
        const bSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Beranda",
                    "item": "https://streambox.pages.dev/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": video.title || 'Video',
                    "item": window.location.href
                }
            ]
        };

        breadcrumbSchema.textContent = JSON.stringify(bSchema);
    }
}

/* ============================================
   Share Functions
   ============================================ */

function shareToFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareToTwitter() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
}

function shareToWhatsapp() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://wa.me/?text=${title}%20${url}`, '_blank');
}

function shareToTelegram() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://t.me/share/url?url=${url}&text=${title}`, '_blank');
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link berhasil disalin!');
    }).catch(() => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link berhasil disalin!');
    });
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

    // Jika di halaman view, redirect ke homepage dengan query
    const isViewPage =
        window.location.pathname.includes('view.html') ||
        document.getElementById('videoIframe');

    if (isViewPage && query) {
        window.location.href = `index.html?q=${encodeURIComponent(query)}`;
        return;
    }

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

            ||

            (v.description || '')
                .toLowerCase()
                .includes(query)
        );
    }

    currentPage = 1;

    renderVideoGrid();

    renderPagination();
}

/**
 * Check URL for search query on homepage load
 */
function checkUrlSearch() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');

    if (query) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = query;
        }
        // Will be applied after videos are loaded
        return query;
    }
    return null;
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

        initViewPage();

    } else {

        // Check if there's a search query in URL
        const searchQuery = checkUrlSearch();

        initHomepage().then(() => {
            // Apply search filter if query exists
            if (searchQuery && allVideos.length > 0) {
                performSearch();
            }
        });
    }
});
