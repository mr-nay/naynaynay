/* ============================================
   StreamBox - API Module
   Handles all fetch requests to external API
   ============================================ */

// API Configuration
const API_BASE_URL = 'https://api.jejaring.cc/videos.php';

// Video IDs
const VIDEO_IDS = [
  '690a489gl4',
  'MJ21yWAPAu',
  'ub0dg1buk6',
  '4Qvl2tym6O',
  'JeQatjNAMX',
  'Vm1xQGvotV',
  'B2WlfZ9Cvi',
  'r3zlgtwiwe',
  'sjhojyi3q8',
  '3s14dza788',
  '4a307e6q9j',
  'cator0dwxs',
  'gjvdw0io39',
  '6eq2e9l15g',
  '8fv7p8r6c8',
  '0928n5f6xm',
  '7z53i01616',
  'w7iff04991',
  'a829vo0713',
  '7b23egb99f',
  '4m2k97n5i3',
  '236s2sr938',
  'oy2foe237b',
  '2aqpzgbut9',
  '9h5y36dh94',
  'fp0h5uusmo'
];

/**
 * Fetch single video data from API
 * @param {string} videoId
 * @returns {Promise<Object|null>}
 */
async function fetchVideo(videoId) {

    try {

        const response = await fetch(
            `${API_BASE_URL}?id=${encodeURIComponent(videoId)}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('API RESPONSE:', data);

        // VALIDASI DATA
        if (
            data &&
            data.status === 'success' &&
            data.video
        ) {

            const video = data.video;

            // RETURN FORMAT YANG STABIL
            return {
                code: video.code || videoId,
                title: video.title || 'No Title',
                slug: video.slug || '',
                description: video.description || '',
                actor: video.actor || '',
                genre: video.genre || '',
                poster: video.poster || '',
                embed: video.embed || '',
                videos: video.videos || '',
                download: video.download || '',
                views: video.views || 0,
                date: video.date || ''
            };
        }

        return null;

    } catch (error) {

        console.warn(
            `Failed to fetch video ${videoId}:`,
            error.message
        );

        // fallback demo jika API gagal
        return generateDemoVideo(videoId, 0);
    }
}

/**
 * Fetch multiple videos
 * @param {string[]} ids
 * @returns {Promise<Object[]>}
 */
async function fetchMultipleVideos(ids = VIDEO_IDS) {

    const promises = ids.map(id => fetchVideo(id));

    const results = await Promise.all(promises);

    return results.filter(video => video !== null);
}

/**
 * Get all video IDs
 * @returns {string[]}
 */
function getVideoIds() {
    return VIDEO_IDS;
}

/**
 * Get video ID from URL parameters
 * @returns {string|null}
 */
function getVideoIdFromUrl() {

    const params = new URLSearchParams(window.location.search);

    return (
        params.get('id') ||
        params.get('code') ||
        null
    );
}

/**
 * Generate fallback/demo video
 * Only used if API fails
 */
function generateDemoVideo(id, index = 0) {

    return {
        code: id,
        title: `Video ${id}`,
        slug: '',
        description: 'Video description unavailable.',
        actor: 'Unknown',
        genre: 'Unknown',
        poster: `https://poster.imgvid.com/${id}.jpg`,
        embed: `https://gdplayer.ornop.org/e/${id}`,
        videos: `https://gdplayer.ornop.org/e/${id}`,
        download: '',
        views: 0,
        date: ''
    };
}
