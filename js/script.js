const startButton = document.getElementById("startBtn");
const dailyRecipeCard = document.getElementById("dailyRecipeCard");
const recipeDayTitle = document.getElementById("recipeDayTitle");
const recipeDayCopy = document.getElementById("recipeDayCopy");

function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
        return { emoji: "🌞", title: "Good Morning!", subtitle: "Ready to cook something delicious?" };
    }
    if (hour < 18) {
        return { emoji: "☀️", title: "Good Afternoon!", subtitle: "Let's prepare a tasty meal." };
    }
    return { emoji: "🌙", title: "Good Evening!", subtitle: "What's for dinner today?" };
}

function renderLandingGreeting() {
    const greeting = getTimeGreeting();
    const greetingElement = document.getElementById("landingGreeting");
    if (!greetingElement) return;

    greetingElement.innerHTML = `<strong>${greeting.emoji} ${greeting.title}</strong>${greeting.subtitle}`;
}

function parseJsonObject(text) {
    if (!text || typeof text !== "string") {
        return null;
    }

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || firstBrace > lastBrace) {
        return null;
    }

    const jsonString = text.slice(firstBrace, lastBrace + 1);
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return null;
    }
}

function getRandomFallbackDailyRecipe() {
    const fallbackRecipes = [
        {
            name: "Paneer Butter Masala",
            summary: "A rich and creamy classic with paneer and aromatic spices.",
            ingredients: ["paneer", "tomato", "cream", "onion", "garam masala"],
            estimatedTime: "40 mins",
            difficulty: "Medium",
            preparationTime: "15 mins",
            cookingTime: "25 mins",
            servings: "2-3"
        },
        {
            name: "Egg Tomato Bhurji",
            summary: "A spicy scrambled egg dish with tomato and garden herbs.",
            ingredients: ["egg", "tomato", "onion", "green chili", "coriander"],
            estimatedTime: "20 mins",
            difficulty: "Easy",
            preparationTime: "10 mins",
            cookingTime: "10 mins",
            servings: "2"
        },
        {
            name: "Veggie Fried Rice",
            summary: "A colorful rice dish loaded with vegetables and savory seasoning.",
            ingredients: ["rice", "carrot", "peas", "capsicum", "soy sauce"],
            estimatedTime: "30 mins",
            difficulty: "Easy",
            preparationTime: "12 mins",
            cookingTime: "18 mins",
            servings: "3"
        },
        {
            name: "Mushroom Masala",
            summary: "Earthy mushrooms cooked in a spiced tomato gravy.",
            ingredients: ["mushroom", "tomato", "onion", "ginger-garlic paste", "coriander"],
            estimatedTime: "35 mins",
            difficulty: "Medium",
            preparationTime: "12 mins",
            cookingTime: "23 mins",
            servings: "2-3"
        },
        {
            name: "Chicken Pepper Roast",
            summary: "A bold, peppery roast with tender chicken and warm spices.",
            ingredients: ["chicken", "black pepper", "onion", "ginger", "curry leaves"],
            estimatedTime: "45 mins",
            difficulty: "Medium",
            preparationTime: "15 mins",
            cookingTime: "30 mins",
            servings: "3"
        }
    ];

    const recipe = fallbackRecipes[Math.floor(Math.random() * fallbackRecipes.length)];
    return {
        ...recipe,
        mainIngredients: recipe.ingredients,
        quickBadge: parseInt(recipe.estimatedTime, 10) <= 25 ? "Quick Meal" : "",
        estimatedCost: "₹200",
        healthyBadges: ["Chef's Choice"]
    };
}

function renderDailyRecipe(recipe) {
    if (!recipe || !recipeDayTitle || !recipeDayCopy) return;

    recipeDayTitle.textContent = recipe.name || "Recipe of the Day";
    recipeDayCopy.textContent = recipe.summary || "Tap to explore the recipe & prep steps.";
    if (dailyRecipeCard) {
        dailyRecipeCard.dataset.recipe = encodeURIComponent(JSON.stringify(recipe));
        dailyRecipeCard.classList.add("clickable");
    }
}

async function loadDailyRecipe() {
    const todayKey = new Date().toISOString().slice(0, 10);
    const prompt = `You are a creative chef. Generate a single featured "Recipe of the Day" for today's date ${todayKey}. Assume common pantry staples like salt, oil, pepper, turmeric, and basic spices are available. Return only a JSON object with name, summary, ingredients, estimatedTime, difficulty, preparationTime, cookingTime, servings, and mainIngredients.`;
    const response = await callGemini(prompt);
    let recipe = parseJsonObject(response);

    if (!recipe || !recipe.name) {
        recipe = getRandomFallbackDailyRecipe();
    }

    return recipe;
}

function bindDailyRecipeCard() {
    if (!dailyRecipeCard) return;

    dailyRecipeCard.addEventListener("click", () => {
        const recipeData = dailyRecipeCard.dataset.recipe;
        if (!recipeData) return;

        try {
            const recipe = JSON.parse(decodeURIComponent(recipeData));
            saveSelectedRecipe(recipe);
            window.location.href = "recipe.html";
        } catch (error) {
            console.error("Could not save daily recipe:", error);
        }
    });

    dailyRecipeCard.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            dailyRecipeCard.click();
        }
    });
}

startButton.addEventListener("click", () => {
    window.location.href = "ingredients.html";
});

window.addEventListener("DOMContentLoaded", async () => {
    renderLandingGreeting();
    bindDailyRecipeCard();

    const dailyRecipe = await loadDailyRecipe();
    renderDailyRecipe(dailyRecipe);
});
