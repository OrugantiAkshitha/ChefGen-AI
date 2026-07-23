const button = document.getElementById("generateBtn");
const input = document.getElementById("ingredients");
const recipeContainer = document.getElementById("recipeContainer");
const pageGreeting = document.getElementById("pageGreeting");
const recipeCount = document.getElementById("recipeCount");
const confidenceMessage = document.getElementById("confidenceMessage");

function displayNoRecipeState() {
    recipeContainer.innerHTML = `
        <div class="recipe-card" style="grid-column: 1 / -1; padding: 30px; text-align: center;">
            <h3>No Recipe Found</h3>
            <p>We couldn&apos;t generate a good recipe with the current ingredients. Try adding another vegetable, protein, or grain.</p>
        </div>
    `;
    recipeCount.textContent = "No. of Recipes Found: 0";
    confidenceMessage.textContent = "🤖 AI Confidence: Recipe suggestions depend on your input and pantry staples.";
}

function displayRecipeCount(count) {
    recipeCount.textContent = `No. of Recipes Found: ${count}`;
}

function displayRecipeGreeting() {
    showMessage("✅ Recipes Generated Successfully", "success");
    confidenceMessage.textContent = "🤖 AI Confidence: These recipes are based on the ingredients you provided and assume common pantry staples.";
}

function renderRecipeCards(recipes) {
    displayRecipeCount(recipes.length);
    recipeContainer.innerHTML = recipes
        .map((recipe) => `
            <article class="recipe-card" data-recipe='${encodeURIComponent(JSON.stringify(recipe))}'>
                <div>
                    <h3>${recipe.name}</h3>
                    <p>${recipe.summary || "A flavor-packed dish created from your ingredients."}</p>
                </div>
                <div class="recipe-meta">
                    <span><i class="fa-solid fa-clock"></i> ${recipe.estimatedTime}</span>
                    <span><i class="fa-solid fa-fire-flame-curved"></i> ${recipe.difficulty}</span>
                </div>
            </article>
        `)
        .join("");

    const cards = document.querySelectorAll(".recipe-card");
    cards.forEach((card) => {
        card.addEventListener("click", () => {
            const recipeJson = decodeURIComponent(card.dataset.recipe);
            const recipe = JSON.parse(recipeJson);
            saveSelectedRecipe(recipe);
            window.location.href = "recipe.html";
        });
    });

    recipeContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updatePageGreeting() {
    if (!pageGreeting) return;
    const greeting = getTimeGreeting();
    pageGreeting.innerHTML = `<strong>${greeting.emoji} ${greeting.title}</strong> ${greeting.subtitle}`;
}

button.addEventListener("click", async () => {
    if (button.disabled) {
        return;
    }

    const rawIngredients = input.value.trim();
    recipeContainer.innerHTML = "";
    showMessage("", "info");
    confidenceMessage.textContent = "";

    if (!rawIngredients) {
        showMessage("Please enter ingredients.", "error");
        return;
    }

    const ingredientList = rawIngredients
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    if (ingredientList.length < 2) {
        showMessage("Try adding at least two or three ingredients.", "error");
        return;
    }

    button.disabled = true;
    toggleLoading(true);

    try {
        const recipes = await generateRecipes(rawIngredients);
        toggleLoading(false);

        if (getLastGeminiError()?.status === 429) {
            showToast("Gemini quota limit reached. Showing local recipe suggestions instead.", "error");
            showMessage("Gemini is temporarily rate-limited. Showing local fallback recipes for now.", "error");
        }

        if (!recipes || recipes.length === 0) {
            showMessage("I couldn&apos;t find a good recipe with the current ingredients.", "error");
            displayNoRecipeState();
            return;
        }

        displayRecipeGreeting();
        renderRecipeCards(recipes);
    } catch (error) {
        console.error("[Ingredients] Recipe generation failed:", error);
        toggleLoading(false);
        showMessage("I couldn&apos;t find a good recipe with the current ingredients.", "error");
        displayNoRecipeState();
    } finally {
        button.disabled = false;
    }
});

input.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        button.click();
    }
});

window.addEventListener("DOMContentLoaded", () => {
    updatePageGreeting();
});
