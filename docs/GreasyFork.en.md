# Auto-Feed｜PT Cross-Site Torrent Assistant (Refactored)

Current refactored source: <https://github.com/Gawain12/auto_feed_js/tree/refactor-dev>

Original project’s mainline: <https://github.com/tomorrow505/auto_feed_js/tree/dev>

Auto-Feed helps prepare a torrent release for another supported tracker. From a torrent details page, choose a destination; the script carries over the torrent file and available metadata, screenshots and media information, then fills fields supported by that destination. On the upload page, check for duplicates, review and edit the prefilled content, and submit only when you are ready.

Many users know Auto-Feed from the original script by tomorrow505. This refactor was developed together with the original author to make the familiar cross-site workflow easier to maintain and extend. It organizes tracker adapters, metadata extraction, form filling, image tools and remote-client features into clearer modules. Support and available fields vary by site, and some smaller trackers and edge cases are still being adapted. When reporting a problem, include the source and destination tracker names; do not share passkeys or client credentials.

## Main features

- **Cross-site forwarding:** Choose a supported destination from a source torrent page and open its prepared upload form. Supported fields depend on the destination.
- **Duplicate checks and quick search:** Open a destination’s duplicate-search page or use quick-search links for commonly used trackers. Check the results before uploading.
- **Metadata assistance:** Organize titles, descriptions, IMDb and other media details, and common release fields. Supported pages are filled automatically where possible.
- **Image tools:** Extract and preview image URLs or BBCode, resolve supported thumbnail links, replace text, and prepare images for supported hosts. Follow the image rules of the destination tracker.
- **English UI and optional extras:** Open **Settings** in the torrent-page tools or press **Alt+S**, then choose **中/en**. The choice is saved automatically. Reload tracker and image-host pages to update the toolbar, image tools and remote-client sidebar. Optional features such as Douban information, release-group labels and quick search can be switched off individually.
- **Remote clients:** Configure qBittorrent, Transmission or Deluge and name download directories. On a torrent details page, choose a client and directory in the sidebar to send the torrent manually; verification options are available. Uploading does not automatically send or seed the release.
- **Download after upload:** An optional setting downloads the destination’s `.torrent` file after a forwarded upload succeeds. This is separate from manually sending a torrent through the sidebar.

## Site-specific examples

Trackers have different fields, image rules and upload flows. For example, a Tik upload form can be filled with an English title and description template from available metadata. Its image field stays blank so you can handle images according to that site’s rules. **Prepare images for Hostik** carries images from the current forwarding flow to Hostik; after uploading there, paste the generated BBCode into the description. The script does not submit the tracker upload for you.

On pages with a film aspect-ratio field, Auto-Feed can read the ratio from IMDb technical specifications. If it cannot retrieve the value, the field stays blank. A film’s aspect ratio is different from the encoded video’s display ratio.

## Screenshots

The examples below include a general tools view and one live tracker-page example. Other previews use example data and client addresses; no real upload was submitted and no client transfer was started. Tracker themes and layouts may differ.

### General tools

![English torrent-page forwarding tools and quick search](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/quick-tools.en.jpg)

![Site selection](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/sites.en.jpg)

![Image tools](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/image_tools.en.jpg)

![Remote client sidebar and named directories](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/remote-sidebar.en.jpg)

![File verification choice before sending to a remote client](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/remote-verify.en.jpg)

![qBittorrent, Transmission and Deluge settings with example addresses](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/remote-clients.en.jpg)

![Optional features and post-upload torrent download settings](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/settings.en.jpg)

### Examples from individual tracker pages

![Example tracker page with destination choices and duplicate-search links](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/ptp-source-toolbar-en.png)

![Hostik image block with a full-size cover and linked screenshot thumbnails](https://raw.githubusercontent.com/Gawain12/auto_feed_js/refactor-dev/docs/images/hostik-bbcode.en.jpg)
