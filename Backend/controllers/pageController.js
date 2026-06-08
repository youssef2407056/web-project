exports.getHome = (req, res) => {
  res.render("pages/home", {
    title: "Noir Perfume · Niche Fragrance",
    activePage: "home",
    bodyClass: "page-home"
  });
};

exports.getAbout = (req, res) => {
  res.render("pages/about", {
    title: "About us · Noir Perfume",
    activePage: "about"
  });
};

exports.getContact = (req, res) => {
  res.render("pages/contact", {
    title: "Contact us · Noir Perfume",
    activePage: "contact"
  });
};

exports.getShop = (req, res) => {
  const { category, brand } = req.query;

  const selectedBrand = brand ? brand.toLowerCase() : "";
  const selectedCategory = category ? category.toLowerCase() : "shopall";

  const brandLabels = {
    chanel: "Chanel",
    dior: "Dior",
    boss: "Hugo Boss"
  };

  let pageTitle = "Noir Perfume · All Products";

  if (selectedBrand) {
    pageTitle = `Noir Perfume · ${brandLabels[selectedBrand] || selectedBrand}`;
  } else if (selectedCategory && selectedCategory !== "shopall" && selectedCategory !== "all") {
    pageTitle = `Noir Perfume · ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Collection`;
  }

  res.render("pages/shop", {
    title: pageTitle,
    pageTitle,
    activePage: "shop",
    selectedCategory,
    selectedBrand,
    selectedBrandLabel: brandLabels[selectedBrand] || selectedBrand
  });
};
