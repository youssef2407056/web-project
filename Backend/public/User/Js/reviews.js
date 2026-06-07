/**
 * Noir Perfume — Product Reviews (backend API)
 */
(function () {
  var selectedRating = 0;

  function isLoggedIn() {
    return !!(window.noirSession && window.noirSession.loggedIn);
  }

  function currentUser() {
    if (!window.noirSession || !window.noirSession.loggedIn) return null;
    return {
      name: window.noirSession.userName || '',
      email: window.noirSession.userEmail || ''
    };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return iso;
    }
  }

  function resolveMongoProductId(productId) {
    if (isMongoProductId(productId)) return String(productId);
    if (window.noirResolveMongoProductId) return window.noirResolveMongoProductId(productId);
    return String(productId || '');
  }

  function isMongoProductId(productId) {
    return /^[a-f\d]{24}$/i.test(String(productId || ''));
  }

  function mapApiReview(r) {
    return {
      id: String(r._id || r.id || ''),
      productId: String(r.product || ''),
      title: r.title || '',
      body: r.comment || '',
      author: (r.user && r.user.name) || 'Customer',
      verified: true,
      rating: Number(r.rating) || 0,
      createdAt: r.createdAt || new Date().toISOString()
    };
  }

  function fetchProductReviews(productId) {
    var mongoId = resolveMongoProductId(productId);
    if (!isMongoProductId(mongoId)) return Promise.resolve([]);
    return fetch('/reviews/' + encodeURIComponent(mongoId), { credentials: 'same-origin' })
      .then(function (res) {
        return res.ok ? res.json() : { success: false, reviews: [] };
      })
      .then(function (data) {
        if (!data || !data.success || !Array.isArray(data.reviews)) return [];
        return data.reviews.map(mapApiReview);
      })
      .catch(function () {
        return [];
      });
  }

  function renderStars(rating) {
    var n = Math.max(0, Math.min(5, Number(rating) || 0));
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<span class="review-star' + (i <= n ? ' review-star--on' : '') + '" aria-hidden="true">★</span>';
    }
    return out;
  }

  function renderSummary(reviews) {
    var el = document.getElementById('reviewsSummary');
    if (!el) return;
    var count = reviews.length;
    el.innerHTML =
      '<div class="reviews-summary">' +
      '<div class="total-reviews">(' + count + ' review' + (count !== 1 ? 's' : '') + ')</div>' +
      '</div>';
  }

  function renderList(reviews) {
    var el = document.getElementById('reviewsList');
    if (!el) return;
    if (!reviews.length) {
      el.innerHTML = '<p class="reviews-empty">No reviews yet — be the first to share your thoughts!</p>';
      return;
    }
    var sorted = reviews.slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    el.innerHTML = sorted
      .map(function (r) {
        var user = escapeHtml(r.author || 'Anonymous');
        var verified = r.verified ? '<span class="review-verified">✔ Verified purchase</span>' : '';
        return (
          '<article class="review-card">' +
          '<div class="review-card__head">' +
          '<div class="review-card__meta">' +
          '<span class="review-author">' + user + '</span>' +
          verified +
          '</div>' +
          '<div class="review-card__right">' +
          (r.rating ? '<div class="review-rating">' + renderStars(r.rating) + '</div>' : '') +
          '<span class="review-date">' + formatDate(r.createdAt) + '</span>' +
          '</div>' +
          '</div>' +
          (r.title ? '<p class="review-title">' + escapeHtml(r.title) + '</p>' : '') +
          '<p class="review-body">' + escapeHtml(r.body) + '</p>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderForm(productId, onSuccess) {
    var wrap = document.getElementById('reviewFormWrap');
    if (!wrap) return;

    var mongoId = resolveMongoProductId(productId);

    if (!isMongoProductId(mongoId)) {
      wrap.innerHTML = '<p class="reviews-empty">Loading review form…</p>';
      var catalogReady = window.noirCatalogReady ? window.noirCatalogReady() : Promise.resolve();
      catalogReady.then(function () {
        mongoId = resolveMongoProductId(productId);
        if (!isMongoProductId(mongoId)) {
          wrap.innerHTML = '<p class="reviews-empty">Reviews are unavailable for this product.</p>';
          return;
        }
        renderForm(productId, onSuccess);
      });
      return;
    }

    if (!isLoggedIn()) {
      wrap.innerHTML =
        '<div class="review-login-prompt">' +
        '<p>Please <a href="/auth/login">sign in</a> to write a review.</p>' +
        '</div>';
      return;
    }

    var user = currentUser();
    selectedRating = 0;

    wrap.innerHTML =
      '<h3 class="reviews-form-title">Write a review</h3>' +
      '<div class="review-form">' +
      '<div class="review-form__field">' +
      '<label>Rating <span aria-hidden="true">*</span></label>' +
      '<div class="review-rating-input" id="revRatingInput" role="radiogroup" aria-label="Rating">' +
      [1, 2, 3, 4, 5]
        .map(function (n) {
          return (
            '<button type="button" class="review-rating-btn" data-rating="' +
            n +
            '" aria-label="' +
            n +
            ' stars">★</button>'
          );
        })
        .join('') +
      '</div>' +
      '</div>' +
      '<div class="review-form__field">' +
      '<label for="revName">Name</label>' +
      '<input type="text" id="revName" placeholder="Your name" value="' +
      (user && user.name ? escapeHtml(user.name) : '') +
      '" autocomplete="name">' +
      '</div>' +
      '<div class="review-form__field">' +
      '<label for="revTitle">Review title</label>' +
      '<input type="text" id="revTitle" placeholder="Sum it up in a sentence…" maxlength="120">' +
      '</div>' +
      '<div class="review-form__field">' +
      '<label for="revBody">Your review <span aria-hidden="true">*</span></label>' +
      '<textarea id="revBody" rows="4" placeholder="What did you think of the scent, longevity, sillage…?" maxlength="1200"></textarea>' +
      '</div>' +
      '<p id="revError" class="review-form__error" aria-live="polite"></p>' +
      '<button type="button" id="revSubmit" class="btn-review-submit">Post review</button>' +
      '</div>';

    wrap.querySelectorAll('.review-rating-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedRating = Number(btn.getAttribute('data-rating')) || 0;
        wrap.querySelectorAll('.review-rating-btn').forEach(function (b) {
          b.classList.toggle('review-rating-btn--on', Number(b.getAttribute('data-rating')) <= selectedRating);
        });
      });
    });

    document.getElementById('revSubmit').addEventListener('click', function () {
      var body = (document.getElementById('revBody').value || '').trim();
      var errEl = document.getElementById('revError');

      if (!selectedRating) {
        errEl.textContent = 'Please select a star rating.';
        return;
      }
      if (!body) {
        errEl.textContent = 'Please write your review before posting.';
        return;
      }

      errEl.textContent = '';
      var submitBtn = document.getElementById('revSubmit');
      submitBtn.disabled = true;

      fetch('/reviews/' + encodeURIComponent(mongoId), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          title: (document.getElementById('revTitle').value || '').trim(),
          comment: body
        })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok || !result.data.success) {
            throw new Error((result.data && result.data.message) || 'Could not save review.');
          }
          onSuccess();
          wrap.innerHTML =
            '<div class="review-thanks"><span class="review-thanks-icon">✔</span>' +
            '<p>Thank you for your review!</p></div>';
        })
        .catch(function (err) {
          submitBtn.disabled = false;
          errEl.textContent = err.message || 'Could not save review. Please try again.';
        });
    });
  }

  function initReviews(productId) {
    if (!productId) return;

    function refresh() {
      fetchProductReviews(productId).then(function (reviews) {
        renderSummary(reviews);
        renderList(reviews);
      });
    }

    refresh();
    renderForm(productId, refresh);
  }

  window.noirInitReviews = initReviews;
})();
