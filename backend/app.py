# backend/app.py

import os
from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
from models import db, User, Product, Request, Message
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
# Add these new imports for Google Sign-In
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

basedir = os.path.abspath(os.path.dirname(__file__))

# Define the upload folder and allowed extensions
UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
CORS(app, supports_credentials=True)

# --- Configuration ---
app.config['SECRET_KEY'] = 'a_very_secret_and_secure_key_change_it'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'instance', 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db.init_app(app)

# Helper function to check for allowed file types
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# === User Helper Function ===
def user_to_dict(user):
    return {
        'id': user.id, 'full_name': user.full_name, 'email': user.email,
        'phone_number': user.phone_number, 'address': user.address,
        'gender': user.gender, 'is_seller': user.is_seller
    }

# ===============================================
# ===         AUTHENTICATION ROUTES           ===
# ===============================================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'This email address is already registered.'}), 409
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(
        full_name=data['full_name'], email=data['email'], phone_number=data['phone_number'],
        address=data['address'], gender=data['gender'], password=hashed_password
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Registration successful! You can now log in.'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Invalid email or password. Please try again.'}), 401
    session['user_id'] = user.id
    return jsonify({'message': 'Login successful!', 'user': user_to_dict(user)}), 200
    
@app.route('/api/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    token = data.get('token')
    try:
        # IMPORTANT: Replace this with your actual Google Client ID
        CLIENT_ID = "138005063161-92qou3eaj7netnggmv5t8i9k6vj1gq91.apps.googleusercontent.com"
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
        google_email = idinfo['email']
        user = User.query.filter_by(email=google_email).first()
        if not user:
            # Create a new user if they don't exist
            new_user = User(
                full_name=idinfo.get('name', 'N/A'),
                email=google_email,
                phone_number="0000000000", # Placeholder
                address="Not Provided",    # Placeholder
                gender="Not Provided",     # Placeholder
                password=generate_password_hash(os.urandom(16).hex()) # Secure random password
            )
            db.session.add(new_user)
            db.session.commit()
            user = new_user
        session['user_id'] = user.id
        return jsonify({'message': 'Google login successful!', 'user': user_to_dict(user)}), 200
    except ValueError as e:
        print(f"Google Token Error: {e}")
        return jsonify({'message': 'Invalid Google token.'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'You have been logged out.'}), 200

@app.route('/api/check_session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({'logged_in': True, 'user': user_to_dict(user)}), 200
    return jsonify({'logged_in': False}), 200

# ===============================================
# ===           PRODUCT ROUTES                ===
# ===============================================

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.order_by(Product.updated_at.desc()).all()
    product_list = []
    for p in products:
        image_url = f"http://127.0.0.1:5000/uploads/{p.image_url}" if p.image_url else None
        product_list.append({
            'id': p.id, 'name': p.name, 'price': p.price, 'quantity': p.quantity,
            'image_url': image_url, 'updated_at': p.updated_at.isoformat()
        })
    return jsonify(product_list)

# --- NEWLY ADDED ROUTE ---
@app.route('/api/product/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    image_url = f"http://127.0.0.1:5000/uploads/{product.image_url}" if product.image_url else None
    product_data = {
        'id': product.id, 
        'name': product.name, 
        'price': product.price, 
        'quantity': product.quantity,
        'image_url': image_url, 
        'updated_at': product.updated_at.isoformat()
    }
    return jsonify(product_data)

@app.route('/api/products/add', methods=['POST'])
def add_product():
    if 'user_id' not in session: return jsonify({'message': 'Please log in.'}), 401
    user = User.query.get(session['user_id'])
    if not user or not user.is_seller: return jsonify({'message': 'Not authorized.'}), 403
    if 'image' not in request.files: return jsonify({'message': 'No image file part.'}), 400
    file = request.files['image']
    if file.filename == '': return jsonify({'message': 'No selected file.'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        new_product = Product(name=request.form['name'], price=float(request.form['price']), quantity=request.form['quantity'], image_url=filename)
        db.session.add(new_product)
        db.session.commit()
        return jsonify({'message': f"Product '{request.form['name']}' added."}), 201
    return jsonify({'message': 'File type not allowed.'}), 400

@app.route('/api/products/update/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    if 'user_id' not in session: return jsonify({'message': 'Please log in.'}), 401
    user = User.query.get(session['user_id'])
    if not user or not user.is_seller: return jsonify({'message': 'Not authorized.'}), 403
    product_to_update = Product.query.get(product_id)
    if not product_to_update: return jsonify({'message': 'Product not found.'}), 404
    data = request.get_json()
    if 'name' in data: product_to_update.name = data['name']
    if 'price' in data: product_to_update.price = float(data['price'])
    if 'quantity' in data: product_to_update.quantity = data['quantity']
    db.session.commit()
    return jsonify({'message': 'Product updated successfully.'}), 200

@app.route('/api/products/delete/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if 'user_id' not in session: return jsonify({'message': 'Please log in.'}), 401
    user = User.query.get(session['user_id'])
    if not user or not user.is_seller: return jsonify({'message': 'Not authorized.'}), 403
    product_to_delete = Product.query.get(product_id)
    if not product_to_delete: return jsonify({'message': 'Product not found.'}), 404
    if product_to_delete.image_url:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], product_to_delete.image_url))
        except Exception as e:
            print(f"Error deleting image file: {e}")
    db.session.delete(product_to_delete)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully.'}), 200

# ===============================================
# ===           REQUEST ROUTES                ===
# ===============================================

@app.route('/api/requests/add', methods=['POST'])
def add_request():
    if 'user_id' not in session: return jsonify({'message': 'Please log in.'}), 401
    data = request.get_json()
    if not all(k in data for k in ['product_id', 'quantity']): return jsonify({'message': 'Missing data.'}), 400
    new_request = Request(user_id=session['user_id'], product_id=data['product_id'], requested_quantity=data['quantity'])
    db.session.add(new_request)
    db.session.commit()
    return jsonify({'message': 'Your request has been sent successfully!'}), 201

@app.route('/api/requests', methods=['GET'])
def get_requests():
    if 'user_id' not in session: return jsonify({'message': 'Please log in.'}), 401
    user = User.query.get(session['user_id'])
    if not user or not user.is_seller: return jsonify({'message': 'Not authorized.'}), 403
    requests = db.session.query(Request, User, Product).join(User, Request.user_id == User.id).join(Product, Request.product_id == Product.id).order_by(Request.requested_at.desc()).all()
    request_list = [{'request_id': req.id, 'buyer_name': buyer.full_name, 'buyer_contact': buyer.phone_number, 'product_name': product.name, 'requested_quantity': req.requested_quantity, 'status': req.status, 'requested_at': req.requested_at.isoformat()} for req, buyer, product in requests]
    return jsonify(request_list)

@app.route('/api/myrequests', methods=['GET'])
def get_my_requests():
    if 'user_id' not in session: return jsonify({'message': 'Please log in.'}), 401
    user_id = session['user_id']
    requests = db.session.query(Request, Product).join(Product, Request.product_id == Product.id).filter(Request.user_id == user_id).order_by(Request.requested_at.desc()).all()
    request_list = [{'product_name': product.name, 'requested_quantity': req.requested_quantity, 'status': req.status, 'requested_at': req.requested_at.isoformat()} for req, product in requests]
    return jsonify(request_list)

@app.route('/api/requests/update/<int:request_id>', methods=['POST'])
def update_request_status(request_id):
    if 'user_id' not in session: return jsonify({'message': 'Please log in.'}), 401
    user = User.query.get(session['user_id'])
    if not user or not user.is_seller: return jsonify({'message': 'Not authorized.'}), 403
    req_to_update = Request.query.get(request_id)
    if not req_to_update: return jsonify({'message': 'Request not found.'}), 404
    data = request.get_json()
    new_status = data.get('status')
    if new_status not in ['Confirmed', 'Rejected', 'Shipped']: return jsonify({'message': 'Invalid status.'}), 400
    req_to_update.status = new_status
    db.session.commit()
    return jsonify({'message': f'Request {request_id} updated.'}), 200

# ===============================================
# ===           MESSAGING ROUTES              ===
# ===============================================

@app.route('/api/messages/conversations', methods=['GET'])
def get_conversations():
    if 'user_id' not in session: return jsonify({'message': 'Please log in.'}), 401
    user = User.query.get(session['user_id'])
    convo_users = User.query.filter_by(is_seller=False).all() if user.is_seller else User.query.filter_by(is_seller=True).all()
    return jsonify([user_to_dict(u) for u in convo_users])

@app.route('/api/messages/history/<int:other_user_id>', methods=['GET'])
def get_message_history(other_user_id):
    if 'user_id' not in session: return jsonify({'message': 'Please log in.'}), 401
    user_id = session['user_id']
    messages = Message.query.filter(((Message.sender_id == user_id) & (Message.receiver_id == other_user_id)) | ((Message.sender_id == other_user_id) & (Message.receiver_id == user_id))).order_by(Message.timestamp.asc()).all()
    message_list = [{'id': msg.id, 'sender_id': msg.sender_id, 'content': msg.content, 'timestamp': msg.timestamp.isoformat()} for msg in messages]
    return jsonify(message_list)

@app.route('/api/messages/send', methods=['POST'])
def send_message():
    if 'user_id' not in session: return jsonify({'message': 'Please log in.'}), 401
    data = request.get_json()
    if not all(k in data for k in ['receiver_id', 'content']): return jsonify({'message': 'Missing data.'}), 400
    new_message = Message(sender_id=session['user_id'], receiver_id=data['receiver_id'], content=data['content'])
    db.session.add(new_message)
    db.session.commit()
    return jsonify({'message': 'Message sent successfully.'}), 201


if __name__ == '__main__':
    with app.app_context():
        if not os.path.exists(os.path.join(basedir, 'instance')):
            os.makedirs(os.path.join(basedir, 'instance'))
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        db.create_all()
    app.run(debug=True, port=5000)