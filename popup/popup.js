// YouTube Watch Later Cleaner - Popup Script

let currentSettings = null;
let currentStats = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');

  // Load settings and stats
  await loadSettings();
  await loadStats();

  // Set up event listeners
  setupEventListeners();

  // Listen for stats updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATS_UPDATED') {
      updateStatsDisplay(message.stats);
    }
  });
});

// Load settings from storage
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (settings) => {
      currentSettings = settings;
      updateSettingsDisplay(settings);
      resolve();
    });
  });
}

// Load statistics from storage
async function loadStats() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (stats) => {
      currentStats = stats;
      updateStatsDisplay(stats);
      resolve();
    });
  });
}

// Update settings display
function updateSettingsDisplay(settings) {
  document.getElementById('enabledToggle').checked = settings.enabled;
  document.getElementById('autoRemoveToggle').checked = settings.autoRemove;
  document.getElementById('visualIndicatorsToggle').checked = settings.showVisualIndicators;
  document.getElementById('thresholdSelect').value = settings.threshold;
}

// Update statistics display
function updateStatsDisplay(stats) {
  // Videos removed
  document.getElementById('videosRemoved').textContent = stats.videosRemoved;

  // Time saved
  const minutes = Math.floor(stats.totalWatchTimeSaved / 60);
  const hours = Math.floor(minutes / 60);

  let timeSavedText;
  if (hours > 0) {
    timeSavedText = `${hours}h ${minutes % 60}m`;
  } else {
    timeSavedText = `${minutes}m`;
  }

  document.getElementById('timeSaved').textContent = timeSavedText;

  // Last clean date
  const lastCleanElement = document.getElementById('lastCleanDate');
  if (stats.lastCleanDate) {
    const date = new Date(stats.lastCleanDate);
    lastCleanElement.textContent = formatDate(date);
  } else {
    lastCleanElement.textContent = 'Never';
  }
}

// Format date for display
function formatDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Set up event listeners
function setupEventListeners() {
  // Enabled toggle
  document.getElementById('enabledToggle').addEventListener('change', (e) => {
    currentSettings.enabled = e.target.checked;
    saveSettings();
  });

  // Auto-remove toggle
  document.getElementById('autoRemoveToggle').addEventListener('change', (e) => {
    currentSettings.autoRemove = e.target.checked;
    saveSettings();
  });

  // Visual indicators toggle
  document.getElementById('visualIndicatorsToggle').addEventListener('change', (e) => {
    currentSettings.showVisualIndicators = e.target.checked;
    saveSettings();
  });

  // Threshold select
  document.getElementById('thresholdSelect').addEventListener('change', (e) => {
    currentSettings.threshold = parseInt(e.target.value);
    saveSettings();
  });

  // Clean now button
  document.getElementById('cleanNowBtn').addEventListener('click', handleCleanNow);
}

// Save settings to storage
function saveSettings() {
  chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    settings: currentSettings
  }, (response) => {
    if (response && response.success) {
      console.log('Settings saved');
    }
  });
}

// Handle manual clean button click
async function handleCleanNow() {
  const button = document.getElementById('cleanNowBtn');

  // Disable button and show loading state
  button.disabled = true;
  button.classList.add('loading');
  button.textContent = 'Cleaning...';

  try {
    // Send clean request to background
    chrome.runtime.sendMessage({ type: 'MANUAL_CLEAN' }, (response) => {
      // Re-enable button
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = 'Clean Now';

      if (response && response.success) {
        // Show success message
        showMessage(`Removed ${response.removedCount} of ${response.totalVideos} videos`, 'success');

        // Reload stats
        loadStats();
      } else {
        // Show error message
        const errorMsg = response && response.error ? response.error : 'Unknown error';
        showMessage(`Error: ${errorMsg}`, 'error');
      }
    });
  } catch (error) {
    console.error('Clean now error:', error);
    button.disabled = false;
    button.classList.remove('loading');
    button.textContent = 'Clean Now';
    showMessage('An error occurred', 'error');
  }
}

// Show temporary message
function showMessage(text, type = 'info') {
  // Create message element
  const message = document.createElement('div');
  message.className = `popup-message ${type}`;
  message.textContent = text;

  // Style it
  message.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    font-size: 13px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    animation: slideDown 0.3s ease;
  `;

  // Add to document
  document.body.appendChild(message);

  // Remove after 3 seconds
  setTimeout(() => {
    message.style.opacity = '0';
    message.style.transition = 'opacity 0.3s';
    setTimeout(() => message.remove(), 300);
  }, 3000);
}

// Add slideDown animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(style);
