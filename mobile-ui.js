
(() => {
  'use strict';

  const SURFACE_IDS = [
    'brush-library-popover',
    'layers-panel',
    'grid-settings-popover',
    'color-panel',
    'actions-panel',
    'nib-studio-popover',
    'eraser-studio-popover'
  ];

  const init = () => {
    document.body.classList.add('mobile-page');

    const moreSheet = document.getElementById('mobile-more-sheet');
    const moreToggle = document.getElementById('mobile-more-toggle');
    const focusExit = document.getElementById('mobile-focus-exit');
    const orientationHint = document.getElementById('mobile-orientation-hint');
    const orientationDismiss = document.getElementById('mobile-orientation-dismiss');
    const recorder = document.getElementById('studio-tape-recorder');
    const mobileRecorderBtn = document.getElementById('mobile-recorder-toggle');

    const closeMore = () => {
      if (moreSheet) moreSheet.classList.remove('is-open');
      if (moreToggle) moreToggle.classList.remove('is-active');
    };

    const closeStandardSurfaces = (exceptId = null) => {
      SURFACE_IDS.forEach(id => {
        if (id === exceptId) return;
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden')) el.classList.add('hidden');
      });
    };

    const setActiveTool = (toolId) => {
      document.querySelectorAll('#mobile-bottom-dock .mobile-dock-btn[data-proxy]').forEach(btn => {
        const isTool = ['tool-brush', 'tool-eraser'].includes(btn.dataset.proxy);
        if (isTool) btn.classList.toggle('is-active', btn.dataset.proxy === toolId);
      });
    };

    const syncRecorderState = () => {
      if (!recorder) return;
      const open = !recorder.classList.contains('hidden');
      document.body.classList.toggle('mobile-recorder-open', open);

      if (mobileRecorderBtn) {
        mobileRecorderBtn.classList.toggle('is-active', open);
        mobileRecorderBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
      }

      if (open) {
        closeMore();
        // Keep the recorder as the only bottom surface. Other panels, if opened later,
        // are positioned above it by CSS instead of stacking on top of its controls.
        closeStandardSurfaces();
      }

      // The canvas fit routine already belongs to the original engine.
      window.setTimeout(() => document.getElementById('fit-screen-btn')?.click(), 60);
    };

    // Proxy controls in the dedicated mobile UI to the untouched original engine.
    document.querySelectorAll('[data-proxy]').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = btn.dataset.proxy;
        const target = document.getElementById(targetId);

        if (target) {
          // Close the calligraphy menu before opening any functional surface.
          if (btn.closest('#mobile-more-sheet')) closeMore();
          target.click();

          if (targetId === 'tool-brush' || targetId === 'tool-eraser') {
            setActiveTool(targetId);
          }
        }
      });
    });

    if (moreToggle && moreSheet) {
      moreToggle.addEventListener('click', () => {
        // The recorder owns the bottom zone. Close it first before opening the tool menu.
        if (document.body.classList.contains('mobile-recorder-open')) {
          document.getElementById('tape-deck-close-btn')?.click();
        }

        closeStandardSurfaces();
        const next = !moreSheet.classList.contains('is-open');
        moreSheet.classList.toggle('is-open', next);
        moreToggle.classList.toggle('is-active', next);
      });
    }

    document.addEventListener('pointerdown', (event) => {
      if (!moreSheet || !moreSheet.classList.contains('is-open')) return;
      if (!moreSheet.contains(event.target) && !(moreToggle && moreToggle.contains(event.target))) {
        closeMore();
      }
    }, { passive: true });

    document.querySelectorAll('[data-mobile-action="focus"]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeMore();

        // Focus mode and recorder mode are mutually exclusive on phones.
        if (document.body.classList.contains('mobile-recorder-open')) {
          document.getElementById('tape-deck-close-btn')?.click();
        }

        document.body.classList.add('mobile-focus');
        window.setTimeout(() => document.getElementById('fit-screen-btn')?.click(), 50);
      });
    });

    if (focusExit) {
      focusExit.addEventListener('click', () => {
        document.body.classList.remove('mobile-focus');
        window.setTimeout(() => document.getElementById('fit-screen-btn')?.click(), 50);
      });
    }

    if (orientationDismiss) {
      orientationDismiss.addEventListener('click', () => {
        if (orientationHint) orientationHint.classList.add('dismissed');
      });
    }

    // Mirror the ink color into the mobile calligraphy menu.
    const sourceColor = document.getElementById('color-preview-circle');
    const mobileColor = document.getElementById('mobile-color-dot');
    const syncColor = () => {
      if (!sourceColor || !mobileColor) return;
      const computed = getComputedStyle(sourceColor).backgroundColor;
      if (computed) mobileColor.style.backgroundColor = computed;
    };

    syncColor();
    if (sourceColor && mobileColor) {
      new MutationObserver(syncColor).observe(sourceColor, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    ['tool-brush', 'tool-eraser'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => setActiveTool(id));
    });

    // Watch the original recorder's hidden class instead of changing its engine.
    if (recorder) {
      new MutationObserver(syncRecorderState).observe(recorder, {
        attributes: true,
        attributeFilter: ['class']
      });
      syncRecorderState();
    }

    // If any original popover opens, close the mobile menu. This gives every
    // interaction surface one clear layer and avoids accidental double overlays.
    SURFACE_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      new MutationObserver(() => {
        if (!el.classList.contains('hidden')) {
          closeMore();
          SURFACE_IDS.forEach(otherId => {
            if (otherId === id) return;
            const other = document.getElementById(otherId);
            if (other && !other.classList.contains('hidden')) other.classList.add('hidden');
          });
        }
      }).observe(el, { attributes: true, attributeFilter: ['class'] });
    });

    const updateViewportUnit = () => {
      document.documentElement.style.setProperty('--mobile-vh', (window.innerHeight * 0.01) + 'px');
    };

    const refit = () => {
      updateViewportUnit();
      window.setTimeout(() => document.getElementById('fit-screen-btn')?.click(), 220);
    };

    updateViewportUnit();
    window.addEventListener('resize', updateViewportUnit, { passive: true });
    window.addEventListener('orientationchange', refit, { passive: true });

    setActiveTool('tool-brush');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
