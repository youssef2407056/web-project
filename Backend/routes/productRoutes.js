const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const { requireAdmin } = require("../middleware/authMiddleware");

router.get("/:id", productController.getProductDetails);

/* Admin product API (from backend CRUD) */
router.get("/", requireAdmin, productController.getAllProducts);
router.post("/", requireAdmin, productController.createProduct);
router.put("/:id", requireAdmin, productController.updateProduct);
router.delete("/:id", requireAdmin, productController.deleteProduct);

module.exports = router;