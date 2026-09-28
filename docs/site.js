(() => {
  "use strict";
  const { project, categories, tasks, results, benchmarkStatistics, taskDetails } = window.HIDE_CONTENT;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const taskGroups = $("#task-groups");
  const taskDialog = $("#task-dialog");
  const dialogVideos = $$("video[data-camera]", taskDialog);
  const taskVideo = dialogVideos[0];
  const heroVideos = $$(".showcase video");
  let activeTask = null;
  let dialogPlaying = false;
  let dialogFrame = 0;
  let dialogLoadId = 0;
  let dialogSeekTime = 0;
  let selectedDemo = 1;
  let manifest = new Map();
  let requestedShowcasePlayback = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let benchmarkPlayback = !reducedMotion.matches;
  const visibleVideos = new Set();
  const cardVideos = new Map();
  const statisticsByTask = new Map(benchmarkStatistics.map(stat => [stat.id, stat]));
  const meanStatistic = key => (benchmarkStatistics.reduce((sum, stat) => sum + stat[key], 0) / benchmarkStatistics.length).toFixed(1);
  const totalVariations = benchmarkStatistics.reduce((sum, stat) => sum + stat.variations, 0);

  function canPlayInline(video) {
    return benchmarkPlayback && visibleVideos.has(video) && !document.hidden && !$("dialog[open]");
  }

  function playInline(video) {
    if (!canPlayInline(video)) return;
    if (video.getAttribute("src") !== video.dataset.src) video.src = video.dataset.src;
    video.play().then(() => {
      // A scroll, demo change, or pause can arrive while play() is pending.
      if (!canPlayInline(video)) video.pause();
    }).catch(() => {});
  }

  function pauseInlineVideos() {
    cardVideos.forEach(video => video.pause());
  }

  function resumeInlineVideos() {
    visibleVideos.forEach(playInline);
  }

  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) {
        visibleVideos.add(video);
        // Load only visible clips, even when autoplay is disabled.
        if (video.getAttribute("src") !== video.dataset.src) video.src = video.dataset.src;
        playInline(video);
      } else {
        visibleVideos.delete(video);
        video.pause();
      }
    });
  }, { threshold: 0.1 });

  // Episode 1 retains stable fallback paths; additional episodes use the manifest.
  fetch("assets/trimmed/demo-manifest.json", { cache: "no-cache" })
    .then(response => { if (!response.ok) throw new Error("Manifest unavailable"); return response.json(); })
    .then(data => {
      manifest = new Map(data.tasks.map(task => [task.id, task]));
      $$("[data-episode]").forEach(button => {
        const number = Number(button.dataset.episode);
        button.disabled = !tasks.every(task => manifest.get(task.id)?.episodes?.some(episode => episode.number === number));
      });
      heroVideos.forEach(video => {
        const episode = manifest.get(video.dataset.task)?.episodes?.[0];
        if (!episode) return;
        video.dataset.src = episode.front_video;
        if (video.getAttribute("src")) {
          video.pause();
          video.removeAttribute("src");
          video.load();
        }
      });
      selectDemo(selectedDemo);
      if (requestedShowcasePlayback && !document.hidden && !taskDialog.open) playShowcase();
    })
    .catch(() => {
      $("#demo-status").textContent = "Demo 1 available · Additional demos could not be loaded";
    });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function episodeFor(task) {
    const data = manifest.get(task.id);
    return data?.episodes?.find(episode => episode.number === selectedDemo) || data || {
      front_video: `assets/videos/${task.id}-front.mp4`,
      shoulder_video: `assets/videos/${task.id}-shoulder.mp4`,
      poster: `assets/posters/${task.id}.jpg`,
      shoulder_poster: task.defaultView === "shoulder" ? `assets/posters/${task.id}-shoulder.jpg` : undefined,
      descriptions: [task.instruction],
    };
  }

  function defaultViewFor(task) {
    return task.defaultView === "shoulder" ? "shoulder" : "front";
  }

  function posterFor(episode, view) {
    return view === "shoulder" ? episode.shoulder_poster || episode.poster : episode.poster;
  }

  function viewLabel(view) {
    return view === "shoulder" ? "left and right shoulder cameras" : "front camera";
  }

  function renderTasks() {
    Object.entries(categories).forEach(([key, category], groupIndex) => {
      const groupTasks = tasks.filter(task => task.category === key);
      const group = element("section", `task-group ${key}`);
      group.id = `tasks-${key}`;
      group.setAttribute("aria-labelledby", `${group.id}-title`);
      const heading = element("div", "task-group-heading");
      const title = element("h3", "", category.name);
      title.id = `${group.id}-title`;
      const groupName = element("div", "task-group-name");
      const groupLabels = element("div", "task-group-labels");
      groupLabels.append(title, element("p", "task-group-memory", category.remember));
      groupName.append(element("span", "group-number", String(groupIndex + 1).padStart(2, "0")), groupLabels);
      heading.append(groupName, element("span", "group-count", `${groupTasks.length} TASKS`));
      const grid = element("div", "task-grid");
      groupTasks.forEach(task => {
        const card = element("article", `task-card ${task.category}`);
        card.dataset.task = task.id;
        const media = element("div", "task-thumbnail");
        const video = element("video");
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true; // Published clips include a two-second final-frame hold.
        video.playsInline = true;
        video.controls = true;
        video.preload = "none";
        const view = defaultViewFor(task);
        video.poster = posterFor(episodeFor(task), view);
        video.dataset.src = episodeFor(task)[`${view}_video`];
        video.setAttribute("aria-label", `${task.title}, demo ${selectedDemo}, ${viewLabel(view)}`);
        video.addEventListener("error", () => {
          $(".task-video-error", card).hidden = false;
        });
        const error = element("p", "task-video-error", "Video unavailable. Try another demo.");
        error.hidden = true;
        media.append(video, error);
        const content = element("div", "task-card-content");
        content.append(element("h4", "", task.title));
        const expand = element("button", "task-expand", "View all cameras ↗");
        expand.type = "button";
        expand.setAttribute("aria-label", `Enlarge ${task.title} in three camera views`);
        expand.addEventListener("click", () => openTask(task));
        content.append(expand);
        card.append(media, content);
        grid.append(card);
        cardVideos.set(task.id, video);
        videoObserver.observe(video);
      });
      group.append(heading, grid);
      taskGroups.append(group);
    });
  }

  function selectDemo(number) {
    selectedDemo = number;
    $$("[data-episode]").forEach(button => {
      const active = Number(button.dataset.episode) === number;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    tasks.forEach(task => {
      const video = cardVideos.get(task.id);
      if (!video) return;
      const episode = episodeFor(task);
      const view = defaultViewFor(task);
      video.pause();
      video.poster = posterFor(episode, view);
      video.dataset.src = episode[`${view}_video`];
      video.setAttribute("aria-label", `${task.title}, demo ${number}, ${viewLabel(view)}`);
      $(".task-video-error", video.closest(".task-card")).hidden = true;
      // Clear the previous decoded frame; offscreen clips retain only their poster.
      video.removeAttribute("src");
      video.load();
      if (visibleVideos.has(video)) {
        video.src = video.dataset.src;
        playInline(video);
      }
    });
    $("#demo-status").textContent = `Demo ${number} of 3 · All ${tasks.length} tasks · 2 s final-frame hold`;
    if (activeTask) {
      loadDialogMedia(activeTask);
    }
  }

  function formatTime(time) {
    const seconds = Math.max(0, Math.floor(time || 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function syncDialogControls() {
    const ready = Number.isFinite(taskVideo.duration) && taskVideo.readyState >= 1;
    const seek = $("#dialog-seek");
    seek.disabled = !ready;
    seek.max = ready ? taskVideo.duration : 100;
    seek.value = ready ? taskVideo.currentTime : 0;
    seek.setAttribute("aria-valuetext", `${formatTime(taskVideo.currentTime)} of ${ready ? formatTime(taskVideo.duration) : "loading"}`);
    $("#dialog-time").textContent = `${formatTime(taskVideo.currentTime)} / ${ready ? formatTime(taskVideo.duration) : "—"}`;
    const play = $("#dialog-play");
    play.disabled = !ready;
    play.textContent = dialogPlaying ? "Pause all" : "Play all";
    play.setAttribute("aria-pressed", String(dialogPlaying));
  }

  function pauseDialog() {
    dialogPlaying = false;
    cancelAnimationFrame(dialogFrame);
    dialogVideos.forEach(video => video.pause());
    syncDialogControls();
  }

  function syncCameraFrames() {
    if (!dialogPlaying || !taskDialog.open) return;
    dialogVideos.slice(1).forEach(video => {
      if (taskVideo.readyState < 3 || taskVideo.seeking || taskVideo.paused) {
        video.pause();
      } else if (video.readyState >= 2) {
        if (Math.abs(video.currentTime - taskVideo.currentTime) > 0.12 && !video.seeking) {
          video.currentTime = Math.min(taskVideo.currentTime, video.duration);
        }
        if (video.paused) video.play().catch(() => {});
      }
    });
    syncDialogControls();
    dialogFrame = requestAnimationFrame(syncCameraFrames);
  }

  function playDialog() {
    if (!taskDialog.open) return;
    dialogPlaying = true;
    const loadId = dialogLoadId;
    Promise.allSettled(dialogVideos.map(video => video.play())).then(results => {
      if (loadId !== dialogLoadId) return;
      if (!taskDialog.open || !dialogPlaying || results[0].status === "rejected") pauseDialog();
    });
    cancelAnimationFrame(dialogFrame);
    dialogFrame = requestAnimationFrame(syncCameraFrames);
    syncDialogControls();
  }

  function seekDialog(time) {
    dialogSeekTime = time;
    dialogVideos.forEach(video => {
      if (video.readyState >= 1) video.currentTime = Math.max(0, Math.min(time, video.duration));
    });
    syncDialogControls();
  }

  function loadDialogMedia(task, startTime = 0, shouldPlay = false) {
    pauseDialog();
    const loadId = ++dialogLoadId;
    dialogSeekTime = startTime;
    const episode = episodeFor(task);
    updateDialogText();
    dialogVideos.forEach(video => {
      const front = video.dataset.camera === "front";
      $(".camera-error", video.closest("figure")).hidden = true;
      video.poster = front ? episode.poster : episode.shoulder_poster || "";
      video.src = front ? episode.front_video : episode.shoulder_video;
      video.setAttribute("aria-label", `${task.title}, demo ${selectedDemo}, ${video.dataset.camera} camera`);
      video.onloadedmetadata = () => {
        if (loadId !== dialogLoadId || !taskDialog.open) return;
        const time = video !== taskVideo && taskVideo.readyState >= 1 ? taskVideo.currentTime : dialogSeekTime;
        video.currentTime = Math.min(time, video.duration);
        syncDialogControls();
      };
      video.load();
    });
    if (shouldPlay) playDialog();
  }

  function updateDialogText() {
    $("#dialog-category").textContent = categories[activeTask.category].name;
    $("#dialog-title").textContent = activeTask.title;
    $("#dialog-description").textContent = `“${episodeFor(activeTask).descriptions?.[0] || activeTask.instruction}”`;
    $("#dialog-note").textContent = `Expert demonstration · Demo ${selectedDemo} · Three synchronized views · 20 FPS · 2 s final-frame hold`;
    renderTaskDetails(activeTask);
  }

  function renderTaskDetails(task) {
    const detail = taskDetails[task.id];
    const stat = statisticsByTask.get(task.id);
    const section = $("#dialog-task-details");
    section.hidden = !detail || !stat;
    if (section.hidden) return;
    const metrics = [
      [stat.frames.toFixed(1), "average frames"],
      [stat.keyframes.toFixed(1), "average keyframes"],
      [String(stat.variations), "task variations"],
    ];
    $("#dialog-task-stats").replaceChildren(...metrics.map(([value, label]) => {
      const item = element("div");
      item.append(element("strong", "", value), element("span", "", label));
      return item;
    }));
    const fields = [
      ["Task description", detail.description],
      ["Success condition", detail.successMetric],
      ["Scene objects", detail.objects],
      ["Variation type", stat.variationType],
      ["Keyframe counts", detail.keyframeCounts],
    ];
    $("#dialog-task-copy").replaceChildren(...fields.map(([heading, copy]) => {
      const article = element("article");
      article.append(element("h4", "", heading), element("p", "", copy));
      return article;
    }));
    $("#dialog-instruction-pattern").textContent = detail.instructionPattern;
  }

  function renderBenchmarkTable() {
    const body = $("#benchmark-statistics-table");
    body.replaceChildren(...benchmarkStatistics.map(stat => {
      const task = tasks.find(entry => entry.id === stat.id);
      const row = element("tr");
      row.dataset.task = stat.id;
      const name = element("th", "", task?.title || stat.id);
      name.scope = "row";
      row.append(name);
      [stat.languageTemplate, stat.frames.toFixed(1), stat.keyframes.toFixed(1), String(stat.variations), stat.variationType]
        .forEach(value => row.append(element("td", "", value)));
      return row;
    }));
    $("#benchmark-table-task-count").textContent = `${benchmarkStatistics.length} tasks`;
    $("#benchmark-table-frames").textContent = meanStatistic("frames");
    $("#benchmark-table-keyframes").textContent = meanStatistic("keyframes");
    $("#benchmark-table-variations").textContent = String(totalVariations);
  }

  function openTask(task) {
    activeTask = task;
    const inlineVideo = cardVideos.get(task.id);
    const startTime = inlineVideo?.currentTime || 0;
    const shouldPlay = !reducedMotion.matches && inlineVideo && !inlineVideo.paused;
    heroVideos.forEach(video => video.pause());
    pauseInlineVideos();
    taskDialog.showModal();
    taskDialog.scrollTop = 0;
    loadDialogMedia(task, startTime, shouldPlay);
  }

  dialogVideos.forEach(video => video.addEventListener("error", () => {
    if (taskDialog.open) $(".camera-error", video.closest("figure")).hidden = false;
  }));
  taskVideo.addEventListener("timeupdate", syncDialogControls);
  taskVideo.addEventListener("ended", () => {
    if (dialogPlaying) { seekDialog(0); playDialog(); }
  });
  $("#dialog-play").addEventListener("click", () => { if (dialogPlaying) pauseDialog(); else playDialog(); });
  $("#dialog-seek").addEventListener("input", event => seekDialog(Number(event.target.value)));
  taskDialog.addEventListener("close", () => {
    pauseDialog();
    ++dialogLoadId;
    activeTask = null;
    dialogVideos.forEach(video => { video.removeAttribute("src"); video.load(); });
    resumeInlineVideos();
  });
  $$('dialog').forEach(dialog => {
    $(".close-dialog", dialog).addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });
  $$("[data-episode]").forEach(button => button.addEventListener("click", () => {
    if (selectedDemo !== Number(button.dataset.episode)) selectDemo(Number(button.dataset.episode));
  }));
  $("#expand-method").addEventListener("click", () => {
    pauseInlineVideos();
    $("#figure-dialog").showModal();
  });
  $("#figure-dialog").addEventListener("close", resumeInlineVideos);

  function syncBenchmarkButton() {
    const button = $("#play-benchmark");
    button.setAttribute("aria-pressed", String(benchmarkPlayback));
    button.replaceChildren(element("span", "", benchmarkPlayback ? "Ⅱ" : "▶"), document.createTextNode(benchmarkPlayback ? "Pause demos" : "Play demos"));
  }
  $("#play-benchmark").addEventListener("click", () => {
    benchmarkPlayback = !benchmarkPlayback;
    if (benchmarkPlayback) resumeInlineVideos(); else pauseInlineVideos();
    syncBenchmarkButton();
  });
  reducedMotion.addEventListener("change", event => {
    if (event.matches) {
      benchmarkPlayback = false;
      pauseInlineVideos();
      syncBenchmarkButton();
    }
  });
  syncBenchmarkButton();

  const playButton = $("#play-showcase");
  function syncPlayButton() {
    const playing = heroVideos.some(video => !video.paused);
    playButton.setAttribute("aria-pressed", String(playing));
    playButton.replaceChildren(element("span", "", playing ? "Ⅱ" : "▶"), document.createTextNode(playing ? "Pause demos" : "Play demos"));
  }
  async function playShowcase() {
    await Promise.allSettled(heroVideos.map(video => {
      if (!video.getAttribute("src")) video.src = video.dataset.src;
      return video.play();
    }));
    syncPlayButton();
  }
  playButton.addEventListener("click", () => {
    requestedShowcasePlayback = !heroVideos.some(video => !video.paused);
    if (requestedShowcasePlayback) playShowcase();
    else heroVideos.forEach(video => video.pause());
    syncPlayButton();
  });
  heroVideos.forEach(video => ["play", "pause", "error"].forEach(event => video.addEventListener(event, syncPlayButton)));
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) heroVideos.forEach(video => video.pause());
    else if (requestedShowcasePlayback && !taskDialog.open && !document.hidden) playShowcase();
  }, { threshold: 0.1 }).observe($(".showcase"));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { heroVideos.forEach(video => video.pause()); pauseDialog(); pauseInlineVideos(); }
    else resumeInlineVideos();
  });

  function renderChart(metric) {
    const chart = $("#results-chart");
    chart.replaceChildren();
    [...results].sort((a, b) => b[metric] - a[metric]).forEach(result => {
      const row = element("div", `bar-row${result.ours ? " ours" : ""}`);
      row.setAttribute("aria-label", `${result.name}: ${result[metric].toFixed(1)} percent success`);
      const track = element("div", "bar-track");
      track.style.setProperty("--value", result[metric]);
      const fill = element("div", "bar-fill");
      fill.style.width = `${result[metric]}%`;
      track.append(fill, element("span", "bar-value", result[metric].toFixed(1)));
      row.append(element("span", "bar-name", result.name), track);
      chart.append(row);
    });
  }
  // Keep headline counts and metrics in sync when new materials are added.
  $("#stat-task-count").textContent = tasks.length;
  if (benchmarkStatistics.length) {
    $("#stat-average-frames").textContent = meanStatistic("frames");
    $("#stat-average-keyframes").textContent = meanStatistic("keyframes");
    $("#stat-total-variations").textContent = String(totalVariations);
    $("#stat-summary-note").textContent = `Frame and keyframe counts average the ${benchmarkStatistics.length} task means; variations are summed. Success-rate gain is over the strongest baseline.`;
  }
  const ours = results.find(result => result.ours);
  const strongestBaseline = [...results].filter(result => !result.ours).sort((a, b) => b.avg - a.avg)[0];
  if (ours && strongestBaseline) {
    const gain = ours.avg - strongestBaseline.avg;
    const gainLabel = `${gain >= 0 ? "+" : ""}${gain.toFixed(1)}`;
    $("#stat-success-rate").replaceChildren(document.createTextNode(ours.avg.toFixed(1)), element("span", "", "%"));
    $("#stat-success-gain").textContent = `${gainLabel} pp`;
    const comparison = `${Math.abs(gain).toFixed(1)} percentage points ${gain >= 0 ? "over" : "below"} ${strongestBaseline.name}, the strongest baseline on average`;
    $("#stat-success-gain").title = comparison;
    $("#stat-success-gain").setAttribute("aria-label", comparison);
    $(".results-highlight > strong").replaceChildren(document.createTextNode(ours.avg.toFixed(1)), element("span", "", "%"));
    const summary = $(".results-highlight > p");
    summary.replaceChildren(element("span", "", `${gain >= 0 ? "↗" : "↘"} ${Math.abs(gain).toFixed(1)} percentage points`), element("br"), document.createTextNode(`${gain >= 0 ? "over" : "below"} ${strongestBaseline.name}, the strongest`), element("br"), document.createTextNode("baseline on average."));
  }
  $("#results-table").replaceChildren();
  results.forEach(result => {
    const row = element("tr", result.ours ? "ours" : "");
    const label = element("th", "", result.name);
    label.scope = "row";
    row.append(label);
    ["avg", "repetition", "history", "progress"].forEach(key => row.append(element("td", "", result[key].toFixed(1))));
    $("#results-table").append(row);
  });
  $("#result-metric").addEventListener("change", event => renderChart(event.target.value));

  // An empty URL is an explicit unreleased state, never a broken placeholder link.
  $$('[data-paper-link]').forEach(link => {
    if (project.paperUrl) {
      link.href = project.paperUrl;
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
      const label = $(".paper-status", link);
      if (label) label.textContent = link.classList.contains("resource-card") ? "Read the paper ↗" : "Read the paper";
      const note = $(".paper-status-note", link);
      if (note) note.hidden = true;
    } else {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
    }
  });
  if (project.repositoryUrl) {
    $("#hero-code").href = project.repositoryUrl;
    $("#hero-code").target = "_blank";
    $("#hero-code").rel = "noopener";
    $("#code-status").hidden = true;
    const link = element("a", "", "View on GitHub ↗");
    link.href = project.repositoryUrl; link.target = "_blank"; link.rel = "noopener";
    $("#code-resource-link").classList.remove("muted");
    $("#code-resource-link").replaceChildren(link);
  }
  if (project.datasetUrl) {
    const link = element("a", "", "Explore the dataset ↗");
    link.href = project.datasetUrl; link.target = "_blank"; link.rel = "noopener";
    $("#data-resource-link").classList.remove("muted");
    $("#data-resource-link").replaceChildren(link);
  }
  if (project.authors.length) {
    const authors = $("#authors");
    authors.hidden = false;
    authors.replaceChildren();
    project.authors.forEach((author, index) => {
      if (index) authors.append(document.createTextNode(" · "));
      const name = element(author.url ? "a" : "span", "", author.name);
      if (author.url) { name.href = author.url; name.target = "_blank"; name.rel = "noopener"; }
      if (author.affiliation) name.title = author.affiliation;
      authors.append(name);
    });
  }
  if (project.citation) {
    $("#citation").hidden = false;
    $("#citation-text").textContent = project.citation;
    $("#citation-note").hidden = !project.citationIsTemplate;
    $("#copy-citation").textContent = project.citationIsTemplate ? "Copy template" : "Copy BibTeX";
    $("#copy-citation").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(project.citation); $("#copy-status").textContent = project.citationIsTemplate ? "Citation template copied." : "BibTeX copied."; }
      catch { const range = document.createRange(); range.selectNodeContents($("#citation-text")); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); $("#copy-status").textContent = "Citation selected. Press Ctrl+C (or ⌘C) to copy."; }
    });
  } else {
    $("#citation").hidden = true;
  }

  const navLinks = $$(".site-header nav a");
  // Resources still ends the Results highlight, without adding a navigation link.
  const navSections = [...navLinks.map(link => $(link.hash)).filter(Boolean), $("#resources")];
  let clickedSection = null;
  let navSettleTimer;
  let navFrame = 0;

  function highlightNav(id) {
    navLinks.forEach(link => {
      const active = link.hash === `#${id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
    });
  }

  function updateNavigation() {
    navFrame = 0;
    if (clickedSection) return;
    const activationLine = $(".site-header").offsetHeight + Math.min(innerHeight * 0.22, 180);
    let current = null;
    for (const section of navSections) {
      if (section.getBoundingClientRect().top <= activationLine) current = section.id;
    }
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) current = navSections.at(-1).id;
    highlightNav(current);
  }

  function finishNavigation() {
    clearTimeout(navSettleTimer);
    clickedSection = null;
    updateNavigation();
  }

  navLinks.forEach(link => link.addEventListener("click", event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    clickedSection = link.hash.slice(1);
    highlightNav(clickedSection); // Acknowledge the click before smooth scrolling begins.
    clearTimeout(navSettleTimer);
    navSettleTimer = setTimeout(finishNavigation, 900);
  }));
  window.addEventListener("scroll", () => {
    if (clickedSection) {
      clearTimeout(navSettleTimer);
      navSettleTimer = setTimeout(finishNavigation, 150);
    } else if (!navFrame) navFrame = requestAnimationFrame(updateNavigation);
  }, { passive: true });
  window.addEventListener("resize", updateNavigation);
  window.addEventListener("wheel", finishNavigation, { passive: true });
  window.addEventListener("touchstart", finishNavigation, { passive: true });
  document.addEventListener("keydown", event => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) finishNavigation();
  });
  window.addEventListener("hashchange", () => { if (!clickedSection) updateNavigation(); });
  renderTasks();
  renderBenchmarkTable();
  renderChart("avg");
  requestAnimationFrame(updateNavigation);
})();
