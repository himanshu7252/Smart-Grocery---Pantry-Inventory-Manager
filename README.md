# PantrySmart: Smart Grocery & Pantry Inventory Manager

**PantrySmart** is an industry-grade, cross-platform mobile application built using **React Native CLI and TypeScript** backed by a **Node.js, Express, and MongoDB** REST API. It is designed to help individuals, families, small kitchens, and hostels manage grocery inventory, minimize food waste, track expiry dates, receive automated stock alerts, and automatically coordinate shopping lists.

---

## 🚀 Key Features

* **Secure Authentication:** User signup, login, session validation (JWT), and token persistence using `AsyncStorage`.
* **Pantry Inventory CRUD:** Full CRUD operations on inventory items including brand tracking, categories, locations (e.g. Fridge, Pantry), purchase pricing, and text notes.
* **Quantity Stepper controls:** Responsive `[-] Quantity [+]` stepper inputs for immediate inventory updates.
* **Automatic Low-Stock Alerts:** Automatically monitors stock levels. If an item falls below the minimum stock threshold, a notification is logged.
* **Smart Shopping List Sync:** Automatically calculates restock requirements (`Target Stock - Current Stock`) when items run low, injecting needed items into the shopping list.
* **Closed-Loop Restocking:** Completing/checking off an item on the shopping list automatically updates inventory stock levels and logs a purchase transaction.
* **Expiry Warnings:** Dynamically calculates days remaining and generates warnings (`EXPIRY_SOON`, `EXPIRED`).
* **Restock Prediction:** Analyzes historical consumption logs over the last 30 days to calculate daily average usage rates and estimate remaining stock days.
* **Integrated Hardware Simulators:** 
  * **Barcode Scanner:** Simulated camera viewport with animated scan laser, allowing users to scan common items to auto-fill forms.
  * **Receipt OCR Scanner:** Simulates uploading a store receipt, parsing list text, and importing multiple items in a single click.
* **Family Shared Inventory:** Supports creating or joining family groups to share active shopping lists and cupboard inventory.
* **Advanced Analytics Dashboard:** Custom progress-bar breakdowns detailing category inventory valuations, spending habits, and consumption-to-waste ratios.

---

## 📐 Architecture & Data Flow

```text
       ┌────────────────────────┐
       │   React Native App     │◀──────┐
       │  (CLI + TypeScript)    │       │
       └───────────┬────────────┘       │
                   │                    │
                   ▼ (Redux State)      │
       ┌────────────────────────┐       │ (Token Persistence)
       │    Redux Toolkit       │       │
       └───────────┬────────────┘       │
                   │                    │
                   ▼ (Axios Client)     │
       ┌────────────────────────┐       │
       │    Axios API Client    │───────┘
       └───────────┬────────────┘
                   │
                   ▼ (JWT Bearer Token Header)
       ┌────────────────────────┐
       │  Express REST server   │
       └───────────┬────────────┘
                   │
                   ▼ (Mongoose Schemas)
       ┌────────────────────────┐
       │     MongoDB Database   │
       └────────────────────────┘
```

### Navigation Architecture
```text
RootNavigator
│
├── AuthNavigator (Unauthenticated Stack)
│   ├── SplashScreen
│   ├── LoginScreen
│   └── RegisterScreen
│
└── AppNavigator (Authenticated Stack)
    │
    ├── Bottom Tab Navigator
    │   ├── DashboardTab (DashboardScreen)
    │   ├── InventoryTab (InventoryScreen)
    │   ├── ShoppingListTab (ShoppingListScreen)
    │   ├── AnalyticsTab (AnalyticsScreen)
    │   └── ProfileTab (ProfileScreen)
    │
    └── Action Stack Screens
        ├── AddGrocery
        ├── GroceryDetails
        ├── EditGrocery
        └── Scanner
```

---

## 🗄️ Database Schema Design (Mongoose Models)

### 1. User (`server/models/User.js`)
Tracks user profiles and associates them with a family sharing unit.
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed via bcrypt
  phone: { type: String, default: '' },
  familyId: { type: ObjectId, ref: 'Family', default: null }
}
```

### 2. Grocery (`server/models/Grocery.js`)
Maintains the inventory cupboard items.
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['Vegetables', 'Fruits', 'Dairy', 'Grains', 'Snacks', 'Beverages', 'Meat', 'Frozen', 'Household', 'Other'], default: 'Other' },
  brand: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  unit: { type: String, required: true }, // e.g. kg, L, pcs
  minimumStock: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  expiryDate: { type: Date, default: null },
  barcode: { type: String, default: '' },
  location: { type: String, default: '' }, // e.g. Fridge, Pantry
  notes: { type: String, default: '' }
}
```

### 3. ShoppingList (`server/models/ShoppingList.js`)
Active lists of items to purchase.
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'My Shopping List' },
  items: [{
    itemId: { type: ObjectId, ref: 'Grocery', default: null }, // Link to pantry
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'pcs' },
    completed: { type: Boolean, default: false }
  }],
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  shared: { type: Boolean, default: false }
}
```

### 4. Transaction (`server/models/Transaction.js`)
Tracks history log changes of stock levels.
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true },
  groceryItemId: { type: ObjectId, ref: 'Grocery', required: true },
  type: { type: String, enum: ['PURCHASE', 'CONSUMPTION', 'ADJUSTMENT', 'WASTE'], required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, default: '' }
}
```

### 5. Notification (`server/models/Notification.js`)
System warnings and alerts.
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['LOW_STOCK', 'EXPIRY_SOON', 'EXPIRED', 'RESTOCK'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedItemId: { type: ObjectId, ref: 'Grocery', default: null },
  read: { type: Boolean, default: false }
}
```

### 6. Family (`server/models/Family.js`)
Shared group memberships for synchronization.
```javascript
{
  name: { type: String, required: true },
  ownerId: { type: ObjectId, ref: 'User', required: true },
  members: [{ type: ObjectId, ref: 'User' }]
}
```

---

## 🛠️ Installation & Setup

### Requirements
* **Node.js** (v22.11.0 or higher)
* **MongoDB** (Local instance running on port `27017` or Atlas connection string)
* **Android Development Environment:** JDK 17, Android Studio, Android SDK, and an Emulator.

---

### Step 1: Clone and Set Up Workspace
```bash
git clone <your-repository-url> smart-grocery-list
cd smart-grocery-list
```

### Step 2: Configure & Start Express Backend Server
1. Go into the server directory:
   ```bash
   cd server
   ```
2. Install server dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `server/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/smart_grocery_db
   JWT_SECRET=supersecretjwtkey_smartgrocery_123456
   ```
4. Launch the server in hot-reload development mode:
   ```bash
   npm run dev
   ```
   *The server should run on port `5000` and output: `MongoDB Connected: 127.0.0.1`*

---

### Step 3: Configure & Start React Native Mobile App
1. Open a new terminal and go into the mobile directory:
   ```bash
   cd mobile
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Configure the backend connection:
   * Open [`mobile/src/constants/index.ts`](file:///d:/AppDev/Smart-Grocery-List-Inventory-Management/mobile/src/constants/index.ts).
   * **Android Emulator:** Leave the default `API_BASE_URL = 'http://10.0.2.2:5000/api'`.
   * **Physical Android Device:** Set `API_BASE_URL` to your computer's local Wi-Fi IP address (e.g. `'http://192.168.1.15:5000/api'`). Ensure your computer and phone are connected to the same Wi-Fi.
4. Launch Metro Bundler:
   ```bash
   npx react-native start
   ```
5. Deploy the application to your Android emulator or connected device:
   ```bash
   npx react-native run-android
   ```

---

## 🧠 Business Logic Equations

### Smart Shopping List restock quantity calculation:
$$\text{Restock Quantity} = \max(0.1, \text{Target Stock} - \text{Current Stock})$$
*(where $\text{Target Stock} = \text{Minimum Stock} \times 2$)*

### Expiry days warning calculation:
$$\text{Days Until Expiry} = \left\lceil \frac{\text{Expiry Date} - \text{Now}}{\text{1 Day (ms)}} \right\rceil$$
* $\text{Days} \le 3 \implies$ `EXPIRY_SOON`
* $\text{Days} < 0 \implies$ `EXPIRED`

### Daily average usage restock calculation:
$$\text{Average Daily Consumption} = \frac{\sum \text{Consumption Quantities}}{\text{Last Log Date} - \text{First Log Date} \text{ (in days)}}$$
$$\text{Days Remaining} = \frac{\text{Current Quantity}}{\text{Average Daily Consumption}}$$

---

## 📈 Learning Outcomes

1. **Full-Stack Mobile Synchronization:** Connecting a React Native client to a Node.js REST API with automated event behaviors (e.g., checking off list items updates inventory).
2. **Centralized Client Design:** Building robust Axios client middleware with request interceptors to automatically attach session headers.
3. **Type-Safe Routing:** Utilizing TypeScript generic parameters (`RootStackParamList`) to guarantee navigation parameter safety.
4. **Clean State Architecture:** Separating state slices (auth, inventory, shopping list, notifications) with Redux Toolkit and custom typed hooks.
5. **Robust UI Styles:** Designing standard StyleSheet configurations with responsive vector SVG components, avoiding linking bugs in CLI environments.
6. **Relational Database Design:** Structuring Mongoose compound indexes to scale queries and ensure data integrity.
