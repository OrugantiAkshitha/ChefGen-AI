# 🍳 ChefGen AI

> **AI-Powered Smart Recipe Generator using Generative AI & Cloud Computing**

ChefGen AI is an intelligent web application that helps users create delicious recipes using the ingredients available at home. Powered by **Google Gemini AI**, it generates complete recipes with cooking instructions, nutrition information, chef tips, and more.

---

## 🌐 Live Demo

🔗 **https://orugantiakshitha.github.io/ChefGen-AI/**

---

# 📖 Table of Contents

- About
- Features
- Technology Stack
- Project Structure
- Installation
- Configuration
- Running the Project
- Future Enhancements
- Deployment
- Team
- License

---

# 🍽 About

ChefGen AI is an AI-powered recipe generator designed to make cooking easier and smarter.

Users simply enter the ingredients they have at home, and the application uses **Google Gemini AI** to generate multiple recipe suggestions. After selecting a recipe, users receive:

- 🍲 Complete Recipe
- 📝 Step-by-Step Cooking Instructions
- ⏱ Preparation & Cooking Time
- 👨‍🍳 Difficulty Level
- 🍽 Servings
- 🥗 Nutrition Information
- 💡 Smart Chef Tips
- 🌟 AI Confidence Message

The application assumes common pantry staples such as **salt, oil, water, and basic spices** are already available, so users only need to enter the main ingredients.

---

# ✨ Features

## 🏠 Beautiful Landing Page

- Modern Glassmorphism UI
- Responsive Hero Section
- Attractive Orange Theme
- Smooth Animations
- Mobile-Friendly Design

---

## 🥗 Ingredient Input

- Add Multiple Ingredients
- Smart Ingredient Validation
- Interactive Ingredient Chips
- Pantry Staples Assumption
- Responsive Search Interface

---

## 🤖 AI Recipe Generation

Powered by **Google Gemini 2.5 Flash**

Generates:

- Recipe Name
- Description
- Ingredients
- Step-by-Step Instructions
- Preparation Time
- Cooking Time
- Total Time
- Difficulty
- Servings
- Calories
- Protein
- Carbohydrates
- Fat
- Chef Tips
- Recipe Variations

---

## 🍛 Smart Recipe Suggestions

Example combinations:

| Ingredients | Suggested Recipe |
|-------------|------------------|
| Egg + Bread | Egg Toast |
| Tomato + Onion | Tomato Curry |
| Milk + Coffee | Coffee |
| Rice + Vegetables | Fried Rice |
| Chicken + Spices | Chicken Curry |
| Maggi + Egg | Egg Maggi |

---

## 🧠 Smart Pantry Assumption

ChefGen AI automatically assumes these ingredients are available:

- Salt
- Water
- Oil
- Pepper
- Common Spices

Users only need to enter the primary ingredients.

---

## 📄 Detailed Recipe Information

Each recipe includes:

- Recipe Title
- Description
- Ingredients
- Cooking Steps
- Preparation Time
- Cooking Time
- Total Time
- Difficulty
- Servings
- Estimated Cost
- Nutrition Facts
- Health Assessment
- AI Confidence Score
- Chef Recommendation
- Cooking Quote

---

## 🔄 Offline Fallback Mode

If a Gemini API key is not configured:

- Loads sample recipes
- Fully functional demo mode
- Suitable for testing
- No application errors

---

## 📱 Responsive Design

Optimized for:

- Desktop
- Laptop
- Tablet
- Mobile Devices

---

## 🎨 User Interface Features

- Glassmorphism Design
- Gradient Buttons
- Hover Animations
- Loading Spinner
- Modern Recipe Cards
- Responsive Navigation
- Blur Background Effects
- Smooth Page Transitions

---

# 🛠 Technology Stack

## Frontend

- HTML5
- CSS3
- Vanilla JavaScript (ES6)

## Generative AI

- Google Gemini 2.5 Flash API

## Cloud Computing

- Google AI Studio
- Gemini API

## Hosting

- GitHub Pages
- Firebase Hosting
- Live Server

## Development Tools

- Visual Studio Code
- Git
- GitHub

---

# 📂 Project Structure

```text
ChefGen-AI/
│
├── assets/
│   └── background.jpg
│
├── css/
│   ├── style.css
│   ├── ingredients.css
│   └── recipe.css
│
├── data/
│   └── sampleRecipes.json
│
├── js/
│   ├── app.js
│   ├── config.js
│   ├── gemini.js
│   ├── ingredients.js
│   └── recipe.js
│
├── index.html
├── ingredients.html
├── recipe.html
├── firebase.json
├── .gitignore
└── README.md
```

---

# ⚙ Installation

Clone the repository:

```bash
git clone https://github.com/OrugantiAkshitha/ChefGen-AI.git
```

Navigate to the project folder:

```bash
cd ChefGen-AI
```

Open the project in **Visual Studio Code**.

---

# 🔑 Configuration

Open:

```text
js/config.js
```

Replace:

```javascript
const API_KEY = "YOUR_GEMINI_API_KEY";
```

with:

```javascript
const API_KEY = "YOUR_ACTUAL_GEMINI_API_KEY";
```

You can obtain a Gemini API key from:

https://aistudio.google.com/

---

# ▶ Running the Project

### Method 1 (Recommended)

1. Install the **Live Server** extension in VS Code.
2. Open `index.html`.
3. Right-click and select:

```text
Open with Live Server
```

---

### Method 2

Deploy the application using **Firebase Hosting**.

---

# 🚀 Future Enhancements

- User Authentication
- Favorite Recipes
- Recipe History
- Dark Mode
- Voice Input
- AI Image Generation
- Shopping List Generator
- Meal Planner
- Multi-language Support
- Recipe Sharing
- PDF Recipe Download
- Barcode Ingredient Scanner
- OCR Ingredient Detection
- Food Waste Reduction Suggestions

---

# ☁ Deployment

## GitHub Pages

Push your project to GitHub and enable **GitHub Pages** from the repository settings.

---

## Firebase Hosting

Install Firebase CLI:

```bash
npm install -g firebase-tools
```

Login:

```bash
firebase login
```

Initialize:

```bash
firebase init
```

Deploy:

```bash
firebase deploy
```

---

# 👥 Team

## Team Name

**GenAI Pioneers**

### Team Members

- ORUGANTI AKSHITHA
- Talluri Chandana
- Koka Navya Sree

---

**IBM SkillsBuild Internship**

**Project Theme:** Generative AI & Cloud Computing

**Project Title:** ChefGen AI – AI-Powered Smart Recipe Generator

---

# 📜 License

This project is developed for educational purposes as part of the **IBM SkillsBuild Internship Program**.

Feel free to learn from, modify, and enhance the project.

---

# ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.

**Happy Cooking with ChefGen AI! 🍳🤖**