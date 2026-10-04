
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
    const landscapeToolbar = document.getElementById('landscape-floating-toolbar');
    const landscapeRecorderBtn = landscapeToolbar?.querySelector('[data-float-tool="recorder"]') || null;
    let landscapeToolbarManager = null;
    let focusEnteredAutomatically = false;
    let autoFocusSuppressedUntilPortrait = false;

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
      document.querySelectorAll('#mobile-bottom-dock .mobile-dock-btn[data-proxy], #landscape-floating-toolbar .landscape-tool-btn[data-proxy]').forEach(btn => {
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

      if (landscapeRecorderBtn) {
        landscapeRecorderBtn.classList.toggle('is-active', open);
        landscapeRecorderBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
        const icon = landscapeRecorderBtn.querySelector('i');
        if (icon) icon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-record-vinyl';
        landscapeRecorderBtn.title = open ? 'إغلاق مسجل الخط' : 'مسجل الخط';
        landscapeRecorderBtn.setAttribute('aria-label', open ? 'إغلاق مسجل الخط' : 'مسجل الخط');
      }

      if (open) {
        closeMore();
        // Keep the recorder as the only bottom surface. Other panels, if opened later,
        // are positioned above it by CSS instead of stacking on top of its controls.
        closeStandardSurfaces();
      }

      landscapeToolbarManager?.onRecorderState(open);

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

    const isLandscapeViewport = () => window.innerWidth > window.innerHeight;

    const enterFocusMode = (source = 'manual') => {
      closeMore();

      // Manual focus keeps the previous phone behavior: close the recorder.
      // Automatic landscape focus keeps it open because the floating toolbar
      // already has recorder-aware collision handling.
      if (source === 'manual' && document.body.classList.contains('mobile-recorder-open')) {
        document.getElementById('tape-deck-close-btn')?.click();
      }

      document.body.classList.add('mobile-focus');
      focusEnteredAutomatically = source === 'auto';
      window.setTimeout(() => document.getElementById('fit-screen-btn')?.click(), 50);
      window.setTimeout(() => landscapeToolbarManager?.onViewportChange(), 80);
    };

    const exitFocusMode = (source = 'manual') => {
      const wasAuto = focusEnteredAutomatically;
      document.body.classList.remove('mobile-focus');
      focusEnteredAutomatically = false;

      // If the user manually exits auto-focus while still in landscape,
      // respect that choice until the device returns to portrait.
      if (source === 'manual' && wasAuto && isLandscapeViewport()) {
        autoFocusSuppressedUntilPortrait = true;
      }

      window.setTimeout(() => document.getElementById('fit-screen-btn')?.click(), 50);
      window.setTimeout(() => landscapeToolbarManager?.onViewportChange(), 80);
    };

    const syncOrientationFocus = () => {
      const landscape = isLandscapeViewport();
      const enabled = landscapeToolbarManager?.isAutoFocusEnabled?.() === true;

      if (!landscape) {
        autoFocusSuppressedUntilPortrait = false;
        if (focusEnteredAutomatically && document.body.classList.contains('mobile-focus')) {
          exitFocusMode('orientation');
        }
        return;
      }

      if (enabled && !autoFocusSuppressedUntilPortrait && !document.body.classList.contains('mobile-focus')) {
        enterFocusMode('auto');
      }

      if (!enabled && focusEnteredAutomatically && document.body.classList.contains('mobile-focus')) {
        exitFocusMode('setting');
      }
    };

    document.querySelectorAll('[data-mobile-action="focus"]').forEach(btn => {
      btn.addEventListener('click', () => enterFocusMode('manual'));
    });

    if (focusExit) {
      focusExit.addEventListener('click', () => exitFocusMode('manual'));
    }

    if (orientationHint) {
      try {
        const dismissed = localStorage.getItem('diwan_orientation_hint_dismissed') === '1';
        if (dismissed) orientationHint.classList.add('dismissed');
      } catch (e) {}

      // Keep the hint useful but never let it sit over the writing area.
      if (!orientationHint.classList.contains('dismissed')) {
        window.setTimeout(() => {
          orientationHint.classList.add('dismissed');
        }, 4200);
      }
    }

    if (orientationDismiss) {
      orientationDismiss.addEventListener('click', () => {
        if (orientationHint) orientationHint.classList.add('dismissed');
        try {
          localStorage.setItem('diwan_orientation_hint_dismissed', '1');
        } catch (e) {}
      });
    }

    // Mirror the ink color into the mobile calligraphy menu.
    const sourceColor = document.getElementById('color-preview-circle');
    const mobileColor = document.getElementById('mobile-color-dot');
    const landscapeColor = document.getElementById('landscape-color-dot');
    const syncColor = () => {
      if (!sourceColor) return;
      const computed = getComputedStyle(sourceColor).backgroundColor;
      if (!computed) return;
      if (mobileColor) mobileColor.style.backgroundColor = computed;
      if (landscapeColor) landscapeColor.style.backgroundColor = computed;
    };

    syncColor();
    if (sourceColor && (mobileColor || landscapeColor)) {
      new MutationObserver(syncColor).observe(sourceColor, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    ['tool-brush', 'tool-eraser'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => setActiveTool(id));
    });


    // ============================================================
    // Landscape Floating Toolbar Manager
    // ============================================================
    if (landscapeToolbar) {
      const STORAGE_KEY = 'diwan_landscape_toolbar_v1';
      const grip = document.getElementById('landscape-toolbar-grip');
      const toolsHost = document.getElementById('landscape-toolbar-tools');
      const customizeBtn = document.getElementById('landscape-toolbar-customize');
      const collapseBtn = document.getElementById('landscape-toolbar-collapse');
      const configPanel = document.getElementById('landscape-toolbar-config');
      const configClose = document.getElementById('landscape-config-close');
      const configTools = document.getElementById('landscape-config-tools');
      const resetPositionBtn = document.getElementById('landscape-toolbar-reset-position');
      const resetAllBtn = document.getElementById('landscape-toolbar-reset-all');
      const autoFocusToggle = document.getElementById('landscape-auto-focus-toggle');

      const TOOL_META = {
        brush:    { label: 'القلم',      icon: 'fa-pen-nib' },
        eraser:   { label: 'الممحاة',    icon: 'fa-eraser' },
        undo:     { label: 'تراجع',      icon: 'fa-arrow-rotate-left' },
        redo:     { label: 'إعادة',      icon: 'fa-arrow-rotate-right' },
        layers:   { label: 'الطبقات',    icon: 'fa-layer-group' },
        color:    { label: 'لون الحبر',  icon: 'fa-palette' },
        recorder: { label: 'المسجل',     icon: 'fa-record-vinyl' },
        fit:      { label: 'ملاءمة',     icon: 'fa-expand' },
        more:     { label: 'المزيد',     icon: 'fa-ellipsis' }
      };

      const ALL_TOOL_IDS = Object.keys(TOOL_META);
      const DEFAULT_CONFIG = {
        order: ['brush', 'eraser', 'undo', 'redo', 'layers', 'recorder', 'more', 'color', 'fit'],
        visible: {
          brush: true,
          eraser: true,
          undo: true,
          redo: true,
          layers: true,
          color: false,
          recorder: true,
          fit: false,
          more: true
        },
        layout: 'horizontal',
        collapsed: false,
        autoFocusLandscape: true,
        position: null
      };

      let config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      let dragging = false;
      let dragStart = null;
      let idleTimer = null;
      let recorderOpen = false;

      const isLandscape = () => window.innerWidth > window.innerHeight;

      const sanitizeConfig = (candidate) => {
        if (!candidate || typeof candidate !== 'object') return JSON.parse(JSON.stringify(DEFAULT_CONFIG));

        const order = Array.isArray(candidate.order)
          ? candidate.order.filter(id => ALL_TOOL_IDS.includes(id))
          : [];

        ALL_TOOL_IDS.forEach(id => {
          if (!order.includes(id)) order.push(id);
        });

        const visible = { ...DEFAULT_CONFIG.visible };
        if (candidate.visible && typeof candidate.visible === 'object') {
          ALL_TOOL_IDS.forEach(id => {
            if (typeof candidate.visible[id] === 'boolean') visible[id] = candidate.visible[id];
          });
        }

        return {
          order,
          visible,
          layout: candidate.layout === 'vertical' ? 'vertical' : 'horizontal',
          collapsed: !!candidate.collapsed,
          autoFocusLandscape: candidate.autoFocusLandscape !== false,
          position: candidate.position &&
                    Number.isFinite(candidate.position.x) &&
                    Number.isFinite(candidate.position.y)
            ? { x: candidate.position.x, y: candidate.position.y }
            : null
        };
      };

      const loadConfig = () => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) config = sanitizeConfig(JSON.parse(raw));
        } catch (e) {
          config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
      };

      const saveConfig = () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (e) {}
      };

      const toolbarButtons = () =>
        new Map(
          Array.from(landscapeToolbar.querySelectorAll('.landscape-tool-btn[data-float-tool]'))
            .map(btn => [btn.dataset.floatTool, btn])
        );

      const wakeToolbar = () => {
        landscapeToolbar.classList.remove('is-idle');
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          if (!dragging && !landscapeToolbar.classList.contains('is-config-open')) {
            landscapeToolbar.classList.add('is-idle');
          }
        }, 2800);
      };

      const closeConfig = () => {
        landscapeToolbar.classList.remove('is-config-open');
        configPanel?.classList.remove('place-left', 'place-up');
        wakeToolbar();
      };

      const positionConfigPanel = () => {
        if (!configPanel) return;
        const rect = landscapeToolbar.getBoundingClientRect();
        configPanel.classList.toggle('place-left', rect.left < window.innerWidth / 2);
        configPanel.classList.toggle('place-up', rect.top > window.innerHeight / 2);
      };

      const getReservedBottom = () => {
        const rail = document.querySelector('body.mobile-page main > aside');
        if (!rail) return 8;
        const rect = rail.getBoundingClientRect();
        return Math.max(8, window.innerHeight - rect.top + 8);
      };

      const clampPosition = (x, y) => {
        const rect = landscapeToolbar.getBoundingClientRect();
        const margin = 8;
        const header = document.querySelector('body.mobile-page > header');
        const headerBottom = header ? header.getBoundingClientRect().bottom : 52;

        const minX = margin;
        const minY = headerBottom + 6;
        const maxX = Math.max(minX, window.innerWidth - rect.width - margin);
        let maxY = Math.max(minY, window.innerHeight - rect.height - getReservedBottom());

        if (recorderOpen && recorder && !recorder.classList.contains('hidden')) {
          const recorderRect = recorder.getBoundingClientRect();
          maxY = Math.min(maxY, Math.max(minY, recorderRect.top - rect.height - 8));
        }

        return {
          x: Math.min(Math.max(x, minX), maxX),
          y: Math.min(Math.max(y, minY), maxY)
        };
      };

      const applyPosition = (pos, persist = false) => {
        if (!isLandscape()) return;

        requestAnimationFrame(() => {
          const header = document.querySelector('body.mobile-page > header');
          const desired = pos || {
            x: 12,
            y: (header ? header.getBoundingClientRect().bottom : 52) + 12
          };
          const next = clampPosition(desired.x, desired.y);
          landscapeToolbar.style.left = Math.round(next.x) + 'px';
          landscapeToolbar.style.top = Math.round(next.y) + 'px';
          landscapeToolbar.style.right = 'auto';
          landscapeToolbar.style.bottom = 'auto';
          config.position = next;
          positionConfigPanel();
          if (persist) saveConfig();
        });
      };

      const renderConfigRows = () => {
        if (!configTools) return;
        configTools.innerHTML = '';

        config.order.forEach((id, index) => {
          const meta = TOOL_META[id];
          if (!meta) return;

          const row = document.createElement('div');
          row.className = 'landscape-config-row';
          row.dataset.configTool = id;

          const label = document.createElement('div');
          label.className = 'tool-label';
          label.innerHTML = '<i class="fa-solid ' + meta.icon + '"></i><span>' + meta.label + '</span>';

          const toggle = document.createElement('input');
          toggle.type = 'checkbox';
          toggle.className = 'tool-toggle';
          toggle.checked = !!config.visible[id];
          toggle.setAttribute('aria-label', 'إظهار ' + meta.label);
          toggle.addEventListener('change', () => {
            config.visible[id] = toggle.checked;
            if (!Object.values(config.visible).some(Boolean)) {
              config.visible.brush = true;
            }
            applyConfig();
            saveConfig();
          });

          const up = document.createElement('button');
          up.type = 'button';
          up.className = 'reorder-btn';
          up.title = 'تحريك للأمام';
          up.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
          up.disabled = index === 0;
          up.addEventListener('click', () => {
            if (index <= 0) return;
            [config.order[index - 1], config.order[index]] = [config.order[index], config.order[index - 1]];
            applyConfig();
            saveConfig();
          });

          const down = document.createElement('button');
          down.type = 'button';
          down.className = 'reorder-btn';
          down.title = 'تحريك للخلف';
          down.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
          down.disabled = index === config.order.length - 1;
          down.addEventListener('click', () => {
            if (index >= config.order.length - 1) return;
            [config.order[index], config.order[index + 1]] = [config.order[index + 1], config.order[index]];
            applyConfig();
            saveConfig();
          });

          row.append(label, toggle, up, down);
          configTools.appendChild(row);
        });
      };

      const applyConfig = () => {
        const buttons = toolbarButtons();

        config.order.forEach(id => {
          const btn = buttons.get(id);
          if (btn && toolsHost) toolsHost.appendChild(btn);
        });

        buttons.forEach((btn, id) => {
          const forceVisibleInRecorder =
            recorderOpen && ['brush', 'eraser', 'undo', 'redo', 'recorder'].includes(id);
          btn.hidden = forceVisibleInRecorder ? false : !config.visible[id];
        });

        landscapeToolbar.classList.toggle('is-vertical', config.layout === 'vertical');
        landscapeToolbar.classList.toggle('is-collapsed', config.collapsed);
        if (autoFocusToggle) autoFocusToggle.checked = config.autoFocusLandscape !== false;

        document.querySelectorAll('[data-toolbar-layout]').forEach(btn => {
          btn.classList.toggle('is-active', btn.dataset.toolbarLayout === config.layout);
        });

        renderConfigRows();
        requestAnimationFrame(() => applyPosition(config.position, false));
      };

      if (grip) {
        grip.addEventListener('pointerdown', (event) => {
          if (!isLandscape() || event.button > 0) return;
          event.preventDefault();
          closeConfig();
          dragging = true;
          landscapeToolbar.classList.add('is-dragging');
          grip.setPointerCapture?.(event.pointerId);

          const rect = landscapeToolbar.getBoundingClientRect();
          dragStart = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            x: rect.left,
            y: rect.top
          };
          wakeToolbar();
        });

        grip.addEventListener('pointermove', (event) => {
          if (!dragging || !dragStart) return;
          const next = clampPosition(
            dragStart.x + (event.clientX - dragStart.pointerX),
            dragStart.y + (event.clientY - dragStart.pointerY)
          );
          landscapeToolbar.style.left = Math.round(next.x) + 'px';
          landscapeToolbar.style.top = Math.round(next.y) + 'px';
          config.position = next;
          positionConfigPanel();
        });

        const endDrag = (event) => {
          if (!dragging) return;
          dragging = false;
          dragStart = null;
          landscapeToolbar.classList.remove('is-dragging');
          try { grip.releasePointerCapture?.(event.pointerId); } catch (e) {}
          saveConfig();
          wakeToolbar();
        };

        grip.addEventListener('pointerup', endDrag);
        grip.addEventListener('pointercancel', endDrag);
      }

      customizeBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const opening = !landscapeToolbar.classList.contains('is-config-open');
        landscapeToolbar.classList.toggle('is-config-open', opening);
        if (opening) {
          renderConfigRows();
          positionConfigPanel();
        }
        wakeToolbar();
      });

      configClose?.addEventListener('click', closeConfig);

      collapseBtn?.addEventListener('click', () => {
        config.collapsed = !config.collapsed;
        closeConfig();
        applyConfig();
        saveConfig();
      });

      document.querySelectorAll('[data-toolbar-layout]').forEach(btn => {
        btn.addEventListener('click', () => {
          config.layout = btn.dataset.toolbarLayout === 'vertical' ? 'vertical' : 'horizontal';
          config.collapsed = false;
          applyConfig();
          saveConfig();
        });
      });

      autoFocusToggle?.addEventListener('change', () => {
        config.autoFocusLandscape = autoFocusToggle.checked;
        autoFocusSuppressedUntilPortrait = false;
        saveConfig();
        syncOrientationFocus();
        wakeToolbar();
      });

      resetPositionBtn?.addEventListener('click', () => {
        config.position = null;
        applyPosition(null, true);
      });

      resetAllBtn?.addEventListener('click', () => {
        config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        applyConfig();
        saveConfig();
      });

      landscapeToolbar.querySelector('[data-landscape-action="more"]')?.addEventListener('click', (event) => {
        event.preventDefault();
        closeConfig();
        moreToggle?.click();
        wakeToolbar();
      });

      landscapeToolbar.querySelectorAll('.landscape-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          closeConfig();
          wakeToolbar();
        });
      });

      landscapeToolbar.addEventListener('pointerdown', wakeToolbar, { passive: true });
      landscapeToolbar.addEventListener('pointermove', wakeToolbar, { passive: true });

      landscapeToolbarManager = {
        isAutoFocusEnabled() {
          return config.autoFocusLandscape !== false;
        },
        onRecorderState(open) {
          recorderOpen = open;
          if (open) closeConfig();
          applyConfig();
          requestAnimationFrame(() => applyPosition(config.position, false));
        },
        onViewportChange() {
          syncOrientationFocus();
          if (!isLandscape()) return;
          requestAnimationFrame(() => applyPosition(config.position, false));
        }
      };

      loadConfig();
      applyConfig();
      syncOrientationFocus();
      wakeToolbar();
    }

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
      window.setTimeout(() => {
        landscapeToolbarManager?.onViewportChange();
        document.getElementById('fit-screen-btn')?.click();
      }, 220);
    };

    updateViewportUnit();
    window.addEventListener('resize', () => {
      updateViewportUnit();
      landscapeToolbarManager?.onViewportChange();
    }, { passive: true });
    window.addEventListener('orientationchange', refit, { passive: true });

    setActiveTool('tool-brush');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
