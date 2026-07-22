const recipeContent = document.getElementById("recipeContent");

function renderError(message) {
    recipeContent.innerHTML = `
        <div class="recipe-card">
            <div class="section">
                <h2>No Recipe Found</h2>
                <p>${message}</p>
                <a class="button-secondary" href="ingredients.html">Back to Ingredients</a>
            </div>
        </div>
    `;
}

function bindRecipeActions() {
    const copyButton = document.getElementById("copyRecipeBtn");
    const printButton = document.getElementById("printRecipeBtn");

    if (copyButton) {
        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(recipeContent.innerText.trim());
                showToast("📋 Recipe copied to clipboard", "success");
            } catch (error) {
                showToast("Unable to copy recipe.", "error");
            }
        });
    }

    if (printButton) {
        printButton.addEventListener("click", () => {
            window.print();
        });
    }
}

async function renderRecipePage() {
    const selectedRecipe = getSelectedRecipe();
    if (!selectedRecipe) {
        renderError("No recipe was selected. Please choose a recipe from the ingredients page.");
        return;
    }

    try {
        const recipeHtml = await generateRecipeDetails(selectedRecipe.name, selectedRecipe.mainIngredients ? selectedRecipe.mainIngredients.join(", ") : selectedRecipe.ingredients ? selectedRecipe.ingredients.join(", ") : "");
        recipeContent.innerHTML = recipeHtml;
        bindRecipeActions();
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        renderError("Unable to load the recipe details right now. Please try again.");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    renderRecipePage();
});
