## Diagram

![Diagram](/docs/diagram/files/diagram.png)

## Description
 
### **User**

Collection of user data

- FirstName: String
- LastName: String
- Login: String
- Email: String 
- Password: String (Hash)
- Addresses
  - FirstName: String
  - LastName: String
  - Phone: String
  - Country: String
  - PostalCode: String
  - City: String
  - Street: String
  - StreetNumber: String
  - FlatNumber: String
- Roles: String[]
- Orders: mongoose.Types.ObjectId (Orders)
- Reviews: mongoose.Types.ObjectId (Reviews)
- Cart
  - Dish: mongoose.Types.ObjectId (Dishes)
  - Quantity: Number
- DefaultCurrency: mongoose.Types.ObjectId (Currencies)
- Active: Boolean
- Banned: Boolean

### **Dishes**

Collection of menu data

- Name: String
- Category: String
- Cuisine: String
- Type: String
- Ingredients: String[]
- Stock: Number
- Currency: mongoose.Types.ObjectId (Currencies)
- UnitPrice: Number
- RatingsSum: Number
- RatingCount: Number
- Description: String[]
- Images: String[]
- Reviews: mongoose.Types.ObjectId[] (Reviews)

### **Reviews**

Collection of reviews and comments data

- User: mongoose.Types.ObjectId (Users)
- Dish: mongoose.Types.ObjectId (Dishes)
- Order: mongoose.Types.ObjectId (Orders)
- Date: String
- Rating: Number
- Body: String[]

### **Orders**

Collection of orders data

- User: mongoose.Types.ObjectId (Users)
- Dishes
  - Dish: mongoose.Types.ObjectId (Dishes)
  - Quantity: Number
  - UnitPrice: Number
- Date:String
- TotalPrice: Number
- Currency: mongoose.Types.ObjectId (Currencies)

### **Globals**

Collection of global values

- Persistence: Number
- MainCurrency: mongoose.Types.ObjectId[] (Currencies)

### **Currencies**

Collection of currencies data

- Code: String
- Symbol: String
- Name: String

### **ExchangeRates**

Collection of exchange rates of currencies

- Ratio: Number
- From: String
- To: String