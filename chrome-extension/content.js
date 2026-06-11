(() => {
  if (globalThis.__ALYSSA_CAPTURE_CONTENT_READY__) return;
  globalThis.__ALYSSA_CAPTURE_CONTENT_READY__ = true;

  const MAX_TEXT_LENGTH = 900;
  const MAX_CANDIDATES = 30;

  function safeText(value, maxLength = MAX_TEXT_LENGTH) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function absoluteUrl(value) {
    if (!value) return "";
    try {
      return new URL(value, window.location.href).href;
    } catch {
      return "";
    }
  }

  function isVisible(element) {
    if (!element || typeof element.getBoundingClientRect !== "function") return false;
    const style = window.getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 24 && rect.height > 24 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  function getMetaContent(name) {
    const selector = [
      `meta[property="${name}"]`,
      `meta[name="${name}"]`,
      `meta[property="og:${name}"]`,
      `meta[name="twitter:${name}"]`,
    ].join(",");
    return safeText(document.querySelector(selector)?.getAttribute("content") || "");
  }

  function getDetectedBrandName(platform) {
    const title = safeText(getMetaContent("title") || document.title);
    const pathParts = window.location.pathname.split("/").filter(Boolean);

    if (platform === "Instagram" && pathParts[0] && !["p", "reel", "tv"].includes(pathParts[0])) {
      return pathParts[0].replace(/^@/, "");
    }

    if (platform === "Facebook" && pathParts[0] && !["reel", "watch", "videos", "posts"].includes(pathParts[0])) {
      return pathParts[0];
    }

    return safeText(title.split(/[|·-]/)[0] || title, 120);
  }

  function detectPlatform() {
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const href = window.location.href.toLowerCase();
    const title = safeText(document.title, 160);

    if (href.includes("facebook.com/ads/library") || href.includes("meta.com/ads")) {
      return {
        platform: "Meta Ad Library",
        pageType: "ad_library",
        pageTitle: title,
        pageUrl: window.location.href,
        detectedBrandName: getDetectedBrandName("Meta Ad Library"),
      };
    }

    if (host.includes("instagram.com")) {
      const pageType = path.includes("/reel/") ? "reel" : path.includes("/p/") ? "post" : path.includes("/tv/") ? "video" : "profile";
      return {
        platform: "Instagram",
        pageType,
        pageTitle: title,
        pageUrl: window.location.href,
        detectedBrandName: getDetectedBrandName("Instagram"),
      };
    }

    if (host.includes("facebook.com") || host.includes("fb.watch")) {
      const pageType = path.includes("/reel/") ? "reel" : path.includes("/watch") || path.includes("/videos") ? "video" : "page";
      return {
        platform: "Facebook",
        pageType,
        pageTitle: title,
        pageUrl: window.location.href,
        detectedBrandName: getDetectedBrandName("Facebook"),
      };
    }

    return {
      platform: "Website",
      pageType: "landing_page",
      pageTitle: title,
      pageUrl: window.location.href,
      detectedBrandName: getDetectedBrandName("Website"),
    };
  }

  function findNearbyRoot(element) {
    return element.closest("article, section, main, [role='article'], [data-ad-preview], div") || element.parentElement || element;
  }

  function findPreviewImage(root) {
    const images = Array.from(root.querySelectorAll("img")).filter(isVisible);
    const best = images
      .map((image) => {
        const rect = image.getBoundingClientRect();
        return {
          image,
          area: rect.width * rect.height,
          src: absoluteUrl(image.currentSrc || image.src),
          alt: safeText(image.alt || image.getAttribute("aria-label") || ""),
        };
      })
      .filter((item) => item.src)
      .sort((a, b) => b.area - a.area)[0];

    return best || null;
  }

  function buildCandidate(input) {
    const sourceUrl = absoluteUrl(input.sourceUrl || window.location.href);
    const previewUrl = absoluteUrl(input.previewUrl || "");
    const captionText = safeText(input.captionText || "");
    const title = safeText(input.title || input.competitorBrand || input.pageTitle || document.title || "Captured Material", 180);
    const qualityWarnings = [];

    if (!sourceUrl) qualityWarnings.push("未能讀取素材連結");
    if (!previewUrl) qualityWarnings.push("未找到獨立預覽圖");
    if (!captionText) qualityWarnings.push("未找到可用文字");

    const confidence = sourceUrl && previewUrl && captionText ? "high" : sourceUrl && previewUrl ? "medium" : "low";

    return {
      id: input.id || `capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      platform: input.platform || "Website",
      sourceType: input.sourceType || "unknown",
      sourceUrl,
      previewUrl,
      title,
      competitorBrand: safeText(input.competitorBrand || ""),
      captionText,
      pageTitle: safeText(input.pageTitle || document.title || ""),
      pageUrl: window.location.href,
      extractedAt: new Date().toISOString(),
      confidence,
      qualityWarnings,
    };
  }

  function dedupeCandidates(candidates) {
    const seen = new Set();
    return candidates.filter((candidate) => {
      const key = `${candidate.sourceUrl || ""}::${candidate.previewUrl || ""}::${candidate.title || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function extractLinkCandidates(patterns, platformInfo) {
    const links = Array.from(document.querySelectorAll("a[href]"))
      .filter(isVisible)
      .filter((link) => patterns.some((pattern) => link.href.includes(pattern)));

    return links.map((link, index) => {
      const root = findNearbyRoot(link);
      const preview = findPreviewImage(root);
      const text = safeText(root.innerText || link.getAttribute("aria-label") || link.textContent || "");
      const href = absoluteUrl(link.href);
      const sourceType = href.includes("/reel/") || href.includes("/watch") ? `${platformInfo.platform.toLowerCase().replace(/\s+/g, "_")}_reel` : `${platformInfo.platform.toLowerCase().replace(/\s+/g, "_")}_post`;

      return buildCandidate({
        id: `${platformInfo.platform.toLowerCase()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        platform: platformInfo.platform,
        sourceType,
        sourceUrl: href,
        previewUrl: preview?.src || "",
        title: preview?.alt || text || platformInfo.pageTitle,
        competitorBrand: platformInfo.detectedBrandName,
        captionText: text || preview?.alt || "",
        pageTitle: platformInfo.pageTitle,
      });
    });
  }

  function extractMetaAdLibraryCandidates(platformInfo) {
    const cardRoots = Array.from(document.querySelectorAll("[role='article'], article, div"))
      .filter(isVisible)
      .filter((element) => {
        const text = safeText(element.innerText || "", 300);
        return element.querySelector("img") && text.length > 20;
      })
      .slice(0, MAX_CANDIDATES);

    return cardRoots.map((root, index) => {
      const preview = findPreviewImage(root);
      const text = safeText(root.innerText || "", 900);
      const links = Array.from(root.querySelectorAll("a[href]")).map((link) => absoluteUrl(link.href)).filter(Boolean);
      const sourceUrl = links.find((url) => url.includes("facebook.com/ads/library") || url.includes("ad_archive") || url.includes("story_fbid")) || window.location.href;

      return buildCandidate({
        id: `meta-ad-library-${index}-${Math.random().toString(36).slice(2, 6)}`,
        platform: "Meta Ad Library",
        sourceType: "meta_ad_library",
        sourceUrl,
        previewUrl: preview?.src || "",
        title: safeText(text.split(".")[0] || preview?.alt || platformInfo.pageTitle, 180),
        competitorBrand: platformInfo.detectedBrandName,
        captionText: text,
        pageTitle: platformInfo.pageTitle,
      });
    });
  }

  function extractLandingPageCandidates(platformInfo) {
    const ogImage = absoluteUrl(getMetaContent("image"));
    const heading = safeText(document.querySelector("h1")?.innerText || getMetaContent("title") || document.title, 180);
    const candidates = [];

    if (ogImage) {
      candidates.push(
        buildCandidate({
          id: "landing-og-image",
          platform: "Website",
          sourceType: "landing_page",
          sourceUrl: window.location.href,
          previewUrl: ogImage,
          title: heading || platformInfo.pageTitle,
          competitorBrand: platformInfo.detectedBrandName,
          captionText: safeText(document.querySelector("main")?.innerText || document.body?.innerText || "", 900),
          pageTitle: platformInfo.pageTitle,
        })
      );
    }

    const largeImages = Array.from(document.querySelectorAll("img"))
      .filter(isVisible)
      .map((image) => {
        const rect = image.getBoundingClientRect();
        return {
          image,
          area: rect.width * rect.height,
          src: absoluteUrl(image.currentSrc || image.src),
          alt: safeText(image.alt || ""),
        };
      })
      .filter((item) => item.src && item.area > 12000)
      .sort((a, b) => b.area - a.area)
      .slice(0, 8);

    largeImages.forEach((item, index) => {
      candidates.push(
        buildCandidate({
          id: `landing-image-${index}`,
          platform: "Website",
          sourceType: "landing_page",
          sourceUrl: window.location.href,
          previewUrl: item.src,
          title: item.alt || heading || platformInfo.pageTitle,
          competitorBrand: platformInfo.detectedBrandName,
          captionText: item.alt || heading,
          pageTitle: platformInfo.pageTitle,
        })
      );
    });

    if (!candidates.length) {
      candidates.push(
        buildCandidate({
          id: "landing-page-current",
          platform: "Website",
          sourceType: "landing_page",
          sourceUrl: window.location.href,
          previewUrl: "",
          title: heading || platformInfo.pageTitle,
          competitorBrand: platformInfo.detectedBrandName,
          captionText: safeText(document.querySelector("main")?.innerText || document.body?.innerText || "", 900),
          pageTitle: platformInfo.pageTitle,
        })
      );
    }

    return candidates;
  }

  function scanPage() {
    const platformInfo = detectPlatform();
    let candidates = [];

    if (platformInfo.platform === "Instagram") {
      candidates = extractLinkCandidates(["/p/", "/reel/", "/tv/"], platformInfo);
    } else if (platformInfo.platform === "Facebook") {
      candidates = extractLinkCandidates(["/reel/", "/videos/", "/posts/", "/watch/", "story_fbid"], platformInfo);
    } else if (platformInfo.platform === "Meta Ad Library") {
      candidates = extractMetaAdLibraryCandidates(platformInfo);
    }

    if (!candidates.length || platformInfo.platform === "Website") {
      candidates = [...candidates, ...extractLandingPageCandidates(platformInfo)];
    }

    candidates = dedupeCandidates(candidates).slice(0, MAX_CANDIDATES);

    return {
      ...platformInfo,
      scannedAt: new Date().toISOString(),
      candidateCount: candidates.length,
      candidates,
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "ALYSSA_SCAN_PAGE") return undefined;

    try {
      sendResponse({ ok: true, data: scanPage() });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error?.message || "Scan failed",
        data: {
          ...detectPlatform(),
          scannedAt: new Date().toISOString(),
          candidateCount: 0,
          candidates: [],
        },
      });
    }

    return true;
  });
})();
