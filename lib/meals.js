import sql from "better-sqlite3";
import slugify from "slugify";
import xss from "xss";
import fs from "node:fs";
import { uploadImage } from "./cloudinary";

const db = sql("meals.db");

export async function getMeals() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  // throw new Error("Failed to fetch meals");
  const meals = db.prepare("SELECT * FROM meals").all();
  return meals;
}

export function getMeal(slug) {
  const meal = db.prepare("SELECT * FROM meals WHERE slug = ?").get(slug);
  return meal;
}

export async function saveMeal(meal) {
  meal.slug = slugify(meal.title, { lower: true });
  meal.instructions = xss(meal.instructions);

  const extension = meal.image.name.split(".").pop();
  const fileName = `${meal.slug}_${Math.floor(
    Math.random() * 100
  )}.${extension}`;

  let imageUrl;

  try {
    imageUrl = await uploadImage(meal.image);
  } catch (error) {
    throw new Error(
      "Image upload failed, meal was not shared. Please try again later."
    );
  }

  meal.image = imageUrl;

  db.prepare(
    `
    INSERT INTO meals
    (title, summary, instructions, creator, creator_email, image, slug)
    VALUES (
      @title,
      @summary,
      @instructions,
      @creator,
      @creator_email,
      @image,
      @slug
    )
    `
  ).run(meal);
}

export function deleteMeal(slug) {
  // Fetch the meal to get its image path
  const meal = db.prepare("SELECT * FROM meals WHERE slug = ?").get(slug);

  if (!meal) {
    throw new Error("Meal not found");
  }

  // Delete the image file
  const imagePath = `public${meal.image}`;
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }

  // Delete the meal from the database
  db.prepare("DELETE FROM meals WHERE slug = ?").run(slug);
}
