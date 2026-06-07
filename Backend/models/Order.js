const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order user is required"]
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"]
        }
      }
    ],

    lineItems: [
      {
        productId: { type: String, trim: true },
        name: { type: String, trim: true },
        price: { type: Number, min: 0 },
        quantity: { type: Number, min: 1, default: 1 },
        sizeMl: { type: String, trim: true },
        image: { type: String, trim: true },
        currency: { type: String, trim: true, default: "LE" }
      }
    ],

    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true
    },

    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true
    },

    shippingAddress: {
      type: String,
      required: [true, "Shipping address is required"],
      trim: true
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "visa"],
      default: "cash"
    },

    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"]
    },

    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending"
    },

    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ""
    },

    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);
