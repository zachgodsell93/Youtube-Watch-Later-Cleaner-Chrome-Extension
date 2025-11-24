# YouTube Watch Later Cleaner

Automatically clean your YouTube Watch Later playlist by removing videos you've already watched (or partially watched) based on configurable thresholds.

## Overview

This project provides **two versions** of the YouTube Watch Later Cleaner:

1. **Chrome Extension** (Recommended) - Browser-based automatic cleaner
2. **Python CLI Tool** - Command-line interface for manual cleaning

Both versions solve the problem of managing an ever-growing Watch Later playlist by automatically removing videos you've already watched to a certain percentage.

---

## 🎯 Which Version Should You Use?

### Chrome Extension (Recommended)

**Best for**: Users who want automatic, seamless cleaning while browsing YouTube

✅ **Pros**:
- Tracks watch progress in real-time as you watch videos
- Automatically removes videos when threshold is reached
- Visual indicators on thumbnails showing watch progress
- Statistics dashboard
- No manual intervention needed

❌ **Cons**:
- Chrome-only (other browsers not supported yet)
- Requires browser extension installation

[**→ Get Started with Extension**](extension/README.md)

### Python CLI Tool

**Best for**: Developers, scripters, or users who prefer command-line tools

✅ **Pros**:
- Can be scheduled/automated via cron or Task Scheduler
- Works on any OS with Python
- Good for one-time bulk cleaning
- No browser required

❌ **Cons**:
- **Watch percentage tracking not fully implemented** (YouTube API limitation)
- Requires Python installation and setup
- Manual execution required

[**→ Get Started with CLI**](CLI/README.md)

**Note**: The CLI version currently cannot retrieve actual watch percentages from YouTube's API. It serves as a proof-of-concept and may require additional implementation (Analytics API, Google Takeout parser, or custom tracking).

---

## Quick Start

### Chrome Extension

1. Clone this repository
2. Follow setup instructions in [`extension/README.md`](extension/README.md)
3. Load the extension in Chrome
4. Authorize with your Google account
5. Start watching YouTube - videos will auto-clean based on your settings!

### Python CLI

1. Clone this repository
2. Follow setup instructions in [`CLI/README.md`](CLI/README.md)
3. Configure OAuth credentials
4. Run the script:
   ```bash
   cd CLI
   python youtube_cleaner.py --threshold 75 --dry-run
   ```

---

## Features Comparison

| Feature | Chrome Extension | Python CLI |
|---------|-----------------|------------|
| Watch progress tracking | ✅ Real-time | ⚠️ Not implemented* |
| Automatic removal | ✅ Yes | ❌ No (manual run) |
| Visual indicators | ✅ Badges on thumbnails | ❌ N/A |
| Statistics | ✅ Dashboard in popup | ❌ No |
| Threshold options | ✅ 25%, 50%, 75%, 90%, 100% | ✅ Any%, 25%, 50%, 75% |
| Dry-run mode | ❌ No | ✅ Yes |
| Cross-platform | ❌ Chrome only | ✅ Windows, Mac, Linux |
| Scheduling | ✅ Always active | ✅ Via cron/Task Scheduler |

*The CLI version infrastructure exists, but watch percentage retrieval requires additional implementation (see CLI README for options).

---

## Project Structure

```
Youtube-Watch-Later-Cleaner/
├── README.md                    # This file
├── .gitignore                   # Git ignore rules
├── CLI/                         # Python CLI version
│   ├── README.md                # CLI documentation
│   ├── SETUP.md                 # Detailed CLI setup guide
│   ├── TODO.md                  # CLI development tasks
│   ├── youtube_cleaner.py       # Main CLI script
│   ├── config.py                # CLI configuration
│   └── requirements.txt         # Python dependencies
└── extension/                   # Chrome extension version
    ├── README.md                # Extension documentation
    ├── manifest.json            # Extension configuration
    ├── background.js            # Service worker (API logic)
    ├── content.js               # YouTube page script
    ├── content.css              # Content script styles
    ├── popup/                   # Extension UI
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js
    └── icons/                   # Extension icons
        └── ICONS_README.txt
```

---

## How It Works

### Chrome Extension

1. **Tracks Watch Progress**: Monitors the YouTube player as you watch videos
2. **Stores Data Locally**: Saves watch percentages in browser storage
3. **Auto-Removes Videos**: When a Watch Later video hits your threshold (e.g., 75%), it's automatically removed via YouTube API
4. **Shows Visual Indicators**: Displays colored badges on thumbnails showing how much you've watched
5. **Provides Statistics**: Tracks how many videos removed and time saved

### Python CLI

1. **Authenticates**: Uses OAuth 2.0 to access your YouTube account
2. **Fetches Playlist**: Retrieves your Watch Later playlist items
3. **Checks Watch Status**: *Would check watch percentage (not currently implemented)*
4. **Filters Videos**: Identifies videos meeting the threshold
5. **Removes Videos**: Deletes matching videos from Watch Later (or shows in dry-run mode)

---

## Requirements

### Chrome Extension

- Google Chrome browser
- Google account with YouTube access
- Google Cloud Project with YouTube Data API v3 enabled

### Python CLI

- Python 3.7 or higher
- Google account with YouTube access
- Google Cloud Project with YouTube Data API v3 enabled
- Python packages: google-auth, google-auth-oauthlib, google-api-python-client

---

## Setup Overview

Both versions require a Google Cloud Project with YouTube Data API v3 enabled:

1. Create project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials:
   - **Extension**: Chrome Extension type
   - **CLI**: Desktop app type
4. Configure the application with your credentials

See the respective README files for detailed setup instructions.

---

## API Quotas & Limits

YouTube Data API v3 has daily quota limits:

- **Default quota**: 10,000 units/day
- **Reading playlist items**: ~1 unit per request (50 videos)
- **Deleting video**: 50 units per deletion

**Daily removal capacity**: ~200 videos/day with default quota

For large playlists, cleaning may take multiple days. You can request quota increases in Google Cloud Console if needed.

---

## Privacy & Security

### Data Storage

- **Extension**: All data stored locally in browser (watch progress, settings, stats)
- **CLI**: OAuth tokens stored in `token.pickle` (gitignored)

### API Access

Both versions require permission to:
- View your YouTube account
- Manage your YouTube videos

No data is sent to external servers except YouTube API calls to manage your playlist.

### Security Best Practices

- Never commit `client_secrets.json` or `token.pickle`
- Keep OAuth credentials secure
- Review authorized applications periodically in Google Account settings
- Use `.gitignore` to prevent credential leaks

---

## Troubleshooting

### Common Issues

**"YouTube API error 403"**
- Solution: Enable YouTube Data API v3 in Google Cloud Console

**"Quota exceeded"**
- Solution: Wait 24 hours for quota reset, or request increase

**Extension not tracking watch progress**
- Solution: Check browser console for errors, ensure extension is enabled

**CLI can't find watch percentages**
- This is expected - see CLI README for implementation options

### Getting Help

1. Check the specific README for your version:
   - [Extension README](extension/README.md)
   - [CLI README](CLI/README.md)
2. Review error messages in console/terminal
3. Verify Google Cloud Project setup
4. Check API quotas in Cloud Console

---

## Development Status

### Chrome Extension: ✅ Ready to Use

The extension is fully functional and ready to use. All core features implemented:
- [x] Real-time watch tracking
- [x] Automatic video removal
- [x] Visual progress indicators
- [x] Settings & statistics UI
- [x] OAuth integration

### Python CLI: ⚠️ Partially Complete

The CLI has solid infrastructure but is missing the core watch tracking feature:
- [x] OAuth authentication
- [x] YouTube API integration
- [x] Command-line interface
- [x] Dry-run mode
- [x] Comprehensive documentation
- [ ] **Watch percentage retrieval** (requires Analytics API, Takeout parser, or custom solution)

See [`CLI/TODO.md`](CLI/TODO.md) for implementation options.

---

## Future Enhancements

**Both Versions:**
- Support for other playlists (not just Watch Later)
- Whitelist for specific channels/videos
- Filters by video age, duration, upload date
- Undo/restore functionality

**Extension-Specific:**
- Firefox support
- Sync settings across devices
- Enhanced statistics and charts

**CLI-Specific:**
- Complete watch percentage implementation
- Web dashboard for configuration
- Multiple profile support

---

## Contributing

Contributions welcome! Areas of focus:

1. **CLI Watch Tracking**: Implement one of the three approaches in CLI/TODO.md
2. **Extension Icons**: Create proper icon assets
3. **Testing**: Add automated tests
4. **Documentation**: Improve guides and troubleshooting
5. **Firefox Support**: Port extension to Firefox

---

## License

This project is open source. Feel free to use, modify, and distribute.

---

## Acknowledgments

- Built with YouTube Data API v3
- Chrome Extension Manifest v3
- Google OAuth 2.0 for authentication

---

## Version History

- **v1.0.0** (2025-11-24)
  - Initial release
  - Chrome extension fully functional
  - Python CLI infrastructure complete (watch tracking pending)
  - Comprehensive documentation

---

**Ready to clean your Watch Later playlist?** Choose your version:
- [**Chrome Extension Setup →**](extension/README.md)
- [**Python CLI Setup →**](CLI/README.md)
