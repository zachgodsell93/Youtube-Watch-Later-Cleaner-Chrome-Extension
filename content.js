// YouTube Watch Later Cleaner - Content Script
// Runs on YouTube pages to track watch progress and add visual indicators

let currentVideoId = null;
let watchProgressInterval = null;
let settings = null;

// Initialize content script
async function init() {
  console.log('YouTube Watch Later Cleaner content script loaded');

  // Get settings
  settings = await getSettings();

  // Start tracking when on a video page
  if (isVideoPage()) {
    startWatchTracking();
  }

  // Add visual indicators if on Watch Later playlist
  if (isWatchLaterPlaylist()) {
    addVisualIndicators();
  }

  // Listen for page navigation (YouTube is a SPA)
  observePageChanges();
}

// Get settings from background
function getSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      resolve(response);
    });
  });
}

// Check if current page is a video page
function isVideoPage() {
  return window.location.pathname === '/watch';
}

// Check if current page is Watch Later playlist
function isWatchLaterPlaylist() {
  const params = new URLSearchParams(window.location.search);
  return params.get('list') === 'WL' || window.location.pathname.includes('/playlist');
}

// Get current video ID from URL
function getVideoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('v');
}

// Get YouTube player element
function getPlayer() {
  return document.querySelector('video.html5-main-video');
}

// Start tracking watch progress
function startWatchTracking() {
  const videoId = getVideoId();

  if (!videoId) {
    console.log('No video ID found');
    return;
  }

  // Stop existing tracking
  if (watchProgressInterval) {
    clearInterval(watchProgressInterval);
  }

  currentVideoId = videoId;
  console.log(`Starting watch tracking for video: ${videoId}`);

  // Track progress every 5 seconds
  watchProgressInterval = setInterval(() => {
    trackProgress();
  }, 5000);

  // Also track when page unloads
  window.addEventListener('beforeunload', trackProgress);
}

// Track current watch progress
async function trackProgress() {
  const player = getPlayer();

  if (!player || !currentVideoId) {
    return;
  }

  const currentTime = player.currentTime;
  const duration = player.duration;

  if (!duration || duration === 0) {
    return;
  }

  const watchPercentage = Math.floor((currentTime / duration) * 100);

  // Get playlist item ID (needed for removal)
  const playlistItemId = await getPlaylistItemId(currentVideoId);

  // Send to background worker
  chrome.runtime.sendMessage({
    type: 'WATCH_PROGRESS',
    data: {
      videoId: currentVideoId,
      watchPercentage,
      duration,
      playlistItemId
    }
  }, (response) => {
    if (response && response.removed) {
      console.log(`Video removed from Watch Later: ${response.reason}`);
      showNotification(`Video removed at ${watchPercentage}% watched`);
    }
  });
}

// Get playlist item ID for a video in Watch Later
async function getPlaylistItemId(videoId) {
  // This is a simplified version. In production, you'd need to
  // either store this mapping or query the API
  return `WL_${videoId}`;
}

// Show notification to user
function showNotification(message) {
  // Create a toast notification
  const toast = document.createElement('div');
  toast.className = 'ytcleaner-toast';
  toast.textContent = `Watch Later Cleaner: ${message}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #065fd4;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease;
  `;

  document.body.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add visual indicators to Watch Later playlist thumbnails
async function addVisualIndicators() {
  if (!settings || !settings.showVisualIndicators) {
    return;
  }

  // Wait for playlist to load
  await waitForElement('ytd-playlist-video-renderer');

  const videoElements = document.querySelectorAll('ytd-playlist-video-renderer');

  for (const element of videoElements) {
    const videoId = extractVideoId(element);

    if (!videoId) continue;

    // Get watch data for this video
    chrome.runtime.sendMessage({
      type: 'GET_WATCH_DATA',
      videoId
    }, (watchData) => {
      if (watchData && watchData.percentage > 0) {
        addProgressBadge(element, watchData.percentage);
      }
    });
  }
}

// Extract video ID from playlist item element
function extractVideoId(element) {
  const link = element.querySelector('a#thumbnail');
  if (!link) return null;

  const href = link.getAttribute('href');
  const match = href.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

// Add progress badge to video thumbnail
function addProgressBadge(element, percentage) {
  // Check if badge already exists
  if (element.querySelector('.ytcleaner-badge')) {
    return;
  }

  const badge = document.createElement('div');
  badge.className = 'ytcleaner-badge';

  // Color code based on percentage
  let color = '#00a000'; // Green for < 25%
  if (percentage >= 75) {
    color = '#cc0000'; // Red for >= 75%
  } else if (percentage >= 25) {
    color = '#ff9900'; // Orange for 25-74%
  }

  badge.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: ${color};
    color: white;
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: bold;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  `;

  badge.textContent = `${percentage}% watched`;

  const thumbnail = element.querySelector('#thumbnail');
  if (thumbnail) {
    thumbnail.style.position = 'relative';
    thumbnail.appendChild(badge);
  }
}

// Wait for element to appear in DOM
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, timeout);
  });
}

// Observe page changes (YouTube SPA navigation)
function observePageChanges() {
  let lastUrl = window.location.href;

  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;

    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('Page changed:', currentUrl);

      // Stop existing tracking
      if (watchProgressInterval) {
        clearInterval(watchProgressInterval);
        watchProgressInterval = null;
      }

      // Start new tracking if on video page
      if (isVideoPage()) {
        setTimeout(() => startWatchTracking(), 1000);
      }

      // Add indicators if on Watch Later
      if (isWatchLaterPlaylist()) {
        setTimeout(() => addVisualIndicators(), 1000);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
