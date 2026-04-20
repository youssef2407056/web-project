/**
 * Noir Perfume — Product Reviews System
 * Stores reviews in localStorage under key: noir_reviews
 * Usage: auto-initialised on DOMContentLoaded when #reviewsSection exists
 */
(function () {
  const REVIEWS_KEY = 'noir_reviews';

  /* ── Storage helpers ───────────────────────────────────────────── */
  /**
   * Retrieves all reviews from localStorage.
   * @returns {Object} Object with product IDs as keys and arrays of reviews as values.
   */
  function getAllReviews() {
    try {
      const raw = localStorage.getItem(REVIEWS_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Retrieves reviews for a specific product.
   * @param {string} productId - The product ID.
   * @returns {Array} Array of reviews for the product.
   */
  function getProductReviews(productId) {
    const all = getAllReviews();
    const arr = all[productId];
    return Array.isArray(arr) ? arr : [];
  }

  /**
   * Saves a new review for a product.
   * @param {string} productId - The product ID.
   * @param {Object} review - The review object.
   */
  function saveReview(productId, review) {
    const all = getAllReviews();
    if (!Array.isArray(all[productId])) {
      all[productId] = [];
    }
    all[productId].unshift(review);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
  }

  /* ── Helpers ───────────────────────────────────────────────────── */
  /**
   * Escapes HTML characters to prevent XSS.
   * @param {string} s - The string to escape.
   * @returns {string} The escaped string.
   */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Retrieves the current logged-in user.
   * @returns {Object|null} The user object or null.
   */
  function currentUser() {
    try {
      const u = localStorage.getItem('noir_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Formats an ISO date string to a readable date.
   * @param {string} iso - The ISO date string.
   * @returns {string} The formatted date.
   */
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

  /* ── Render summary ───────────────────────────────── */
  /**
   * Renders the reviews summary with total review count.
   * @param {Array} reviews - Array of review objects.
   */
  function renderSummary(reviews) {
    const el = document.getElementById('reviewsSummary');
    if (!el) return;
    const count = reviews.length;
    el.innerHTML = `<div class="reviews-summary">` +
      `<div class="total-reviews">(${count} reviews)</div>` +
    `</div>`;
  }

  /* ── Render review list ────────────────────────────────────────── */
  /**
   * Renders the list of reviews.
   * @param {Array} reviews - Array of review objects.
   * @param {string} sort - The sort order ('newest').
   */
  function renderList(reviews) {
    const el = document.getElementById('reviewsList');
    if (!el) return;
    if (!reviews.length) {
      el.innerHTML = '<p class="reviews-empty">No reviews yet — be the first to share your thoughts!</p>';
      return;
    }
    let sorted = reviews.slice();
    // Sort by newest only
    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    el.innerHTML = sorted.map(r => {
      const user = escapeHtml(r.author || 'Anonymous');
      const verified = r.verified ? '<span class="review-verified">✔ Verified purchase</span>' : '';
      return `<article class="review-card">` +
        `<div class="review-card__head">` +
          `<div class="review-card__meta">` +
            `<span class="review-author">${user}</span>` +
            verified +
          `</div>` +
          `<div class="review-card__right">` +
            `<span class="review-date">${formatDate(r.createdAt)}</span>` +
          `</div>` +
        `</div>` +
        (r.title ? `<p class="review-title">${escapeHtml(r.title)}</p>` : '') +
        `<p class="review-body">${escapeHtml(r.body)}</p>` +
      `</article>`;
    }).join('');
  }

  /* ── Form: render & handle submit ──────────────────────────────── */
  /**
   * Renders the review form and handles submission.
   * @param {string} productId - The product ID.
   * @param {Function} onSuccess - Callback function on successful submission.
   */
  function renderForm(productId, onSuccess) {
    const wrap = document.getElementById('reviewFormWrap');
    if (!wrap) return;

    const user = currentUser();

    wrap.innerHTML = `<h3 class="reviews-form-title">Write a review</h3>` +
      `<div class="review-form">` +
        `<div class="review-form__field">` +
          `<label for="revName">Name</label>` +
          `<input type="text" id="revName" placeholder="Your name" value="${user && user.name ? escapeHtml(user.name) : ''}" autocomplete="name">` +
        `</div>` +
        `<div class="review-form__field">` +
          `<label for="revTitle">Review title</label>` +
          `<input type="text" id="revTitle" placeholder="Sum it up in a sentence…" maxlength="120">` +
        `</div>` +
        `<div class="review-form__field">` +
          `<label for="revBody">Your review <span aria-hidden="true">*</span></label>` +
          `<textarea id="revBody" rows="4" placeholder="What did you think of the scent, longevity, sillage…?" maxlength="1200"></textarea>` +
        `</div>` +
        `<p id="revError" class="review-form__error" aria-live="polite"></p>` +
        `<button type="button" id="revSubmit" class="btn-review-submit">Post review</button>` +
      `</div>`;

    document.getElementById('revSubmit').addEventListener('click', () => {
      const body = (document.getElementById('revBody').value || '').trim();
      const errEl = document.getElementById('revError');

      if (!body) {
        errEl.textContent = 'Please write your review before posting.';
        return;
      }

      errEl.textContent = '';

      const u = currentUser();
      const review = {
        id: 'rev-' + Date.now(),
        productId: productId,
        title: (document.getElementById('revTitle').value || '').trim(),
        body: body,
        author: (document.getElementById('revName').value || '').trim() || (u && u.name) || 'Anonymous',
        verified: !!(u && u.email),
        createdAt: new Date().toISOString(),
      };

      saveReview(productId, review);
      onSuccess();

      wrap.innerHTML = `<div class="review-thanks"><span class="review-thanks-icon">✔</span>` +
        `<p>Thank you for your review!</p></div>`;
    });
  }

  /* ── Main init ─────────────────────────────────────────────────── */
  /**
   * Initializes the reviews system for a product.
   * @param {string} productId - The product ID.
   */
  function initReviews(productId) {
    if (!productId) return;

    function refresh() {
      const reviews = getProductReviews(productId);
      renderSummary(reviews);
      renderList(reviews);
    }

    refresh();
    renderForm(productId, refresh);
  }

  /* ── Expose & auto-boot ────────────────────────────────────────── */
  window.noirInitReviews = initReviews;

  document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('reviewsSection');
    if (!section) return;
    const pid = section.getAttribute('data-product-id');
    if (pid) initReviews(pid);
  });
})();