function parseResponseText(responseJson) {
    if (!responseJson || !responseJson.output) {
        return null;
    }

    try {
        const outputSegments = responseJson.output
            .flatMap((entry) => entry.content || [])
            .map((contentSegment) => contentSegment.text || "")
            .filter(Boolean);

        return outputSegments.join(" ").trim();
    } catch (error) {
        return null;
    }
}

let geminiRequestInFlight = false;
let lastGeminiError = null;

function clearLastGeminiError() {
    lastGeminiError = null;
}

function getLastGeminiError() {
    return lastGeminiError;
}

async function callGemini(prompt) {
    const baseUrl = typeof API_BASE_URL !== "undefined" ? API_BASE_URL.replace(/\/$/, "") : "";
    const endpoint = `${baseUrl}/api/ai/generate`;

    if (geminiRequestInFlight) {
        console.warn("[Gemini] Skipping duplicate request because one request is already in progress.");
        return null;
    }

    geminiRequestInFlight = true;
    clearLastGeminiError();

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt,
                stream: false
            })
        });

        const responseBody = await response.json().catch(() => ({}));

        if (!response.ok) {
            const backendMessage = responseBody?.detail || "Unknown backend error";
            lastGeminiError = {
                status: response.status,
                detail: backendMessage
            };
            console.error(`[Gemini][Frontend] Backend responded with HTTP ${response.status}: ${backendMessage}`);
            return null;
        }

        const json = responseBody;
        return json.response || null;
    } catch (error) {
        lastGeminiError = {
            status: 500,
            detail: error?.message || "Request failed"
        };
        console.error("[Gemini][Frontend] Request failed:", error);
        return null;
    } finally {
        geminiRequestInFlight = false;
    }
}

async function loadLocalRecipes() {
    try {
        const response = await fetch("data/sampleRecipes.json");
        return await response.json();
    } catch (error) {
        return [];
    }
}

async function loadLocalRecipeDetail(recipeName) {
    const recipes = await loadLocalRecipes();
    return recipes.find((recipe) => recipe.name.toLowerCase() === recipeName.toLowerCase()) || null;
}

function capitalizeWord(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function estimateCost(ingredients) {
    const count = ingredients.length;
    let cost = 70 + count * 15;
    if (ingredients.some((item) => /paneer|chicken|fish|egg/i.test(item))) {
        cost += 30;
    }
    if (ingredients.some((item) => /rice|maggi|noodles/i.test(item))) {
        cost += 10;
    }
    return `₹${Math.round(cost / 10) * 10}`;
}

function buildHealthyBadges(ingredients) {
    const badges = [];
    const normalized = ingredients.map((item) => item.toLowerCase());

    if (normalized.some((item) => /egg|chicken|fish|paneer|tofu/.test(item))) {
        badges.push("High Protein");
    }
    if (normalized.some((item) => /spinach|corn|tomato|carrot|peas|mushroom/.test(item))) {
        badges.push("Rich in Fiber");
    }
    if (!normalized.some((item) => /cream|butter|cheese/.test(item))) {
        badges.push("Low Fat");
    }
    if (normalized.some((item) => /rice|maggi|noodles|bread|pasta/.test(item))) {
        badges.push("Energy Rich");
    }
    return badges.length ? badges : ["Balanced Choice"];
}

function buildHealthAssessment(ingredients) {
    const normalized = ingredients.map((item) => item.toLowerCase());
    const proteinItems = normalized.filter((item) => /egg|chicken|fish|paneer|tofu|lentil|beans/.test(item));
    const fiberItems = normalized.filter((item) => /spinach|corn|tomato|carrot|peas|mushroom|broccoli|cabbage|green/.test(item));
    const highFatItems = normalized.filter((item) => /butter|cream|cheese|oil|ghee|mayonnaise|mayo/.test(item));
    const highCarbItems = normalized.filter((item) => /rice|maggi|noodles|bread|pasta|potato|potatoes/.test(item));
    const processedItems = normalized.filter((item) => /maggi|instant|packaged|processed|sausage|salami/.test(item));
    const sugarItems = normalized.filter((item) => /sugar|honey|syrup|jaggery|chocolate/.test(item));

    const hasProtein = proteinItems.length > 0;
    const hasFiber = fiberItems.length > 0;
    const hasHighFat = highFatItems.length > 0;
    const hasHighCarb = highCarbItems.length > 0;
    const hasProcessed = processedItems.length > 0;
    const hasSugar = sugarItems.length > 0;

    let rating = "Good";
    let advice = "Can be consumed regularly as part of a balanced diet.";
    let impact = "Eating more than the limit may still cause digestive imbalance over time.";
    let summary = "A balanced recipe with good nutrition from your selected ingredients.";

    if (hasProcessed || hasSugar || (hasHighFat && hasHighCarb)) {
        rating = "Limited";
        advice = "Limit this recipe to once or twice a week.";
        impact = hasHighFat
            ? "Overeating this can raise cholesterol and increase the risk of weight gain."
            : hasHighCarb
            ? "Too much may spike blood sugar and cause bloating or fatigue."
            : "Excess consumption can stress digestion and reduce overall energy balance.";
        summary = `This recipe contains ${hasProcessed ? processedItems.join(", ") : hasSugar ? sugarItems.join(", ") : "rich ingredients"} and should be enjoyed occasionally.`;
    } else if (hasHighFat || hasHighCarb) {
        rating = "Moderate";
        advice = "Consume in moderation and balance with vegetables and lean protein.";
        impact = hasHighFat
            ? "More than the limit may add extra calories and unhealthy fat to your diet."
            : "Eating too much may contribute to blood sugar swings and sluggishness.";
        summary = `This recipe is ${hasHighFat ? "richer in fats" : "higher in carbohydrates"} and works best as part of a balanced meal.`;
    }

    if (hasProtein && hasFiber && !hasHighFat && !hasProcessed) {
        rating = "Good";
        advice = "This recipe can be enjoyed regularly, even multiple times a week.";
        impact = "If eaten in very large portions, it may still add extra calories, so portion control helps.";
        summary = `This is a strong choice because it combines ${proteinItems.join(", ")} with ${fiberItems.join(", ")} for protein and fiber. ` +
            (highCarbItems.length ? `It also includes ${highCarbItems.join(", ")} for energy.` : "");
    }

    if (!hasProtein && !hasFiber && (hasHighCarb || hasHighFat || hasProcessed || hasSugar)) {
        rating = "Limited";
        advice = "Consider pairing this dish with more vegetables or lean protein.";
        impact = "Frequent consumption may contribute to energy imbalance and digestive strain.";
        summary = "This recipe is heavier on carbs and fats without enough fiber or protein for balance.";
    }

    return {
        healthRating: rating,
        healthSummary: summary,
        consumptionAdvice: advice,
        overLimitEffects: impact
    };
}

function buildNutritionValues(ingredients) {
    const normalized = ingredients.map((item) => item.toLowerCase());
    let calories = 240;
    let protein = 8;
    let carbs = 28;
    let fat = 12;

    if (normalized.some((item) => /egg|chicken|fish|paneer|tofu|lentil|beans/.test(item))) {
        protein += 10;
        calories += 120;
    }
    if (normalized.some((item) => /rice|maggi|noodles|bread|pasta|potato|potatoes/.test(item))) {
        carbs += 22;
        calories += 100;
    }
    if (normalized.some((item) => /butter|cream|cheese|oil|ghee/.test(item))) {
        fat += 10;
        calories += 90;
    }
    if (normalized.some((item) => /sugar|honey|syrup|chocolate/.test(item))) {
        carbs += 12;
        calories += 60;
    }
    if (normalized.some((item) => /spinach|corn|tomato|carrot|peas|mushroom|broccoli|cabbage|green/.test(item))) {
        calories += 20;
        carbs += 6;
    }

    return {
        Calories: `${Math.round(calories / 5) * 5} kcal`,
        Protein: `${Math.round(protein)}g`,
        Carbs: `${Math.round(carbs)}g`,
        Fat: `${Math.round(fat)}g`
    };
}

function buildFunFact(recipeName, ingredients) {
    const facts = [
        `Did you know? ${recipeName} can be made more flavorful with a pinch of roasted cumin powder.`,
        `Fun fact: Balancing acidity and spice is the secret to delicious ${recipeName}.`,
        `Did you know? Fresh herbs boost the aroma of ${recipeName} instantly.`,
        `Fun fact: A dash of lemon or yogurt brightens every ${recipeName}.`
    ];
    return facts[Math.floor(Math.random() * facts.length)];
}

function buildQuote() {
    const quotes = [
        "Cooking is an art, and every meal tells a story.",
        "A good recipe is the best form of comfort.",
        "Every ingredient has a voice in the kitchen.",
        "Great meals come from great memories and bold flavors."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}



function getRecipeImageUrl(recipeName) {
    const seed = recipeName.replace(/\s+/g, '-').toLowerCase();
    return `https://picsum.photos/seed/${seed}/900/600`;
}

function buildImageQuery(recipeName, ingredients) {
    return `Search query: ${recipeName} with ${ingredients.join(", ")}`;
}

function formatDifficultyBadge(difficulty) {
    const normalized = difficulty ? difficulty.toLowerCase() : "easy";
    if (normalized.includes("medium")) return `<span class="badge medium">🟠 Medium</span>`;
    if (normalized.includes("hard")) return `<span class="badge hard">🔴 Hard</span>`;
    return `<span class="badge easy">🟢 Easy</span>`;
}

function formatHealthRatingBadge(rating) {
    const normalized = rating ? rating.toLowerCase() : "moderate";
    if (normalized === "good") return `<span class="badge health-good">💚 Good</span>`;
    if (normalized === "limited") return `<span class="badge health-limited">⚠️ Limited</span>`;
    return `<span class="badge health-moderate">🟡 Moderate</span>`;
}

function buildRecipeSteps(name, ingredients) {
    const ingredientList = ingredients.map((item) => item.trim()).filter(Boolean);
    const firstItems = ingredientList.slice(0, 3).join(", ");
    const lowerName = name.toLowerCase();

    if (lowerName.includes("coffee") || lowerName.includes("tea") || lowerName.includes("beverage") || lowerName.includes("milk") || lowerName.includes("drink") || lowerName.includes("shake") || lowerName.includes("latte")) {
        return [
            `Prepare ${firstItems} by measuring out the right amounts.`,
            `Heat milk or water to the desired temperature, being careful not to boil.`,
            `Mix in the main ingredients and stir gently to combine.`,
            `Serve warm or chilled immediately and enjoy.`
        ];
    }

    if (lowerName.includes("stir fry") || lowerName.includes("stir-fry")) {
        return [
            `Heat oil in a hot pan and stir-fry ${firstItems} with aromatics until fragrant.`,
            `Add softer ingredients and sauces, tossing quickly to keep the texture crisp.`,
            `Season the mixture with spices and a splash of liquid to create a glossy finish.`,
            `Serve immediately to preserve the vibrant colors and texture.`
        ];
    }

    if (lowerName.includes("grilled") || lowerName.includes("roast")) {
        return [
            `Marinate ${firstItems} with spices and oil to allow the flavors to soak in.`,
            `Preheat the pan or oven and sear until the edges caramelize beautifully.`,
            `Finish cooking over moderate heat until tender inside.`,
            `Rest briefly before serving to let the juices settle.`
        ];
    }

    if (lowerName.includes("soup") || lowerName.includes("stew")) {
        return [
            `Sauté the base ingredients until they release their aroma and soften.`,
            `Add liquid and simmer gently to develop a rich broth.`,
            `Stir in the remaining ingredients until tender and infused.`,
            `Serve hot with a drizzle of oil or fresh herbs.`
        ];
    }

    if (lowerName.includes("scramble") || lowerName.includes("delight")) {
        return [
            `Prepare ${firstItems} and chop them into bite-sized pieces.`,
            `Cook the ingredients gently in a skillet until they soften.`,
            `Mix in eggs or binding ingredients and stir until just set.`,
            `Plate while still moist and enjoy right away.`
        ];
    }

    if (lowerName.includes("curry") || lowerName.includes("masala")) {
        return [
            `Sear ${firstItems} in oil, then add onions, tomatoes and spices to build a rich base.`,
            `Simmer until the sauce thickens and the flavors meld together.`,
            `Add the main ingredients and cook until fully coated and tender.`,
            `Finish with fresh herbs and serve with rice or bread.`
        ];
    }

    return [
        `Prepare ${firstItems} and gently sauté with spices to release their aromas.`,
        `Cook the ingredients in stages so each one retains good texture.`,
        `Combine everything and simmer briefly while stirring carefully.`,
        `Plate the finished dish and enjoy it while it is warm and fragrant.`
    ];
}

function buildChefTips(name, ingredients) {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("coffee") || lowerName.includes("tea") || lowerName.includes("beverage") || lowerName.includes("milk") || lowerName.includes("drink") || lowerName.includes("shake") || lowerName.includes("latte")) {
        return [
            "Use fresh ingredients for the best flavor.",
            "Heat milk gently without boiling to preserve its creamy texture.",
            "Serve immediately while the beverage is at its perfect temperature."
        ];
    }

    if (lowerName.includes("stir fry") || lowerName.includes("stir-fry")) {
        return [
            "Keep the pan hot and stir constantly so ingredients cook quickly.",
            "Use a splash of sauce or stock for a silky finish.",
            "Serve immediately to preserve the crisp texture."
        ];
    }

    if (lowerName.includes("grilled") || lowerName.includes("roast")) {
        return [
            "Marinating ahead enhances the flavor dramatically.",
            "Avoid overcrowding the pan to get a good sear.",
            "Let the cooked food rest before slicing for juiciness."
        ];
    }

    if (lowerName.includes("soup") || lowerName.includes("stew")) {
        return [
            "Simmer gently so the flavors develop without breaking down the ingredients.",
            "Add fresh herbs near the end for brightness.",
            "A squeeze of lemon can lift the final taste."
        ];
    }

    if (lowerName.includes("scramble") || lowerName.includes("delight")) {
        return [
            "Cook on medium heat so the mixture stays tender.",
            "Keep stirring lightly to avoid sticking or burning.",
            "Season at the end so the flavors remain fresh."
        ];
    }

    if (lowerName.includes("curry") || lowerName.includes("masala")) {
        return [
            "Toast spices lightly to bring out their deepest aroma.",
            "Add acid like lemon juice or yogurt to balance richness.",
            "Let the curry rest for a few minutes before serving."
        ];
    }

    return [
        "Taste as you cook to keep the seasoning balanced.",
        "Adjust the heat carefully to prevent overcooking.",
        "Add a final garnish of fresh herbs or citrus for a bright finish."
    ];
}

function createFallbackRecipe(name, summary, ingredients, difficulty = "Easy", estimatedTime = "30 mins", preparationTime = "10 mins", cookingTime = "20 mins", servings = "2-4") {
    const healthRatings = buildHealthyBadges(ingredients);
    const quickFlag = parseInt(estimatedTime, 10) <= 25 ? "Quick Meal" : "";

    return {
        name,
        summary,
        ingredients,
        mainIngredients: ingredients,
        difficulty,
        estimatedTime,
        preparationTime,
        cookingTime,
        servings,
        estimatedCost: estimateCost(ingredients),
        healthyBadges: healthRatings,
        quickBadge: quickFlag,
        imageQuery: buildImageQuery(name, ingredients),
        ...buildHealthAssessment(ingredients),
        funFact: buildFunFact(name, ingredients),
        quote: buildQuote(),
        steps: buildRecipeSteps(name, ingredients),
        chefTips: buildChefTips(name, ingredients),
        nutrition: buildNutritionValues(ingredients)
    };
}

function formatIngredientsChips(ingredients) {
    return ingredients
        .filter((item) => item)
        .map((item) => `<span class="chip">${item}</span>`)
        .join("");
}

function buildRecipeHtml(recipe) {
    const chipsHtml = formatIngredientsChips(recipe.ingredients || []);
    const difficultyBadge = formatDifficultyBadge(recipe.difficulty || "Easy");
    const healthRatingBadge = formatHealthRatingBadge(recipe.healthRating || "Moderate");
    const healthyBadgesHtml = (recipe.healthyBadges || []).map((badge) => `<span class="badge">🥗 ${badge}</span>`).join("");
    const quickBadgeHtml = recipe.quickBadge ? `<span class="badge">⚡ ${recipe.quickBadge}</span>` : "";
    const nutritionHtml = [
        { label: "Calories", value: recipe.nutrition?.Calories },
        { label: "Protein", value: recipe.nutrition?.Protein },
        { label: "Carbs", value: recipe.nutrition?.Carbs },
        { label: "Fat", value: recipe.nutrition?.Fat }
    ]
        .filter((item) => item.value)
        .map((item) => `<div class="nutrition-card"><h4>${item.label}</h4><p>${item.value}</p></div>`)
        .join("");

    return `
        <div class="recipe-hero">
            <div>
                <div class="recipe-title">${recipe.name}</div>
                <p class="recipe-summary">${recipe.summary || "A delicious recipe crafted for your ingredients."}</p>
                <div class="badge-row">
                    ${difficultyBadge}
                    ${healthRatingBadge}
                    ${healthyBadgesHtml}
                    ${quickBadgeHtml}
                </div>
                <div class="recipe-actions">
                    <button id="copyRecipeBtn" class="button-primary">📋 Copy Recipe</button>
                    <button id="printRecipeBtn" class="button-secondary">🖨️ Print Recipe</button>
                </div>
                <div class="meta-grid">
                    <div class="meta-item"><h4>Preparation Time</h4><p>${recipe.preparationTime}</p></div>
                    <div class="meta-item"><h4>Cooking Time</h4><p>${recipe.cookingTime}</p></div>
                    <div class="meta-item"><h4>Servings</h4><p>${recipe.servings}</p></div>
                    <div class="meta-item"><h4>Estimated Cost</h4><p>${recipe.estimatedCost}</p></div>
                </div>
                <div class="chip-list">${chipsHtml}</div>
            </div>
        </div>
        <div class="recipe-body">
            <div class="feature-row">
                <div class="feature-card"><h4>💡 Smart Chef Tip</h4><ul>${recipe.chefTips.map((tip) => `<li>${tip}</li>`).join("")}</ul></div>
                <div class="feature-card"><h4>💡 Did You Know?</h4><p>${recipe.funFact}</p></div>
            </div>
            <div class="section">
                <h3>Ingredients</h3>
                <ul>${(recipe.ingredients || []).map((item) => `<li>${item}</li>`).join("")}</ul>
            </div>
            <div class="section">
                <h3>Cooking Steps</h3>
                <div class="step-grid">${(recipe.steps || []).map((step, index) => `
                    <div class="step-card">
                        <div class="step-detail">
                            <div class="step-number">Step ${index + 1}</div>
                            <p>${step}</p>
                        </div>
                    </div>
                `).join("")}</div>
            </div>
            <div class="section">
                <h3>Nutrition</h3>
                <div class="nutrition-grid">${nutritionHtml}</div>
            </div>
            <div class="info-card">
                <h4>🍎 Health Assessment</h4>
                <p>${recipe.healthSummary || "A balanced recipe based on your selected ingredients."}</p>
                <p><strong>Recipe rating:</strong> ${recipe.healthRating || "Moderate"}</p>
                <p><strong>Consumption advice:</strong> ${recipe.consumptionAdvice || "Consume in moderation."}</p>
                <p><strong>Overlimit warning:</strong> ${recipe.overLimitEffects || "Eating more than the recommended amount can impact your health."}</p>
            </div>
            <div class="info-card">
                <h4>🤖 AI Confidence</h4>
                <p>These recipe suggestions are based on the ingredients you provided and assume common pantry staples such as salt, oil, pepper, and turmeric.</p>
            </div>
            <div class="quote-card">
                <h4>🍽️ Cooking Quote</h4>
                <p>${recipe.quote}</p>
                <p style="margin-top:10px; font-size:0.95rem; opacity:0.8;">— ChefGen AI</p>
            </div>
        </div>
    `;
}

function parseJsonArray(text) {
    if (!text || typeof text !== "string") {
        return null;
    }

    const normalized = text.trim();
    const firstBracket = normalized.indexOf("[");
    const lastBracket = normalized.lastIndexOf("]");

    if (firstBracket === -1 || lastBracket === -1 || firstBracket > lastBracket) {
        return null;
    }

    const jsonString = normalized.slice(firstBracket, lastBracket + 1);

    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return null;
    }
}

function extractRecipesFromText(text) {
    const parsed = parseJsonArray(text);
    if (!Array.isArray(parsed)) {
        return [];
    }
    return parsed.map((item) => ({
        name: item.name || item.recipeName || item.title || "Untitled Recipe",
        estimatedTime: item.estimatedTime || item.time || "30 mins",
        difficulty: item.difficulty || item.level || "Medium",
        servings: item.servings || item.yield || "2-4",
        summary: item.summary || item.description || "A flavorful dish created from your ingredients.",
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        mainIngredients: Array.isArray(item.mainIngredients) ? item.mainIngredients : item.ingredients || [],
        preparationTime: item.preparationTime || item.prepTime || "15 mins",
        cookingTime: item.cookingTime || item.cookTime || "15 mins"
    }));
}

function findIngredientKeywords(ingredientList) {
    const normalized = ingredientList.map((item) => item.toLowerCase());
    const categories = [
        {keywords: ["fish", "prawn", "shrimps", "shrimp", "salmon", "tuna", "seafood"], tag: "Seafood"},
        {keywords: ["chicken", "turkey"], tag: "Chicken"},
        {keywords: ["egg", "eggs"], tag: "Egg"},
        {keywords: ["paneer", "tofu"], tag: "Paneer"},
        {keywords: ["potato", "potatoes", "aloo"], tag: "Potato"},
        {keywords: ["tomato", "tomatoes"], tag: "Tomato"},
        {keywords: ["rice", "rice"], tag: "Rice"},
        {keywords: ["maggie", "maggi", "noodles"], tag: "Noodles"}
    ];

    const category = categories.find((group) => group.keywords.some((keyword) => normalized.includes(keyword)));
    return category ? category.tag : null;
}

function buildCreativeRecipeNames(ingredientList, category) {
    const items = ingredientList.map((item) => item.trim()).filter(Boolean);
    const normalized = [...new Set(items.map((item) => item.toLowerCase()))];
    const main = capitalizeWord(normalized[0] || "Ingredient");
    const second = normalizeSecondItem(normalized);
    const third = normalizeThirdItem(normalized);
    const names = [];

    const strongProtein = normalized.find((item) => /chicken|egg|paneer|tofu|mushroom|fish|shrimp|prawn/.test(item));
    const strongProteinName = strongProtein ? capitalizeWord(strongProtein) : null;

    if (normalized.includes("maggi") && strongProteinName) {
        names.push(`${strongProteinName} Maggi Supreme`);
        names.push(`Spicy ${strongProteinName} Maggi Bowl`);
        names.push(`${strongProteinName} & Maggi Stir Fry`);
        names.push(`Cheesy ${strongProteinName} Maggi`);
        names.push(`${strongProteinName} Masala Maggi`);
    } else if (normalized.includes("maggi")) {
        names.push("Maggi Delight");
        if (normalized.includes("egg")) names.push("Egg Maggi Supreme");
        names.push(`Spicy ${second || main} Maggi`);
        names.push(`Cheesy ${main} Bowl`);
        names.push(`${third || second || main} Masala Maggi`);
    } else if (normalized.includes("egg") && normalized.includes("tomato")) {
        names.push("Egg Tomato Fiesta");
        names.push(`Egg ${second || "Supreme"} Supreme`);
        names.push(`Spicy ${main} Bhurji`);
        names.push(`${main} Toast Twist`);
        names.push(`${main} Curry Delight`);
    } else if (normalized.includes("paneer") && normalized.includes("capsicum")) {
        names.push("Kadai Paneer Fusion");
        names.push("Paneer Pepper Crunch");
        names.push(`Creamy ${main} Stir Fry`);
        names.push("Paneer Masala Feast");
        names.push("Garden Paneer Bowl");
    } else if (normalized.includes("chicken")) {
        names.push("Chicken Supreme");
        names.push("Spicy Chicken Roast");
        names.push("Chicken Masala Bowl");
        names.push("Herbed Chicken Fry");
        names.push(`Tomato ${main} Delight`);
    } else if (normalized.includes("rice")) {
        names.push("Veggie Fried Rice");
        names.push("Carrot Peas Pulao");
        names.push(`Spiced ${main} Bowl`);
        names.push(`Masala ${main}`);
        names.push("Rainbow Rice Fiesta");
    } else if (normalized.includes("mushroom")) {
        names.push("Mushroom Pepper Fry");
        names.push("Mushroom Capsicum Roast");
        names.push(`Creamy ${main} Masala`);
        names.push("Earthy Mushroom Stew");
        names.push("Garlic Mushroom Delight");
    } else if (normalized.includes("spinach")) {
        names.push(`Palak ${second || "Paneer"}`);
        names.push("Spinach Corn Curry");
        names.push("Creamy Spinach Bowl");
        names.push(`Green ${main} Fiesta`);
        names.push(`Corn ${second || "Paneer"} Masala`);
    } else if (normalized.includes("milk")) {
        if (normalized.includes("coffee") || normalized.includes("coffee seeds")) {
            names.push("Creamy Coffee");
            names.push("Milk Coffee");
            names.push("Iced Coffee Latte");
            names.push("Hot Coffee Delight");
            names.push("Smooth Milk Coffee");
        } else if (normalized.includes("tea") || normalized.includes("tea powder")) {
            names.push("Milk Tea");
            names.push("Creamy Black Tea");
            names.push("Hot Tea Latte");
            names.push("Chai Milk Blend");
            names.push("Smooth Tea Beverage");
        } else if (normalized.includes("boost") || normalized.includes("horlicks")) {
            names.push("Boost Milk");
            names.push("Horlicks Milk Shake");
            names.push("Nutritious Milk Drink");
            names.push("Energy Milk Beverage");
            names.push("Creamy Boost Drink");
        } else if (normalized.includes("sugar") || normalized.includes("jaggery")) {
            names.push("Sweet Milk Drink");
            names.push("Milk Kheer");
            names.push("Creamy Milk Pudding");
            names.push("Jaggery Milk");
            names.push("Condensed Milk Sweet");
        } else {
            names.push("Milk Beverage");
            names.push("Creamy Milk Drink");
            names.push("Milk Shake");
            names.push("Smooth Milk");
            names.push(`${main} Milk Drink`);
        }
    } else {
        names.push(`${main} Delight`);
        names.push(`${second || main} Supreme ${main}`);
        names.push(`Spicy ${main} ${second}`.trim());
        names.push(`Cheesy ${main} Bowl`);
        names.push(`${third || second || main} Masala ${main}`.trim());
    }

    return [...new Set(names)].slice(0, 5);
}

function normalizeSecondItem(normalized) {
    return normalized[1] ? capitalizeWord(normalized[1]) : "Veggie";
}

function normalizeThirdItem(normalized) {
    return normalized[2] ? capitalizeWord(normalized[2]) : "Spice";
}

function generateLocalRecipesFromIngredients(ingredientText) {
    const ingredientList = ingredientText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const primary = capitalizeWord(ingredientList[0] || "Ingredient");
    const category = findIngredientKeywords(ingredientList) || primary;
    const creativeNames = buildCreativeRecipeNames(ingredientList, category);

    const generated = creativeNames.map((name) => createFallbackRecipe(
        name,
        `A special ${name} recipe created with ${ingredientList.join(", ")} and pantry spices.`,
        ingredientList,
        category === "Chicken" || category === "Seafood" ? "Medium" : "Easy",
        category === "Rice" ? "35 mins" : "30 mins",
        "12 mins",
        category === "Grilled" ? "18 mins" : "20 mins",
        "2-4"
    ));

    return generated.slice(0, 5);
}

async function generateRecipes(ingredientText) {
    if (!ingredientText || !ingredientText.trim()) {
        return [];
    }

    const normalized = ingredientText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", ");

    if (!API_KEY) {
        return generateLocalRecipesFromIngredients(ingredientText);
    }

    const prompt = `You are a professional chef. Assume all common pantry ingredients are already available: salt, oil, pepper, turmeric, chili powder, garam masala, ginger-garlic paste, coriander powder, sugar, coffee powder, tea powder, jaggery, coffee seeds, boost, horlicks. Do NOT ask user for these items. Generate ONLY recipes using the provided ingredients. IMPORTANT: For drinks, beverages, teas, coffees, or sweet desserts - DO NOT add masala, garam masala, chili powder, or unnecessary spices. Only use cardamom as a light flavoring if appropriate. For masala tea, only include ginger and cardamom if user explicitly provided them. Keep beverages and sweets simple and clean. Return a JSON array with objects containing name, estimatedTime, difficulty, servings, ingredients, preparationTime, cookingTime, and summary. Do not include any explanation outside the JSON array. Provided ingredients: ${normalized}`;

    const responseText = await callGemini(prompt);
    if (!responseText) {
        return generateLocalRecipesFromIngredients(ingredientText);
    }

    const recipes = extractRecipesFromText(responseText);
    if (!recipes || recipes.length === 0) {
        return generateLocalRecipesFromIngredients(ingredientText);
    }

    return recipes;
}

function createDynamicRecipeDetails(recipeName, ingredientText) {
    const ingredientList = ingredientText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    return createFallbackRecipe(
        recipeName,
        `A complete recipe created around ${ingredientList.join(", ")} and pantry staples.`,
        ingredientList,
        "Medium",
        "30 mins",
        "12 mins",
        "18 mins",
        "2-4"
    );
}

async function generateRecipeDetails(recipeName, ingredientText) {
    if (!recipeName) {
        return buildRecipeHtml(createFallbackRecipe("Recipe", "Recipe details are not available.", [ingredientText], "Medium", "30 mins", "12 mins", "18 mins", "2"));
    }

    const normalizedInput = ingredientText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", ");

    if (!API_KEY) {
        const localRecipe = await loadLocalRecipeDetail(recipeName);
        if (localRecipe) {
            return buildRecipeHtml(createFallbackRecipe(
                localRecipe.name,
                localRecipe.summary,
                localRecipe.ingredients,
                localRecipe.difficulty,
                localRecipe.estimatedTime,
                localRecipe.preparationTime,
                localRecipe.cookingTime,
                localRecipe.servings
            ));
        }

        return buildRecipeHtml(createDynamicRecipeDetails(recipeName, normalizedInput));
    }

    const prompt = `You are a professional chef. Assume all common pantry ingredients are already available. Do NOT ask user for salt, oil, pepper, turmeric, or other basic spices. Create a complete formatted HTML recipe for the dish named ${recipeName}. Include Recipe Name, Preparation Time, Cooking Time, Difficulty, Servings, Ingredients, Cooking Steps, Chef Tips, Nutrition, Calories, Protein, Carbs, and Fat. Use the provided ingredients: ${normalizedInput}. IMPORTANT: If this is a drink, beverage, tea, coffee, or sweet dessert - DO NOT add masala, garam masala, chili powder, or unnecessary spices in the recipe. For masala tea, only use ginger and cardamom if provided. Keep beverages and sweets simple and clean-flavored. Return only the HTML markup for the recipe content without <html> or <body> wrappers.`;

    const responseHtml = await callGemini(prompt);
    if (!responseHtml || responseHtml.trim().length < 20) {
        const localRecipe = await loadLocalRecipeDetail(recipeName);
        return buildRecipeHtml(localRecipe ? createFallbackRecipe(
            localRecipe.name,
            localRecipe.summary,
            localRecipe.ingredients,
            localRecipe.difficulty,
            localRecipe.estimatedTime,
            localRecipe.preparationTime,
            localRecipe.cookingTime,
            localRecipe.servings
        ) : createDynamicRecipeDetails(recipeName, normalizedInput));
    }

    return responseHtml;
}
