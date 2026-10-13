# Auto-Feed｜PT Cross-Site Torrent Assistant (Refactored)

Project: <https://github.com/tomorrow505/auto_feed_js/tree/dev>

Auto-Feed helps move a release from a supported tracker’s torrent page to another tracker’s upload form. It carries over torrent metadata, media information, screenshots and the torrent file, then fills supported fields so you can review the result before submitting it.

This is a refactored version of the original Auto-Feed by tomorrow505. Smaller trackers, individual fields and edge cases are still being adapted. Support varies by site; please report problems with the source and target tracker names, without including passkeys or client credentials.

## English UI and optional extras

Open **Settings** in the torrent-page tools, or press **Alt+S**. Click **中/en** to choose English. The language choice is saved automatically; reload tracker and image-host pages to update their injected tools and remote sidebar.

Douban information, release group labels, IMDb/Douban quick search, list-page search, default anonymous uploading and post-upload torrent downloads have their own switches. If you do not want Chinese-language Douban content on PTP, turn off **PTP: Show Douban Info**, save, and reload the page. These extras are optional and are separate from the forwarding workflow. Existing users’ choices are preserved.

## Useful workflows for PTP and Tik users

- **Cross-site forwarding:** choose a supported target tracker from a torrent detail page. Review the filled title, description, identifiers, media fields and torrent attachment before uploading. Exclusive / no re-upload notices are surfaced; follow both trackers’ rules.
- **Search before forwarding:** the duplicate-search switch opens search results instead of upload forms. Configurable quick-search links let you look up the same title across selected trackers.
- **Tik upload preparation:** fills a Tik-style title and English description template from available metadata and media information. Posters and screenshots are deliberately omitted from autofill. Rehost images to Hostik, then paste the generated BBCode into the description. Third-party image-host links are not prefilled. Review the template and fill any remaining details before submitting.
- **Film aspect ratio:** reads the film ratio from IMDb technical specifications, separately from the encoded video’s display ratio. If IMDb cannot be read, the film ratio stays blank. Open its technical specs and use **Refresh ratio** to try again without replacing the rest of your edited description.
- **Image handling:** extract image URLs or BBCode, preview images, resolve supported thumbnails to full-size URLs, replace strings, and prepare images for supported hosts including PTPIMG, Pixhost, Imgbox, HDBits and Hostik. API-based hosts require their corresponding keys; some hosts use a browser upload bridge.
- **Hostik for Tik:** queue images, fetch them into the Hostik upload page, and generate a centered image block with a full-size cover and linked screenshot thumbnails. Copy the generated BBCode into the image section of the Tik description.
- **Remote clients:** configure qBittorrent, Transmission or Deluge, with named download directories. On a torrent detail page, select the client and directory in the sidebar to send that torrent. Verification can be the default, or you can choose a mode before each send. Skip verification only when the complete matching files already exist in that directory.
- **After uploading:** the optional post-upload feature downloads the target tracker’s `.torrent` file after a successful forwarded upload. Remote sending remains a separate, manual sidebar action; Auto-Feed does not automatically send or seed the release after upload.

## Screenshots

The previews below use the current Auto-Feed UI with example torrent data and example client addresses. The Tik form preview exercises the adapter with example metadata and a saved public IMDb aspect-ratio sample; it is not a screenshot of an upload submitted to a tracker or a live client transfer. Tracker themes and layouts may differ.

### Torrent-page tools and quick search

![English torrent-page forwarding tools and quick search](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/quick-tools.en.jpg)

### Tik upload preparation: images omitted, IMDb film ratio

![Tik form preview with a Hostik rehosting prompt, torrent attachment and IMDb film aspect ratio](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/tik-upload-hostik.en.jpg)

### Hostik image block for Tik

![Hostik full-size cover and linked screenshot BBCode](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/hostik-bbcode.en.jpg)

### Remote client and directory selection

![English remote client sidebar and named directories](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/remote-sidebar.en.jpg)

![English file verification choice before sending](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/remote-verify.en.jpg)

### Remote client settings

![qBittorrent, Transmission and Deluge settings with example addresses](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/remote-clients.en.jpg)

### Optional features and post-upload torrent download

![Optional page enhancements and post-upload torrent download settings](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/settings.en.jpg)

### Site selection

![Site selection](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/sites.en.jpg)

### Image toolbox

![Image tools](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/image_tools.en.jpg)
