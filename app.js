/* ============================================
   StreamBox - Main Application Module
   Handles routing, pagination, theme, UI
   ============================================ */

// Configuration
const POSTS_PER_PAGE = 12;
const AD_INTERVAL = 2; // Show ad every N posts
let currentPage = 1;
let allVideos = [];
let filteredVideos = [];

/* ============================================
   Theme Management
   ============================================ */

/**
 * Initialize theme from localStorage or default to dark
 */
function initTheme() {
    const savedTheme = localStorage.getItem('streambox-theme') || 'dark';
    applyTheme(savedTheme);
}

/**
 * Apply theme to document
 * @param {string} theme - 'dark' or 'light'
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('streambox-theme', theme);
    updateThemeIcon(theme);
}

/**
 * Toggle between dark and light theme
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

/**
 * Update theme toggle icon
 * @param {string} theme - Current theme
 */
function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

/* ============================================
   Homepage Functions
   ============================================ */

/**
 * Initialize homepage
 */
async function initHomepage() {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) return;

    showLoadingGrid(videoGrid);

    // Fetch videos from API
    const ids = getVideoIds();
    const videos = await fetchMultipleVideos(ids);

    // If API returns data, use it; otherwise use demo data
    if (videos.length > 0) {
        allVideos = videos;
    } else {
        // Generate demo data as fallback
        allVideos = ids.map((id, index) => generateDemoVideo(id, index));
    }

    filteredVideos = [...allVideos];

    // Render pinned post
    renderPinnedPost(allVideos[0]);

    // Render video grid with pagination
    renderVideoGrid();
    renderPagination();
}

/**
 * Show loading skeleton in grid
 * @param {HTMLElement} container - Grid container
 */
function showLoadingGrid(container) {
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="video-card">
                    <div class="skeleton" style="aspect-ratio:16/9;"></div>
                    <div class="card-body">
                        <div class="skeleton" style="height:16px;margin-bottom:8px;"></div>
                        <div class="skeleton" style="height:12px;width:60%;"></div>
                    </div>
                </div>
            </div>`;
    }
    container.innerHTML = html;
}

/**
 * Render pinned/featured post
 * @param {Object} video - Video data object
 */
function renderPinnedPost(video) {
    const container = document.getElementById('pinnedPost');
    if (!container || !video) return;

    container.innerHTML = `
        <div class="col-12">
            <a href="view.html?id=${video.code}" class="text-decoration-none">
                <div class="pinned-card position-relative fade-in">
                    <div class="row g-0">
                        <div class="col-md-6">
                            <div class="position-relative" style="aspect-ratio:16/9;overflow:hidden;">
                                <span class="pinned-badge"><i class="bi bi-pin-fill me-1"></i>Pilihan</span>
                                <img src="${video.poster}" alt="${video.title}" 
                                     class="w-100 h-100" style="object-fit:cover;" 
                                     loading="lazy"
                                     onerror="this.src='https://via.placeholder.com/640x360/1a1d24/6c63ff?text=StreamBox'">
                            </div>
                        </div>
                        <div class="col-md-6 d-flex align-items-center">
                            <div class="p-4">
                                <h3 class="fw-bold mb-2" style="color:var(--text-primary);">${video.title}</h3>
                                <p class="mb-2" style="color:var(--text-secondary);font-size:0.9rem;">${video.description || ''}</p>
                                <div class="d-flex gap-2 flex-wrap">
                                    <span class="badge bg-accent"><i class="bi bi-eye me-1"></i>${formatViews(video.views)}</span>
                                    <span class="badge bg-secondary">${video.date || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        </div>`;
}

/**
 * Render video grid with ads inserted
 */
function renderVideoGrid() {
    const container = document.getElementById('videoGrid');
    if (!container) return;

    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const pageVideos = filteredVideos.slice(start, end);

    let html = '';
    pageVideos.forEach((video, index) => {
        // Insert ad slot every AD_INTERVAL posts
        if (index > 0 && index % AD_INTERVAL === 0) {
            html += `
                <div class="col-12 ad-slot-inline">
                    <div class="ad-banner text-center">
                        <div class="ad-placeholder"><span>Advertisement</span></div>
                    </div>
                </div>`;
        }

        html += `
            <div class="col-6 col-md-4 col-lg-3 fade-in">
                <a href="view.html?id=${video.code}" class="text-decoration-none">
                    <div class="video-card">
                        <div class="card-img-wrapper">
                            <img src="${video.poster}" alt="${video.title}" 
                                 loading="lazy"
                                 onerror="this.src='https://via.placeholder.com/320x180/1a1d24/6c63ff?text=StreamBox'">
                            <div class="play-overlay">
                                <i class="bi bi-play-circle-fill"></i>
                            </div>
                        </div>
                        <div class="card-body">
                            <h3 class="card-title">${video.title}</h3>
                            <div class="card-meta">
                                <i class="bi bi-eye me-1"></i>${formatViews(video.views)} • ${video.date || '-'}
                            </div>
                        </div>
                    </div>
                </a>
            </div>`;
    });

    container.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(filteredVideos.length / POSTS_PER_PAGE);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage - 1});return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>`;

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1);return false;">1</a></li>`;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="goToPage(${i});return false;">${i}</a>
            </li>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages});return false;">${totalPages}</a></li>`;
    }

    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage + 1});return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>`;

    container.innerHTML = html;
}

/**
 * Navigate to specific page
 * @param {number} page - Page number
 */
function goToPage(page) {
    const totalPages = Math.ceil(filteredVideos.length / POSTS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderVideoGrid();
    renderPagination();
}

/* ============================================
   Video View Page Functions
   ============================================ */

/**
 * Initialize video view page
 */
async function initViewPage() {
    const videoIframe = document.getElementById('videoIframe');
    if (!videoIframe) return;

    const videoId = getVideoIdFromUrl();
    if (!videoId) {
        showVideoError('Video tidak ditemukan. ID tidak valid.');
        return;
    }

    // Fetch video data
    let video = await fetchVideo(videoId);

    // Fallback to demo data if API fails
    if (!video) {
        video = generateDemoVideo(videoId, 0);
    }

    // Update page content
    renderVideoView(video);
    updateSEOMeta(video);
}

/**
 * Render video view page content
 * @param {Object} video - Video data object
 */
function renderVideoView(video) {
    // Set iframe source
    const iframe = document.getElementById('videoIframe');
    if (iframe) {
        iframe.src = video.embed || video.videos || '';
        iframe.title = video.title || 'Video Player';
    }

    // Set title
    const titleEl = document.getElementById('videoTitle');
    if (titleEl) titleEl.textContent = video.title || 'Untitled';

    // Set breadcrumb
    const breadcrumb = document.getElementById('breadcrumbTitle');
    if (breadcrumb) breadcrumb.textContent = video.title || 'Video';

    // Set views
    const viewsEl = document.getElementById('videoViews');
    if (viewsEl) viewsEl.innerHTML = `<i class="bi bi-eye me-1"></i>${formatViews(video.views)} views`;

    // Set date
    const dateEl = document.getElementById('videoDate');
    if (dateEl) dateEl.innerHTML = `<i class="bi bi-calendar me-1"></i>${video.date || '-'}`;

    // Set description
    const descEl = document.getElementById('videoDescription');
    if (descEl) descEl.textContent = video.description || 'Tidak ada deskripsi.';

    // Set actor
    const actorEl = document.getElementById('videoActor');
    if (actorEl) {
        actorEl.innerHTML = `<strong><i class="bi bi-person-fill me-1"></i>Aktor:</strong> <span>${video.actor || '-'}</span>`;
    }

    // Set poster
    const posterEl = document.getElementById('videoPoster');
    if (posterEl) {
        posterEl.src = video.poster || '';
        posterEl.alt = video.title || 'Video Poster';
        posterEl.onerror = function() {
            this.src = 'https://via.placeholder.com/320x480/1a1d24/6c63ff?text=StreamBox';
        };
    }

    // Set genres
    const genreEl = document.getElementById('videoGenres');
    if (genreEl && video.genre) {
        const genres = video.genre.split(',').map(g => g.trim()).filter(g => g);
        genreEl.innerHTML = genres.map(g => `<span class="genre-badge">${g}</span>`).join('');
    }

    // Set download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        const downloadUrl = video.download || video.embed || video.videos || '#';
        downloadBtn.href = downloadUrl;
    }

    // Set auto download button
    const autoDownloadBtn = document.getElementById('autoDownloadBtn');
    if (autoDownloadBtn) {
        autoDownloadBtn.onclick = function() {
            const url = video.download || video.embed || video.videos || '';
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        };
    }

    // Update page title
    document.title = `${video.title || 'Video'} - StreamBox`;
}

/**
 * Update SEO meta tags dynamically
 * @param {Object} video - Video data object
 */
function updateSEOMeta(video) {
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = video.description || `Tonton ${video.title} di StreamBox`;

    // Update Open Graph
    updateMetaTag('property', 'og:title', video.title || 'StreamBox Video');
    updateMetaTag('property', 'og:description', video.description || '');
    updateMetaTag('property', 'og:image', video.poster || '');
    updateMetaTag('property', 'og:url', window.location.href);

    // Update Twitter Card
    updateMetaTag('name', 'twitter:title', video.title || 'StreamBox Video');
    updateMetaTag('name', 'twitter:description', video.description || '');
    updateMetaTag('name', 'twitter:image', video.poster || '');

    // Update canonical
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.href;

    // Update VideoObject schema
    const schemaEl = document.getElementById('videoSchema');
    if (schemaEl) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": video.title || '',
            "description": video.description || '',
            "thumbnailUrl": video.poster || '',
            "uploadDate": video.date || '',
            "embedUrl": video.embed || '',
            "interactionStatistic": {
                "@type": "InteractionCounter",
                "interactionType": "http://schema.org/WatchAction",
                "userInteractionCount": video.views || 0
            }
        };
        schemaEl.textContent = JSON.stringify(schema);
    }

    // Update breadcrumb schema
    const breadcrumbSchema = document.getElementById('breadcrumbSchema');
    if (breadcrumbSchema) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Beranda", "item": "https://streambox.pages.dev/"},
                {"@type": "ListItem", "position": 2, "name": video.title || 'Video', "item": window.location.href}
            ]
        };
        breadcrumbSchema.textContent = JSON.stringify(schema);
    }
}

/**
 * Update or create meta tag
 */
function updateMetaTag(attr, value, content) {
    let tag = document.querySelector(`meta[${attr}="${value}"]`);
    if (tag) {
        tag.content = content;
    }
}

/**
 * Show error message on video page
 * @param {string} message - Error message
 */
function showVideoError(message) {
    const wrapper = document.getElementById('playerWrapper');
    if (wrapper) {
        wrapper.innerHTML = `
            <div class="text-center p-5">
                <i class="bi bi-exclamation-triangle-fill" style="font-size:3rem;color:var(--accent);"></i>
                <h3 class="mt-3">${message}</h3>
                <a href="index.html" class="btn btn-accent mt-3">Kembali ke Beranda</a>
            </div>`;
    }
}

/* ============================================
   Social Share Functions
   ============================================ */

function shareToFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
}

function shareToTwitter() {
    const title = document.getElementById('videoTitle')?.textContent || 'StreamBox Video';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`, '_blank');
}

function shareToWhatsapp() {
    const title = document.getElementById('videoTitle')?.textContent || 'StreamBox Video';
    window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + window.location.href)}`, '_blank');
}

function shareToTelegram() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}`, '_blank');
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const btn = event.currentTarget;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-lg"></i>';
        setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
    });
}

/* ============================================
   Search Function
   ============================================ */

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
}

function performSearch() {
    const query = document.getElementById('searchInput')?.value.trim().toLowerCase();
    if (!query) {
        filteredVideos = [...allVideos];
    } else {
        filteredVideos = allVideos.filter(v =>
            (v.title && v.title.toLowerCase().includes(query)) ||
            (v.genre && v.genre.toLowerCase().includes(query)) ||
            (v.actor && v.actor.toLowerCase().includes(query))
        );
    }
    currentPage = 1;
    renderVideoGrid();
    renderPagination();
}

/* ============================================
   Utility Functions
   ============================================ */

/**
 * Format view count
 * @param {number} views - View count
 * @returns {string} Formatted string
 */
function formatViews(views) {
    if (!views) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
}

/* ============================================
   Initialization
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initTheme();

    // Theme toggle event
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Initialize search
    initSearch();

    // Detect page and initialize
    const isViewPage = window.location.pathname.includes('view.html') ||
                       document.getElementById('videoIframe');

    if (isViewPage) {
        initViewPage();
    } else {
        initHomepage();
    }
});