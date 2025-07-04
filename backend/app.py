from flask import Flask
from datetime import timedelta
from flask_cors import CORS, cross_origin
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, set_access_cookies,
    set_refresh_cookies, unset_jwt_cookies
)

app = Flask(__name__)
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

@app.route('/')
def home():
    return 'Hello, Flask!'

if __name__ == '__main__':
    app.run(debug=True)
