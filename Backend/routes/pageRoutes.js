const express = require("express");
const router = express.Router();

const pageController = require("../controllers/pageController");

router.get("/", pageController.getHome);

router.get("/about", pageController.getAbout);

router.get("/contact", pageController.getContact);

router.get("/shop", pageController.getShop);

module.exports = router;