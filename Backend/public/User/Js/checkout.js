(function () {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function linePrice(item) {
    var sym = item.currency || 'LE';
    if (window.noirFormatMoney) return window.noirFormatMoney(item.price * (item.qty || 1), sym);
    return String(item.price * (item.qty || 1));
  }

  function resolveCheckoutImage(item) {
    if (window.noirResolveProductImage) return window.noirResolveProductImage(item.productId || null, item.image || '');
    return item.image || '';
  }

  var PROMO_STORAGE = 'noir_checkout_promo';

  var activeDiscount = 0;
  var activePromoCode = '';

  function normalizePromoCode(raw) {
    return String(raw || '')
      .replace(/[\s\u200b-\u200d\ufeff\u00a0]/g, '')
      .toUpperCase();
  }

  function lookupPromoPercent(code, callback) {
    var c = normalizePromoCode(code);
    if (!c) {
      callback(0);
      return;
    }
    fetch('/api/promos/validate/' + encodeURIComponent(c), { credentials: 'same-origin' })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data && result.data.success) {
          callback(Number(result.data.discountPercent) || 0, result.data.code || c);
        } else {
          callback(0);
        }
      })
      .catch(function () {
        callback(0);
      });
  }

  function renderSummary() {
    var list = document.getElementById('checkoutLines');
    var totalEl = document.getElementById('checkoutTotal');
    if (!list || !window.noirGetCart) return;

    var items = window.noirGetCart();
    if (items.length === 0) {
      activeDiscount = 0;
      try {
        sessionStorage.removeItem(PROMO_STORAGE);
      } catch (e2) {}
      list.innerHTML = '<li>Your cart is empty. <a href="' + (window.noirHtmlPage ? window.noirHtmlPage('Shopall.html') : 'Shopall.html') + '">Continue shopping</a></li>';
      if (totalEl) totalEl.textContent = '—';
      var wrapEmpty = document.getElementById('checkoutFinalWrap');
      if (wrapEmpty) wrapEmpty.style.display = 'none';
      return;
    }

    var totals = {};
    list.innerHTML = '';
    items.forEach(function (item) {
      var sym = item.currency || 'LE';
      totals[sym] = (totals[sym] || 0) + item.price * (item.qty || 1);
      var li = document.createElement('li');
      var imgSrcRaw = resolveCheckoutImage(item);
      var imgSrc = imgSrcRaw ? escapeHtml(imgSrcRaw) : '';
      li.innerHTML =
        (imgSrc ? '<img src="' + imgSrc + '" alt="" onerror="this.onerror=null;this.src=\'../Images/image.webp\'">' : '<span style="width:44px"></span>') +
        '<div><div>' +
        escapeHtml(item.name) +
        '</div><small style="color:#666">' +
        (item.sizeMl === '—' ? '' : escapeHtml(String(item.sizeMl)) + ' ml') +
        ' × ' +
        (item.qty || 1) +
        '</small></div><strong>' +
        linePrice(item) +
        '</strong>';
      list.appendChild(li);
    });

    if (totalEl) {
      var syms = Object.keys(totals);
      if (activeDiscount > 0) {
        totalEl.textContent = syms
          .map(function (sym) {
            var amt = totals[sym] * (1 - activeDiscount / 100);
            return window.noirFormatMoney ? window.noirFormatMoney(amt, sym) : sym + amt.toFixed(2);
          })
          .join(' · ');
      } else {
        totalEl.textContent = syms
          .map(function (sym) {
            return window.noirFormatMoney ? window.noirFormatMoney(totals[sym], sym) : sym + totals[sym].toFixed(2);
          })
          .join(' · ');
      }
    }
  }

  function appendOrder(order) {
    try {
      var raw = localStorage.getItem('noir_orders');
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) arr = [];
      arr.unshift(order);
      localStorage.setItem('noir_orders', JSON.stringify(arr));
    } catch (e) {
      localStorage.setItem('noir_orders', JSON.stringify([order]));
    }
  }

  function getSubtotal() {
    var items = window.noirGetCart ? window.noirGetCart() : [];
    var totals = {};
    items.forEach(function(item) {
      var sym = item.currency || 'LE';
      totals[sym] = (totals[sym] || 0) + item.price * (item.qty || 1);
    });
    return totals;
  }

  function renderFinalTotal() {
    var wrap = document.getElementById('checkoutFinalWrap');
    var subEl = document.getElementById('finalSubtotal');
    var discRow = document.getElementById('discountRow');
    var discEl = document.getElementById('finalDiscount');
    var totEl = document.getElementById('finalTotal');
    if (!wrap) return;

    var totals = getSubtotal();
    var syms = Object.keys(totals);
    if (!syms.length) return;
    wrap.style.display = 'block';

    var subtotalParts = syms.map(function(s) {
      return window.noirFormatMoney ? window.noirFormatMoney(totals[s], s) : s + totals[s].toFixed(2);
    });
    if (subEl) subEl.textContent = subtotalParts.join(' · ');

    if (activeDiscount > 0) {
      discRow.style.display = 'flex';
      var discParts = syms.map(function(s) {
        return '-' + (window.noirFormatMoney ? window.noirFormatMoney(totals[s] * activeDiscount / 100, s) : (totals[s] * activeDiscount / 100).toFixed(2));
      });
      if (discEl) discEl.textContent = discParts.join(' · ') + ' (' + activeDiscount + '% off)';
      var finalParts = syms.map(function(s) {
        var amt = totals[s] * (1 - activeDiscount / 100);
        return window.noirFormatMoney ? window.noirFormatMoney(amt, s) : s + amt.toFixed(2);
      });
      if (totEl) totEl.textContent = finalParts.join(' · ');
    } else {
      if (discRow) discRow.style.display = 'none';
      if (totEl) totEl.textContent = subtotalParts.join(' · ');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var promoInputEarly = document.getElementById('promoInput');
    var promoMsgEarly = document.getElementById('promoMsg');
    try {
      var savedEarly = sessionStorage.getItem(PROMO_STORAGE);
      if (savedEarly && promoInputEarly && !promoInputEarly.value) {
        lookupPromoPercent(savedEarly, function (pEarly, codeEarly) {
          if (pEarly) {
            promoInputEarly.value = codeEarly || savedEarly;
            activeDiscount = pEarly;
            activePromoCode = codeEarly || savedEarly;
            if (promoMsgEarly) {
              promoMsgEarly.style.color = '#2e7d32';
              promoMsgEarly.textContent = 'Code applied — ' + pEarly + '% off your order subtotal.';
            }
            renderSummary();
            renderFinalTotal();
          }
        });
      }
    } catch (eEarly) {}

    renderSummary();
    renderFinalTotal();

   

    // Promo code
    var promoApply = document.getElementById('promoApply');
    var promoInput = document.getElementById('promoInput');
    var promoMsg = document.getElementById('promoMsg');

    function applyPromoCode() {
      var raw = promoInput && promoInput.value ? promoInput.value : '';
      var code = normalizePromoCode(raw);
      if (!code) {
        activeDiscount = 0;
        activePromoCode = '';
        if (promoMsg) {
          promoMsg.style.color = '#c62828';
          promoMsg.textContent = 'Enter a promo code.';
        }
        renderSummary();
        renderFinalTotal();
        return;
      }
      if (promoMsg) {
        promoMsg.style.color = '#666';
        promoMsg.textContent = 'Checking code…';
      }
      lookupPromoPercent(code, function (pct, appliedCode) {
        if (pct) {
          activeDiscount = pct;
          activePromoCode = appliedCode || code;
          try {
            sessionStorage.setItem(PROMO_STORAGE, activePromoCode);
          } catch (e1) {}
          if (promoMsg) {
            promoMsg.style.color = '#2e7d32';
            promoMsg.textContent = 'Code applied — ' + pct + '% off your order subtotal.';
          }
        } else {
          activeDiscount = 0;
          activePromoCode = '';
          try {
            sessionStorage.removeItem(PROMO_STORAGE);
          } catch (e3) {}
          if (promoMsg) {
            promoMsg.style.color = '#c62828';
            promoMsg.textContent = 'That code is not valid or is inactive.';
          }
        }
        renderSummary();
        renderFinalTotal();
      });
    }

    if (promoApply) {
      promoApply.addEventListener('click', applyPromoCode);
    }
    if (promoInput) {
      promoInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyPromoCode();
        }
      });
    }

    var form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      form.querySelectorAll('.field-error').forEach(function (el) {
        el.remove();
      });

      form.querySelectorAll('input:not([type="hidden"]), textarea').forEach(function (el) {
        el.style.borderColor = '';
      });

      function showError(input, msg) {
        input.style.borderColor = '#c62828';
        var err = document.createElement('div');
        err.className = 'field-error';
        err.style.color = '#c62828';
        err.style.fontSize = '13px';
        err.style.marginTop = '5px';
        err.style.marginBottom = '8px';
        err.textContent = msg;
        input.parentNode.insertBefore(err, input.nextSibling);
      }

      var items = (window.noirGetCart ? window.noirGetCart() : []).filter(function (item) {
        return item && item.name && item.price != null && !Number.isNaN(Number(item.price));
      });

      if (items.length === 0) {
        e.preventDefault();
        alert('Your cart is empty.');
        return;
      }

      var nameInput = form.querySelector('[name="name"]');
      var emailInput = form.querySelector('[name="email"]');
      var phoneInput = form.querySelector('[name="phone"]');
      var addressInput = form.querySelector('[name="address"]');

      var name = nameInput.value.trim();
      var email = emailInput.value.trim().toLowerCase();
      var phone = phoneInput.value.trim();
      var address = addressInput.value.trim();

      var valid = true;

      if (!name) {
        showError(nameInput, 'Full name is required');
        valid = false;
      }

      if (!email) {
        showError(emailInput, 'Email is required');
        valid = false;
      } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        showError(emailInput, 'Enter a valid email');
        valid = false;
      }

      if (!phone) {
        showError(phoneInput, 'Phone is required');
        valid = false;
      } else {
        var cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 11 || cleanPhone.length > 13) {
          showError(phoneInput, 'Invalid phone number');
          valid = false;
        }
      }

      if (!address) {
        showError(addressInput, 'Shipping address is required');
        valid = false;
      }

      if (!valid) {
        e.preventDefault();
        return;
      }

      var cartField = document.getElementById('cartItemsField');
      if (cartField) {
        cartField.value = JSON.stringify(items);
      }

      localStorage.setItem('noir_cart', '[]');
      if (window.noirSession && window.noirSession.loggedIn) {
        fetch('/cart/clear', { method: 'POST', credentials: 'same-origin' }).catch(function () {});
      }
    });

    window.addEventListener('noir-currency-change', function () {
      renderSummary();
      renderFinalTotal();
    });
  });

})();