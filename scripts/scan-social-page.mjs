#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, ".crawler-output");
const resultPath = path.join(outputDir, "social-scan-result.json");
const screenshotPath = path.join(outputDir, "page-screenshot.png");

function parseArgs(argv) {
  const args = argv.slice(2);
  const url = args.find((arg) => !arg.startsWith("--")) || "";
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const parsedLimit = limitArg ? Number(limitArg.split("=")[1]) : 12;

  return {
    url,
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(Math.floor(parsedLimit), 50) : 12,
    headed: args.includes("--headed"),
  };
}

function inferPlatform(url) {
  const value = String(url || "").toLowerCase();
  if (value.includes("instagram.com")) return "instagram";
  if (value.includes("facebook.com") || value.includes("fb.watch")) return "facebook";
  return "unknown";
}

function usage() {
  console.log('Usage: node scripts/scan-social-page.mjs "<url>" --limit=12 --headed');
}

function isLikelyCorruptedText(value) {
  const text = String(value || "");
  if (!text.trim()) return false;

  const sample = text.slice(0, 1200);
  const replacementCount = (sample.match(/\uFFFD/g) || []).length;
  const controlCount = (sample.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length;
  const mojibakeTokenCount = (sample.match(/[��]|嚗|蝝|銝|撌|餈|摰|憿|閬|瘣|擃|蝷|鈭|皞|璅|脣|芸||||||||||||||||||||||||||||||||||]/g) || []).length;
  const weirdQuestionCount = (sample.match(/\?[^\sA-Za-z0-9?]/g) || []).length;
  const cjkCount = (sample.match(/[\u3400-\u9FFF]/g) || []).length;
  const asciiWordCount = (sample.match(/[A-Za-z]{3,}/g) || []).length;
  const suspiciousCount = replacementCount * 4 + controlCount * 3 + mojibakeTokenCount + weirdQuestionCount;

  return suspiciousCount >= 8 && suspiciousCount > cjkCount * 0.35 + asciiWordCount * 0.5;
}

function cleanCandidateText(value, { corrupted = false, maxLength = 320 } = {}) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";
  return normalized.slice(0, corrupted ? Math.min(maxLength, 180) : maxLength);
}

function hasReadableText(value) {
  const text = String(value || "").trim();
  if (text.length < 8) return false;
  if (isLikelyCorruptedText(text)) return false;

  const readableChars = text.match(/[A-Za-z0-9\u3400-\u9FFF]/g) || [];
  return readableChars.length >= 8;
}

function scoreCandidate(candidate, context) {
  const warnings = [];
  const hasPreview = Boolean(candidate.previewUrl);
  const corruptedCaption = isLikelyCorruptedText(candidate.caption);
  const corruptedPageTitle = isLikelyCorruptedText(candidate.pageTitle);
  const hasCaption = hasReadableText(candidate.caption);
  const duplicatePreview = hasPreview && context.duplicatePreviewUrls.has(candidate.previewUrl);
  const uniqueSourceUrl = !context.duplicateSourceUrls.has(candidate.sourceUrl);
  let qualityScore = 100;

  if (!uniqueSourceUrl) {
    qualityScore -= 30;
    warnings.push("duplicate_source_url");
  }
  if (!hasPreview) {
    qualityScore -= 30;
    warnings.push("missing_preview");
  }
  if (duplicatePreview) {
    qualityScore -= 35;
    warnings.push("duplicate_preview");
  }
  if (!hasCaption) {
    qualityScore -= 20;
    warnings.push("missing_or_unreadable_caption");
  }
  if (corruptedCaption) {
    qualityScore -= 25;
    warnings.push("corrupted_caption_truncated");
  }
  if (corruptedPageTitle) {
    qualityScore -= 10;
    warnings.push("corrupted_page_title");
  }
  if (context.loginWallDetected) {
    qualityScore -= 30;
    warnings.push("login_wall_detected");
  }
  if (context.modalDetected) {
    qualityScore -= 25;
    warnings.push("modal_blocking_page");
  }

  qualityScore = Math.max(0, Math.min(100, qualityScore));

  const confidence =
    context.loginWallDetected || duplicatePreview || qualityScore < 45
      ? "low"
      : uniqueSourceUrl && hasPreview && !duplicatePreview && hasCaption && !corruptedCaption && qualityScore >= 75
        ? "high"
        : hasPreview
          ? "medium"
          : "low";

  return {
    ...candidate,
    caption: cleanCandidateText(candidate.caption, { corrupted: corruptedCaption }),
    pageTitle: cleanCandidateText(candidate.pageTitle, { corrupted: corruptedPageTitle, maxLength: 220 }),
    hasPreview,
    hasCaption,
    duplicatePreview,
    corruptedText: corruptedCaption || corruptedPageTitle,
    qualityScore,
    qualityWarnings: warnings,
    confidence,
  };
}

function applyQualityChecks(result) {
  const candidates = Array.isArray(result.candidates) ? result.candidates : [];
  const previewCounts = new Map();
  const sourceCounts = new Map();

  for (const candidate of candidates) {
    if (candidate.previewUrl) previewCounts.set(candidate.previewUrl, (previewCounts.get(candidate.previewUrl) || 0) + 1);
    if (candidate.sourceUrl) sourceCounts.set(candidate.sourceUrl, (sourceCounts.get(candidate.sourceUrl) || 0) + 1);
  }

  const duplicatePreviewUrls = new Set([...previewCounts.entries()].filter(([, count]) => count > 1).map(([url]) => url));
  const duplicateSourceUrls = new Set([...sourceCounts.entries()].filter(([, count]) => count > 1).map(([url]) => url));
  const context = {
    duplicatePreviewUrls,
    duplicateSourceUrls,
    loginWallDetected: Boolean(result.loginWallDetected),
    modalDetected: Boolean(result.modalDetected),
  };
  const scoredCandidates = candidates.map((candidate) => scoreCandidate(candidate, context));
  const pageTitleCorrupted = isLikelyCorruptedText(result.pageTitle);
  const warnings = Array.isArray(result.warnings) ? [...result.warnings] : [];

  if (result.modalDetected && result.platform === "instagram") {
    warnings.push("Instagram login modal is blocking part of the page.");
  }
  if (result.loginWallDetected) warnings.push("Login wall or limited public content detected.");
  if (duplicatePreviewUrls.size > 0) warnings.push("Multiple candidates share the same preview image.");
  if (pageTitleCorrupted) warnings.push("Page title appears corrupted or mojibake.");

  return {
    ...result,
    pageTitle: cleanCandidateText(result.pageTitle, { corrupted: pageTitleCorrupted, maxLength: 220 }),
    pageTitleCorrupted,
    candidates: scoredCandidates,
    candidatesFound: scoredCandidates.length,
    qualitySummary: {
      uniquePreviewCount: scoredCandidates.filter((candidate) => candidate.hasPreview && !candidate.duplicatePreview).length,
      duplicatedPreviewCount: scoredCandidates.filter((candidate) => candidate.duplicatePreview).length,
      readableCaptionCount: scoredCandidates.filter((candidate) => candidate.hasCaption).length,
      highConfidenceCount: scoredCandidates.filter((candidate) => candidate.confidence === "high").length,
      mediumConfidenceCount: scoredCandidates.filter((candidate) => candidate.confidence === "medium").length,
      lowConfidenceCount: scoredCandidates.filter((candidate) => candidate.confidence === "low").length,
    },
    warnings: [...new Set(warnings)],
  };
}

function getRecommendedNextStep(result) {
  if (result.modalDetected) return "Inspect screenshot; login modal is blocking part of the page, so direct crawling is not reliable yet.";
  if (result.loginWallDetected) return "Treat output as partial only; compare with screenshot and consider Extension capture for true previews.";
  if ((result.qualitySummary?.uniquePreviewCount || 0) === 0 && result.candidatesFound > 0) {
    return "Improve preview extraction before using candidates downstream.";
  }
  if (result.candidatesFound === 0) return "Try a different public page or inspect screenshot to see what Playwright can access.";
  return "Review JSON and screenshot manually before deciding whether this source is usable.";
}

function summarizeResult(result) {
  console.log("");
  console.log("Social scan summary");
  console.log("-------------------");
  console.log(`platform: ${result.platform}`);
  console.log(`url: ${result.url}`);
  console.log(`candidates found: ${result.candidatesFound}`);
  console.log(`candidates with unique preview: ${result.qualitySummary?.uniquePreviewCount || 0}`);
  console.log(`candidates with duplicated preview: ${result.qualitySummary?.duplicatedPreviewCount || 0}`);
  console.log(`candidates with readable caption: ${result.qualitySummary?.readableCaptionCount || 0}`);
  console.log(`login wall detected: ${result.loginWallDetected ? "yes" : "no"}`);
  console.log(`modal detected: ${result.modalDetected ? "yes" : "no"}`);
  console.log(`likely blocked: ${result.likelyBlocked ? "yes" : "no"}`);
  console.log(`recommended next step: ${result.recommendedNextStep || getRecommendedNextStep(result)}`);
  if (result.reason) console.log(`reason: ${result.reason}`);
  console.log(`json: ${path.relative(repoRoot, resultPath)}`);
  console.log(`screenshot: ${path.relative(repoRoot, screenshotPath)}`);
}

async function writeResult(result) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(resultPath, JSON.stringify(result, null, 2), "utf8");
}

function createBaseResult({ url, platform }) {
  return {
    success: false,
    reason: "",
    platform,
    url,
    pageTitle: "",
    finalUrl: "",
    candidatesFound: 0,
    loginWallDetected: false,
    modalDetected: false,
    modalTextSample: "",
    likelyBlocked: false,
    pageTitleCorrupted: false,
    discoveredAt: new Date().toISOString(),
    candidates: [],
    qualitySummary: {
      uniquePreviewCount: 0,
      duplicatedPreviewCount: 0,
      readableCaptionCount: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
    },
    warnings: [],
    recommendedNextStep: "",
    diagnostics: {},
  };
}

async function main() {
  const options = parseArgs(process.argv);
  const platform = inferPlatform(options.url);

  if (!options.url || platform === "unknown") {
    usage();
    const result = {
      ...createBaseResult({ url: options.url, platform }),
      reason: options.url ? "unsupported_platform" : "missing_url",
      diagnostics: {
        supportedPlatforms: ["instagram", "facebook"],
      },
    };
    await writeResult(result);
    summarizeResult(result);
    process.exitCode = 1;
    return;
  }

  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({
    headless: !options.headed,
  });

  const page = await browser.newPage({
    viewport: { width: 1365, height: 900 },
  });

  let responseStatus = null;
  let navigationError = "";
  const result = createBaseResult({ url: options.url, platform });

  try {
    const response = await page.goto(options.url, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    responseStatus = response?.status() ?? null;

    await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
    await page.waitForTimeout(3500);
  } catch (error) {
    navigationError = error?.message || String(error);
  }

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    result.diagnostics.screenshotError = error?.message || String(error);
  }

  try {
    const pageData = await page.evaluate(
      ({ platform, limit }) => {
        const now = new Date().toISOString();
        const pageTitle = document.title || "";
        const finalUrl = window.location.href;
        const bodyText = document.body?.innerText || "";
        const lowerBody = bodyText.toLowerCase();
        const loginWallDetected =
          /log in|login|sign up|create account|登入|登錄|註冊|登录|注册|see more from/i.test(bodyText) ||
          Boolean(document.querySelector('input[name="email"], input[name="pass"], input[type="password"]'));
        const likelyBlocked =
          /temporarily blocked|content isn't available|page isn't available|something went wrong|try again later|not available|unsupported browser|無法顯示|暫時無法/i.test(
            bodyText
          );

        const linkPatterns =
          platform === "instagram"
            ? [/\/p\//i, /\/reel\//i, /\/tv\//i]
            : [/\/reel\//i, /\/videos\//i, /\/posts\//i, /\/watch\//i, /story_fbid/i];

        const typeFromUrl = (href) => {
          if (/\/reel\//i.test(href)) return "reel";
          if (/\/videos\//i.test(href) || /\/watch\//i.test(href)) return "video";
          if (/\/p\//i.test(href) || /\/posts\//i.test(href) || /story_fbid/i.test(href)) return "post";
          if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(href)) return "image";
          return "unknown";
        };

        const isVisible = (element) => {
          if (!element) return false;
          const style = window.getComputedStyle(element);
          if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 4 && rect.height > 4 && rect.bottom >= 0 && rect.right >= 0;
        };

        const cleanText = (value, maxLength = 600) =>
          String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, maxLength);

        const modalCandidates = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]')).filter(isVisible);
        const fixedOverlayCandidates = Array.from(document.querySelectorAll("div"))
          .filter((element) => {
            if (!isVisible(element)) return false;
            const style = window.getComputedStyle(element);
            const zIndex = Number(style.zIndex);
            const rect = element.getBoundingClientRect();
            return (
              (style.position === "fixed" || style.position === "sticky") &&
              (Number.isFinite(zIndex) ? zIndex >= 10 : true) &&
              rect.width > window.innerWidth * 0.25 &&
              rect.height > window.innerHeight * 0.15
            );
          })
          .slice(0, 5);
        const modalElement = [...modalCandidates, ...fixedOverlayCandidates].find((element) =>
          /log in|login|sign up|create account|登入|登錄|註冊|登录|注册|see more from/i.test(element.innerText || "")
        );
        const modalDetected = Boolean(modalElement);
        const modalTextSample = cleanText(modalElement?.innerText || "", 500);

        const normalizeUrl = (value) => {
          try {
            const url = new URL(value, window.location.href);
            url.hash = "";
            return url.href;
          } catch {
            return "";
          }
        };

        const findPreview = (link) => {
          const scopes = [
            link.closest("article"),
            link.closest('[role="article"]'),
            link.closest("li"),
            link.closest("div"),
            link.parentElement,
            document.body,
          ].filter(Boolean);

          for (const scope of scopes) {
            const image = Array.from(scope.querySelectorAll("img")).find((img) => isVisible(img) && img.currentSrc);
            if (image) {
              return {
                previewUrl: image.currentSrc || image.src || "",
                altText: cleanText(image.alt || image.getAttribute("aria-label") || ""),
              };
            }
          }

          return { previewUrl: "", altText: "" };
        };

        const links = Array.from(document.querySelectorAll("a[href]"));
        const candidates = [];
        const seen = new Set();

        for (const link of links) {
          const href = normalizeUrl(link.getAttribute("href"));
          if (!href || seen.has(href)) continue;
          if (!linkPatterns.some((pattern) => pattern.test(href))) continue;

          seen.add(href);
          const visible = isVisible(link);
          const scope = link.closest("article") || link.closest('[role="article"]') || link.closest("div") || link;
          const preview = findPreview(link);
          const caption = cleanText(
            preview.altText ||
              link.getAttribute("aria-label") ||
              link.textContent ||
              scope?.innerText ||
              "",
            800
          );

          candidates.push({
            platform,
            sourceUrl: href,
            type: typeFromUrl(href),
            previewUrl: preview.previewUrl,
            caption,
            pageTitle,
            discoveredAt: now,
            confidence: visible && preview.previewUrl ? "high" : visible ? "medium" : "low",
          });

          if (candidates.length >= limit) break;
        }

        return {
          pageTitle,
          finalUrl,
          candidates,
          loginWallDetected,
          modalDetected,
          modalTextSample,
          likelyBlocked,
          diagnostics: {
            visibleLinkCount: links.filter(isVisible).length,
            materialLinkCount: candidates.length,
            bodyTextSample: cleanText(lowerBody, 1000),
          },
        };
      },
      { platform, limit: options.limit }
    );

    result.pageTitle = pageData.pageTitle;
    result.finalUrl = pageData.finalUrl;
    result.candidates = pageData.candidates;
    result.candidatesFound = pageData.candidates.length;
    result.loginWallDetected = pageData.loginWallDetected;
    result.modalDetected = pageData.modalDetected;
    result.modalTextSample = cleanCandidateText(pageData.modalTextSample, { maxLength: 500 });
    result.likelyBlocked = pageData.likelyBlocked;
    result.diagnostics = {
      ...result.diagnostics,
      ...pageData.diagnostics,
      responseStatus,
      navigationError,
      screenshotPath: path.relative(repoRoot, screenshotPath),
    };

    Object.assign(result, applyQualityChecks(result));

    const usableCandidateCount =
      (result.qualitySummary.highConfidenceCount || 0) + (result.qualitySummary.mediumConfidenceCount || 0);
    result.success =
      usableCandidateCount > 0 &&
      !result.likelyBlocked &&
      !result.loginWallDetected &&
      !result.modalDetected &&
      (result.qualitySummary.uniquePreviewCount || 0) > 0;
    result.reason = result.success
      ? ""
      : result.likelyBlocked
        ? "likely_blocked"
        : result.modalDetected
          ? "modal_blocking_page"
          : result.loginWallDetected
            ? "login_wall_or_limited_public_content"
            : result.candidatesFound === 0
              ? "no_candidates_found"
              : result.qualitySummary.uniquePreviewCount === 0
                ? "no_unique_previews"
                : "low_quality_candidates";
    result.recommendedNextStep = getRecommendedNextStep(result);
  } catch (error) {
    result.reason = "scan_failed";
    result.diagnostics = {
      ...result.diagnostics,
      responseStatus,
      navigationError,
      error: error?.message || String(error),
      screenshotPath: path.relative(repoRoot, screenshotPath),
    };
  } finally {
    await browser.close();
  }

  if (navigationError && result.candidatesFound === 0) {
    result.reason = result.reason || "navigation_failed";
    result.diagnostics.navigationError = navigationError;
  }

  await writeResult(result);
  summarizeResult(result);
}

main().catch(async (error) => {
  const options = parseArgs(process.argv);
  const result = {
    ...createBaseResult({ url: options.url, platform: inferPlatform(options.url) }),
    reason: "fatal_error",
    diagnostics: {
      error: error?.message || String(error),
    },
  };

  await writeResult(result).catch(() => {});
  summarizeResult(result);
  process.exitCode = 1;
});
