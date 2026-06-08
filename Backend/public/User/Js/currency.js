(function () {
  "use strict";

  var STORAGE_KEY = "noir_currency";
  var rate = null;

  function getMode() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "LE" ? "LE" : "USD";
    } catch (e) {
      return "USD";
    }
  }

  function setMode(mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode === "LE" ? "LE" : "USD");
    } catch (e) {}
  }

  function formatLocal(amount, currency) {
    var sym = currency || "LE";
    var n = Number(amount);
    if (!Number.isFinite(n)) return "";
    if (sym === "$") {
      return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (sym === "LE") {
      return "LE " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return sym + " " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function convertToUsd(egpAmount) {
    if (!rate) return Number(egpAmount);
    return Number(egpAmount) * rate;
  }

  function formatEgpAmount(egpAmount) {
    var n = Number(egpAmount);
    if (!Number.isFinite(n)) return "";
    if (getMode() === "USD" && rate) {
      return formatLocal(convertToUsd(n), "$");
    }
    return formatLocal(n, "LE");
  }

  function wrapFormatMoney() {
    var base = window.noirFormatMoney;
    if (base && base.__noirCurrencyWrapped) return;

    window.noirFormatMoney = function (amount, currency) {
      var mode = getMode();
      if (mode === "USD" && rate) {
        return formatLocal(convertToUsd(amount), "$");
      }
      if (typeof base === "function") {
        return base(amount, currency);
      }
      return formatLocal(amount, currency || "LE");
    };
    window.noirFormatMoney.__noirCurrencyWrapped = true;
  }

  function hydrateStaticMoney(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-egp]").forEach(function (el) {
      var egp = Number(el.getAttribute("data-egp"));
      if (!Number.isFinite(egp)) return;
      if (!el.hasAttribute("data-egp-original")) {
        el.setAttribute("data-egp-original", el.textContent);
      }
      el.textContent = formatEgpAmount(egp);
    });
  }

  function refreshSwitcher() {
    var mode = getMode();
    document.querySelectorAll(".currency-switcher .currency-btn").forEach(function (btn) {
      var active = btn.getAttribute("data-currency") === mode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function notifyChange() {
    refreshSwitcher();
    hydrateStaticMoney();
    window.dispatchEvent(new CustomEvent("noir-currency-change"));
  }

  function loadRates() {
    return fetch("/api/external/currency", { credentials: "same-origin" })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data && data.success && data.rate) {
          rate = Number(data.rate);
          window.noirUsdRate = rate;
        }
      })
      .catch(function () {
        rate = 0.021;
        window.noirUsdRate = rate;
      });
  }

  function bindSwitcher() {
    document.querySelectorAll(".currency-switcher .currency-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = btn.getAttribute("data-currency");
        if (!next || next === getMode()) return;
        setMode(next);
        notifyChange();
      });
    });
  }

  function observeDynamicContent() {
    if (typeof MutationObserver === "undefined") return;
    var timer = null;
    var observer = new MutationObserver(function (mutations) {
      var hasNew = mutations.some(function (m) {
        return m.addedNodes && m.addedNodes.length;
      });
      if (!hasNew) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        hydrateStaticMoney();
      }, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    refreshSwitcher();
    wrapFormatMoney();
    bindSwitcher();
    observeDynamicContent();
    loadRates().then(notifyChange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.noirCurrency = {
    getMode: getMode,
    getRate: function () {
      return rate;
    },
    convertToUsd: convertToUsd,
    formatEgpAmount: formatEgpAmount,
    hydrateStaticMoney: hydrateStaticMoney
  };
})();
