// @arvindang/scroll-video-scrubber, upstream revision c67adc9 (MIT).
// Classic-script wrapper for file:// previews; implementation unchanged.
(function () {
"use strict";
// src/index.ts
var ROOT_SELECTOR = "[data-video-scrubber]";
var VIDEO_SELECTOR = "[data-svs-video], video";
var STICKY_SELECTOR = "[data-svs-sticky]";
var PROGRESS_SELECTOR = "[data-svs-progress]";
var PROGRESS_PROPERTY = "--svs-progress";
var autoInitialized = /* @__PURE__ */ new WeakMap();
function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}
function isHTMLElement(value) {
  return typeof value === "object" && value !== null && "nodeType" in value && value.nodeType === 1 && "style" in value;
}
function isVideoElement(value) {
  return isHTMLElement(value) && value.tagName.toLowerCase() === "video";
}
function resolveRoot(reference) {
  if (isHTMLElement(reference)) return reference;
  if (typeof document === "undefined") {
    throw new Error("createVideoScrubber() requires a browser DOM.");
  }
  const root = document.querySelector(reference);
  if (!isHTMLElement(root)) {
    throw new Error(`Video scrubber root not found: ${reference}`);
  }
  return root;
}
function findWithinRoot(root, reference) {
  if (isHTMLElement(reference)) return reference;
  if (root.matches(reference)) return root;
  return root.querySelector(reference);
}
function resolveOptionalElement(root, reference, defaultSelector, optionName) {
  if (reference === null) return null;
  const isExplicit = reference !== void 0;
  const resolved = findWithinRoot(root, reference ?? defaultSelector);
  if (!resolved && isExplicit) {
    throw new Error(`Video scrubber ${optionName} not found: ${String(reference)}`);
  }
  return resolved;
}
function finiteDuration(video) {
  return Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null;
}
function rectHeight(rect) {
  return rect.height || Math.max(0, rect.bottom - rect.top);
}
function restoreAttribute(element, name, previous) {
  if (previous === null) element.removeAttribute(name);
  else element.setAttribute(name, previous);
}
function errorFromMedia(video) {
  const code = video.error?.code;
  return new Error(code ? `Video scrubber media error (code ${code}).` : "Video scrubber media error.");
}
function createVideoScrubber(options) {
  if (!options?.root) {
    throw new TypeError("createVideoScrubber() requires a root element or selector.");
  }
  const root = resolveRoot(options.root);
  const ownerDocument = root.ownerDocument;
  const defaultView = ownerDocument.defaultView;
  if (!defaultView) throw new Error("Video scrubber root must belong to a browser document.");
  const view = defaultView;
  const videoCandidate = resolveOptionalElement(
    root,
    options.video,
    VIDEO_SELECTOR,
    "video"
  );
  if (!isVideoElement(videoCandidate)) {
    throw new Error("Video scrubber requires a <video> element inside its root.");
  }
  const video = videoCandidate;
  const sticky = resolveOptionalElement(
    root,
    options.sticky,
    STICKY_SELECTOR,
    "sticky element"
  );
  const progressElement = resolveOptionalElement(
    root,
    options.progress,
    PROGRESS_SELECTOR,
    "progress element"
  ) ?? root;
  const configuredFrameRate = options.frameRate ?? 30;
  if (!Number.isFinite(configuredFrameRate) || configuredFrameRate <= 0) {
    throw new TypeError("Video scrubber frameRate must be a positive number.");
  }
  const respectReducedMotion = options.respectReducedMotion !== false;
  const mediaQuery = respectReducedMotion && typeof view.matchMedia === "function" ? view.matchMedia(options.reducedMotionQuery ?? "(prefers-reduced-motion: reduce)") : null;
  const previousRootEnhanced = root.getAttribute("data-svs-enhanced");
  const previousRootState = root.getAttribute("data-svs-state");
  const previousRootProgress = root.style.getPropertyValue(PROGRESS_PROPERTY);
  const previousTargetProgress = progressElement.style.getPropertyValue(PROGRESS_PROPERTY);
  const previousMuted = video.muted;
  const previousMutedAttribute = video.getAttribute("muted");
  const previousPlaysInline = video.playsInline;
  const previousPlaysInlineAttribute = video.getAttribute("playsinline");
  const previousControls = video.controls;
  const previousControlsAttribute = video.getAttribute("controls");
  let currentProgress = 0;
  let destroyed = false;
  let runtimeEnabled = false;
  let readyCalled = false;
  let animationFrame = null;
  let intersectionObserver = null;
  let unlockInFlight = false;
  let unlocked = false;
  const scheduleFrame = typeof view.requestAnimationFrame === "function" ? view.requestAnimationFrame.bind(view) : (callback) => view.setTimeout(() => callback(view.performance.now()), 16);
  const cancelFrame = typeof view.cancelAnimationFrame === "function" ? view.cancelAnimationFrame.bind(view) : view.clearTimeout.bind(view);
  const controller = {
    root,
    video,
    sticky,
    progressElement,
    get progress() {
      return currentProgress;
    },
    get enabled() {
      return runtimeEnabled && !destroyed;
    },
    get destroyed() {
      return destroyed;
    },
    update: requestUpdate,
    setProgress,
    destroy
  };
  function reportError(error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    options.onError?.(normalized, controller);
  }
  function markReady() {
    if (readyCalled || !finiteDuration(video) || destroyed) return;
    readyCalled = true;
    options.onReady?.(controller);
  }
  function writeProgress(progress) {
    const serialized = String(progress);
    root.style.setProperty(PROGRESS_PROPERTY, serialized);
    if (progressElement !== root) {
      progressElement.style.setProperty(PROGRESS_PROPERTY, serialized);
    }
  }
  function seekToCurrentProgress(force = false) {
    if (!runtimeEnabled || destroyed || video.seeking) return;
    const duration = finiteDuration(video);
    if (!duration) return;
    const oneFrame = 1 / configuredFrameRate;
    const lastRenderableTime = Math.max(0, duration - Math.min(oneFrame, duration));
    const nextTime = lastRenderableTime * currentProgress;
    const halfFrame = oneFrame / 2;
    if (!force && Math.abs(video.currentTime - nextTime) < halfFrame) return;
    try {
      video.currentTime = nextTime;
    } catch (error) {
      reportError(error);
    }
  }
  function setProgress(value) {
    if (destroyed) return;
    const nextProgress = clamp(Number.isFinite(value) ? value : 0);
    const changed = Math.abs(nextProgress - currentProgress) > 1e-6;
    currentProgress = nextProgress;
    writeProgress(nextProgress);
    seekToCurrentProgress();
    if (changed) options.onProgress?.(nextProgress, controller);
  }
  function stickyTopOffset() {
    if (!sticky) return 0;
    const computedTop = view.getComputedStyle(sticky).top;
    const parsedTop = Number.parseFloat(computedTop);
    return Number.isFinite(parsedTop) ? parsedTop : 0;
  }
  function isVideoVisible() {
    const rect = video.getBoundingClientRect();
    const viewportWidth = view.innerWidth || ownerDocument.documentElement.clientWidth;
    const viewportHeight = view.innerHeight || ownerDocument.documentElement.clientHeight;
    return rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
  }
  function calculateProgress() {
    const rootRect = root.getBoundingClientRect();
    const viewportHeight = view.innerHeight || ownerDocument.documentElement.clientHeight;
    const offset = stickyTopOffset();
    const stickyHeight = sticky ? rectHeight(sticky.getBoundingClientRect()) || Math.max(0, viewportHeight - offset) : viewportHeight;
    const scrollDistance = Math.max(0, rectHeight(rootRect) - stickyHeight);
    if (scrollDistance === 0) return rootRect.top <= offset ? 1 : 0;
    return clamp((offset - rootRect.top) / scrollDistance);
  }
  function runUpdate() {
    animationFrame = null;
    if (!runtimeEnabled || destroyed) return;
    setProgress(calculateProgress());
  }
  function requestUpdate() {
    if (!runtimeEnabled || destroyed || animationFrame !== null) return;
    animationFrame = scheduleFrame(runUpdate);
  }
  function handleViewportChange() {
    void attemptMediaUnlock();
    requestUpdate();
  }
  function handleMetadata() {
    markReady();
    seekToCurrentProgress();
  }
  function handleSeeked() {
    seekToCurrentProgress();
  }
  function handleMediaError() {
    reportError(errorFromMedia(video));
  }
  async function attemptMediaUnlock() {
    if (destroyed || !runtimeEnabled || unlocked || unlockInFlight || !isVideoVisible()) return;
    unlockInFlight = true;
    try {
      const playResult = video.play();
      if (playResult) await playResult;
      video.pause();
      unlocked = true;
      root.removeEventListener("pointerdown", handlePointerRetry);
      intersectionObserver?.disconnect();
      intersectionObserver = null;
      seekToCurrentProgress(true);
    } catch {
      try {
        video.pause();
      } catch {
      }
    } finally {
      unlockInFlight = false;
    }
  }
  function handlePointerRetry() {
    void attemptMediaUnlock();
  }
  function observeForUnlock() {
    const IntersectionObserverConstructor = view.IntersectionObserver;
    if (!IntersectionObserverConstructor) return;
    intersectionObserver = new IntersectionObserverConstructor(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) return;
        void attemptMediaUnlock();
      },
      { rootMargin: options.unlockRootMargin ?? "200px 0px" }
    );
    intersectionObserver.observe(root);
  }
  function startRuntime() {
    if (destroyed || runtimeEnabled || options.enabled === false || mediaQuery?.matches) return;
    runtimeEnabled = true;
    video.controls = false;
    video.removeAttribute("controls");
    root.setAttribute("data-svs-enhanced", "true");
    root.setAttribute("data-svs-state", "active");
    view.addEventListener("scroll", handleViewportChange, { passive: true });
    view.addEventListener("resize", handleViewportChange, { passive: true });
    root.addEventListener("pointerdown", handlePointerRetry, { passive: true });
    observeForUnlock();
    requestUpdate();
  }
  function stopRuntime(state) {
    if (runtimeEnabled) {
      runtimeEnabled = false;
      view.removeEventListener("scroll", handleViewportChange);
      view.removeEventListener("resize", handleViewportChange);
      root.removeEventListener("pointerdown", handlePointerRetry);
      intersectionObserver?.disconnect();
      intersectionObserver = null;
      if (animationFrame !== null) {
        cancelFrame(animationFrame);
        animationFrame = null;
      }
    }
    root.setAttribute("data-svs-enhanced", "false");
    root.setAttribute("data-svs-state", state);
    video.controls = previousControls;
    restoreAttribute(video, "controls", previousControlsAttribute);
  }
  function handleMotionPreference() {
    if (destroyed) return;
    if (mediaQuery?.matches) stopRuntime("reduced-motion");
    else if (options.enabled === false) stopRuntime("disabled");
    else startRuntime();
  }
  function destroy() {
    if (destroyed) return;
    stopRuntime("disabled");
    destroyed = true;
    video.removeEventListener("loadedmetadata", handleMetadata);
    video.removeEventListener("durationchange", handleMetadata);
    video.removeEventListener("seeked", handleSeeked);
    video.removeEventListener("error", handleMediaError);
    if (mediaQuery) {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleMotionPreference);
      } else {
        mediaQuery.removeListener(handleMotionPreference);
      }
    }
    restoreAttribute(root, "data-svs-enhanced", previousRootEnhanced);
    restoreAttribute(root, "data-svs-state", previousRootState);
    if (previousRootProgress) root.style.setProperty(PROGRESS_PROPERTY, previousRootProgress);
    else root.style.removeProperty(PROGRESS_PROPERTY);
    if (progressElement !== root) {
      if (previousTargetProgress) {
        progressElement.style.setProperty(PROGRESS_PROPERTY, previousTargetProgress);
      } else {
        progressElement.style.removeProperty(PROGRESS_PROPERTY);
      }
    }
    video.muted = previousMuted;
    video.playsInline = previousPlaysInline;
    video.controls = previousControls;
    restoreAttribute(video, "muted", previousMutedAttribute);
    restoreAttribute(video, "playsinline", previousPlaysInlineAttribute);
    restoreAttribute(video, "controls", previousControlsAttribute);
    if (autoInitialized.get(root) === controller) autoInitialized.delete(root);
  }
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  writeProgress(0);
  video.addEventListener("loadedmetadata", handleMetadata);
  video.addEventListener("durationchange", handleMetadata);
  video.addEventListener("seeked", handleSeeked);
  video.addEventListener("error", handleMediaError);
  if (mediaQuery) {
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleMotionPreference);
    } else {
      mediaQuery.addListener(handleMotionPreference);
    }
  }
  markReady();
  handleMotionPreference();
  return controller;
}
function autoInitVideoScrubbers(options = {}) {
  if (typeof document === "undefined") return [];
  const selector = options.selector ?? ROOT_SELECTOR;
  const roots = Array.from(document.querySelectorAll(selector));
  return roots.map((root) => {
    const existing = autoInitialized.get(root);
    if (existing && !existing.destroyed) return existing;
    const frameRateAttribute = Number.parseFloat(root.dataset.svsFrameRate ?? "");
    const dataOptions = {
      root,
      video: root.dataset.svsVideoSelector || void 0,
      sticky: root.dataset.svsStickySelector || void 0,
      progress: root.dataset.svsProgressSelector || void 0,
      frameRate: Number.isFinite(frameRateAttribute) ? frameRateAttribute : void 0,
      enabled: !root.hasAttribute("data-svs-disabled"),
      respectReducedMotion: !root.hasAttribute("data-svs-ignore-reduced-motion")
    };
    const scrubber = createVideoScrubber({ ...dataOptions, ...options, root });
    autoInitialized.set(root, scrubber);
    return scrubber;
  });
}
window.ScrollVideoScrubber = { autoInitVideoScrubbers, createVideoScrubber };
})();
