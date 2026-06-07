const mongoose = require("mongoose");
const User = require("../models/User");

function favoritesToJson(user) {
  return (user.favorites || []).map(function (id) {
    return String(id);
  });
}

exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user.id).select("favorites");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({
      success: true,
      favorites: favoritesToJson(user)
    });
  } catch (err) {
    next(err);
  }
};

exports.syncFavorites = async (req, res, next) => {
  try {
    const incoming = Array.isArray(req.body.favorites) ? req.body.favorites : [];
    const valid = incoming.filter(function (id) {
      return mongoose.Types.ObjectId.isValid(String(id));
    });

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const merged = new Set(user.favorites.map(String));
    valid.forEach(function (id) {
      merged.add(String(id));
    });
    user.favorites = Array.from(merged);
    await user.save();

    res.json({
      success: true,
      favorites: favoritesToJson(user)
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleFavorite = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
      return res.status(400).json({ success: false, message: "Invalid product." });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const idStr = String(productId);
    const idx = user.favorites.findIndex(function (f) {
      return String(f) === idStr;
    });

    if (idx >= 0) {
      user.favorites.splice(idx, 1);
    } else {
      user.favorites.push(productId);
    }

    await user.save();
    res.json({
      success: true,
      added: idx < 0,
      favorites: favoritesToJson(user)
    });
  } catch (err) {
    next(err);
  }
};
