# Alyssa Capture Chrome Extension v0.1

Prototype for capturing browser-visible marketing materials into Alyssa Swipe File.

This replaces unreliable server-side IG / FB crawling with a user-triggered browser workflow:

1. Open Instagram, Facebook, Meta Ad Library, or a landing page.
2. Click the Alyssa Capture extension.
3. Review visible material candidates.
4. Select the items you want.
5. Send selected items into Alyssa App.

## Load Unpacked Extension

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on Developer mode.
4. Click Load unpacked.
5. Select this folder: `chrome-extension/`.

## Test With Local App

1. Run the app:

```bash
npm run dev
```

2. Open a page you can view in Chrome, for example:

```text
https://www.instagram.com/hairforest.hk/
```

3. Click Alyssa Capture.
4. Choose `localhost:3000` as the Alyssa App target.
5. Select materials.
6. Click `送出已選素材`.
7. Alyssa App opens with `?alyssaCaptureImport=1`.
8. Confirm the materials appear in Swipe File.

## Test With Vercel

1. Choose `Vercel` in the extension popup.
2. Send selected materials.
3. The extension opens:

```text
https://alyssa-creative-sop-app.vercel.app/?alyssaCaptureImport=1
```

## Supported Pages

- Instagram public pages, posts, reels, and visible grids.
- Facebook public pages, posts, reels, videos, and visible links.
- Meta Ad Library pages the user can already view.
- Generic landing pages with Open Graph images, headings, or visible large images.

## Known Limitations

- This is not a crawler.
- It only reads the current visible browser tab after the user clicks the extension.
- It does not bypass login walls, private pages, rate limits, bot checks, or iframe restrictions.
- Instagram and Facebook DOM structures change often, so candidate quality will vary.
- If a candidate has no thumbnail, the extension captures the current viewport once and uses that as a fallback preview.
- Very large screenshots can make localStorage heavy; use a small selected batch for testing.

## Privacy Note

Capture is user-triggered only. The extension does not run background mass scraping, does not handle login credentials, and does not collect private data beyond what the user explicitly selects and sends to Alyssa App.
