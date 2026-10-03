
(() => {
  'use strict';

  const init = () => {
    document.body.classList.add('mobile-page');

    const proxyButtons = document.querySelectorAll('[data-proxy]');
    const moreSheet = document.getElementById('mobile-more-sheet');
    const moreToggle = document.getElementById('mobile-more-toggle');
    const focusExit = document.getElementById('mobile-focus-exit');
    const orientationHint = document.getElementById('mobile-orientation-hint');
    const orientationDismiss = document.getElementById('mobile-orientation-dismiss');

    const closeMore = () => {
      if (moreSheet) moreSheet.classList.remove('is-open');
      if (moreToggle) moreToggle.classList.remove('is-active');
    };

    const setActiveTool = (toolId) => {
      document.querySelectorAll('#mobile-bottom-dock .mobile-dock-btn[data-proxy]').forEach(btn => {
        const isTool = ['tool-brush', 'tool-eraser'].includes(btn.dataset.proxy);
        if (isTool) btn.classList.toggle('is-active', btn.dataset.proxy === toolId);
      });
    };

    proxyButtons.forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = btn.dataset.proxy;
        const target = document.getElementById(targetId);
        if (target) {
          target.click();
          if (targetId === 'tool-brush' || targetId === 'tool-eraser') setActiveTool(targetId);
        }
        if (btn.closest('#mobile-more-sheet')) closeMore();
      });
    });

    if (moreToggle && moreSheet) {
      moreToggle.addEventListener('click', () => {
        const next = !moreSheet.classList.contains('is-open');
        moreSheet.classList.toggle('is-open', next);
        moreToggle.classList.toggle('is-active', next);
      });
    }

    document.addEventListener('pointerdown', (event) => {
      if (!moreSheet || !moreSheet.classList.contains('is-open')) return;
      if (!moreSheet.contains(event.target) && !(moreToggle && moreToggle.contains(event.target))) closeMore();
    }, { passive: true });

    document.querySelectorAll('[data-mobile-action="focus"]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeMore();
        document.body.classList.add('mobile-focus');
        setTimeout(() => document.getElementById('fit-screen-btn')?.click(), 50);
      });
    });

    if (focusExit) {
      focusExit.addEventListener('click', () => {
        document.body.classList.remove('mobile-focus');
        setTimeout(() => document.getElementById('fit-screen-btn')?.click(), 50);
      });
    }

    if (orientationDismiss) {
      orientationDismiss.addEventListener('click', () => {
        if (orientationHint) orientationHint.classList.add('dismissed');
      });
    }

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

    const updateViewportUnit = () => {
      document.documentElement.style.setProperty('--mobile-vh', (window.innerHeight * 0.01) + 'px');
    };

    updateViewportUnit();
    window.addEventListener('resize', updateViewportUnit, { passive: true });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        updateViewportUnit();
        document.getElementById('fit-screen-btn')?.click();
      }, 250);
    }, { passive: true });

    setActiveTool('tool-brush');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
