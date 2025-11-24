<div align="center">

# YouTube Watch Later Cleaner

### Chrome Extension

**Automatically manage your YouTube Watch Later playlist based on watch progress**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://www.google.com/chrome/)
[![YouTube API](https://img.shields.io/badge/YouTube-Data%20API%20v3-FF0000?logo=youtube&logoColor=white)](https://developers.google.com/youtube/v3)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Configuration](#-configuration) • [Troubleshooting](#-troubleshooting)

</div>

---

## 🎯 Overview

YouTube Watch Later Cleaner is a Chrome extension that helps you maintain a clean and manageable Watch Later playlist. It automatically removes videos you've already watched based on customizable completion thresholds, saving you from manual playlist management.

Never let your Watch Later playlist become an overwhelming graveyard of half-watched content again.

## ✨ Features

### Core Functionality

- **🤖 Automatic Removal**: Videos are automatically removed when you've watched them past your chosen threshold
- **📊 Real-time Tracking**: Monitors your watch progress as you view videos across YouTube
- **🎨 Visual Indicators**: Color-coded progress badges on Watch Later playlist thumbnails
- **⚙️ Configurable Thresholds**: Choose when to remove videos (25%, 50%, 75%, 90%, or 100% completion)
- **📈 Statistics Dashboard**: Track videos removed, time saved, and cleaning history
- **🔄 Manual Scanning**: On-demand playlist scanning and cleaning

### Visual Feedback

When viewing your [Watch Later playlist](https://www.youtube.com/playlist?list=WL), each video displays a colored badge:

- 🟢 **Green** (< 25%): Barely started
- 🟠 **Orange** (25-74%): Partially watched
- 🔴 **Red** (≥ 75%): Will be removed soon

### Privacy-First Design

- All data stored locally in your browser
- No external servers or data collection
- OAuth 2.0 secure authentication
- Open source and transparent

---

## 📋 Prerequisites

Before installing the extension, you'll need:

- Google Chrome browser (or Chromium-based browser)
- A Google account with YouTube access
- A Google Cloud Project with YouTube Data API v3 enabled

---

## 🚀 Installation

### Step 1: Set Up Google Cloud Project

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Go to **APIs & Services** → **Library**
   - Search for **"YouTube Data API v3"**
   - Click **Enable**

### Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the consent screen:
   - **User type**: External
   - **App name**: YouTube Watch Later Cleaner
   - **Support email**: Your email address
   - **Scopes**: Leave default
4. **Application type**: Select **Chrome Extension** (or Web Application)
5. Copy the generated **Client ID** (format: `xxxxx.apps.googleusercontent.com`)
6. Click **Create**

### Step 3: Configure the Extension

1. Open `manifest.json` in this directory
2. Locate the `oauth2` section
3. Replace the existing client ID with your own:
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/youtube",
       "https://www.googleapis.com/auth/youtube.force-ssl"
     ]
   }
   ```
4. Save the file

### Step 4: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select this extension directory
5. The extension should now appear in your extensions list

### Step 5: Authorize the Extension

1. Click the extension icon in your Chrome toolbar
2. Click **"Clean Now"** or visit any YouTube video
3. You'll be prompted to authorize access to your YouTube account
4. Grant the requested permissions
5. You're all set!

---

## 💡 Usage

### Automatic Mode (Default)

Once installed and authorized, the extension works seamlessly in the background:

1. **Watch Videos**: Continue watching YouTube normally
2. **Automatic Tracking**: The extension monitors your watch progress
3. **Auto-Removal**: Videos in Watch Later are removed when they reach your threshold (default: 75%)
4. **Notifications**: Brief notifications inform you when videos are removed

### Extension Popup

Click the extension icon to access the control panel:

```
┌─────────────────────────────────┐
│  YouTube Watch Later Cleaner    │
├─────────────────────────────────┤
│  ✓ Extension Enabled            │
│  ✓ Auto-Remove Videos           │
│  ✓ Show Progress Badges         │
│                                 │
│  Remove videos watched:         │
│  ○ 25%  ○ 50%  ⦿ 75%  ○ 90%   │
│                                 │
│  Statistics:                    │
│  Videos Removed: 42             │
│  Time Saved: 3h 24m             │
│  Last Cleaned: 2 hours ago      │
│                                 │
│  [        Clean Now        ]    │
└─────────────────────────────────┘
```

### Manual Cleaning

To manually scan and clean your entire Watch Later playlist:

1. Click the extension icon
2. Click **"Clean Now"**
3. The extension processes all videos and removes those meeting the threshold
4. A notification displays the results

---

## ⚙️ Configuration

### Settings

All settings are accessible through the extension popup:

| Setting                  | Options                  | Description                                     |
| ------------------------ | ------------------------ | ----------------------------------------------- |
| **Extension Enabled**    | On/Off                   | Master toggle for all extension functionality   |
| **Auto-Remove Videos**   | On/Off                   | Enable/disable automatic video removal          |
| **Show Progress Badges** | On/Off                   | Toggle visual indicators on playlist thumbnails |
| **Removal Threshold**    | 25%, 50%, 75%, 90%, 100% | Minimum watch percentage before removal         |

### Recommended Thresholds

- **25%**: Aggressive cleaning - removes videos you started watching
- **50%**: Moderate - removes videos you've watched halfway
- **75%**: Balanced (default) - removes mostly-watched videos
- **90%**: Conservative - only removes nearly-finished videos
- **100%**: Only removes fully-watched videos

---

## 🔧 How It Works

### Architecture

```
┌─────────────────┐
│  Content Script │  Runs on YouTube pages
│   (content.js)  │  - Monitors video player
│                 │  - Injects visual badges
└────────┬────────┘  - Sends watch data
         │
         ▼
┌─────────────────┐
│ Background      │  Service worker
│  (background.js)│  - OAuth authentication
│                 │  - Watch progress storage
└────────┬────────┘  - YouTube API calls
         │
         ▼
┌─────────────────┐
│   Popup UI      │  User interface
│   (popup/)      │  - Settings control
│                 │  - Statistics display
└─────────────────┘  - Manual triggers
```

### Data Flow

1. **Watch Tracking**: Content script monitors YouTube player events
2. **Progress Storage**: Watch percentages stored locally via Chrome Storage API
3. **Threshold Check**: Background worker compares progress against user threshold
4. **API Removal**: Videos meeting criteria are removed via YouTube Data API
5. **Statistics Update**: Counters updated for dashboard display

---

## 🔒 Privacy & Permissions

### Required Permissions

| Permission       | Purpose                                                |
| ---------------- | ------------------------------------------------------ |
| `storage`        | Store settings, watch progress, and statistics locally |
| `identity`       | OAuth authentication with Google account               |
| `youtube.com`    | Access YouTube pages to track watch progress           |
| `googleapis.com` | Call YouTube Data API to manage playlists              |

### Data Storage

All data is stored **exclusively in your browser's local storage**:

- Watch progress percentages for each video
- User preference settings
- Statistics (removal count, time saved)
- OAuth tokens

**Zero external data transmission** except authenticated YouTube API calls.

### API Quotas

YouTube Data API v3 has daily quota limits:

| Operation            | Cost     | Daily Limit    |
| -------------------- | -------- | -------------- |
| Read playlist item   | ~1 unit  | ~10,000 items  |
| Delete playlist item | 50 units | ~200 deletions |

**Default quota**: 10,000 units/day
**Typical usage**: The extension can remove ~200 videos per day within quota limits.

---

## 🐛 Troubleshooting

### Extension Not Working

**Problem**: Extension appears inactive or unresponsive
**Solutions**:

1. Open extension popup - check for error messages
2. Verify YouTube Data API v3 is enabled in Google Cloud Console
3. Check API quota usage: Cloud Console → APIs & Services → Dashboard
4. Try removing and re-loading the extension

### Videos Not Being Removed

**Problem**: Videos remain in playlist despite meeting threshold
**Solutions**:

1. Confirm "Extension Enabled" and "Auto-Remove Videos" are both ON
2. Lower the threshold temporarily to test functionality
3. Visit your Watch Later playlist to check for progress badges
4. Manually trigger "Clean Now" to test API connectivity

### Visual Indicators Missing

**Problem**: No progress badges appear on thumbnails
**Solutions**:

1. Enable "Show Progress Badges" in settings
2. Refresh your Watch Later playlist page
3. Watch a video first - badges only appear after tracking data exists
4. Check browser console for JavaScript errors

### API Errors

Common YouTube API errors and fixes:

| Error Code            | Meaning                     | Solution                           |
| --------------------- | --------------------------- | ---------------------------------- |
| 401 Unauthorized      | Invalid/expired OAuth token | Re-authorize extension (reload it) |
| 403 Forbidden         | API not enabled             | Enable YouTube Data API v3         |
| 429 Too Many Requests | Quota limit exceeded        | Wait 24 hours for quota reset      |
| 404 Not Found         | Video/playlist not found    | Video may be private or deleted    |

### Debugging

Enable Chrome DevTools for different components:

- **Background Worker**: `chrome://extensions/` → Click "service worker" link
- **Content Script**: Right-click YouTube page → Inspect → Console tab
- **Popup**: Right-click extension icon → Inspect popup

---

## 📁 Project Structure

```
Youtube-Watch-Later-Cleaner-Chrome-Extension/
├── manifest.json              # Extension configuration & permissions
├── background.js             # Service worker - API logic & OAuth
├── content.js                # YouTube page script - watch tracking
├── content.css              # Styling for injected elements
├── popup/
│   ├── popup.html           # Extension popup UI structure
│   ├── popup.css            # Popup styling
│   └── popup.js             # Popup logic & event handlers
├── icons/
│   ├── icon16.png           # 16x16 toolbar icon
│   ├── icon48.png           # 48x48 extension management
│   ├── icon128.png          # 128x128 Chrome Web Store
│   └── ICONS_README.txt     # Icon design guidelines
└── README.md                # This file
```

---

## 🧪 Testing

### Watch Tracking Test

1. Open any YouTube video
2. Open browser DevTools console (F12)
3. Look for: `Starting watch tracking for video: [VIDEO_ID]`
4. Watch for 10-15 seconds
5. Check for progress update messages

### Visual Indicators Test

1. Watch a few videos from your Watch Later playlist (partially)
2. Navigate to [Watch Later](https://www.youtube.com/playlist?list=WL)
3. Verify colored badges appear on watched videos
4. Badge color should match watch percentage

### Auto-Removal Test

1. Set threshold to 25% (low threshold for quick testing)
2. Watch a Watch Later video past 25%
3. Video should be auto-removed with notification
4. Check popup statistics for updated count

### Manual Clean Test

1. Click extension icon
2. Click "Clean Now"
3. Wait for API processing
4. Check for success notification with removal count

---

## ⚠️ Known Limitations

1. **Playlist Item ID**: Current implementation uses simplified IDs. Production deployments should fetch actual `playlistItem.id` from the API for reliability.

2. **Video Duration**: Manual cleaning estimates duration. For accuracy, fetch actual duration via YouTube Data API.

3. **SPA Navigation**: YouTube's Single Page Application architecture can sometimes cause edge cases with DOM observation.

4. **API Quotas**: Large playlists (500+ videos) may require multiple days to fully clean due to daily quota limits.

5. **Watch History Sync**: Watch progress is tracked only when the extension is active. Progress from mobile/TV apps is not synced.

---

## 🚧 Future Enhancements

Planned features for future releases:

- [ ] Support for custom playlists (beyond Watch Later)
- [ ] Undo/restore recently removed videos
- [ ] Export watch history and statistics data
- [ ] Sync settings across devices via Chrome Storage Sync
- [ ] Channel whitelist (never remove from specific channels)
- [ ] Filter by video age, duration, or category
- [ ] Batch operations with progress indicators
- [ ] Keyboard shortcuts for power users
- [ ] Dark mode for popup interface
- [ ] Import/export configuration profiles

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, fork the repository, and create pull requests.

### Development Setup

1. Clone the repository
2. Make your changes to the extension files
3. Test thoroughly using the methods in the [Testing](#-testing) section
4. Ensure no console errors or warnings
5. Submit a pull request with a clear description

---

## 📚 Resources

- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [OAuth 2.0 for Chrome Extensions](https://developer.chrome.com/docs/extensions/mv3/tut_oauth/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

---

## ⚡ Related Projects

- [YouTube Watch Later Cleaner CLI](../Youtube-Watch-Later-Cleaner-CLI/) - Command-line version with batch processing capabilities

---

## 💬 Support

For issues, questions, or feature requests:

1. Review the [Troubleshooting](#-troubleshooting) section
2. Check browser console for error messages
3. Verify Google Cloud Project configuration
4. Open an issue on GitHub with detailed reproduction steps

---

## ⚖️ Disclaimer

This extension uses the YouTube Data API v3 and requires compliance with [YouTube's Terms of Service](https://www.youtube.com/t/terms). API quotas apply. Use responsibly and ensure your Google Cloud Project is properly configured.

**This is an independent project and is not affiliated with, endorsed by, or sponsored by YouTube or Google.**

---

<div align="center">

[⬆ Back to Top](#youtube-watch-later-cleaner)

</div>
