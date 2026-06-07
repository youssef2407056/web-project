const Order = require("../models/Order");
const Product = require("../models/Product");

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.session.user.id })
      .populate("products.product", "name price image")
      .sort({ createdAt: -1 });

    res.render("orders/my-orders", {
      title: "My Orders · Noir Perfume",
      activePage: "orders",
      orders
    });
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { products, shippingAddress, phone, paymentMethod, totalPrice } = req.body;

    if (!products || products.length === 0) {
      req.session.error = "Cart is empty.";
      return res.redirect("/checkout");
    }

    const order = await Order.create({
      user: req.session.user.id,
      products,
      shippingAddress,
      phone,
      paymentMethod: paymentMethod || "cash",
      totalPrice,
      status: "pending"
    });

    for (const item of products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -Number(item.quantity) }
      });
    }

    req.session.success = "Order placed successfully.";
    res.redirect("/checkout/thanks");
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    await Order.findByIdAndUpdate(req.params.id, { status }, { runValidators: true });

    req.session.success = "Order status updated.";
    res.redirect("/admin/orders");
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    await Order.findByIdAndDelete(req.params.id);

    req.session.success = "Order deleted.";
    res.redirect("/admin/orders");
  } catch (err) {
    next(err);
  }
};
