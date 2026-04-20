(function () {
  var PWD_KEY = 'noir_admin_pwd';
  var SESS_KEY = 'noir_admin_session';
  var ORDERS_KEY = 'noir_orders';
  var USERS_KEY = 'noir_users_registry';

  function getOrders() {
    try {
      var raw = localStorage.getItem(ORDERS_KEY);
      var a = raw ? JSON.parse(raw) : [];
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function saveOrders(arr) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(arr));
  }

  function getUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      var a = raw ? JSON.parse(raw) : [];
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(arr) {
    localStorage.setItem(USERS_KEY, JSON.stringify(arr));
  }

  function getCatalogState() {
    if (window.noirLoadAdminCatalogState) return window.noirLoadAdminCatalogState();
    try {
      var raw = localStorage.getItem('noir_admin_catalog');
      return raw ? JSON.parse(raw) : { removed: [], overrides: {}, custom: {} };
    } catch (e) {
      return { removed: [], overrides: {}, custom: {} };
    }
  }

  function saveCatalogState(state) {
    if (window.noirSaveAdminCatalogState) window.noirSaveAdminCatalogState(state);
    else localStorage.setItem('noir_admin_catalog', JSON.stringify(state));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showDashboard() {
    var loginEl = document.getElementById('adminLogin');
    if (loginEl) loginEl.style.display = 'none';
    var dash = document.getElementById('adminDash');
    if (dash) dash.style.display = 'block';
    renderUsers();
    renderOrders();
    renderProducts();
    renderRemoved();
  }

  function renderUsers() {
    var tbody = document.querySelector('#adminUsersTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var users = getUsers();
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No registered users on this browser yet.</td></tr>';
      return;
    }
    users.forEach(function (u, index) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' +
        escapeHtml(u.name || '') +
        '</td><td>' +
        escapeHtml(u.email || '') +
        '</td><td>' +
        (u.createdAt ? new Date(u.createdAt).toLocaleString() : '') +
        '</td><td><button type="button" class="admin-btn-danger admin-btn-sm" data-remove-user="' +
        index +
        '">Remove</button></td>';
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-remove-user]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-remove-user'), 10);
        if (isNaN(i)) return;
        if (!confirm('Permanently delete this account? They will not be able to sign in again.')) return;
        var list = getUsers();
        var removed = list[i];
        var email = removed && removed.email ? String(removed.email).toLowerCase().trim() : '';
        list.splice(i, 1);
        saveUsers(list);
        if (email) {
          try {
            var legacy = localStorage.getItem('noir_user_v2');
            if (legacy) {
              var u = JSON.parse(legacy);
              if (u && String(u.email || '').toLowerCase().trim() === email) {
                localStorage.removeItem('noir_user_v2');
              }
            }
          } catch (e1) {}
          try {
            sessionStorage.removeItem('noir_session');
          } catch (e2) {}
        }
        renderUsers();
      });
    });
  }

  function renderOrders() {
    var tbody = document.querySelector('#adminOrdersTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var orders = getOrders();
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No orders yet.</td></tr>';
      return;
    }
    orders.forEach(function (o, index) {
      var tr = document.createElement('tr');
      var nItems = (o.items || []).reduce(function (a, x) {
        return a + (x.qty || 1);
      }, 0);
      tr.innerHTML =
        '<td>' +
        escapeHtml(o.id || '') +
        '</td><td>' +
        (o.createdAt ? new Date(o.createdAt).toLocaleString() : '') +
        '</td><td>' +
        escapeHtml(o.status || 'pending') +
        '</td><td>' +
        escapeHtml((o.customer && o.customer.name) || '') +
        '<br><small>' +
        escapeHtml((o.customer && o.customer.email) || '') +
        '</small></td><td>' +
        nItems +
        '</td><td><button type="button" class="admin-btn-outline admin-btn-sm" data-edit-order="' +
        index +
        '">Edit</button></td>';
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-edit-order]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-edit-order'), 10);
        openOrderModal(i);
      });
    });
  }

  function renderOrderItemsReadonly(items) {
    var wrap = document.getElementById('orderItemsDisplay');
    if (!wrap) return;
    var arr = Array.isArray(items) ? items : [];
    if (arr.length === 0) {
      wrap.innerHTML = '<p class="admin-muted small">No line items.</p>';
      return;
    }
    var rows = arr
      .map(function (it) {
        var sz = it.sizeMl != null && it.sizeMl !== '—' ? String(it.sizeMl) + ' ml · ' : '';
        var cur = it.currency || 'LE';
        var line =
          escapeHtml(it.name || '') +
          ' · ' +
          sz +
          'qty ' +
          (it.qty || 1) +
          ' · ' +
          cur +
          ' ' +
          (it.price != null ? Number(it.price).toFixed(2) : '—');
        return '<li>' + line + '</li>';
      })
      .join('');
    wrap.innerHTML = '<ul class="admin-order-items-list">' + rows + '</ul>';
  }

  function openOrderModal(index) {
    var orders = getOrders();
    var o = orders[index];
    if (!o) return;
    var modal = document.getElementById('orderEditModal');
    document.getElementById('orderEditIndex').value = String(index);
    document.getElementById('orderStatus').value = o.status || 'pending';
    document.getElementById('orderCustName').value = (o.customer && o.customer.name) || '';
    document.getElementById('orderCustEmail').value = (o.customer && o.customer.email) || '';
    document.getElementById('orderCustPhone').value = (o.customer && o.customer.phone) || '';
    document.getElementById('orderCustAddress').value = (o.customer && o.customer.address) || '';
    document.getElementById('orderPayment').value = o.paymentMethod || '';
    document.getElementById('orderDiscount').value = o.discount != null ? o.discount : 0;
    renderOrderItemsReadonly(o.items || []);
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeOrderModal() {
    var modal = document.getElementById('orderEditModal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function saveOrderFromModal() {
    var index = parseInt(document.getElementById('orderEditIndex').value, 10);
    var orders = getOrders();
    if (isNaN(index) || !orders[index]) return;
    var o = orders[index];
    var preservedItems = Array.isArray(o.items) ? o.items.slice() : [];
    o.status = document.getElementById('orderStatus').value;
    o.customer = o.customer || {};
    o.customer.name = document.getElementById('orderCustName').value;
    o.customer.email = document.getElementById('orderCustEmail').value;
    o.customer.phone = document.getElementById('orderCustPhone').value;
    o.customer.address = document.getElementById('orderCustAddress').value;
    o.discount = parseFloat(document.getElementById('orderDiscount').value) || 0;
    o.items = preservedItems;
    orders[index] = o;
    saveOrders(orders);
    closeOrderModal();
    renderOrders();
  }

  function renderProducts() {
    var tbody = document.querySelector('#adminProductsTable tbody');
    if (!tbody || !window.noirGetProductById) return;
    tbody.innerHTML = '';
    var st = getCatalogState();
    var ids = window.noirCatalogIds ? window.noirCatalogIds.slice() : [];
    ids.forEach(function (id) {
      var p = window.noirGetProductById(id);
      if (!p) return;
      var tr = document.createElement('tr');
      var isCustom = !!st.custom[id];
      var type = isCustom ? 'Custom' : st.overrides[id] ? 'Overridden' : 'Built-in';
      tr.innerHTML =
        '<td><code>' +
        escapeHtml(id) +
        '</code></td><td>' +
        escapeHtml(p.name || '') +
        '</td><td>' +
        escapeHtml(p.category || '') +
        '</td><td>' +
        type +
        '</td><td><button type="button" class="admin-btn-outline admin-btn-sm" data-edit-pid="' +
        escapeHtml(id) +
        '">Edit</button> <button type="button" class="admin-btn-danger admin-btn-sm" data-hide-pid="' +
        escapeHtml(id) +
        '">Hide from shop</button></td>';
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-edit-pid]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openProductForm(btn.getAttribute('data-edit-pid'));
      });
    });
    tbody.querySelectorAll('[data-hide-pid]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pid = btn.getAttribute('data-hide-pid');
        if (!confirm('Hide this product from all shop pages?')) return;
        var s = getCatalogState();
        if (pid.indexOf('custom-') === 0) {
          delete s.custom[pid];
        } else {
          if (s.removed.indexOf(pid) === -1) s.removed.push(pid);
        }
        saveCatalogState(s);
        alert('Saved. Reloading…');
        location.reload();
      });
    });
  }

  function renderRemoved() {
    var tbody = document.querySelector('#adminRemovedTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var st = getCatalogState();
    var rem = st.removed || [];
    if (rem.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2">None</td></tr>';
      return;
    }
    rem.forEach(function (id) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><code>' +
        escapeHtml(id) +
        '</code></td><td><button type="button" class="admin-btn-outline admin-btn-sm" data-restore-pid="' +
        escapeHtml(id) +
        '">Restore</button></td>';
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-restore-pid]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pid = btn.getAttribute('data-restore-pid');
        var s = getCatalogState();
        s.removed = (s.removed || []).filter(function (x) {
          return x !== pid;
        });
        saveCatalogState(s);
        location.reload();
      });
    });
  }

  function clearProductForm() {
    document.getElementById('pfEditId').value = '';
    document.getElementById('pfMode').value = 'add';
    document.getElementById('pfName').value = '';
    document.getElementById('pfImage').value = '';
    document.getElementById('pfCategory').value = 'unisex';
    document.getElementById('pfLine').value = '';
    document.getElementById('pfDesc').value = '';
    document.getElementById('pfCurrency').value = 'LE';
    document.getElementById('pfBaseMl').value = '100';
    document.getElementById('pfCompare').value = '';
    var body = document.getElementById('pfSizesBody');
    if (body) {
      body.innerHTML = '';
      [[30, 500, true], [50, 800, true], [100, 1200, true]].forEach(function (row) {
        addSizeRow(body, row[0], row[1], row[2]);
      });
    }
  }

  function addSizeRow(body, ml, price, inStock) {
    var tbody = body || document.getElementById('pfSizesBody');
    if (!tbody) return;
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="number" class="pf-ml" value="' +
      ml +
      '" min="1"></td>' +
      '<td><input type="number" class="pf-price" value="' +
      price +
      '" min="0" step="1"></td>' +
      '<td><input type="checkbox" class="pf-stock" ' +
      (inStock ? 'checked' : '') +
      '></td>' +
      '<td><button type="button" class="admin-btn-outline admin-btn-sm pf-rm-row">×</button></td>';
    tbody.appendChild(tr);
    tr.querySelector('.pf-rm-row').addEventListener('click', function () {
      tr.remove();
    });
  }

  function readSizesFromForm() {
    var rows = document.querySelectorAll('#pfSizesBody tr');
    var sizes = [];
    rows.forEach(function (tr) {
      var ml = parseInt(tr.querySelector('.pf-ml').value, 10);
      var price = parseFloat(tr.querySelector('.pf-price').value);
      var stock = tr.querySelector('.pf-stock').checked;
      if (!isNaN(ml) && !isNaN(price)) {
        sizes.push({ ml: ml, price: price, inStock: stock });
      }
    });
    return sizes;
  }

  function openProductForm(productId) {
    var form = document.getElementById('adminProductForm');
    if (form) form.style.display = 'block';
    if (!productId) {
      clearProductForm();
      document.getElementById('pfMode').value = 'add';
      return;
    }
    document.getElementById('pfMode').value = 'edit';
    document.getElementById('pfEditId').value = productId;
    var p = window.noirGetProductById ? window.noirGetProductById(productId) : null;
    var st = getCatalogState();
    if (!p && st.custom[productId]) p = st.custom[productId];
    if (!p) {
      alert('Product not found');
      return;
    }
    document.getElementById('pfName').value = p.name || '';
    document.getElementById('pfImage').value = p.image || '';
    var catVal = p.category || 'unisex';
    if (catVal === 'shop' && window.noirInferGenderFromProduct) {
      catVal = window.noirInferGenderFromProduct(p);
    } else if (catVal === 'shop') {
      catVal = 'unisex';
    }
    document.getElementById('pfCategory').value = catVal;
    document.getElementById('pfLine').value = p.line || '';
    document.getElementById('pfDesc').value = p.description || '';
    document.getElementById('pfCurrency').value = p.currency || 'LE';
    document.getElementById('pfBaseMl').value = p.baseMl || 100;
    document.getElementById('pfCompare').value = p.compareAt != null ? p.compareAt : '';
    var body = document.getElementById('pfSizesBody');
    if (body) {
      body.innerHTML = '';
      (p.sizes || []).forEach(function (s) {
        addSizeRow(body, s.ml, s.price, s.inStock !== false);
      });
      if (!p.sizes || p.sizes.length === 0) {
        addSizeRow(body, 100, 1000, true);
      }
    }
  }

  function buildProductPayloadFromForm(isNew) {
    var sizes = readSizesFromForm();
    if (sizes.length === 0) {
      alert('Add at least one size.');
      return null;
    }
    var baseMl = parseInt(document.getElementById('pfBaseMl').value, 10) || 100;
    var cat = document.getElementById('pfCategory').value;
    var line =
      document.getElementById('pfLine').value.trim() ||
      (cat === 'men' ? 'Men Eau de Parfum' : cat === 'women' ? 'Women Eau de Parfum' : 'Unisex Eau de Parfum');
    var payload = {
      name: document.getElementById('pfName').value.trim(),
      image: document.getElementById('pfImage').value.trim(),
      category: cat,
      shopPageGender: cat,
      line: line,
      description: document.getElementById('pfDesc').value.trim(),
      currency: document.getElementById('pfCurrency').value.trim() || 'LE',
      sizes: sizes,
      baseMl: baseMl,
      inStock: sizes.some(function (s) {
        return s.inStock !== false;
      }),
      adminManaged: true,
    };
    var cmp = document.getElementById('pfCompare').value;
    if (cmp !== '') payload.compareAt = parseFloat(cmp);
    if (isNew) {
      payload.id = 'custom-' + Date.now();
    }
    return payload;
  }

  function saveProductForm(e) {
    e.preventDefault();
    var mode = document.getElementById('pfMode').value;
    var st = getCatalogState();
    if (mode === 'add') {
      var np = buildProductPayloadFromForm(true);
      if (!np) return;
      st.custom[np.id] = np;
      saveCatalogState(st);
      alert('Product added. The site will reload to apply changes.');
      location.reload();
      return;
    }
    var id = document.getElementById('pfEditId').value;
    if (!id) return;
    var full = buildProductPayloadFromForm(false);
    if (!full) return;
    delete full.id;
    if (id.indexOf('custom-') === 0) {
      st.custom[id] = Object.assign({}, st.custom[id] || {}, full, { id: id });
    } else {
      st.overrides[id] = Object.assign({}, st.overrides[id] || {}, full);
    }
    saveCatalogState(st);
    alert('Product updated. Reloading…');
    location.reload();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem(SESS_KEY) === '1') showDashboard();

    var form = document.getElementById('adminLoginForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = document.getElementById('adminPassword');
        var pass = input ? input.value : '';
        var expected = localStorage.getItem(PWD_KEY) || 'admin123';
        if (pass === expected) {
          sessionStorage.setItem(SESS_KEY, '1');
          showDashboard();
        } else {
          alert('Incorrect password.');
        }
      });
    }

    var setPwd = document.getElementById('adminSetPasswordForm');
    if (setPwd) {
      setPwd.addEventListener('submit', function (e) {
        e.preventDefault();
        var np = document.getElementById('newAdminPwd');
        if (np && np.value.length >= 4) {
          localStorage.setItem(PWD_KEY, np.value);
          alert('Staff password updated for this browser.');
          np.value = '';
        }
      });
    }

    var lo = document.getElementById('adminLogout');
    if (lo) {
      lo.addEventListener('click', function () {
        sessionStorage.removeItem(SESS_KEY);
        location.reload();
      });
    }

    document.querySelectorAll('.admin-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var name = tab.getAttribute('data-tab');
        document.querySelectorAll('.admin-tab').forEach(function (t) {
          t.classList.toggle('is-active', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        document.querySelectorAll('.admin-panel').forEach(function (p) {
          var show = p.id === 'panel-' + name;
          p.hidden = !show;
          p.classList.toggle('is-active', show);
        });
      });
    });

    var orderModal = document.getElementById('orderEditModal');
    if (orderModal) {
      orderModal.querySelectorAll('[data-close-modal]').forEach(function (el) {
        el.addEventListener('click', closeOrderModal);
      });
      var saveOb = document.getElementById('orderSaveBtn');
      if (saveOb) saveOb.addEventListener('click', saveOrderFromModal);
    }

    var btnShow = document.getElementById('btnShowProductForm');
    if (btnShow) {
      btnShow.addEventListener('click', function () {
        clearProductForm();
        document.getElementById('pfMode').value = 'add';
        document.getElementById('adminProductForm').style.display = 'block';
        document.getElementById('adminProductForm').scrollIntoView({ behavior: 'smooth' });
      });
    }
    var btnRef = document.getElementById('btnRefreshProducts');
    if (btnRef) btnRef.addEventListener('click', function () {
      renderProducts();
      renderRemoved();
    });
    var pfAddSize = document.getElementById('pfAddSizeRow');
    if (pfAddSize) {
      pfAddSize.addEventListener('click', function () {
        addSizeRow(null, 50, 600, true);
      });
    }
    var pfCancel = document.getElementById('pfCancel');
    if (pfCancel) {
      pfCancel.addEventListener('click', function () {
        document.getElementById('adminProductForm').style.display = 'none';
      });
    }
    var pfForm = document.getElementById('adminProductForm');
    if (pfForm) pfForm.addEventListener('submit', saveProductForm);
  });
})();
