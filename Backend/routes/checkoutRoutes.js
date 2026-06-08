const express = require("express");
const router = express.Router();

const checkoutController = require("../controllers/checkoutController");
const { requireLogin } = require("../middleware/authMiddleware");

router.get("/", requireLogin, checkoutController.getCheckout);
router.post("/", requireLogin, checkoutController.placeOrder);
router.get("/thanks",requireLogin, checkoutController.getThanks);

module.exports = router;
