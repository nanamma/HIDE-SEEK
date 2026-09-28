(() => {
  "use strict";
  const { realWorld } = window.HIDE_CONTENT;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const gallery = $("#real-world-gallery");
  const dialog = $("#real-world-dialog");
  const enlarged = $("video", dialog);
  const players = new Set();
  const visible = new Set();
  let speed = 1;
  let galleryRendered = false;
  let sourcePlayer = null;
  let sourceTime = 0;
  let returnFocus = null;

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }

  function time(seconds) {
    const rounded = Math.ceil(seconds || 0);
    return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
  }

  function applySpeed(video) {
    video.defaultPlaybackRate = speed;
    video.playbackRate = speed;
  }

  $$("[data-real-world-speed]").forEach(select => {
    select.addEventListener("change", () => {
      speed = Number(select.value);
      $$("[data-real-world-speed]").forEach(other => { other.value = String(speed); });
      players.forEach(applySpeed);
      applySpeed(enlarged);
    });
  });

  function load(video) {
    if (video.getAttribute("src") !== video.dataset.src) {
      video.src = video.dataset.src;
    }
    applySpeed(video);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) {
        visible.add(video);
        load(video);
      } else {
        visible.delete(video);
        video.pause();
      }
    });
  }, { threshold: 0.05 });

  function pauseOthers(current) {
    players.forEach(video => { if (video !== current) video.pause(); });
  }

  function renderResults() {
    const headings = $("#real-world-task-headings");
    headings.replaceChildren();
    ["Method", "Avg."].forEach(label => {
      const heading = node("th", "", label);
      heading.scope = "col";
      headings.append(heading);
    });
    realWorld.tasks.forEach((task, index) => {
      const label = `(${String.fromCharCode(97 + index)})`;
      const heading = node("th", "", `${label} ${task.shortName}`);
      heading.scope = "col";
      heading.title = task.name;
      heading.setAttribute("aria-label", `${label} ${task.name}`);
      headings.append(heading);
    });
    const body = $("#real-world-results");
    body.replaceChildren();
    realWorld.methods.forEach((method, index) => {
      const row = node("tr");
      const best = method.id === "seek";
      const title = node("th", best ? "result-best" : "", method.name);
      title.scope = "row";
      row.append(title);
      const average = node("td", best ? "result-best" : "", String(method.avg));
      row.append(average);
      realWorld.tasks.forEach(task => {
        const cell = node("td", best ? "result-best" : "", String(task.successRates[index]));
        row.append(cell);
      });
      body.append(row);
    });
  }

  function openEnlarged(video, title, button) {
    sourcePlayer = video;
    sourceTime = video.currentTime;
    returnFocus = button;
    pauseOthers(null);
    $("#real-world-dialog-title").textContent = title;
    $("#real-world-dialog-error").hidden = true;
    enlarged.poster = video.poster;
    enlarged.src = video.dataset.src;
    applySpeed(enlarged);
    dialog.showModal();
    // The button is an explicit playback gesture. Keep the selected clip's position.
    enlarged.play().catch(() => {});
  }

  enlarged.addEventListener("loadedmetadata", () => {
    enlarged.currentTime = Math.min(sourceTime, enlarged.duration || sourceTime);
    applySpeed(enlarged);
  });
  enlarged.addEventListener("error", () => { $("#real-world-dialog-error").hidden = false; });
  // site.js handles the shared close button, Escape, and true backdrop clicks.
  dialog.addEventListener("close", () => {
    if (sourcePlayer && sourcePlayer.readyState >= 1) sourcePlayer.currentTime = enlarged.currentTime;
    enlarged.pause();
    enlarged.removeAttribute("src");
    enlarged.load();
    sourcePlayer = null;
    returnFocus?.focus({ preventScroll: true });
  });

  function createPlayer(task, method, clips, featured = false) {
    const card = node("article", featured ? "real-feature-player" : "real-method-card");
    card.dataset.method = method.id;
    if (featured) {
      card.dataset.task = task.id;
      const heading = node("div", "real-feature-heading");
      const number = `(${String.fromCharCode(97 + realWorld.tasks.indexOf(task))})`;
      const title = node("h4", "", task.name);
      title.id = `real-feature-${task.id}`;
      card.setAttribute("aria-labelledby", title.id);
      heading.append(node("span", "real-feature-number", number), title);
      card.append(heading);
    } else {
      const heading = node("div", "real-method-heading");
      heading.append(node("h5", "", method.name), node("span", "", clips.length ? `${clips.length} ${clips.length === 1 ? "clip" : "clips"}` : ""));
      card.append(heading);
    }
    if (!clips.length) {
      const empty = node("div", "real-video-empty", "—");
      empty.setAttribute("role", "img");
      empty.setAttribute("aria-label", `${task.name}, ${method.name}: footage not yet available`);
      card.append(empty);
      return card;
    }
    const frame = node("div", "real-video-frame");
    const video = node("video");
    video.controls = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "none";
    // No loop: the final state remains visible until the viewer replays the clip.
    const error = node("p", "real-video-error", "This clip could not be loaded. Try another clip.");
    error.hidden = true;
    error.setAttribute("role", "status");
    frame.append(video, error);
    const meta = node("div", "real-clip-meta");
    const caption = node("span", "real-clip-caption");
    const enlarge = node("button", "real-enlarge", "Enlarge ↗");
    enlarge.type = "button";
    meta.append(caption, enlarge);
    card.append(frame, meta);
    const picker = node("div", "real-clip-picker");
    if (clips.length > 1) {
      picker.setAttribute("role", "group");
      picker.setAttribute("aria-label", `${task.name}, ${method.name}, choose a clip`);
      clips.forEach((clip, index) => {
        const button = node("button", "", String(index + 1));
        button.type = "button";
        button.setAttribute("aria-label", `Clip ${index + 1}`);
        button.addEventListener("click", () => selectClip(index));
        picker.append(button);
      });
      card.append(picker);
    }
    let activeTitle = "";
    function selectClip(index) {
      const clip = clips[index];
      video.pause();
      error.hidden = true;
      video.poster = clip.poster;
      video.dataset.src = clip.video;
      video.width = clip.width;
      video.height = clip.height;
      const clipLabel = clip.label || `Clip ${index + 1}`;
      activeTitle = `${task.name} · ${method.name} · ${clipLabel}`;
      video.setAttribute("aria-label", activeTitle);
      enlarge.setAttribute("aria-label", `Enlarge ${activeTitle}`);
      caption.textContent = `${clipLabel}${clips.length > 1 ? ` of ${clips.length}` : ""} · ${time(clip.duration_seconds)}`;
      $$("button", picker).forEach((button, selected) => button.setAttribute("aria-pressed", String(selected === index)));
      video.removeAttribute("src");
      video.load();
      if (visible.has(video)) load(video);
    }
    video.addEventListener("play", () => {
      if (document.hidden || (video.closest("#real-world-gallery") && !gallery.open) || $("dialog[open]")) {
        video.pause();
        return;
      }
      pauseOthers(video);
    });
    video.addEventListener("loadedmetadata", () => applySpeed(video));
    video.addEventListener("error", () => { error.hidden = false; });
    enlarge.addEventListener("click", () => openEnlarged(video, activeTitle, enlarge));
    players.add(video);
    selectClip(0);
    observer.observe(video);
    return card;
  }

  function renderGallery(manifest) {
    const container = $("#real-world-tasks");
    realWorld.tasks.forEach((task, index) => {
      const media = manifest.tasks.find(entry => entry.id === task.id);
      const row = node("section", "real-task-row");
      row.dataset.task = task.id;
      const heading = node("div", "real-task-heading");
      const title = node("h4", "", task.name);
      title.id = `real-task-${task.id}`;
      row.setAttribute("aria-labelledby", title.id);
      heading.append(node("span", "", `(${String.fromCharCode(97 + index)})`), title);
      row.append(heading, node("p", "real-task-description", task.description));
      const grid = node("div", "real-method-grid");
      realWorld.methods.forEach(method => grid.append(createPlayer(task, method, media?.methods?.[method.id] || [])));
      row.append(grid);
      container.append(row);
    });
    galleryRendered = true;
  }

  function renderFeaturedTasks(manifest) {
    const method = realWorld.methods.find(entry => entry.id === "seek");
    const cards = realWorld.tasks.map(task => {
      const clips = manifest.tasks.find(entry => entry.id === task.id)?.methods?.[method.id] || [];
      const preferred = manifest.featured;
      const clip = preferred?.task_id === task.id && preferred.method === method.id
        ? clips.find(entry => entry.id === preferred.clip_id) || clips[0]
        : clips[0];
      return createPlayer(task, method, clip ? [clip] : [], true);
    });
    $("#real-world-feature").replaceChildren(...cards);
  }

  renderResults();
  fetch("assets/trimmed/real-world-manifest.json", { cache: "no-cache" })
    .then(response => { if (!response.ok) throw new Error("Real-world manifest unavailable"); return response.json(); })
    .then(manifest => {
      const total = manifest.tasks.reduce((sum, task) => sum + Object.values(task.methods).reduce((count, clips) => count + clips.length, 0), 0);
      $("#real-world-clip-count").textContent = `${total} clips · 4 tasks · 3 methods`;
      renderFeaturedTasks(manifest);
      function toggleGallery() {
        if (gallery.open && !galleryRendered) renderGallery(manifest);
        if (!gallery.open) $$("video", gallery).forEach(video => video.pause());
        $("#real-world-gallery-label").textContent = gallery.open ? "Close the video collection" : "Explore all real-world videos";
        $(".gallery-toggle", gallery).textContent = gallery.open ? "−" : "+";
      }
      gallery.addEventListener("toggle", toggleGallery);
      toggleGallery();
      $("#real-world-loading").hidden = true;
    })
    .catch(() => {
      $("#real-world-loading").textContent = "The video collection could not be loaded. Please reload to try again.";
    });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { pauseOthers(null); enlarged.pause(); }
  });
})();
