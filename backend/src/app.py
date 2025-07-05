from flask import Flask,request,jsonify
from datetime import timedelta
from flask_cors import CORS, cross_origin
from mongoengine import Document, StringField, EmailField,IntField, connect
from mongoengine.connection import get_connection
import bcrypt
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, set_access_cookies,
    set_refresh_cookies, unset_jwt_cookies
)

load_dotenv()
app = Flask(__name__)
try:
    connect(host=os.getenv("MONGO_URI"))
    print("MongoDB connection successfull.")
except Exception as e:
    print("MongoDB connection failed:",str(e))

app.config['SECRET_KEY'] = 'evjfkjhyaiewul'  
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]  
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["JWT_COOKIE_HTTPONLY"] = True

jwt = JWTManager(app)


CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS","DELETE","PUT"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

class User(Document):
    fullname=StringField(required=True, max_length=100)
    email=EmailField(required=True,unique=True)
    username=StringField(required=True, max_length=100, unique=True)
    password=StringField(required=True)
    phno=IntField(required=True,unique=True)

@app.route('/')
def home():
    return 'Hello, Flask!'

@app.route('/api/register',methods=["POST","OPTIONS"])
def register():
    if request.method=="OPTIONS":
        return "",200
    try:
        data=request.get_json()
        if not data:
            return jsonify({"error":"no data provided"}),400

        fullname=data.get("fullname")
        email=data.get("email")
        username=data.get("username")
        password=data.get("password")
        phno=data.get("phno")

        if not username or not password or not email:
            return jsonify({"error": "Missing username, email or password"}), 400
        
        if User.objects(email=email).first():
            return jsonify({"error": "Email already exists"}), 409
        
        if User.objects(username=username).first():
            return jsonify({"error": "Username already exists"}), 409
        
        hashed_password = generate_password_hash(password)

        new_user=User(
            fullname=fullname,
            email=email,
            username=username,
            password=hashed_password,
            phno=phno
        )
        new_user.save()
        return jsonify({
            "message": "User registered successfully",
            "user": {
                "fullname": new_user.fullname,
                "email": new_user.email,
                "username": new_user.username,
                "phno": new_user.phno
            }
        }), 201
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route("/api/login",methods=["POST","OPTIONS"])
def login():
    if request.method=="OPTIONS":
        return "",200
    try:
        data=request.get_json()
        if not data:
            return jsonify({"error":"no data provided"}),400
        username=data.get("username")
        password=data.get("password")

        if not username or not password:
            return jsonify({"error": "Missing username or password"}), 400
        user=User.objects(username=username).first()
        if not user or not check_password_hash(user.password, password):
            return jsonify({"error": "Invalid username or password"}), 401
        
        access_token=create_access_token(identity=username)
        refresh_token=create_refresh_token(identity=username)

        response=jsonify({
            "message": "Login successful",
            "username": username
        })

        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@app.route("/api/me",methods=["GET"])
@jwt_required()
def me():
    current_user=get_jwt_identity()
    print(current_user)
    return jsonify({
        "username": current_user
    }), 200

@app.route("/api/refresh",methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity=get_jwt_identity()
    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)

    response = jsonify({"message": "Tokens refreshed successfully"})
    
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    
    return response

@app.route("/api/logout", methods=["POST"])
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response)
    
    return response



if __name__ == '__main__':
    app.run(debug=True)
