document.addEventListener('DOMContentLoaded', function () {
  var navbar = document.querySelector('.page-contact .navbar');
  function updateNavbarOnScroll() {
    if (!navbar) return;
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }

  window.addEventListener('scroll', updateNavbarOnScroll);
  updateNavbarOnScroll();

 
});
