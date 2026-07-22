const STORAGE_KEY = "chefgen-selected-recipe";

function showMessage(message, type = "info") {
    const messageElement = document.getElementById("message");
    if (!messageElement) {
        return;
    }
    messageElement.textContent = message;
    messageElement.className = type === "error" ? "message error" : "message";
}

function toggleLoading(isVisible) {
    const loadingPanel = document.getElementById("loading");
    if (!loadingPanel) {
        return;
    }
    loadingPanel.style.display = isVisible ? "flex" : "none";
}

function saveSelectedRecipe(recipe) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipe));
}

function getSelectedRecipe() {
    try {
        const storedValue = localStorage.getItem(STORAGE_KEY);
        return storedValue ? JSON.parse(storedValue) : null;
    } catch (error) {
        return null;
    }
}

function clearSelectedRecipe() {
    localStorage.removeItem(STORAGE_KEY);
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

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove("hidden");

    setTimeout(() => {
        toast.classList.add("hidden");
    }, 3000);
}

function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
        return { emoji: "🌞", title: "Good Morning!", subtitle: "Ready to cook something delicious?" };
    }
    if (hour < 18) {
        return { emoji: "☀️", title: "Good Afternoon!", subtitle: "Let&apos;s prepare a tasty meal." };
    }
    return { emoji: "🌙", title: "Good Evening!", subtitle: "What&apos;s for dinner today?" };
}
