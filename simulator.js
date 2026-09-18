/**
 * Bynji Interactive Product Simulator & Live Video Sandbox
 * 100% private, client-side only. Zero telemetry, zero external requests.
 */
(() => {
  document.addEventListener("DOMContentLoaded", () => {
    initHeroCard();
    initShowcaseSimulator();
    initRetinaGallery();
  });

  /* ── 1. Hero Visual Fallback (if present) ─────────────────────────────────── */
  function initHeroCard() {
    const card = document.querySelector("[data-hero-card]");
    if (!card) return;

    const resumeBtn = card.querySelector("[data-hero-resume]");
    const dismissBtn = card.querySelector("[data-hero-dismiss]");
    const resetBtn = card.querySelector("[data-hero-reset]");
    const progressFill = card.querySelector("[data-hero-progress]");
    const statusText = card.querySelector("[data-hero-status]");
    const toast = document.querySelector("[data-hero-toast]");

    let toastTimer = null;

    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add("is-visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 3200);
    }

    if (resumeBtn) {
      resumeBtn.addEventListener("click", () => {
        card.dataset.state = "resumed";
        if (progressFill) progressFill.style.width = "72%";
        if (statusText) statusText.textContent = "Playing from 41:46";
        showToast("✓ Resumed to 41:46 • Saved privately on device");
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        card.dataset.state = "dismissed";
        if (statusText)
          statusText.textContent = "Prompt dismissed (history preserved)";
        showToast("Prompt dismissed • Progress kept in Library");
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        card.dataset.state = "initial";
        if (progressFill) progressFill.style.width = "72%";
        if (statusText)
          statusText.textContent = "Saved privately in your browser";
        if (toast) toast.classList.remove("is-visible");
      });
    }
  }

  /* ── 2. Showcase Window Simulator & Live Sandbox ─────────────────────────── */
  function initShowcaseSimulator() {
    const sim = document.querySelector("[data-bynji-simulator]");
    if (!sim) return;

    // Initialize the live video sandbox
    initLiveSandbox(sim);

    // Initialize Subtitle Intelligence & Player HUD
    initSubtitleIntelligence(sim);

    const tabs = sim.querySelectorAll("[data-sim-tab]");
    const panels = sim.querySelectorAll("[data-sim-panel]");

    // Tab switching
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.simTab;

        tabs.forEach((t) => {
          const isCurrent = t === tab;
          t.classList.toggle("is-active", isCurrent);
          t.setAttribute("aria-selected", isCurrent ? "true" : "false");
        });

        panels.forEach((p) => {
          const isTarget = p.dataset.simPanel === target;
          p.classList.toggle("is-active", isTarget);
          p.hidden = !isTarget;
        });

        // Pause sandbox video if switching away from sandbox tab
        if (target !== "resume") {
          const video = sim.querySelector(".sandbox-video");
          if (video && !video.paused) {
            try {
              video.pause();
            } catch (_) {}
          }
        }

        // Auto-play/pause subtitle demo video when switching tabs
        const subVideo = sim.querySelector(".sub-demo-video");
        if (subVideo) {
          if (target === "subtitles") {
            safePlay(subVideo);
          } else if (!subVideo.paused) {
            try {
              subVideo.pause();
            } catch (_) {}
          }
        }
      });
    });

    // Shelf item selection demo
    const shelfItems = sim.querySelectorAll("[data-shelf-card]");
    const shelfTitle = sim.querySelector("[data-shelf-preview-title]");
    const shelfMeta = sim.querySelector("[data-shelf-preview-meta]");
    const shelfProgress = sim.querySelector("[data-shelf-preview-progress]");
    const shelfTime = sim.querySelector("[data-shelf-preview-time]");

    shelfItems.forEach((card) => {
      card.addEventListener("click", () => {
        shelfItems.forEach((c) => c.classList.remove("is-selected"));
        card.classList.add("is-selected");

        if (shelfTitle) shelfTitle.textContent = card.dataset.title || "";
        if (shelfMeta) shelfMeta.textContent = card.dataset.meta || "";
        if (shelfTime) shelfTime.textContent = card.dataset.time || "";
        if (shelfProgress) {
          shelfProgress.style.width = card.dataset.pct || "50%";
        }
      });
    });

    // Insights time range switch
    const insightsBtns = sim.querySelectorAll("[data-insights-range]");
    const totalTimeEl = sim.querySelector("[data-stat-total-time]");
    const totalVideosEl = sim.querySelector("[data-stat-total-videos]");
    const completionEl = sim.querySelector("[data-stat-completion]");

    insightsBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        insightsBtns.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        const range = btn.dataset.insightsRange;
        if (range === "week") {
          if (totalTimeEl) totalTimeEl.textContent = "14.8 hrs";
          if (totalVideosEl) totalVideosEl.textContent = "23 videos";
          if (completionEl) completionEl.textContent = "84%";
        } else if (range === "month") {
          if (totalTimeEl) totalTimeEl.textContent = "58.2 hrs";
          if (totalVideosEl) totalVideosEl.textContent = "89 videos";
          if (completionEl) completionEl.textContent = "87%";
        } else {
          if (totalTimeEl) totalTimeEl.textContent = "182.4 hrs";
          if (totalVideosEl) totalVideosEl.textContent = "312 videos";
          if (completionEl) completionEl.textContent = "91%";
        }
      });
    });

    // Interactive sync simulation
    const syncNowBtn = sim.querySelector("[data-sim-sync-trigger]");
    const syncStatusEl = sim.querySelector("[data-sim-sync-status]");
    const syncTimeEl = sim.querySelector("[data-sim-sync-time]");

    if (syncNowBtn) {
      syncNowBtn.addEventListener("click", () => {
        syncNowBtn.disabled = true;
        if (syncStatusEl) {
          syncStatusEl.innerHTML =
            '<span class="status-dot status-dot--syncing"></span> Syncing devices...';
        }
        setTimeout(() => {
          syncNowBtn.disabled = false;
          if (syncStatusEl) {
            syncStatusEl.innerHTML =
              '<span class="status-dot status-dot--success"></span> Synced (2 devices)';
          }
          if (syncTimeEl) {
            syncTimeEl.textContent = "Just now";
          }
        }, 800);
      });
    }
  }

  /* ── Shared Audio/Video & Time Formatting Helpers ─────────────────────── */
  function formatTime(sec) {
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? "0" : ""}${rem}`;
  }

  function safePlay(v) {
    if (!v) return;
    try {
      const p = v.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    } catch (_) {}
  }

  function toggleFullscreen(container) {
    if (!container) return;
    const isFs = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFs) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    }
  }

  /* ── 3. Live Video Sandbox Controller ───────────────────────────────────── */
  function initLiveSandbox(sim) {
    const player = sim.querySelector("[data-sandbox-player]");
    if (!player) return;

    const video = player.querySelector(".sandbox-video");
    const playToggleBtn = player.querySelector("[data-sandbox-play-toggle]");
    const scrubber = player.querySelector("[data-sandbox-scrubber]");
    const scrubberFill = player.querySelector("[data-sandbox-scrubber-fill]");
    const timeDisplay = player.querySelector("[data-sandbox-time-display]");
    const resumeOverlay = player.querySelector("[data-sandbox-resume-overlay]");
    const promptTitle = player.querySelector("[data-sandbox-prompt-title]");
    const promptMeta = player.querySelector("[data-sandbox-prompt-meta]");
    const progressFill = player.querySelector("[data-sandbox-progress-fill]");
    const resumeBtn = player.querySelector("[data-sandbox-resume-btn]");
    const restartBtn = player.querySelector("[data-sandbox-restart-btn]");
    const dismissBtn = player.querySelector("[data-sandbox-dismiss]");
    const leavingOverlay = player.querySelector(
      "[data-sandbox-leaving-overlay]",
    );
    const simulateLeaveBtn = sim.querySelector("[data-sandbox-simulate-leave]");
    const quickSeekBtns = sim.querySelectorAll("[data-sandbox-quick-seek]");
    const statusText = sim.querySelector("[data-sandbox-status-text]");
    const fullscreenBtn = player.querySelector("[data-sandbox-fullscreen]");

    const guidePill = sim.querySelector("[data-sandbox-guide-pill]");
    const guideTitle = sim.querySelector("[data-sandbox-guide-title]");
    const guideDesc = sim.querySelector("[data-sandbox-guide-desc]");

    let savedResumeTime = 42; // default safe test target

    function updateGuideBanner(pill, title, desc) {
      if (guidePill && pill) guidePill.textContent = pill;
      if (guideTitle && title) guideTitle.textContent = title;
      if (guideDesc && desc) guideDesc.textContent = desc;
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", () => {
        toggleFullscreen(player);
      });

      const handleFsChange = () => {
        const isFs =
          document.fullscreenElement === player ||
          document.webkitFullscreenElement === player;
        fullscreenBtn.textContent = isFs ? "🗗" : "⛶";
        fullscreenBtn.setAttribute(
          "title",
          isFs ? "Exit Fullscreen" : "Toggle Fullscreen",
        );
      };

      document.addEventListener("fullscreenchange", handleFsChange);
      document.addEventListener("webkitfullscreenchange", handleFsChange);
    }

    function updateScrubber() {
      if (!video || !video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      if (scrubberFill) scrubberFill.style.width = `${pct}%`;
      if (timeDisplay)
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration || 60)}`;
    }

    if (video) {
      video.addEventListener("timeupdate", () => {
        updateScrubber();
        if (video.currentTime > 2) {
          savedResumeTime = Math.round(video.currentTime);
        }
      });

      video.addEventListener("play", () => {
        player.classList.add("is-playing");
        if (playToggleBtn) playToggleBtn.textContent = "❚❚";
        updateGuideBanner(
          `● Playback Active (${formatTime(video.currentTime)})`,
          "Bynji is recording confirmed timestamps locally.",
          'Click "Simulate Leaving Tab" below to test how Bynji detects revisit.',
        );
        if (statusText) {
          statusText.innerHTML = `<span class="status-dot"></span> <strong>Playback active</strong> at ${formatTime(video.currentTime)}.`;
        }
      });

      video.addEventListener("pause", () => {
        player.classList.remove("is-playing");
        if (playToggleBtn) playToggleBtn.textContent = "▶";
      });

      video.addEventListener("ended", () => {
        player.classList.remove("is-playing");
        if (playToggleBtn) playToggleBtn.textContent = "▶";
      });
    }

    if (playToggleBtn && video) {
      playToggleBtn.addEventListener("click", () => {
        if (video.paused) {
          safePlay(video);
        } else {
          try {
            video.pause();
          } catch (_) {}
        }
      });
    }

    if (scrubber && video) {
      scrubber.addEventListener("click", (e) => {
        const rect = scrubber.getBoundingClientRect();
        const clickRatio = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        const dur = video.duration || 60;
        video.currentTime = clickRatio * dur;
        savedResumeTime = Math.round(video.currentTime);
        updateScrubber();
        updateGuideBanner(
          `⏱ Seeked to ${formatTime(video.currentTime)}`,
          'Now click "Simulate Leaving Tab" below!',
          "See how Bynji instantly catches your confirmed timestamp.",
        );
        if (statusText) {
          statusText.innerHTML = `<span class="status-dot"></span> Timeline seeked to <strong>${formatTime(video.currentTime)}</strong>.`;
        }
      });
    }

    quickSeekBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetSec = parseFloat(btn.dataset.seekSeconds || "42");
        if (video) {
          video.currentTime = targetSec;
          savedResumeTime = targetSec;
          updateScrubber();
          if (video.paused) safePlay(video);
        }
        updateGuideBanner(
          `⏱ Jumped to ${formatTime(targetSec)}`,
          'Now click "Simulate Leaving Tab" below!',
          "Experience the authentic on-device Resume prompt.",
        );
        if (statusText) {
          statusText.innerHTML = `<span class="status-dot"></span> Jumped to <strong>${formatTime(targetSec)}</strong>.`;
        }
      });
    });

    if (simulateLeaveBtn && video) {
      simulateLeaveBtn.addEventListener("click", () => {
        const targetTime = savedResumeTime > 3 ? savedResumeTime : 42;
        try {
          video.pause();
        } catch (_) {}
        player.classList.remove("is-playing");

        // 1. Show leaving overlay simulation
        if (leavingOverlay) {
          leavingOverlay.hidden = false;
          leavingOverlay.classList.add("is-visible");
        }
        updateGuideBanner(
          "↻ Tab Closed",
          `Simulating tab closure at ${formatTime(targetTime)}...`,
          "Re-opening video player fresh at 0:00 without cloud delay.",
        );
        if (statusText) {
          statusText.innerHTML = `<span class="status-dot status-dot--syncing"></span> Simulating tab close at <strong>${formatTime(targetTime)}</strong>... Re-opening page.`;
        }

        // 2. Re-open page at 0:00 after brief delay
        setTimeout(() => {
          if (leavingOverlay) {
            leavingOverlay.hidden = true;
            leavingOverlay.classList.remove("is-visible");
          }
          video.currentTime = 0;
          updateScrubber();

          // 3. Trigger authentic Bynji Resume Prompt Toast!
          const dur = video.duration || 60;
          const pct = Math.round((targetTime / dur) * 100);
          if (promptTitle)
            promptTitle.textContent = `Continue from ${formatTime(targetTime)}?`;
          if (promptMeta)
            promptMeta.textContent = `Saved automatically on this device · ${pct}% watched`;
          if (progressFill) progressFill.style.width = `${pct}%`;
          if (resumeBtn) {
            resumeBtn.textContent = "▶ Resume";
            resumeBtn.style.background = "";
          }

          player.classList.add("has-resume-overlay");
          if (resumeOverlay) {
            resumeOverlay.hidden = false;
            resumeOverlay.classList.add("is-visible");
          }
          updateGuideBanner(
            "★ Confirmed Progress Found",
            `Continue from ${formatTime(targetTime)}?`,
            'Click "▶ Resume" on the video to jump back with confirmed progress.',
          );
          if (statusText) {
            statusText.innerHTML = `<span class="status-dot status-dot--success"></span> <strong>Confirmed progress found!</strong> Bynji offered instant Resume at ${formatTime(targetTime)}.`;
          }
        }, 600);
      });
    }

    if (resumeBtn && video) {
      resumeBtn.addEventListener("click", () => {
        resumeBtn.textContent = "✓ Resumed!";
        resumeBtn.style.background = "var(--success)";
        const targetTime = savedResumeTime > 3 ? savedResumeTime : 42;
        video.currentTime = targetTime;
        updateScrubber();
        safePlay(video);
        player.classList.add("is-playing");

        updateGuideBanner(
          `✓ Resumed to ${formatTime(targetTime)}`,
          "Playback seamlessly restored.",
          "Saved 100% locally on your device without cloud servers or telemetry.",
        );
        if (statusText) {
          statusText.innerHTML = `<span class="status-dot status-dot--success"></span> <strong>✓ Resumed playback at ${formatTime(targetTime)}.</strong> Zero cloud servers.`;
        }

        setTimeout(() => {
          player.classList.remove("has-resume-overlay");
          if (resumeOverlay) {
            resumeOverlay.hidden = true;
            resumeOverlay.classList.remove("is-visible");
          }
        }, 1200);
      });
    }

    if (restartBtn && video) {
      restartBtn.addEventListener("click", () => {
        player.classList.remove("has-resume-overlay");
        video.currentTime = 0;
        updateScrubber();
        safePlay(video);
        player.classList.add("is-playing");
        if (resumeOverlay) {
          resumeOverlay.hidden = true;
          resumeOverlay.classList.remove("is-visible");
        }
        updateGuideBanner(
          "↺ Started Over",
          "Playback restarted from 0:00.",
          "History updated quietly on-device.",
        );
        if (statusText) {
          statusText.innerHTML = `<span class="status-dot"></span> Started over from 0:00. History updated locally.`;
        }
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        player.classList.remove("has-resume-overlay");
        if (resumeOverlay) {
          resumeOverlay.hidden = true;
          resumeOverlay.classList.remove("is-visible");
        }
        updateGuideBanner(
          "✕ Prompt Dismissed",
          "User choice respected quietly.",
          "Viewing history remains preserved in your private Library.",
        );
        if (statusText) {
          statusText.innerHTML = `<span class="status-dot"></span> Prompt dismissed. User choice respected quietly during playback.`;
        }
      });
    }
  }

  /* ── 4. Subtitle Intelligence & Player HUD Simulator ─────────────────────── */
  function initSubtitleIntelligence(sim) {
    const subPanel = sim.querySelector('[data-sim-panel="subtitles"]');
    if (!subPanel) return;

    const video = subPanel.querySelector(".sub-demo-video");
    const playToggleBtn = subPanel.querySelector("[data-sub-play-toggle]");
    const timeDisplay = subPanel.querySelector("[data-sub-time]");
    const cueBox = subPanel.querySelector("[data-sub-cue-box]");
    const offsetPill = subPanel.querySelector("[data-sub-offset-pill]");

    // Console controls
    const offsetSlider = subPanel.querySelector("[data-sub-offset-input]");
    const offsetVal = subPanel.querySelector("[data-sub-offset-val]");
    const nudgeBtns = subPanel.querySelectorAll("[data-sub-nudge]");

    const driftSlider = subPanel.querySelector("[data-sub-drift-input]");
    const driftVal = subPanel.querySelector("[data-sub-drift-val]");

    const colorBtns = subPanel.querySelectorAll("[data-sub-color]");
    const scaleSlider = subPanel.querySelector("[data-sub-scale-input]");
    const scaleVal = subPanel.querySelector("[data-sub-scale-val]");
    const opacitySlider = subPanel.querySelector("[data-sub-opacity-input]");
    const opacityVal = subPanel.querySelector("[data-sub-opacity-val]");

    const presetChips = subPanel.querySelectorAll("[data-sub-preset]");
    const fileUploadBtn = subPanel.querySelector("[data-sub-file-button]");
    const filenameEl = subPanel.querySelector("[data-sub-filename]");
    const fileTagEl = subPanel.querySelector("[data-sub-file-tag]");

    // HUD controls & popovers
    const hudChips = subPanel.querySelectorAll(".sub-hud-chip");
    const hudMiniXs = subPanel.querySelectorAll(".sub-hud-mini-x");
    const hudPopovers = subPanel.querySelectorAll(".sub-hud-popover");
    const hudResetBtn = subPanel.querySelector("[data-hud-reset]");
    const subPlayerContainer = subPanel.querySelector("[data-sub-player]");
    const subFullscreenBtn = subPanel.querySelector("[data-sub-fullscreen]");

    if (subFullscreenBtn && subPlayerContainer) {
      subFullscreenBtn.addEventListener("click", () => {
        toggleFullscreen(subPlayerContainer);
      });

      const handleSubFsChange = () => {
        const isFs =
          document.fullscreenElement === subPlayerContainer ||
          document.webkitFullscreenElement === subPlayerContainer;
        subFullscreenBtn.textContent = isFs ? "🗗" : "⛶";
        subFullscreenBtn.setAttribute(
          "title",
          isFs ? "Exit Fullscreen" : "Toggle Fullscreen",
        );
      };

      document.addEventListener("fullscreenchange", handleSubFsChange);
      document.addEventListener("webkitfullscreenchange", handleSubFsChange);
    }

    // Presets dictionary
    const presets = {
      1: "We're 35 minutes into the simulation.<br>Audio sync is locked within ±0ms.",
      2: "Every millisecond counts when synchronizing speech.<br>Subtitles should feel completely effortless.",
      3: "Bynji runs 100% on your machine.<br>Zero cloud lag, zero tracking, zero compromises.",
    };

    let currentPreset = "1";
    let isCustomFile = false;

    function updateCueStyles() {
      if (!cueBox) return;
      const offsetMs = parseInt(offsetSlider?.value || "0", 10);
      const drift = parseFloat(driftSlider?.value || "1.000");
      const scalePct = parseInt(scaleSlider?.value || "100", 10);
      const opacityPct = parseInt(opacitySlider?.value || "75", 10);

      cueBox.style.setProperty("--sub-font-scale", (scalePct / 100).toString());
      cueBox.style.setProperty(
        "--sub-bg-opacity",
        (opacityPct / 100).toString(),
      );

      // Visual offset representation: slight translateY shift to simulate temporal adjustment
      const visualShift = Math.max(
        -10,
        Math.min(10, Math.round(offsetMs / 100)),
      );
      cueBox.style.setProperty("--sub-offset-visual", `${visualShift}px`);

      // Update offset readout
      if (offsetVal) {
        if (offsetMs === 0) {
          offsetVal.textContent = "0 ms";
        } else if (offsetMs > 0) {
          offsetVal.textContent = `+${offsetMs} ms (earlier)`;
        } else {
          offsetVal.textContent = `${offsetMs} ms (delayed)`;
        }
      }
      if (offsetPill) {
        offsetPill.textContent =
          offsetMs === 0
            ? "Offset: ±0 ms"
            : `Offset: ${offsetMs > 0 ? "+" : ""}${offsetMs} ms`;
      }

      // Update drift readout
      if (driftVal) {
        if (Math.abs(drift - 1.0) < 0.0005) {
          driftVal.textContent = "1.000x (Perfect)";
        } else if (drift > 1.0) {
          driftVal.textContent = `${drift.toFixed(3)}x (+${((drift - 1) * 100).toFixed(1)}% speed)`;
        } else {
          driftVal.textContent = `${drift.toFixed(3)}x (-${((1 - drift) * 100).toFixed(1)}% slow)`;
        }
      }

      // Update scale & opacity readouts
      if (scaleVal) scaleVal.textContent = `${scalePct}%`;
      if (opacityVal) opacityVal.textContent = `${opacityPct}%`;
    }

    // Video play/pause toggle
    if (video && playToggleBtn) {
      playToggleBtn.addEventListener("click", () => {
        if (video.paused) {
          safePlay(video);
          playToggleBtn.textContent = "❚❚";
        } else {
          video.pause();
          playToggleBtn.textContent = "▶";
        }
      });

      video.addEventListener("play", () => {
        playToggleBtn.textContent = "❚❚";
      });

      video.addEventListener("pause", () => {
        playToggleBtn.textContent = "▶";
      });

      video.addEventListener("timeupdate", () => {
        if (timeDisplay) {
          const cur = formatTime(video.currentTime || 0);
          const dur = formatTime(video.duration || 60);
          timeDisplay.textContent = `${cur} / ${dur}`;
        }
      });
    }

    // Offset slider & nudges
    if (offsetSlider) {
      offsetSlider.addEventListener("input", updateCueStyles);
    }

    nudgeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const nudgeAmount = parseInt(btn.dataset.subNudge || "0", 10);
        if (!offsetSlider) return;
        if (nudgeAmount === 0) {
          offsetSlider.value = "0";
        } else {
          const cur = parseInt(offsetSlider.value || "0", 10);
          const next = Math.max(-2000, Math.min(2000, cur + nudgeAmount));
          offsetSlider.value = next.toString();
        }
        updateCueStyles();
      });
    });

    // Drift slider
    if (driftSlider) {
      driftSlider.addEventListener("input", updateCueStyles);
    }

    // Color buttons
    colorBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        colorBtns.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const color = btn.dataset.subColor || "#ffffff";
        if (cueBox) {
          cueBox.style.setProperty("--sub-color", color);
        }
      });
    });

    // Scale & opacity
    if (scaleSlider) scaleSlider.addEventListener("input", updateCueStyles);
    if (opacitySlider) opacitySlider.addEventListener("input", updateCueStyles);

    // Preset chips
    presetChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        presetChips.forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        currentPreset = chip.dataset.subPreset || "1";
        if (cueBox && presets[currentPreset]) {
          cueBox.innerHTML = presets[currentPreset];
        }
        if (isCustomFile && filenameEl) {
          filenameEl.textContent = "Drop custom .srt or .vtt file here";
          if (fileTagEl) {
            fileTagEl.textContent = "Instant Local Parse";
            fileTagEl.style.background = "";
            fileTagEl.style.color = "";
          }
          isCustomFile = false;
        }
      });
    });

    // Custom file upload simulation
    if (fileUploadBtn) {
      fileUploadBtn.addEventListener("click", () => {
        isCustomFile = true;
        if (filenameEl) {
          filenameEl.innerHTML =
            "<strong>interstellar_cinema_synced.srt</strong> (842 cues)";
        }
        if (fileTagEl) {
          fileTagEl.textContent = "✓ Custom File Active";
          fileTagEl.style.background = "var(--success)";
          fileTagEl.style.color = "#fff";
        }
        if (cueBox) {
          cueBox.innerHTML =
            "We used to look up at the sky and wonder at our place in the stars...<br><span style='font-size: 0.9em; opacity: 0.85;'>[Custom Subtitle Track Loaded]</span>";
        }
        presetChips.forEach((c) => c.classList.remove("is-active"));
      });
    }

    // Player HUD controls: hover-only mini X, popover actions, restore
    hudMiniXs.forEach((miniX) => {
      miniX.addEventListener("click", (e) => {
        e.stopPropagation();
        const controlType = miniX.dataset.hudHide;
        const popover = subPanel.querySelector(
          `[data-hud-popover="${controlType}"]`,
        );

        // Close other popovers
        hudPopovers.forEach((p) => {
          if (p !== popover) p.hidden = true;
        });

        if (popover) {
          popover.hidden = !popover.hidden;
        }
      });
    });

    // Close popovers on click outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".sub-hud-chip")) {
        hudPopovers.forEach((p) => {
          p.hidden = true;
        });
      }
    });

    // Popover actions
    subPanel.querySelectorAll(".sub-popover-action").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const popover = btn.closest(".sub-hud-popover");
        const chip = btn.closest(".sub-hud-chip");
        if (popover) popover.hidden = true;
        if (chip) {
          chip.style.display = "none";
          if (hudResetBtn) hudResetBtn.hidden = false;
        }
      });
    });

    subPanel.querySelectorAll(".sub-popover-dismiss").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const popover = btn.closest(".sub-hud-popover");
        if (popover) popover.hidden = true;
      });
    });

    if (hudResetBtn) {
      hudResetBtn.addEventListener("click", () => {
        hudChips.forEach((chip) => {
          chip.style.display = "";
        });
        hudResetBtn.hidden = true;
      });
    }

    // Initial update
    updateCueStyles();
  }

  /* ── 5. Retina Feature Gallery Controller ───────────────────────────────── */
  function initRetinaGallery() {
    const gallery = document.querySelector("[data-retina-gallery]");
    if (!gallery) return;

    const tabs = gallery.querySelectorAll("[data-gallery-tab]");
    const slides = gallery.querySelectorAll("[data-gallery-slide]");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.galleryTab;

        tabs.forEach((t) => {
          const isCurrent = t === tab;
          t.classList.toggle("is-active", isCurrent);
          t.setAttribute("aria-selected", isCurrent ? "true" : "false");
        });

        slides.forEach((slide) => {
          const isTarget = slide.dataset.gallerySlide === target;
          slide.classList.toggle("is-active", isTarget);
          slide.hidden = !isTarget;
        });
      });
    });
  }
})();
