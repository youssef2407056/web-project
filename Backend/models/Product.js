const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    brand: {
      type: String,
      required: [true, "Brand is required"],
      lowercase: true,
      trim: true,
      enum: ["boss", "chanel", "dior"]
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      lowercase: true,
      trim: true,
      enum: ["men", "women", "unisex"]
    },

    stock: {
     type: Number,
     default: 0,
     min: 0
    },

    image: {
      type: String,
      required: [true, "Product image is required"],
      trim: true
    },

    sizeMl: {
      type: Number,
      min: [1, "Size must be valid"]
    },

    sizes: [
      {
        ml: {
          type: Number,
          min: 1
        },
        price: {
          type: Number,
          min: 0
        },
        stock: {
          type: Number,
          min: 0,
          default: 0
        },
        inStock: {
          type: Boolean,
          default: true
        }
      }
    ],

    scentNotes: {
  top: [String],
  heart: [String],
  base: [String]
}
    ,

    isFeatured: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
    type: Boolean,
    default: false
    },

    isHidden: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);
