# Interview Preparation Guide - Smart Grocery List & Inventory Manager

This document is designed to help you explain this project in technical and behavioral interviews.

---

## 🎤 Project Walkthrough: "Explain your project"

### ⏱️ 30-Second Elevator Pitch
> "I built **PantrySmart**, a full-stack cross-platform mobile application using **React Native and TypeScript** backed by a **Node.js, Express, and MongoDB** REST API. It solves the everyday problem of food waste and duplicate shopping by tracking grocery inventory levels. It features automated low-stock warnings, expiry calculations, a smart shopping list that auto-injects products when stock runs low, and a simulated barcode/receipt scanner. It demonstrates core full-stack mobile skills: state management with Redux Toolkit, token-based session persistence, and relational mongoose schema design."

---

### ⏱️ 1-Minute Technical Overview
> "PantrySmart is a mobile inventory system built in **TypeScript** using **React Native CLI** for the client and **Node/Express/MongoDB** for the backend. 
> On the frontend, I used **Redux Toolkit** for centralized state management (auth, inventory, shopping list, notifications) and **Axios** with request interceptors to automatically append JWT bearer tokens. 
> On the backend, I designed Mongoose schemas with indexes for high-speed lookup by category and barcode. The key value-add is the integration: when stock levels drop below the user's minimum limit (processed via a backend alert service), the item is automatically injected into their active shopping list with a calculated restock quantity. Checking off that item on the shopping list automatically increments inventory and logs a purchase transaction."

---

### ⏱️ 2-Minute Detailed Engineering Pitch
> "I developed a full-stack mobile application called **PantrySmart** using a React Native CLI, TypeScript, and Redux Toolkit frontend connected to an Express.js and MongoDB REST API.
> 
> Here is how the architecture and data flows are constructed:
> 1. **Authentication & Security:** Implemented custom JWT verification. Passwords are encrypted on signup via pre-save Mongoose hooks utilizing `bcryptjs`. The frontend persists these tokens in `AsyncStorage` and injects them into outgoing requests via custom Axios request interceptors.
> 2. **Pantry Inventory CRUD & Alert Engine:** The inventory module handles product parameters (minimum stock, category, cost, location, expiry). A backend `alertService` processes all stock adjustments. If an item drops below safety levels, the system generates a `LOW_STOCK` notification and injects it into a `ShoppingList` document.
> 3. **Closed-Loop Restocking:** When a user completes shopping and checks off the item, the controller increments the product quantity in inventory, logs a `PURCHASE` transaction, and flags the shopping item as completed.
> 4. **Smart Insights:** Developed custom progress-bar charts showing category valuations and an algorithm that parses historical consumption logs to calculate daily usage averages, projecting remaining days of stock (Restock Prediction).
> 5. **Simulated Hardware Features:** Built a simulated barcode and receipt OCR scan workflow, avoiding brittle native driver dependencies in development.
> This project gave me experience in type safety, database normalizations, offline caching strategies, and event-driven full-stack synchronization."

---

## 📱 React Native & Frontend Interview Q&A

### 1. What is React Native, and how does it render components?
React Native compiles JavaScript UI descriptions into native platform elements. Unlike Cordova, it doesn't run in a webview; it runs JavaScript on a JS engine (like Hermes) which communicates with the Native OS thread (Java/Objective-C UI controllers) across an asynchronous serializing bridge.

### 2. Why did you choose React Native CLI over Expo?
React Native CLI offers production-grade flexibility, allowing integration of native custom libraries and direct control over the `android/` and `ios/` folders. It is the preferred choice for enterprise apps where deep hardware integrations or custom build profiles are required.

### 3. What is Redux Toolkit and why did you use it?
Redux Toolkit simplifies global state management by reducing boilerplate. I used it to maintain a single source of truth for user authentication state, inventory items, shopping lists, and notifications. It allows screens to share state (like inventory restocking on shopping check-offs) instantly without prop drilling.

### 4. How does TypeScript improve React Native development?
TypeScript prevents runtime type errors by validating interfaces compile-time. For this project, I created typed navigation lists (`RootStackParamList`) and model shapes (`GroceryItem`), ensuring that passing parameters (like `itemId` from inventory cards to details views) is validated by the compiler.

### 5. How did you implement session persistence on the mobile client?
I utilized `@react-native-async-storage/async-storage`. When a user logs in or registers, the server returns a JWT. The client saves this token in AsyncStorage. On app boot, a `restoreSession` Redux action retrieves the token and queries `/auth/me` to automatically log the user in without requiring credentials.

---

## 🖥️ Node.js, Express & MongoDB Backend Q&A

### 1. Why did you use MongoDB and Mongoose?
MongoDB's document model is perfect for handling grocery items which have flexible structures (some have barcodes, brands, and expiry dates; others don't). Mongoose acts as an ODM (Object Document Mapper) providing schema validation, casting types, and pre-save hooks (like hashing passwords).

### 2. How did you protect private API endpoints?
I wrote a custom `protect` middleware in `server/middleware/authMiddleware.js`. It reads the `Authorization` header, extracts the Bearer token, decodes it using `jsonwebtoken` with the backend `JWT_SECRET`, queries the MongoDB User collection, and attaches the user document to `req.user`.

### 3. Explain how the automatic restocking logic is triggered.
When a user updates a shopping item to `completed = true`, the `updateShoppingItem` controller in `shoppingController.js` checks if the item has an `itemId` reference. If it does, it queries the `Grocery` collection, increments the quantity by the shopping list quantity, and creates a `Transaction` log of type `PURCHASE`.

### 4. How does the restock prediction algorithm work?
It queries consumption transactions in the last 30 days. It calculates total quantities consumed and divides by the day difference between the first and last transaction. This yields the average daily consumption rate. Finally, it divides current quantity by this rate to output the estimated days of stock remaining.

---

## 💼 HR / Behavioral Explanation (Non-Technical)
> "I built a mobile app called **PantrySmart** that helps households reduce food waste and coordinate grocery shopping. It tracks what you have in your cupboards, calculates when food will expire, and alerts you when essentials like milk run low. It also includes a shared family list, so partners or roommates can see what needs buying. I built both the phone app and the backend database server. Through this, I learned how to plan database relationships, secure user accounts, manage application state, and build clean, responsive mobile interfaces."
