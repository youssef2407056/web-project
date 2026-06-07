require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const Product = require("./models/Product");

/** 30 products — same order as storefront SHOP_ROWS (index 0–29). */
const products = [
  { name: "The Scent Hugo", brand: "boss", category: "unisex", description: "Unisex Eau de Parfum", price: 1240, stock: 30, image: "/User/Images/Boss.unisex.jpeg",  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]},
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "Nicarage", brand: "boss", category: "unisex", description: "Unisex Eau de Parfum", price: 680, stock: 30, image: "/User/Images/Boss3.unisex.jpeg", scentNotes: {
    top: ["Citrus", "Ginger"],
    heart: ["Jasmine", "Rose"],
    base: ["Vanilla", "Musk"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "Vanilla", brand: "boss", category: "unisex", description: "Unisex Eau de Parfum", price: 1580, stock: 30, image: "/User/Images/Boss2.unisex.jpeg", scentNotes: {
    top: ["Vanilla", "Caramel"],
    heart: ["Musk", "Patchouli"],
    base: ["Sandalwood", "Amber"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "Intense Eau De Parfume", brand: "boss", category: "unisex", description: "Unisex Eau de Parfum", price: 920, stock: 30, image: "/User/Images/Boss44.unisex.jpeg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "Lucky Christian Dior", brand: "dior", category: "unisex", description: "Unisex Eau de Parfum", price: 1890, stock: 30, image: "/User/Images/luky.unisex.jpeg", scentNotes: {
    top: ["Citrus", "Grapefruit"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "New Look Christian Dior", brand: "dior", category: "unisex", description: "Unisex Eau de Parfum", price: 540, stock: 30, image: "/User/Images/Doir.jpg",  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "Dioriviera Christian Dior", brand: "dior", category: "unisex", description: "Unisex Eau de Parfum", price: 1420, stock: 30, image: "/User/Images/diorevaa.unisex.jpeg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "GIRE PERSUM Chanel", brand: "chanel", category: "unisex", description: "Unisex Eau de Parfum", price: 1730, stock: 30, image: "/User/Images/channel1.unisex.jpeg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "N°5 Chanel", brand: "chanel", category: "unisex", description: "Unisex Eau de Parfum", price: 610, stock: 30, image: "/User/Images/channel2.unisex.jpeg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "COCO Mademoiselle Chanel", brand: "chanel", category: "unisex", description: "Unisex Eau de Parfum", price: 1950, stock: 30, image: "/User/Images/channal3.unisex.jpeg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "El Mejor Perfume Boss", brand: "boss", category: "women", description: "Women Eau de Parfum", price: 880, stock: 30, image: "/User/Images/boss1.forwomen.jpg",   scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "Boss The Scent Elixir for Her", brand: "boss", category: "women", description: "Women Eau de Parfum", price: 1320, stock: 30, image: "/User/Images/boss2.forwomen.jpg",  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "MA VIE pour Femme Boss", brand: "boss", category: "women", description: "Women Eau de Parfum", price: 1150, stock: 30, image: "/User/Images/boss3.forwomen.jpg", scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "Miss Dior Blooming Bouquet", brand: "dior", category: "women", description: "Women Eau de Parfum", price: 1640, stock: 30, image: "/User/Images/dior1forwomen.jpg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "Eau de Parfum Jasmin & Peach", brand: "dior", category: "women", description: "Women Eau de Parfum", price: 720, stock: 30, image: "/User/Images/dior222forwemen.jpg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "Hypnotic Poison Dior", brand: "dior", category: "women", description: "Women Eau de Parfum", price: 1490, stock: 30, image: "/User/Images/dior3forwomen.jpg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "EAU Splendide Chanel", brand: "chanel", category: "women", description: "Women Eau de Parfum", price: 1080, stock: 30, image: "/User/Images/chanel1forwomen.jpg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "GABRIELLE Chanel", brand: "chanel", category: "women", description: "Women Eau de Parfum", price: 1810, stock: 30, image: "/User/Images/chanel2forwomen.jpg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "COCO Noir Chanel", brand: "chanel", category: "women", description: "Women Eau de Parfum", price: 950, stock: 30, image: "/User/Images/chanel3forwomen.jpg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "N°19 Chanel", brand: "chanel", category: "women", description: "Women Eau de Parfum", price: 2000, stock: 30, image: "/User/Images/chanel4forwomen.jpg", scentNotes: {
    top: ["Citrus", "Bergamot"],
    heart: ["Jasmine", "Rose"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "SELECTION", brand: "boss", category: "men", description: "Men Eau de Parfum", price: 1190, stock: 30, image: "/User/Images/boss1.men.jpg" ,  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "BOSS Bottled Elixir", brand: "boss", category: "men", description: "Men Eau de Parfum", price: 1360, stock: 30, image: "/User/Images/Boss2.men.jpg",  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "Bottled Absolu", brand: "boss", category: "men", description: "Men Eau de Parfum", price: 1740, stock: 30, image: "/User/Images/Boss3.men.jpg" ,  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
    { name: "Platinum Égoïste", brand: "chanel", category: "men", description: "Men Eau de Parfum", price: 890, stock: 30, image: "/User/Images/channel.men.jpg" ,  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "Allure Homme Sport", brand: "chanel", category: "men", description: "Men Eau de Parfum", price: 1270, stock: 30, image: "/User/Images/channel1.men.jpg",  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] },
  { name: "Bleu de Chanel", brand: "chanel", category: "men", description: "Men Eau de Parfum", price: 1540, stock: 30, image: "/User/Images/channel2.men.jpg",  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "Blos D'ARGANT", brand: "dior", category: "men", description: "Men Eau de Parfum", price: 1050, stock: 30, image: "/User/Images/Dior1.men.jpg",  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "Fahrenhein", brand: "dior", category: "men", description: "Men Eau de Parfum", price: 1920, stock: 30, image: "/User/Images/Dior2.men.jpg" ,  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "Dior HOMME", brand: "dior", category: "men", description: "Men Eau de Parfum", price: 660, stock: 30, image: "/User/Images/Dior3.men.jpg",  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  } ,
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}]},
  { name: "Dior Sauvage", brand: "dior", category: "men", description: "Men Eau de Parfum", price: 1410, stock: 30, image: "/User/Images/Dior4.men.jpg",  scentNotes: {
    top: ["Ginger", "Cardamom"],
    heart: ["Freesia", "Iris"],
    base: ["Sandalwood", "Patchouli"]
  },
    sizes: [{ml: 30,price: 521,stock: 15,inStock: true},{ml: 50,price: 843,stock: 10,inStock: true},{ ml: 100, price: 1240,stock: 5,inStock: true}] }
];

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await Product.deleteMany({});
    console.log("Cleared old products");
    const inserted = await Product.insertMany(products);
    console.log("Inserted " + inserted.length + " products successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
