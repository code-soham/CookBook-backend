const express = require("express");
require("dotenv").config();
require("./db/dbconfig");
var cors = require("cors");
const bcrypt = require("bcrypt");
const User = require("./models/user");
const Recipe = require("./models/recipe");
const Image = require("./models/image");
const saltRounds = 10;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.get("/", (req, res) => {
  res.send("CookBook Backend");
});
//auth
app.post("/auth", (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        res.status(400).json({ message: "User not found" });
      } else {
        bcrypt.compare(password, user.password, (err, result) => {
          if (result) {
            res.status(200).json({ message: "User authenticated" });
          } else {
            res.status(400).json({ message: "Incorrect password" });
          }
        });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Internal server error" });
    });
});
//register
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const old = await User.findOne({ email: email });
  if (!old) {
    const hash = bcrypt.hashSync(password, saltRounds);
    const user = new User({
      name: username,
      password: hash,
      email: email,
    });
    user
      .save()
      .then((user) => {
        res.status(200).json({ message: "User created" });
      })
      .catch((err) => {
        res.status(500).json({ message: "Internal server error" });
      });
  } else {
    res.status(400).json({ message: "User already exists" });
  }
});
//add Image to DB
app.post("/addImage", async (req, res) => {
  const { image } = req.body;
  const imageData = new Image({
    image: image,
  });
  imageData

    .save()
    .then((image) => {
      res.status(200).json({ message: "Image added", id: image._id });
    })
    .catch((err) => {
      res.status(500).json({ message: "Internal server error",err });
    });
});
//add new recipe
app.post("/addRecipe", async (req, res) => {
  const { name, ingredients, steps, images, userId } = req.body;
  const recipe = new Recipe({
    name: name,
    ingredients: ingredients,
    steps: steps,
    images: images,
    userId: userId,
  });
  recipe
    .save()
    .then((recipe) => {
      res.status(200).json({ message: "Recipe created" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Internal server error", err });
    });
});
//save edited recipe
app.post("/editRecipe", async (req, res) => {
  const { name, ingredients, steps, images, id } = req.body;
  const recipe = await Recipe.findOne({ _id: id });
  if (recipe) {
    recipe.name = name;
    recipe.ingredients = ingredients;
    recipe.steps = steps;
    recipe.images = images;
    recipe
      .save()
      .then((recipe) => {
        res.status(200).json({ message: "Recipe edited" });
      })
      .catch((err) => {
        res.status(500).json({ message: "Internal server error", err });
      });
  } else {
    res.status(400).json({ message: "Recipe not found" });
  }
});

app.post("/fetchList", async (req, res) => {
  const list = await Recipe.find({
    $text: { $search: req.body.search },
  })
    .then((list) => {
      res.status(200).json(list);
    })
    .catch((err) => {
      res.status(500).json({ message: "Internal server error", err });
    });
});
app.post("/fetchImage", async (req, res) => {
  const { id } = req.body;
  Image.findById(id)
    .then((data) => {
      res.status(200).json({ message: "Recipe fetched", data });
    })
    .catch((err) => {
      res.status(500).json({ message: "Internal server error", err });
    });
});
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
