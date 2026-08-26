import { CATEGORIES, TOOL_ART } from "./data.js";
import { createStore } from "./store.js";
import { executeLocalTool, registerWebMCP } from "./webmcp.js";
import { addDays, escapeHTML, formatCurrency, formatDate, toISODate } from "./utils.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const store = createStore();
const ui = {
  view: "browse",
  query: "",
  category: "All tools",
  distance: 10,
  availableOnly: false,
  webmcp: null,
  confirmationResolver: null,
  demoRunning: false,
};

const elements = {
  toolGrid: $("#tool-grid"),
  emptyTools: $("#empty-tools"),
  resultCount: $("#result-count"),
  activeFilters: $("#active-filters"),
  categoryOptions: $("#category-options"),
  distanceFilter: $("#distance-filter"),
  distanceOutput: $("#distance-output"),
  availableFilter: $("#available-filter"),
  filterPanel: $("#filter-panel"),
  filterToggle: $("#filter-toggle"),
  heroQuery: $("#hero-query"),
  reservations: $("#reservation-list"),
  emptyReservations: $("#empty-reservations"),
  reservationCount: $("#reservation-count"),
  activityList: $("#activity-list"),
  registeredTools: $("#registered-tools"),
  webmcpIndicator: $("#webmcp-indicator"),
  webmcpStatus: $("#webmcp-status-text"),
  agentDemoButton: $("#agent-demo-button"),
  toolDialog: $("#tool-dialog"),
  toolDialogContent: $("#tool-dialog-content"),
  confirmationDialog: $("#confirmation-dialog"),
  confirmationForm: $("#confirmation-form"),
  confirmationTitle: $("#confirmation-title"),
  confirmationCopy: $("#confirmation-copy"),
  confirmationSummary: $("#confirmation-summary"),
  confirmationApprove: $("#confirmation-approve"),
  confirmationIcon: $("#confirmation-icon"),
  listingDialog: $("#listing-dialog"),
  listToolForm: $("#list-tool-form"),
  toastRegion: $("#toast-region"),
};

function artSVG(tool, className = "") {
  const art = TOOL_ART[tool.art] || TOOL_ART.toolkit;
  return `<svg class="${className}" viewBox="${art.viewBox}" role="img" aria-label="${escapeHTML(art.label)}">${art.markup}</svg>`;
}

function initials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CT";
}

function toolCard(tool) {
  const availableLabel = tool.available ? "Available now" : "Currently borrowed";
  return `
    <article class="tool-card" data-tool-card="${escapeHTML(tool.id)}">
      <div class="tool-card-art">
        <span class="availability-badge ${tool.available ? "" : "is-unavailable"}">${availableLabel}</span>
        ${tool.featured ? '<span class="featured-badge">Community favourite</span>' : ""}
        ${artSVG(tool)}
      </div>
      <div class="tool-card-body">
        <div class="tool-meta-row">
          <span class="tool-category">${escapeHTML(tool.category)}</span>
          <span class="tool-distance">${escapeHTML(tool.distanceKm)} km away</span>
        </div>
        <h3>${escapeHTML(tool.name)}</h3>
        <p class="tool-description">${escapeHTML(tool.description)}</p>
        <div class="tool-location">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17s5-4.6 5-9a5 5 0 1 0-10 0c0 4.4 5 9 5 9Z"/><circle cx="10" cy="8" r="1.7"/></svg>
          Pickup in ${escapeHTML(tool.neighborhood)}
        </div>
        <div class="owner-row">
          <div class="owner-info">
            <span class="owner-avatar" aria-hidden="true">${escapeHTML(initials(tool.owner))}</span>
            <span><strong>${escapeHTML(tool.owner)}</strong><small>${escapeHTML(tool.condition)} condition</small></span>
          </div>
          <span class="tool-rating" aria-label="Rated ${escapeHTML(tool.rating)} out of 5 from ${escapeHTML(tool.reviews)} reviews">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 2.7 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.3-4.5 2.3.9-5L2.8 8l5-.7L10 2.7Z"/></svg>
            ${escapeHTML(tool.rating)}
          </span>
        </div>
        <div class="price-row">
          <span><strong>${formatCurrency(tool.pricePerDay)}</strong><small>per day · ${formatCurrency(tool.deposit)} deposit</small></span>
          <button class="button ${tool.available ? "button-dark" : "button-outline"}" type="button" data-tool-id="${escapeHTML(tool.id)}">
            ${tool.available ? "View & reserve" : "View details"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function currentFilters() {
  return {
    query: ui.query,
    category: ui.category,
    maxDistanceKm: ui.distance,
    availableOnly: ui.availableOnly,
  };
}

function renderTools(results = store.findTools(currentFilters())) {
  elements.toolGrid.innerHTML = results.map(toolCard).join("");
  elements.toolGrid.hidden = results.length === 0;
  elements.emptyTools.hidden = results.length !== 0;
  elements.resultCount.textContent = `${results.length} ${results.length === 1 ? "tool" : "tools"} found within ${ui.distance} km`;
  renderActiveFilters();
}

function renderActiveFilters() {
  const chips = [];
  if (ui.query) chips.push({ key: "query", label: `Search: ${ui.query}` });
  if (ui.category !== "All tools") chips.push({ key: "category", label: ui.category });
  if (ui.distance < 10) chips.push({ key: "distance", label: `Within ${ui.distance} km` });
  if (ui.availableOnly) chips.push({ key: "availability", label: "Available now" });
  elements.activeFilters.innerHTML = chips
    .map(({ key, label }) => `<span class="filter-chip">${escapeHTML(label)}<button type="button" data-remove-filter="${key}" aria-label="Remove ${escapeHTML(label)} filter">×</button></span>`)
    .join("");
}

function renderCategories() {
  const tools = store.getTools();
  const icons = ["⌘", "⌁", "⌂", "✎", "▣", "♧", "◉"];
  elements.categoryOptions.innerHTML = CATEGORIES.map((category, index) => {
    const count = category === "All tools" ? tools.length : tools.filter((tool) => tool.category === category).length;
    return `
      <label class="category-option">
        <input type="radio" name="category" value="${escapeHTML(category)}" ${ui.category === category ? "checked" : ""} />
        <span aria-hidden="true">${icons[index]}</span>
        <span>${escapeHTML(category)}</span>
        <span class="category-count">${count}</span>
      </label>
    `;
  }).join("");
}

function resetFilters() {
  ui.query = "";
  ui.category = "All tools";
  ui.distance = 10;
  ui.availableOnly = false;
  elements.heroQuery.value = "";
  elements.distanceFilter.value = "10";
  elements.distanceOutput.textContent = "10 km";
  elements.availableFilter.checked = false;
  renderCategories();
  renderTools();
}

function setView(view) {
  ui.view = view;
  $$('[data-page]').forEach((page) => {
    page.hidden = page.dataset.page !== view;
  });
  $$('[data-view]').forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  if (view === "loans") renderReservations();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openTool(toolId) {
  const tool = store.getTool(toolId);
  if (!tool) return;
  const tomorrow = toISODate(addDays(new Date(), 1));
  const dayAfter = toISODate(addDays(new Date(), 2));

  elements.toolDialogContent.innerHTML = `
    <div class="tool-modal-shell">
      <button class="modal-close" type="button" data-close-dialog aria-label="Close tool details">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
      </button>
      <div class="tool-modal-art">${artSVG(tool)}</div>
      <div class="tool-modal-body">
        <span class="tool-category">${escapeHTML(tool.category)}</span>
        <h2 id="tool-dialog-title">${escapeHTML(tool.name)}</h2>
        <p>${escapeHTML(tool.description)}</p>
        <div class="tool-detail-grid">
          <div><small>Pickup</small><strong>${escapeHTML(tool.neighborhood)} · ${escapeHTML(tool.distanceKm)} km</strong></div>
          <div><small>Contribution</small><strong>${formatCurrency(tool.pricePerDay)} / day</strong></div>
          <div><small>Deposit</small><strong>${formatCurrency(tool.deposit)}</strong></div>
        </div>
        <div class="care-note"><strong>Care note:</strong> ${escapeHTML(tool.rules)}</div>
        ${tool.available ? `
          <form class="reservation-form" id="reservation-form">
            <label class="field"><span>Borrow from</span><input name="startDate" type="date" value="${tomorrow}" min="${toISODate(new Date())}" required /></label>
            <label class="field"><span>Return on</span><input name="endDate" type="date" value="${dayAfter}" min="${tomorrow}" required /></label>
            <label class="field field-wide"><span>Note for ${escapeHTML(tool.owner)} (optional)</span><input name="note" maxlength="240" placeholder="What are you planning to use it for?" /></label>
            <div class="modal-actions"><button class="button button-coral" type="submit">Review reservation</button></div>
          </form>
        ` : '<div class="care-note"><strong>Unavailable:</strong> This tool is currently out with another neighbour. Try again soon.</div>'}
      </div>
    </div>
  `;

  const reservationForm = $("#reservation-form", elements.toolDialogContent);
  reservationForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(reservationForm);
    const request = {
      type: "reserve",
      tool,
      startDate: data.get("startDate"),
      endDate: data.get("endDate"),
      note: data.get("note"),
      source: "human",
    };
    const availability = store.checkAvailability(tool.id, request.startDate, request.endDate);
    if (!availability.available) {
      showToast(availability.reason, "!");
      return;
    }
    const approved = await requestConfirmation(request);
    if (!approved) return;
    try {
      store.reserveTool({ toolId: tool.id, startDate: request.startDate, endDate: request.endDate, note: request.note, source: "human" });
      elements.toolDialog.close();
      showToast(`${tool.name} is reserved. Pickup details are ready in My borrowing.`, "✓");
      setView("loans");
    } catch (error) {
      showToast(error.message, "!");
    }
  });

  elements.toolDialog.showModal();
}

function summaryRow(label, value) {
  return `<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`;
}

function requestConfirmation(payload) {
  if (ui.confirmationResolver) {
    ui.confirmationResolver(false);
    ui.confirmationResolver = null;
  }

  if (payload.type === "cancel") {
    elements.confirmationIcon.textContent = "↩";
    elements.confirmationTitle.textContent = "Cancel this reservation?";
    elements.confirmationCopy.textContent = payload.source === "agent"
      ? "Your agent requested a cancellation. Nothing changes until you approve it here."
      : "The reservation will be released for another neighbour.";
    elements.confirmationSummary.innerHTML = [
      summaryRow("Tool", payload.tool?.name || "Community tool"),
      summaryRow("Dates", `${formatDate(payload.reservation.startDate)} – ${formatDate(payload.reservation.endDate)}`),
      summaryRow("Status", "Currently confirmed"),
    ].join("");
    elements.confirmationApprove.textContent = "Approve cancellation";
  } else {
    const days = Math.max(1, Math.round((new Date(`${payload.endDate}T12:00:00`) - new Date(`${payload.startDate}T12:00:00`)) / 86400000) + 1);
    elements.confirmationIcon.textContent = "✓";
    elements.confirmationTitle.textContent = `Reserve ${payload.tool.name}?`;
    elements.confirmationCopy.textContent = payload.source === "agent"
      ? "Your agent prepared this reservation. Check the details before it changes your borrowing list."
      : "Review the dates and contribution before confirming.";
    elements.confirmationSummary.innerHTML = [
      summaryRow("Dates", `${formatDate(payload.startDate)} – ${formatDate(payload.endDate)}`),
      summaryRow("Pickup", payload.tool.neighborhood),
      summaryRow("Contribution", `${formatCurrency(payload.tool.pricePerDay * days)} for ${days} ${days === 1 ? "day" : "days"}`),
      summaryRow("Refundable deposit", formatCurrency(payload.tool.deposit)),
      payload.note ? summaryRow("Lender note", String(payload.note).slice(0, 80)) : "",
    ].join("");
    elements.confirmationApprove.textContent = "Approve reservation";
  }

  elements.confirmationDialog.showModal();
  return new Promise((resolve) => {
    ui.confirmationResolver = resolve;
  });
}

function renderReservations() {
  const state = store.getState();
  const reservations = state.reservations;
  const activeCount = reservations.filter((item) => item.status === "confirmed").length;
  elements.reservationCount.textContent = String(activeCount);
  elements.reservationCount.setAttribute("aria-label", `${activeCount} active ${activeCount === 1 ? "reservation" : "reservations"}`);
  elements.emptyReservations.hidden = reservations.length !== 0;
  elements.reservations.innerHTML = reservations.map((reservation) => {
    const tool = state.tools.find((item) => item.id === reservation.toolId);
    if (!tool) return "";
    return `
      <article class="reservation-card">
        <div class="reservation-art">${artSVG(tool)}</div>
        <div>
          <span class="reservation-status ${reservation.status === "cancelled" ? "is-cancelled" : ""}">${escapeHTML(reservation.status)}</span>
          <h2>${escapeHTML(tool.name)}</h2>
          <p>${formatDate(reservation.startDate)} – ${formatDate(reservation.endDate)}</p>
          <p>Pickup in ${escapeHTML(tool.neighborhood)} · booked by ${reservation.source === "agent" ? "your agent" : "you"}</p>
        </div>
        <div class="reservation-actions">
          <small>${formatCurrency(tool.deposit)} refundable deposit</small>
          ${reservation.status === "confirmed" ? `<button class="button button-outline" type="button" data-cancel-reservation="${escapeHTML(reservation.id)}">Cancel reservation</button>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function renderActivity() {
  const { activity } = store.getState();
  if (activity.length === 0) {
    elements.activityList.innerHTML = '<div class="activity-empty"><p>Run the agent demo to see every tool call recorded here.</p></div>';
    return;
  }
  elements.activityList.innerHTML = activity.slice(0, 10).map((item) => {
    const icon = item.source === "agent" ? "AI" : item.type === "reservation" ? "✓" : item.type === "cancellation" ? "↩" : "+";
    const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(item.timestamp));
    return `
      <div class="activity-item">
        <span class="activity-icon" aria-hidden="true">${icon}</span>
        <span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.detail || "")}</small></span>
        <span class="activity-time">${escapeHTML(time)}</span>
      </div>
    `;
  }).join("");
}

function renderToolChips(definitions = []) {
  const names = [...definitions.map((tool) => tool.name), "list_community_tool"];
  elements.registeredTools.innerHTML = names.map((name) => `<span class="tool-chip">${escapeHTML(name)}</span>`).join("");
}

function showToast(message, icon = "✓") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span aria-hidden="true">${escapeHTML(icon)}</span><p>${escapeHTML(message)}</p>`;
  elements.toastRegion.append(toast);
  setTimeout(() => toast.remove(), 4300);
}

async function runAgentDemo() {
  if (ui.demoRunning || !ui.webmcp) return;
  ui.demoRunning = true;
  elements.agentDemoButton.disabled = true;
  elements.agentDemoButton.textContent = "Agent is working…";
  const planItems = $$(".agent-plan li");
  planItems.forEach((item, index) => item.classList.toggle("is-complete", index === 0));

  try {
    ui.query = "drill";
    ui.category = "Power tools";
    ui.distance = 5;
    elements.heroQuery.value = "drill";
    elements.distanceFilter.value = "5";
    elements.distanceOutput.textContent = "5 km";
    renderCategories();
    setView("browse");

    const searchOutput = await executeLocalTool(ui.webmcp.definitions, "search_community_tools", {
      query: "cordless drill",
      category: "Power tools",
      maxDistanceKm: 5,
      maxDeposit: 600,
    });
    planItems[0]?.classList.add("is-complete");
    await pause(450);

    const parsed = JSON.parse(searchOutput);
    const toolId = parsed.tools?.[0]?.id;
    if (!toolId) throw new Error("No matching drill is available in the demo catalogue");
    const startDate = toISODate(addDays(new Date(), 1));
    const endDate = toISODate(addDays(new Date(), 2));
    await executeLocalTool(ui.webmcp.definitions, "check_tool_availability", { toolId, startDate, endDate });
    planItems[1]?.classList.add("is-complete");
    await pause(450);

    const result = await executeLocalTool(ui.webmcp.definitions, "reserve_tool", {
      toolId,
      startDate,
      endDate,
      note: "Planning a weekend shelf installation.",
    });
    planItems[2]?.classList.add("is-complete");
    const reservationResult = JSON.parse(result);
    if (reservationResult.reserved) {
      showToast("Agent workflow completed—with your approval.", "AI");
      setView("loans");
    } else {
      showToast("The agent stopped safely without changing anything.", "AI");
    }
  } catch (error) {
    showToast(error.message || "The agent demo could not finish", "!");
  } finally {
    ui.demoRunning = false;
    elements.agentDemoButton.disabled = false;
    elements.agentDemoButton.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6V4Z" /></svg>Run the guided agent demo';
  }
}

function bindEvents() {
  document.addEventListener("click", async (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) setView(viewButton.dataset.view);

    const toolButton = event.target.closest("[data-tool-id]");
    if (toolButton) openTool(toolButton.dataset.toolId);

    const quickSearch = event.target.closest("[data-quick-search]");
    if (quickSearch) {
      ui.query = quickSearch.dataset.quickSearch;
      elements.heroQuery.value = ui.query;
      renderTools();
      $("#catalogue-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const removeFilter = event.target.closest("[data-remove-filter]");
    if (removeFilter) {
      const key = removeFilter.dataset.removeFilter;
      if (key === "query") { ui.query = ""; elements.heroQuery.value = ""; }
      if (key === "category") { ui.category = "All tools"; renderCategories(); }
      if (key === "distance") { ui.distance = 10; elements.distanceFilter.value = "10"; elements.distanceOutput.textContent = "10 km"; }
      if (key === "availability") { ui.availableOnly = false; elements.availableFilter.checked = false; }
      renderTools();
    }

    if (event.target.closest("[data-reset-filters]")) resetFilters();

    if (event.target.closest("[data-open-listing]")) elements.listingDialog.showModal();

    const closeDialog = event.target.closest("[data-close-dialog]");
    if (closeDialog) closeDialog.closest("dialog")?.close();

    const cancellation = event.target.closest("[data-cancel-reservation]");
    if (cancellation) {
      const state = store.getState();
      const reservation = state.reservations.find((item) => item.id === cancellation.dataset.cancelReservation);
      const tool = state.tools.find((item) => item.id === reservation?.toolId);
      if (!reservation || !tool) return;
      const approved = await requestConfirmation({ type: "cancel", reservation, tool, source: "human" });
      if (approved) {
        store.cancelReservation(reservation.id, "human");
        showToast(`${tool.name} reservation cancelled.`, "↩");
      }
    }
  });

  $("#hero-search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    ui.query = elements.heroQuery.value.trim();
    renderTools();
    $("#catalogue-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#filters-form").addEventListener("change", (event) => {
    if (event.target.name === "category") ui.category = event.target.value;
    if (event.target === elements.availableFilter) ui.availableOnly = event.target.checked;
    renderTools();
  });

  $("#filters-form").addEventListener("reset", () => setTimeout(resetFilters, 0));

  elements.distanceFilter.addEventListener("input", () => {
    ui.distance = Number(elements.distanceFilter.value);
    elements.distanceOutput.textContent = `${ui.distance} km`;
    renderTools();
  });

  elements.filterToggle.addEventListener("click", () => {
    const open = elements.filterPanel.classList.toggle("is-open");
    elements.filterToggle.setAttribute("aria-expanded", String(open));
  });

  elements.confirmationDialog.addEventListener("close", () => {
    const resolver = ui.confirmationResolver;
    ui.confirmationResolver = null;
    resolver?.(elements.confirmationDialog.returnValue === "confirm");
  });

  elements.listToolForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const operation = Promise.resolve().then(() => {
      const input = Object.fromEntries(new FormData(elements.listToolForm));
      const tool = store.addTool(input);
      elements.listToolForm.reset();
      elements.listingDialog.close();
      showToast(`${tool.name} is now in the community library.`, "+");
      setView("browse");
      return `Published tool listing: ${tool.name} (${tool.id})`;
    });
    if (event.agentInvoked && typeof event.respondWith === "function") {
      event.respondWith(operation);
    }
    try {
      await operation;
    } catch (error) {
      showToast(error.message || "Could not publish the tool", "!");
    }
  });

  window.addEventListener("toolactivated", (event) => {
    if (event.toolName === "list_community_tool" && !elements.listingDialog.open) {
      elements.listingDialog.showModal();
      showToast("Your agent filled the listing. Review it before publishing.", "AI");
    }
  });

  [elements.toolDialog, elements.listingDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  elements.agentDemoButton.addEventListener("click", runAgentDemo);
  $("#clear-demo-data").addEventListener("click", () => {
    store.reset();
    resetFilters();
    showToast("Demo data has been reset.", "↻");
  });
}

async function initializeWebMCP() {
  ui.webmcp = await registerWebMCP({
    store,
    requestConfirmation,
    onSearchResults(results, input) {
      ui.query = input.query || "";
      ui.category = input.category || "All tools";
      ui.distance = Number(input.maxDistanceKm || 10);
      elements.heroQuery.value = ui.query;
      elements.distanceFilter.value = String(Math.min(10, ui.distance));
      elements.distanceOutput.textContent = `${ui.distance} km`;
      renderCategories();
      setView("browse");
      renderTools(results);
    },
  });

  renderToolChips(ui.webmcp.definitions);
  if (ui.webmcp.supported) {
    elements.webmcpIndicator.classList.add("is-native");
    elements.webmcpIndicator.innerHTML = "<span></span>Live";
    elements.webmcpStatus.textContent = `${ui.webmcp.registered.length} imperative tools registered with this browser, plus one declarative listing tool.`;
  } else {
    elements.webmcpIndicator.innerHTML = "<span></span>Preview";
    elements.webmcpStatus.textContent = "WebMCP is not enabled here. The guided demo executes the same tool handlers locally.";
  }

  if (store.getState().activity.length === 0) {
    store.addActivity({
      type: "system",
      title: ui.webmcp.supported ? "WebMCP tools registered" : "WebMCP preview ready",
      detail: `${ui.webmcp.definitions.length} structured tools available`,
      source: "system",
    });
  }
}

async function init() {
  renderCategories();
  renderTools();
  renderReservations();
  renderActivity();
  bindEvents();
  store.subscribe(() => {
    renderCategories();
    renderTools();
    renderReservations();
    renderActivity();
  });
  await initializeWebMCP();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
  window.addEventListener("beforeunload", () => ui.webmcp?.dispose?.());
}

init();
