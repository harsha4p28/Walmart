from flask import Flask,request,jsonify
from datetime import timedelta
from flask_cors import CORS, cross_origin
from mongoengine import Document,EmbeddedDocument, StringField, EmailField,IntField,DateTimeField,FloatField, connect , fields,EmbeddedDocumentListField,ReferenceField,ListField,EmbeddedDocumentField,LazyReferenceField
from mongoengine.connection import get_connection
import bcrypt
import os
from datetime import datetime
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
    role=StringField(required=False,null=True)
    employeeId=StringField(required=False,null=True)

#for every product
class Product(Document):
    name = StringField(required=True)
    category = StringField()
    volume_per_unit = FloatField()
    meta = {'collection': 'products'}

class Location(EmbeddedDocument):
    latitude = fields.FloatField(required=True)
    longitude = fields.FloatField(required=True)
    address = fields.StringField()

class Capacity(EmbeddedDocument):
    total_volume = fields.IntField(required=True)
    used_volume = fields.IntField(required=True)

class ProductItem(EmbeddedDocument):
    product = ReferenceField(Product, required=True)
    quantity = IntField(required=True)


class Manager(Document):
    manager_id = StringField(required=True, unique=True)
    name = StringField()
    role = StringField()
    contact = EmailField()
    meta = {'collection': 'managers'}

class Shipment(Document):
    shipment_id = StringField(required=True, unique=True)
    destination_store_id = StringField()
    products = EmbeddedDocumentListField(ProductItem)
    vehicle_id = StringField()
    status = StringField(choices=["pending", "in_transit", "delivered"])
    eta = DateTimeField()
    meta = {'collection': 'shipments'}


class SustainabilityMetrics(EmbeddedDocument):
    last_month_emissions_kg = fields.FloatField()
    avg_energy_use_kwh = fields.FloatField()
    green_certified = fields.BooleanField()

class SimulationResult(Document):
    estimated_cost = fields.FloatField()
    estimated_emissions = fields.FloatField()
    suggested_by_ai = fields.BooleanField(default=False)
    meta={'collection':"simulationResult"}

class SimulationHistory(Document):
    simulation_id = fields.StringField(required=True)
    date = fields.DateTimeField()
    description = fields.StringField()
    result = ReferenceField(SimulationResult)
    meta={'collection':"simulationHistory"}

class Warehouse(Document):
    name = StringField(required=True)
    location = EmbeddedDocumentField(Location, required=True)
    capacity = EmbeddedDocumentField(Capacity, required=True)
    inventory = EmbeddedDocumentListField(ProductItem)
    sustainability_metrics = EmbeddedDocumentField(SustainabilityMetrics)
    managers = ListField(ReferenceField(Manager))
    current_shipments = ListField(ReferenceField(Shipment))
    simulation_result= ListField(ReferenceField(SimulationResult))
    simulation_history = ListField(ReferenceField(SimulationHistory))
    last_updated = DateTimeField(default=datetime.utcnow)
    meta = {'collection': 'warehouse'}

class Employee(Document):
    user_username = StringField(required=True)
    user_role = StringField(required=True)
    employee_id = StringField(required=True)
    latitude = FloatField(required=True)
    longitude = FloatField(required=True)
    location_name = StringField(required=True)
    warehouse_id = LazyReferenceField(Warehouse, required=False, null=True)
    meta={'collection':'central'}

@app.route('/')
def home():
    return 'Hello, Flask!'

def ensure_warehouse_for_user(username):
    access=Employee.objects(user_username=username).first()
    if not access:
        raise Exception("User entry not found")
    if access.warehouse_id:
        return access.warehouse_id
    location=Location(
        latitude=access.latitude,
        longitude=access.longitude,
        address=access.location_name
    )
    warehouse=Warehouse(
        name=access.location_name or f"Warehouse for {username}",
        location=location,
        capacity=Capacity(total_volume=10000,used_volume=0),
        inventory=[],
        sustainability_metrics=SustainabilityMetrics()
    )
    warehouse.save()
    access.warehouse_id=warehouse
    access.save()

    return warehouse.id

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
            phno=phno,
            role="",
            employeeId=""
        )
        new_user.save()
        return jsonify({
            "message": "User registered successfully",
            "user": {
                "fullname": new_user.fullname,
                "email": new_user.email,
                "username": new_user.username,
                "phno": new_user.phno,
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
        
        warehouse_id=ensure_warehouse_for_user(username)
        access_token=create_access_token(identity=username)
        refresh_token=create_refresh_token(identity=username)

        response=jsonify({
            "message": "Login successful",
            "username": username,
            "warehouse_id":str(warehouse_id)
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

@app.route("/api/profile",methods=["GET"])
@jwt_required()
def profile():
    try:
        username=get_jwt_identity()
        user =User.objects(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({
            "username": user.username,
            "email": user.email,
            "name": user.fullname,
            "phno":user.phno,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/logout", methods=["POST"])
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response)
    
    return response



if __name__ == '__main__':
    app.run(debug=True)