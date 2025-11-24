// YouTube Watch Later Cleaner - Background Service Worker
// Handles authentication, API calls, and automatic video removal

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const WATCH_LATER_PLAYLIST_ID = 'WL';

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  threshold: 75, // Remove at 75% watched
  autoRemove: true,
  showVisualIndicators: true
};

// Statistics
const DEFAULT_STATS = {
  videosRemoved: 0,
  lastCleanDate: null,
  totalWatchTimeSaved: 0 // in seconds
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('YouTube Watch Later Cleaner installed');

  // Initialize storage with defaults
  const result = await chrome.storage.sync.get(['settings', 'stats']);

  if (!result.settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }

  if (!result.stats) {
    await chrome.storage.sync.set({ stats: DEFAULT_STATS });
  }
});

// Get OAuth token
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

// Get Watch Later playlist items
async function getWatchLaterVideos(token) {
  const url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${WATCH_LATER_PLAYLIST_ID}&maxResults=50`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

// Remove video from Watch Later
async function removeFromWatchLater(token, playlistItemId) {
  const url = `${YOUTUBE_API_BASE}/playlistItems?id=${playlistItemId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to remove video: ${response.status}`);
  }

  return true;
}

// Update statistics
async function updateStats(videoRemoved = false, watchTimeSaved = 0) {
  const result = await chrome.storage.sync.get(['stats']);
  const stats = result.stats || DEFAULT_STATS;

  if (videoRemoved) {
    stats.videosRemoved++;
    stats.lastCleanDate = new Date().toISOString();
  }

  if (watchTimeSaved > 0) {
    stats.totalWatchTimeSaved += watchTimeSaved;
  }

  await chrome.storage.sync.set({ stats });

  // Notify popup if it's open
  chrome.runtime.sendMessage({ type: 'STATS_UPDATED', stats }).catch(() => {
    // Popup might not be open, ignore error
  });
}

// Handle watch progress updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WATCH_PROGRESS') {
    handleWatchProgress(message.data).then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_WATCH_DATA') {
    getWatchData(message.videoId).then(sendResponse);
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(['settings']).then(result => {
      sendResponse(result.settings || DEFAULT_SETTINGS);
    });
    return true;
  }

  if (message.type === 'GET_STATS') {
    chrome.storage.sync.get(['stats']).then(result => {
      sendResponse(result.stats || DEFAULT_STATS);
    });
    return true;
  }

  if (message.type === 'UPDATE_SETTINGS') {
    chrome.storage.sync.set({ settings: message.settings }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'MANUAL_CLEAN') {
    performManualClean().then(sendResponse);
    return true;
  }
});

// Handle watch progress update
async function handleWatchProgress(data) {
  const { videoId, watchPercentage, duration, playlistItemId } = data;

  console.log(`[Watch Progress] Video ID: ${videoId}, Progress: ${watchPercentage}%`);

  // Store watch progress
  await storeWatchProgress(videoId, watchPercentage);
  console.log(`[Watch Progress] Stored progress for ${videoId}: ${watchPercentage}%`);

  // Check if auto-remove is enabled
  const result = await chrome.storage.sync.get(['settings']);
  const settings = result.settings || DEFAULT_SETTINGS;

  console.log(`[Watch Progress] Extension enabled: ${settings.enabled}, Auto-remove: ${settings.autoRemove}, Threshold: ${settings.threshold}%`);

  if (!settings.enabled || !settings.autoRemove) {
    console.log('[Watch Progress] Auto-remove disabled, skipping removal check');
    return { removed: false, reason: 'Auto-remove disabled' };
  }

  // Check if video meets threshold
  if (watchPercentage >= settings.threshold) {
    console.log(`[Watch Progress] Video ${videoId} meets threshold! Attempting removal...`);

    try {
      const token = await getAuthToken();

      // Remove from Watch Later
      await removeFromWatchLater(token, playlistItemId);

      // Calculate time saved (remaining unwatched time)
      const watchTimeSaved = Math.floor(duration * (100 - watchPercentage) / 100);

      // Update statistics
      await updateStats(true, watchTimeSaved);

      console.log(`[Watch Progress] ✓ Auto-removed video ${videoId} at ${watchPercentage}% watched`);

      return {
        removed: true,
        videoId,
        watchPercentage,
        reason: `Reached ${settings.threshold}% threshold`
      };
    } catch (error) {
      console.error('[Watch Progress] Error removing video:', error);
      return { removed: false, error: error.message };
    }
  }

  console.log(`[Watch Progress] Video ${videoId} below threshold (${watchPercentage}% < ${settings.threshold}%)`);
  return { removed: false, reason: 'Below threshold' };
}

// Store watch progress for a video
async function storeWatchProgress(videoId, watchPercentage) {
  const key = `watch_${videoId}`;
  const data = {
    percentage: watchPercentage,
    lastUpdated: Date.now()
  };

  await chrome.storage.local.set({ [key]: data });
}

// Get watch progress for a video
async function getWatchData(videoId) {
  const key = `watch_${videoId}`;
  const result = await chrome.storage.local.get([key]);
  return result[key] || { percentage: 0, lastUpdated: null };
}

// Manual clean operation
async function performManualClean() {
  console.log('=== MANUAL CLEAN STARTED ===');

  try {
    console.log('Getting auth token...');
    const token = await getAuthToken();
    console.log('Auth token obtained successfully');

    console.log('Fetching Watch Later videos...');
    const videos = await getWatchLaterVideos(token);
    console.log(`Found ${videos.length} total videos in Watch Later playlist`);

    const result = await chrome.storage.sync.get(['settings']);
    const settings = result.settings || DEFAULT_SETTINGS;
    console.log(`Current threshold setting: ${settings.threshold}%`);

    let removedCount = 0;
    let totalTimeSaved = 0;
    let videosAboveThreshold = [];
    let videosBelowThreshold = [];

    console.log('\n--- Analyzing videos ---');
    for (const video of videos) {
      const videoId = video.contentDetails.videoId;
      const videoTitle = video.snippet.title;
      const watchData = await getWatchData(videoId);

      console.log(`Video: "${videoTitle}"`);
      console.log(`  ID: ${videoId}`);
      console.log(`  Watch progress: ${watchData.percentage}%`);
      console.log(`  Meets threshold (${settings.threshold}%): ${watchData.percentage >= settings.threshold ? 'YES' : 'NO'}`);

      if (watchData.percentage >= settings.threshold) {
        videosAboveThreshold.push({ videoId, title: videoTitle, percentage: watchData.percentage });

        console.log(`  --> REMOVING from Watch Later`);
        await removeFromWatchLater(token, video.id);

        // Estimate time saved (simplified - actual duration would need separate API call)
        const estimatedDuration = 600; // 10 minutes average
        const timeSaved = Math.floor(estimatedDuration * (100 - watchData.percentage) / 100);
        totalTimeSaved += timeSaved;

        removedCount++;
      } else {
        videosBelowThreshold.push({ videoId, title: videoTitle, percentage: watchData.percentage });
      }
    }

    console.log('\n=== MANUAL CLEAN SUMMARY ===');
    console.log(`Total videos in Watch Later: ${videos.length}`);
    console.log(`Videos above threshold (${settings.threshold}%): ${videosAboveThreshold.length}`);
    console.log(`Videos below threshold: ${videosBelowThreshold.length}`);
    console.log(`Videos removed: ${removedCount}`);
    console.log(`Estimated time saved: ${Math.floor(totalTimeSaved / 60)} minutes`);

    if (videosAboveThreshold.length > 0) {
      console.log('\nRemoved videos:');
      videosAboveThreshold.forEach(v => {
        console.log(`  - "${v.title}" (${v.percentage}% watched)`);
      });
    }

    if (videosBelowThreshold.length > 0) {
      console.log('\nKept videos (below threshold):');
      videosBelowThreshold.forEach(v => {
        console.log(`  - "${v.title}" (${v.percentage}% watched)`);
      });
    }

    if (removedCount > 0) {
      await updateStats(true, totalTimeSaved);
    }

    return {
      success: true,
      removedCount,
      totalVideos: videos.length,
      timeSaved: totalTimeSaved
    };
  } catch (error) {
    console.error('=== MANUAL CLEAN ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    return { success: false, error: error.message };
  }
}

console.log('Background service worker loaded');
