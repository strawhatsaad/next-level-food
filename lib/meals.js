import slugify from "slugify";
import xss from "xss";
import fs from "node:fs";
import { uploadImage } from "./cloudinary";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getMeals() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  // throw new Error("Failed to fetch meals");
  const meals = await prisma.meals.findMany();
  return meals;
}

export async function getMeal(slug) {
  try {
    console.log("Fetching meal with slug:", slug);
    const meal = await prisma.meals.findUnique({
      where: { slug },
    });

    if (!meal) {
      console.error("❌ Meal not found for slug:", slug);
    }

    return meal;
  } catch (error) {
    console.error("🔥 Error fetching meal:", error);
    return null;
  }
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

  const newMeal = await prisma.meals.create({
    data: {
      title: meal.title,
      summary: meal.summary,
      instructions: meal.instructions,
      creator: meal.creator,
      creator_email: meal.creator_email,
      image: meal.image,
      slug: meal.slug,
    },
  });

  console.log(newMeal);
}

export async function deleteMeal(slug) {
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
  const deleteMeal = await prisma.meals.delete({
    where: {
      slug: slug,
    },
  });
}
