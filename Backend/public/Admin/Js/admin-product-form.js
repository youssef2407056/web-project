(function () {
  function init() {
    var tbody  = document.getElementById('adminSizesBody');
    var addBtn = document.getElementById('adminAddSizeRow');
    if (!tbody) return;

    /* ── Build one table row and append it ── */
    function addRow(ml, price, stock, inStock) {
      var idx = tbody.rows.length;
      var tr  = document.createElement('tr');

      tr.innerHTML =
        '<td>' +
          '<input type="number" name="sizes[' + idx + '][ml]"' +
          ' min="1" placeholder="ml"' +
          ' value="' + (ml != null && ml !== '' ? Number(ml) : '') + '">' +
        '</td>' +
        '<td>' +
          '<input type="number" name="sizes[' + idx + '][price]"' +
          ' min="0" step="1" placeholder="LE"' +
          ' value="' + (price != null && price !== '' ? Number(price) : '') + '">' +
        '</td>' +
        '<td>' +
          '<input type="number" name="sizes[' + idx + '][stock]"' +
          ' min="0" step="1" placeholder="0"' +
          ' value="' + (stock != null && stock !== '' ? Number(stock) : 0) + '">' +
        '</td>' +
        '<td style="text-align:center">' +
          '<input type="checkbox" name="sizes[' + idx + '][inStock]" value="true"' +
          (inStock !== false ? ' checked' : '') + '>' +
        '</td>' +
        '<td>' +
          '<button type="button" class="admin-btn-outline admin-btn-sm admin-rm-size">Remove</button>' +
        '</td>';

      tbody.appendChild(tr);

      tr.querySelector('.admin-rm-size').addEventListener('click', function () {
        tr.remove();
        reindex();
      });
    }

    /* ── Re-number all name attributes after a row is removed ── */
    function reindex() {
      Array.prototype.forEach.call(tbody.rows, function (tr, idx) {
        var ml      = tr.querySelector('input[name$="[ml]"]');
        var price   = tr.querySelector('input[name$="[price]"]');
        var stock   = tr.querySelector('input[name$="[stock]"]');
        var inStock = tr.querySelector('input[name$="[inStock]"]');
        if (ml)      ml.name      = 'sizes[' + idx + '][ml]';
        if (price)   price.name   = 'sizes[' + idx + '][price]';
        if (stock)   stock.name   = 'sizes[' + idx + '][stock]';
        if (inStock) inStock.name = 'sizes[' + idx + '][inStock]';
      });
    }

    /* ── Load existing sizes (edit mode) or a blank starter (add mode) ── */
    var existing = Array.isArray(window.__editSizes) ? window.__editSizes : [];

    if (existing.length > 0) {
      existing.forEach(function (s) {
        addRow(s.ml, s.price, s.stock, s.inStock !== false);
      });
    } else if (!window.__editMode) {
      addRow('', '', 0, true);   /* new product: one blank row to start */
    }
    /* edit mode + no sizes → tbody stays empty; admin clicks "+ Add size" */

    /* ── "+ Add size" button ── */
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addRow('', '', 0, true);
      });
    }
  }

  /* Run after the full DOM is ready — guarantees tbody exists */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


// ===== IMAGE UPLOAD PREVIEW =====
(function() {
  var box = document.getElementById("uploadBox");
  var input = document.getElementById("imageInput");
  var preview = document.getElementById("uploadPreview");
  var previewImg = document.getElementById("previewImg");
  var previewName = document.getElementById("previewName");
  var previewSize = document.getElementById("previewSize");
  var clearBtn = document.getElementById("clearImage");
  var currentBox = document.getElementById("currentImageBox");
  if (!box || !input) return;

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function showPreview(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      if (previewName) previewName.textContent = file.name;
      if (previewSize) previewSize.textContent = formatSize(file.size);
      preview.style.display = "flex";
      box.style.display = "none";
      if (currentBox) currentBox.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  input.addEventListener("change", function() {
    if (input.files && input.files[0]) showPreview(input.files[0]);
  });

  box.addEventListener("dragover", function(e) { e.preventDefault(); box.classList.add("dragover"); });
  box.addEventListener("dragleave", function() { box.classList.remove("dragover"); });
  box.addEventListener("drop", function(e) {
    e.preventDefault(); box.classList.remove("dragover");
    var file = e.dataTransfer.files[0];
    if (file) { input.files = e.dataTransfer.files; showPreview(file); }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", function() {
      input.value = "";
      preview.style.display = "none";
      box.style.display = "block";
      if (currentBox) currentBox.style.display = "flex";
    });
  }
})();
