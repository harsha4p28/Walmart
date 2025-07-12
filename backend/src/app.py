from flask import Flask,request,jsonify
import re
import json
from flask_jwt_extended import jwt_required
from datetime import timedelta
from flask_cors import CORS, cross_origin
from mongoengine import Document,EmbeddedDocument, StringField, EmailField,IntField,DateTimeField,FloatField, connect , fields,EmbeddedDocumentListField,ReferenceField,ListField,EmbeddedDocumentField,LazyReferenceField , BooleanField
from mongoengine.connection import get_connection
from mongoengine.queryset.visitor import Q
import google.generativeai as genai
import bcrypt
import os
import requests
import uuid
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
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=45)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["JWT_COOKIE_HTTPONLY"] = True

jwt = JWTManager(app)

CLIMATIQ_API=os.getenv("CLIMATIQ_API")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("models/gemini-1.5-flash")

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

class IntermediateShipment(EmbeddedDocument):
    latitude = fields.FloatField(required=True)
    longitude = fields.FloatField(required=True)
    warehouse_name = StringField()

class Shipment(Document):
    shipment_id = StringField(required=True, unique=True)
    destination_store_id = StringField()
    products = EmbeddedDocumentListField(ProductItem)
    intermediateRoute = EmbeddedDocumentListField(IntermediateShipment)
    vehicle_mode = StringField()
    vehicle_count = IntField()
    emissions = FloatField()
    vehicle_model = StringField()
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

class WarehouseNotification(EmbeddedDocument):
    message= StringField()
    from_warehouse= StringField()
    to_warehouse = StringField()
    shipment_weight= IntField()
    shipment_mode_count = IntField()
    is_accepted = BooleanField(default=False)
    related_shipments = ListField(ReferenceField(Shipment))
    related_warehouses = ListField(ReferenceField('Warehouse'))

class Warehouse(Document):
    name = StringField(required=True)
    location = EmbeddedDocumentField(Location, required=True)
    capacity = EmbeddedDocumentField(Capacity, required=True)
    inventory = EmbeddedDocumentListField(ProductItem)
    sustainability_metrics = EmbeddedDocumentField(SustainabilityMetrics)
    notification_history = EmbeddedDocumentListField(WarehouseNotification)
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
        sustainability_metrics=SustainabilityMetrics(),
        notification_history = WarehouseNotification()
    )
    warehouse.save()
    access.warehouse_id=warehouse
    access.save()

    return warehouse.id

@app.route("/api/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    try:
        username = get_jwt_identity()
        access = Employee.objects(user_username=username).first()
        if not access or not access.warehouse_id:
            return jsonify([])

        warehouse = access.warehouse_id.fetch()
        notifications = warehouse.notification_history or []

        response = []
        for i, note in enumerate(notifications):
            response.append({
                "title": f"Notification {i+1}",
                "message": note.message,
                "time": warehouse.last_updated.strftime("%Y-%m-%d %H:%M:%S"),
                "type": "info" if not note.is_accepted else "accepted"
            })

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/acceptNotification',methods=["POST"])
@jwt_required()
def accept_notification():
    try:
        username = get_jwt_identity()
        data = request.get_json()
        index = data.get("notification_index")

        access = Employee.objects(user_username=username).first()
        if not access:
            raise Exception("User entry not found")

        if not access.warehouse_id:
            return jsonify({"error": "No warehouse found"}), 400

        warehouse_accepting_notification = access.warehouse_id.fetch()
        if not warehouse_accepting_notification:
            return jsonify({"error": "Warehouse not found"}), 404
        if index is None or index >= len(warehouse_accepting_notification.notification_history):
            return jsonify({"error": "Invalid notification index"}), 400

        notification = warehouse_accepting_notification.notification_history[index]
        if notification.is_accepted:
            return jsonify({"message": "Already accepted"}), 200

        shipment1 = notification.related_shipments[0]
        shipment2 = notification.related_shipments[1] 
        from_wh = notification.related_warehouses[0]
        to_wh = notification.related_warehouses[1] 

        if shipment1 not in warehouse_accepting_notification.current_shipments:
            warehouse_accepting_notification.current_shipments.append(shipment1)
        if shipment2 not in warehouse_accepting_notification.current_shipments:
            warehouse_accepting_notification.current_shipments.append(shipment2)
        warehouse_accepting_notification.save()

        if shipment1 not in from_wh.current_shipments:
            from_wh.current_shipments.append(shipment1)
            from_wh.save()

        if shipment2 not in to_wh.current_shipments:
            to_wh.current_shipments.append(shipment2)
            to_wh.save()


        notification.is_accepted = True
        warehouse_accepting_notification.save()


        return jsonify({"message": "Notification accepted and shipments linked."}), 200
    except Exception as e:
        print(f"Error accepting notification: {str(e)}")
        return jsonify({"error": str(e)}), 500
        
    

@app.route('/api/location',methods=["GET"])
@jwt_required()
def get_location():
    try:
        username=get_jwt_identity()
        query=request.args.get('q','')
        if not query:
            return jsonify([])
        access = Employee.objects(user_username=username).first()
        warehouse_id = access.warehouse_id.id
        print(warehouse_id)
        destinations= Warehouse.objects(name__icontains=query).only('name','location')
        filtered_destinations = [
            {
                "name": destination.name,
                "latitude": destination.location.latitude,
                "longitude": destination.location.longitude
            }
            for destination in destinations if destination.id != warehouse_id
        ]
        return jsonify(filtered_destinations)
    except Exception as e:
        return jsonify({"error":str(e)}),500
    

@app.route('/api/optimal', methods=["POST","OPTIONS"])
@jwt_required()
def simulate():
    try:
        if request.method == 'OPTIONS':
            return '', 200
        
        username = get_jwt_identity()
        data = request.get_json()

        mode = data.get("mode")
        activity_id = data.get("model")
        distance = float(data.get("distance", 0))
        weight = float(data.get("weight", 0))  
        count = int(data.get("count", 1))

        if not activity_id or distance==0:
            return jsonify({"error": "Missing required simulation data"}), 400
        
        parameters = {
            "distance": distance,
            "distance_unit": "km"
        }

        if mode in ["truck", "ship", "train"]:
            parameters["weight"] = weight
            parameters["weight_unit"] = "ton"

        payload = {
            "emission_factor": {
                "activity_id": activity_id,
                "data_version": "23.23"
            },
            "parameters": parameters
        }
        
        headers = {
            "Authorization": f"Bearer {os.getenv('CLIMATIQ_API')}",
            "Content-Type": "application/json"
        }

        response = requests.post("https://beta4.api.climatiq.io/estimate", headers=headers, json=payload)
        result = response.json()

        total_emissions = result.get("co2e", 0) * count

        print("Climatiq API Response:", result)

        return jsonify({
            "co2e_per_trip": result.get("co2e"),
            "co2e_unit": result.get("co2e_unit"),
            "trip_count": count,
            "total_co2e": total_emissions,
            "emission_factor": result.get("emission_factor")
        }), 200
        

    except Exception as e:
        print(f"Error in /api/simulate: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

    
@app.route('/api/warehouse', methods=["GET"])
@jwt_required()
def get_own_warehouse_details():
    try:
        username = get_jwt_identity()
        access = Employee.objects(user_username=username).first()
        if not access:
            raise Exception("User entry not found")
        
        if not access.warehouse_id:
            return jsonify({"error": "No warehouse found"}), 400
        
        warehouse = access.warehouse_id.fetch()
        if not warehouse:
            return jsonify({"error": "Warehouse not found"}), 404
        
        if not warehouse.location:
            return jsonify({"error": "Warehouse location not found"}), 404
        
        
        latitude = warehouse.location.latitude
        longitude = warehouse.location.longitude
        print(f"Warehouse location: lat={latitude}, long={longitude}")
        
        all_warehouses = Warehouse.objects()

        warehouse_list = []
        for wh in all_warehouses:
            warehouse_list.append({
                "id": str(wh.id),
                "name": wh.name,
                "latitude": wh.location.latitude if wh.location else None,
                "longitude": wh.location.longitude if wh.location else None
            })
        print(warehouse_list)
        return jsonify({
            "name": warehouse.name,
            "latitude": latitude,
            "longitude": longitude,
            "warehouse_list":warehouse_list,
        })

    except Exception as e:
        print(f"Error in /api/warehouse: {str(e)}")  # log error for debugging
        return jsonify({"error": str(e)}), 500

@app.route('/api/addSimulation',methods=["POST","OPTIONS"])
@jwt_required()
def add_simulation():
    try:
        if request.method == 'OPTIONS':
            return '', 200
        data=request.get_json()
        if not data:
            return jsonify({"error":"no data provided"}),400
        
        shipment_id = str(uuid.uuid4())
        to = data.get("to")
        mode = data.get("mode")
        model = data.get("model")
        count = data.get("count")
        emissions = data.get("emissions")
        intermediates = data.get("intermediates",[])
        eta = datetime.strptime(data.get("eta"), "%Y-%m-%dT%H:%M:%S") if data.get("eta") else None
        status = "pending"
        product_data = data.get("products", [])

        if not all([to, mode, model, count]):
            return jsonify({"error": "Incomplete simulation data"}), 400
        
        username = get_jwt_identity()
        access = Employee.objects(user_username=username).first()
        if not access:
            raise Exception("User entry not found")
        
        if not access.warehouse_id:
            return jsonify({"error": "No warehouse found"}), 400
        
        warehouse = access.warehouse_id.fetch()
        if not warehouse:
            return jsonify({"error": "Warehouse not found"}), 404
        if intermediates:
            first_label = intermediates[0].get("label")
            first_destination_warehouse = Warehouse.objects(name=first_label).first()
            second_destination_warehouse = Warehouse.objects(name=to).first()

            if not first_destination_warehouse or not second_destination_warehouse:
                return jsonify({"error": "Intermediate or destination warehouse not found"}), 404

            products = [ProductItem(**item) for item in product_data]

            shipment1 = Shipment(
                shipment_id=str(uuid.uuid4()),
                destination_store_id=str(first_destination_warehouse.id),
                products=products,
                vehicle_mode=mode,
                vehicle_count=count,
                emissions=emissions,
                vehicle_model=model,
                status=status,
                eta=eta
            )
            shipment1.save()
            # warehouse.current_shipments.append(shipment1)
            # warehouse.last_updated = datetime.utcnow()
            # warehouse.save()

            # first_destination_warehouse.current_shipments.append(shipment1)
            # first_destination_warehouse.last_updated = datetime.utcnow()
            # first_destination_warehouse.save()

            shipment2 = Shipment(
                shipment_id=str(uuid.uuid4()),
                destination_store_id=str(second_destination_warehouse.id),
                products=products,
                vehicle_mode=mode,
                vehicle_count=count,
                emissions=emissions,
                vehicle_model=model,
                status=status,
                eta=eta
            )
            shipment2.save()

            # first_destination_warehouse.current_shipments.append(shipment2)
            # first_destination_warehouse.last_updated = datetime.utcnow()
            # first_destination_warehouse.save()

            # second_destination_warehouse.current_shipments.append(shipment2)
            # second_destination_warehouse.last_updated = datetime.utcnow()
            # second_destination_warehouse.save()
            notification = WarehouseNotification(
                message=f"Shipment request from {warehouse.name} to {to} via you",
                from_warehouse=warehouse.name,
                to_warehouse = second_destination_warehouse.name,
                shipment_weight=sum([item["quantity"] for item in product_data]),
                shipment_mode_count=count,
                is_accepted=False,
                related_shipments=[shipment1, shipment2],
                related_warehouses=[warehouse,second_destination_warehouse],
            )
            first_destination_warehouse.notification_history.append(notification)
            first_destination_warehouse.save()

        else:
            destination_warehouse = Warehouse.objects(name=to).first()
            if not destination_warehouse:
                return jsonify({"error": "Destination warehouse not found"}), 404

            products = [ProductItem(**item) for item in product_data]

            shipment = Shipment(
                shipment_id=shipment_id,
                destination_store_id=str(destination_warehouse.id),
                products=products,
                vehicle_mode=mode,
                vehicle_count=count,
                emissions=emissions,
                vehicle_model=model,
                status=status,
                eta=eta
            )
            shipment.save()

            warehouse.current_shipments.append(shipment)
            warehouse.last_updated = datetime.utcnow()
            warehouse.save()

            destination_warehouse.current_shipments.append(shipment)
            destination_warehouse.last_updated = datetime.utcnow()
            destination_warehouse.save()



        return jsonify({"message": "Shipment added and linked to warehouse", "shipment_id": shipment_id}), 201

    except Exception as e:
        print(f"Error adding shipment: {str(e)}")
        return jsonify({"error": "Server error occurred"}), 500

# @app.route('/api/aiAnalysis',methods=["POST","OPTIONS"])
# @jwt_required()
# def addIntermediate():
#     try:
#         if request.method == 'OPTIONS':
#             return '', 200
#         data=request.get_json()
#         if not data:
#             return jsonify({"error":"no data provided"}),400
#         print(data)
#         prompt = f"""
#         You are a logistics optimization assistant.

#         Your task is to analyze the provided logistics data to determine the most environmentally efficient route from the origin to the destination. This includes evaluating the option of using intermediate warehouses to minimize total estimated CO2 emissions.

#         Instructions:
#         1. Evaluate both:
#            - The direct route from origin to destination as specified in the user's input.
#            - All alternative routes that pass through available intermediate warehouses.

#         2. For both the direct and optimized routes:
#            - Calculate total distance.
#            - Estimate CO2 emissions.

#         3. Compare the two routes and:
#            - Indicate whether the optimized route provides a significant reduction in emissions.
#            - If the optimized route is better, explain why and highlight the emission savings.

#         Return the optimized route (if it differs from the direct one) in JSON format with this structure:
#         ```json 
#         {{
#           "route": [
#             {{"label": "Origin", "lat": ..., "lng": ...}},
#             ...
#             {{"label": "Destination", "lat": ..., "lng": ...}}
#           ],
#           "total_distance_km": ...,
#           "estimated_co2_kg": ...
#         }}
#         ```

#         Input data:
#         {data}
#         """
        
#         response = model.generate_content(prompt)
#         path_response = response.text.strip()
#         print(path_response) 

#         return jsonify({"optimal_path": path_response})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

@app.route('/api/aiAnalysis', methods=["POST", "OPTIONS"])
@jwt_required()
def addIntermediate():
    try:
        if request.method == 'OPTIONS':
            return '', 200

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        prompt = f"""
        You are a logistics optimization assistant.

        Return ONLY the optimized route in this exact JSON format (no markdown or explanation):

        {{
        "route": [
            {{"label": "Origin", "lat": ..., "lng": ...}},
            ...
            {{"label": "Destination", "lat": ..., "lng": ...}}
        ],
        "total_distance_km": ...,
        "estimated_co2_kg": ...
        }}

        All fields must be present and use numeric values. DO NOT include markdown or extra explanation.

        Input data:
        {data}
        """


        response = model.generate_content(prompt)
        path_response = response.text.strip()

        # 🔍 Extract JSON from the response robustly
        match = re.search(r"\{[\s\S]+\}", path_response)
        if not match:
            return jsonify({"error": "Could not extract JSON from AI response"}), 500

        route_json_str = match.group()

        # 💡 Fix single quotes if Gemini used them
        route_json_str = route_json_str.replace("'", '"')

        # ✅ Now safely parse
        route_json = json.loads(route_json_str)

        # Short explanation (you can calculate direct emission properly later)
        direct_emission = 1696000
        optimized_emission = route_json.get("estimated_co2_kg")
        if optimized_emission is None:
            return jsonify({
                "error": "AI did not return emission data. Please try again or check input."
            }), 500

        diff = direct_emission - optimized_emission

        explanation = f"Optimized route saves approximately {diff:,} kg CO₂ compared to direct route."

        return jsonify({
            "route": route_json["route"],
            "total_distance_km": route_json["total_distance_km"],
            "estimated_co2_kg": route_json["estimated_co2_kg"],
            "explanation": explanation
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

        

@app.route('/api/shipments', methods=["GET"])
@jwt_required()
def shipments():
    try:
        username = get_jwt_identity()
        access = Employee.objects(user_username=username).first()
        if not access or not access.warehouse_id:
            return jsonify({"error": "Warehouse not found for user"}), 404

        current_warehouse: Warehouse = access.warehouse_id.fetch()
        current_id = current_warehouse.id

        all_shipments = Shipment.objects(
            Q(destination_store_id=current_id) |
            Q(id__in=[s.id for s in current_warehouse.current_shipments])
        )

        incoming = []
        outgoing = []

        for ship in all_shipments:
            if str(ship.destination_store_id) == str(current_id):
                source = Warehouse.objects(id__ne=current_id, current_shipments=ship).first()
                incoming.append({
                    "shipment_id": ship.shipment_id,
                    "from_warehouse": source.name if source else "Unknown",
                    "mode": ship.vehicle_mode,
                    "count": ship.vehicle_count,
                    "status": ship.status,
                    "lat": source.location.latitude if source else None,
                    "lng": source.location.longitude if source else None,
                    "emissions": ship.emissions,
                    "eta": ship.eta and ship.eta.isoformat()
                })
            else:
                dest = Warehouse.objects(id=ship.destination_store_id).first()
                outgoing.append({
                    "shipment_id": ship.shipment_id,
                    "to_warehouse": dest.name if dest else "Unknown",
                    "mode": ship.vehicle_mode,
                    "count": ship.vehicle_count,
                    "status": ship.status,
                    "lat": dest.location.latitude if dest else None,
                    "lng": dest.location.longitude if dest else None,
                    "emissions": ship.emissions,
                    "eta": ship.eta and ship.eta.isoformat(),
                })
        print(incoming)
        print(outgoing)

        return jsonify({
            "incoming": incoming,
            "outgoing": outgoing
        }), 200

    except Exception as e:
        print(f"Error in shipments endpoint: {e}")
        return jsonify({"error": "Server error"}), 500


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