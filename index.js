const express = require("express");
require("dotenv").config();
require("./db/dbconfig");
var cors = require("cors");
const bcrypt = require("bcrypt");
const cloudinary = require("./utils/cloudinary");
const upload = require("./utils/multer");
const User = require("./models/user");
const Recipe = require("./models/recipe");
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
            res.status(200).json({ message: "User authenticated", uid: user });
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
//get my recipes
app.post("/myrecipes", async (req, res) => {
  const { uid } = req.body;
  const recipes = await Recipe.find({ userId: uid });
  res.status(200).json({ recipes: recipes });
});
app.post("/recipe", async (req, res) => {
  const { id } = req.body;
  const recipe = await Recipe.findById(id, function (err, recipe) {
    if (err) {
      res.status(500).json({ message: "Internal Server Error" });
      console.log(err);
    } else {
      res.status(200).json({ recipe });
    }
  });
});
//add Image to DB
app.post("/addImage", upload.single("image"), async (req, res) => {
  // console.log(req);
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    res.status(200).json({
      message: "Image uploaded",
      url: result.secure_url,
      cloudinary_id: result.public_id,
      version: result.version,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
    console.log(err);
  }
});
//remove Image from DB
app.post("/removeImage", async (req, res) => {
  const { cloudinary_id } = req.body;
  cloudinary.uploader.destroy(cloudinary_id, (err, result) => {
    if (err) {
      res.status(500).json({ message: "Internal server error" });
    } else {
      res.status(200).json({ message: "Image removed" });
    }
  });
});
//add new recipe
app.post("/addRecipe", async (req, res) => {
  const { name, ingredients,description, steps, images, userId } = req.body;
  const recipe = new Recipe({
    name: name,
    ingredients: ingredients,
    steps: steps,
    images: images,
    userId: userId,
    description: description,
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
  console.log(req.body)
  const { name, description, ingredients, steps, images, _id } = req.body;
  const recipe = await Recipe.findOne({ _id: _id });
  console.log(images)
  recipe.images=[];
  if (recipe !==null) {
    recipe.name = name;
    recipe.ingredients = ingredients;
    recipe.steps = steps;
    recipe.images = images;
    recipe.description = description;
    recipe
      .save()
      .then((recipe) => {
        res.status(200).json({ message: "Recipe edited", id:recipe._id });
      })
      .catch((err) => {
        console.log(err);
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
      console.log(list);
      res.status(200).json(list);
    })
    .catch((err) => {
      res.status(500).json({ message: "Internal server error", err });
    });
});
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
