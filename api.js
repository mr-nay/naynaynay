/* ============================================
   StreamBox - API Module
   Handles all fetch requests to external API
   ============================================ */

// API Configuration
const API_BASE_URL = 'https://api.jejaring.cc/videos.php';

// Sample video IDs for homepage (since no list endpoint is specified)
const VIDEO_IDS = [
    'zV1y3efjEP', 'aB2c4dEfGh', 'xY9z8wVuTs', 'mN3o4pQrSt',
    'kL5j6iHgFe', 'dC7b8aZyXw', 'vU1t2sRqPo', 'nM3l4kJiHg',
    'fE5d6cBaZy', 'xW7v8uTsRq', 'pO9n0mLkJi', 'hG1f2eDbCa',
    'zY3x4wVuTs', 'rQ5p6oNmLk', 'jI7h8gFeDc', 'bA9z0yXwVu',
    'tS1r2qPoNm', 'lK3j4iHgFe', 'dC5b6aZyXw', 'vU7t8sRqPo',
    'nM9l0kJiHg', 'fE1d2cBaZy', 'xW3v4uTsRq', 'pO5n6mLkJi'
];

/**
 * Fetch single video data from API
 * @param {string} videoId - The video code/ID
 * @returns {Promise<Object|null>} Video data or null on error
 */
async function fetchVideo(videoId) {
    try {
        const response = await fetch(`${API_BASE_URL}?id=${videoId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success' && data.video) {
            return data.video;
        }

        return null;
    } catch (error) {
        console.warn(`Failed to fetch video ${videoId}:`, error.message);
        return null;
    }
}

/**
 * Fetch multiple videos for homepage
 * @param {string[]} ids - Array of video IDs to fetch
 * @returns {Promise<Object[]>} Array of video data objects
 */
async function fetchMultipleVideos(ids) {
    const promises = ids.map(id => fetchVideo(id));
    const results = await Promise.allSettled(promises);

    return results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
}

/**
 * Get all video IDs for the homepage
 * @returns {string[]} Array of video IDs
 */
function getVideoIds() {
    return VIDEO_IDS;
}

/**
 * Get video ID from URL parameters
 * @returns {string|null} Video ID or null
 */
function getVideoIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('code') || null;
}

/**
 * Generate a fallback/demo video object for display purposes
 * @param {string} id - Video ID
 * @param {number} index - Index for variety
 * @returns {Object} Demo video object
 */
function generateDemoVideo(id, index) {
    const titles = [
        'Film Action Terbaik 2026', 'Drama Korea Romantis', 'Anime Populer Episode Terbaru',
        'Thriller Misterius yang Mencekam', 'Komedi Lucu Menghibur', 'Film Horror Terbaru',
        'Dokumenter Alam Semesta', 'Film Sci-Fi Futuristik', 'Adventure Epic Journey',
        'Film Superhero Terbaru', 'Romance Movie 2026', 'Fantasy World Adventure',
        'Crime Investigation Series', 'War Movie Epic Battle', 'Musical Drama Show',
        'Sports Documentary', 'Animated Movie Kids', 'Western Classic Remastered',
        'Cyberpunk Future City', 'Historical Drama Empire', 'Space Exploration Film',
        'Underwater Adventure', 'Mountain Climbing Story', 'Racing Championship'
    ];
    const actors = [
        'John Smith', 'Kim Soo-hyun', 'Takeshi Yamamoto', 'Maria Garcia',
        'Chris Evans', 'Park Min-young', 'Sato Takeru', 'Emma Watson',
        'Tom Holland', 'Song Hye-kyo', 'Keanu Reeves', 'Scarlett Johansson'
    ];
    const genres = [
        'Action,Thriller', 'Drama,Romance', 'Anime,Fantasy', 'Horror,Mystery',
        'Comedy,Family', 'Sci-Fi,Adventure', 'Documentary,Nature', 'Crime,Drama'
    ];

    return {
        code: id,
        title: titles[index % titles.length],
        description: `Saksikan ${titles[index % titles.length]} - film berkualitas tinggi dengan alur cerita yang menarik dan akting memukau. Streaming gratis hanya di StreamBox.`,
        actor: actors[index % actors.length],
        genre: genres[index % genres.length],
        poster: `https://poster.imgvid.com/${id}.jpg`,
        embed: `https://gdplayer.ornop.org/e/${id}`,
        videos: `https://gdplayer.ornop.org/e/${id}`,
        download: `https://gdplayer.ornop.org/e/${id}`,
        views: Math.floor(Math.random() * 100000) + 5000,
        date: `2026-0${Math.floor(Math.random() * 5) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
    };
}