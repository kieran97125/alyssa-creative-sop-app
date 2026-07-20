# Brand Footage Library — Setup and Usage

## Product boundary

- Google Drive remains the source of truth for original brand footage.
- Alyssa Creative SOP scans the Drive folder, reads video metadata and stores only lightweight classification in Google Drive `appProperties`.
- The first version deliberately keeps footage metadata simple: display name, treatment folder, primary usage and notes.
- Browser tab recordings are reference materials. They are uploaded to Vercel Blob and inserted into the existing Creative reference library; they are not treated as owned brand footage.

## One-time Google Drive setup

1. Create a Google Drive folder for the brand, for example `IB Footage Library`.
2. Open `/footage` in Alyssa Creative SOP.
3. Copy the Service Account email shown in the setup panel.
4. Share the Drive root folder with that email as **Editor**.
5. Paste the Drive folder link into the app.
6. Click **建立標準療程 Folder**.

The app creates these first-level folders when missing:

- `01_DEP無針水光Combo`
- `02_BTL_EXION面眼提拉`
- `03_柔清舒敏面部護理`
- `04_S-Lite水感輕腿管理`
- `90_品牌通用素材`

Google Drive API must be enabled for the Google Cloud project behind `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`.

Optional production environment variable:

- `FOOTAGE_ROOT_FOLDER_ID`: default Drive root folder ID. The UI can still override this per browser.

## Daily footage workflow

1. Upload original footage into the matching treatment folder in Google Drive.
2. Open **Footage Library** from the floating launcher.
3. Click **掃描 Folder**.
4. Use **編輯** only when a clearer display name, usage type or short note is useful.
5. Select one or more footage cards.
6. Choose either:
   - **複製 Designer 清單** to copy filenames and Drive links; or
   - **送入 Creative App** to create one `Brand Footage` reference pack inside the existing Creative reference library.
7. Return to the Creative App and use the new footage pack as the material reference for the script or production job.

## Browser tab recording workflow

1. Open the competitor video in another browser tab.
2. In `/footage`, select **掃描／錄製競品影片**.
3. Click **開始錄製分頁**.
4. Select the tab playing the video and enable tab audio when required.
5. Stop recording after the useful section.
6. Add a title and original URL.
7. Click **送入 Creative 素材庫**.

The recording then appears in the existing Creative reference storage and can continue through AI analysis, brand/treatment application and script generation.

## Current limitations

- The Drive root folder must be shared with the configured Service Account.
- This phase scans up to three nested folder levels.
- Original footage remains in Drive; the app does not proxy full-resolution video playback.
- Footage packs are handed into the current browser's Creative reference library. Shared multi-user jobs remain a later database migration.
- Browser recording requires a modern Chromium browser and explicit user permission each time.
