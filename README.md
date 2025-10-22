# Agrilume - Freshness From the Farm to You 🍓🥕



Agrilume is a full-stack web application designed to allow farmers to sell their produce directly to consumers without intermediaries, and for consumers to easily order fresh, quality products. This project was solely developed by me.

---

## ✨ Key Features

* **User Management:**
    * Registration and Login via Email/Password.
    * Login/Register using a Google account.
    * Separate dashboards for Buyers and Sellers.
    * Profile completion (Phone/Address) for users who signed up with Google.
* **Product Management (For Sellers):**
    * Add new products (name, price, quantity, image).
    * Edit existing product details.
    * Delete products.
    * View their own product list.
* **Order Requests:**
    * Buyers can submit requests for products (with quantity validation).
    * Buyers can view the status (Pending, Confirmed, Rejected) of their submitted requests.
    * Sellers can view incoming requests for their products.
    * Sellers have the ability to Confirm or Reject requests.
    * Product quantity automatically decreases when a request is confirmed.
* **Messaging:**
    * Ability for a buyer who made a request and the corresponding seller to message each other.
    * View conversation list and message history.

---

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Python, Flask, Flask-SQLAlchemy, Flask-CORS
* **Database:** SQLite
* **Authentication:** Werkzeug (Password Hashing), Google OAuth2 (Google Sign-In)

---

## ⚙️ Setup and Installation

1.  **Clone the Repository:**
    ```bash
    git clone [Your Repository URL]
    cd [Project Folder Name]
    ```
2.  **Backend Setup:**
    ```bash
    cd backend
    python -m venv venv  # Create a virtual environment
    source venv/bin/activate # (Linux/Mac) or venv\Scripts\activate (Windows)
    pip install -r requirements.txt # Install required packages
    python app.py # Run the backend server ([http://127.0.0.1:5000](http://127.0.0.1:5000))
    ```
3.  **Frontend Setup:**
    * Open the `index.html` file located inside the `frontend` folder of the project with your browser (or run it using an extension like Live Server - e.g., `http://127.0.0.1:5500`).

---

## 🚀 Usage

1.  **Register:** Register as a buyer (using Email/Password or Google).
2.  **Login:** Log in to your account.
3.  **(If Google User):** If prompted, complete your profile by entering your Phone Number and Address.
4.  **Browse Products:** Go to the "Products" page to view available items.
5.  **Request Order:** Click the "Request Order" button on a desired product, enter the quantity, and submit the request. (You will be redirected to Login if not already logged in).
6.  **My Requests:** Go to the "My Requests" page to see your submitted requests and their status.
7.  **Messages:** Navigate to the "Messages" page to communicate with the relevant seller.
8.  **(Seller):** Log in as a Seller (set `is_seller` = True in the database), access the "Seller Dashboard" to add/manage products and confirm/reject incoming requests.

---

## 🧑‍💻 Author

This entire project was solely developed by **Mevinu Methdam**.

---