from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from fastapi.responses import HTMLResponse
from fastapi import FastAPI, APIRouter,Request
from services.googleFitService import fetch_steps, fetch_heart_rate, fetch_sleep, fetch_oxygen
from fastapi import FastAPI
from routes.google_oauth import api_router as google_oauth_router

app = FastAPI()
app.include_router(google_oauth_router, prefix="/auth")


security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        # Fetch the user document from your database (MongoDB in your case)
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # user now contains user info including Google OAuth tokens if stored
        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
# Google Gemini client
import google.generativeai as genai

# --- Load .env Variables ---
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# --- Set Up Logging ---
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# --- MongoDB ---
mongo_url = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
client_db = AsyncIOMotorClient(mongo_url)
db = client_db[os.environ.get('DB_NAME', 'carecompanion_db')]

# --- Security ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get("JWT_SECRET", "carecompanion_jwt_secret_key_2024_secure_random")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.environ.get("JWT_EXPIRATION_MINUTES", 1440))

# --- Gemini ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-pro")
if not GEMINI_API_KEY:
    raise Exception("❌ GEMINI_API_KEY missing in .env — add GEMINI_API_KEY=<your-key>")
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel(GEMINI_MODEL)

# --- FastAPI & Router ---
app = FastAPI()
api_router = APIRouter(prefix="/api")
app.include_router(api_router)

@api_router.get("/oauth2callback", response_class=HTMLResponse)
async def oauth2callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        return HTMLResponse(content="Missing authorization code", status_code=400)

    token_endpoint = "https://oauth2.googleapis.com/token"

    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(token_endpoint, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
            response.raise_for_status()
        except httpx.HTTPError as e:
            logging.error(f"Token exchange failed: {e}")
            return HTMLResponse(content=f"Token exchange failed: {str(e)}", status_code=500)

    token_data = response.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in")

    # TODO: Save access_token and refresh_token securely in your DB associated with logged-in user

    return HTMLResponse(content="Google Fit connected! You can close this window.")

@api_router.get("/vitals/steps")
async def get_steps(current_user: dict = Depends(get_current_user)):
    # Assume current_user from JWT + DB contains Google tokens saved as fields
    access_token = current_user.get("google_access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Missing Google access token")

    data = await fetch_steps(access_token)
    return {"steps": data}

@api_router.get("/vitals/heartrate")
async def get_heart_rate(current_user: dict = Depends(get_current_user)):
    access_token = current_user.get("google_access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Missing Google access token")

    data = await fetch_heart_rate(access_token)
    return {"heartRate": data}

@api_router.get("/vitals/sleep")
async def get_sleep(current_user: dict = Depends(get_current_user)):
    access_token = current_user.get("google_access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Missing Google access token")

    data = await fetch_sleep(access_token)
    return {"sleep": data}

@api_router.get("/vitals/oxygen")
async def get_oxygen(current_user: dict = Depends(get_current_user)):
    access_token = current_user.get("google_access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Missing Google access token")

    data = await fetch_oxygen(access_token)
    return {"oxygen": data}


# --- Models ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    age: Optional[int] = None
    specialization: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    age: Optional[int] = None
    specialization: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class VitalCreate(BaseModel):
    heart_rate: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    oxygen_saturation: Optional[int] = None
    sleep_hours: Optional[float] = None
    activity_minutes: Optional[int] = None
    notes: Optional[str] = None

class Vital(BaseModel):
    id: str
    user_id: str
    heart_rate: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    oxygen_saturation: Optional[int] = None
    sleep_hours: Optional[float] = None
    activity_minutes: Optional[int] = None
    notes: Optional[str] = None
    timestamp: str

class RiskScore(BaseModel):
    id: str
    user_id: str
    score: float
    risk_level: str
    factors: List[str]
    recommendations: List[str]
    timestamp: str

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    scheduled_time: str
    reason: str

class Appointment(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    scheduled_time: str
    reason: str
    status: str
    created_at: str

# --- Helpers ---
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def calculate_risk_score(user_id: str) -> Dict[str, Any]:
    vitals = await db.vitals.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).limit(7).to_list(7)
    if not vitals:
        return {
            "score": 0.0,
            "risk_level": "low",
            "factors": ["No vitals data available"],
            "recommendations": ["Please log your vitals regularly for accurate monitoring"]
        }

    score = 0
    factors: List[str] = []
    latest_vital = vitals[0]
    hr = latest_vital.get("heart_rate")
    if hr and (hr < 60 or hr > 100):
        factors.append(f"Abnormal heart rate: {hr} bpm")
        score += 15
    sys_bp = latest_vital.get("blood_pressure_systolic")
    dia_bp = latest_vital.get("blood_pressure_diastolic")
    if sys_bp and dia_bp and (sys_bp > 140 or dia_bp > 90):
        factors.append(f"Elevated blood pressure: {sys_bp}/{dia_bp}")
        score += 20
    temp = latest_vital.get("temperature")
    if temp and (temp < 36.1 or temp > 37.8):
        factors.append(f"Abnormal temperature: {temp}°C")
        score += 25
    o2 = latest_vital.get("oxygen_saturation")
    if o2 and o2 < 95:
        factors.append(f"Low oxygen saturation: {o2}%")
        score += 30
    sleep = latest_vital.get("sleep_hours")
    if sleep and sleep < 6:
        factors.append(f"Insufficient sleep: {sleep} hours")
        score += 10

    if score >= 50: risk_level = "high"
    elif score >= 25: risk_level = "medium"
    else: risk_level = "low"

    recommendations = []
    if risk_level == "high":
        recommendations = ["Schedule urgent doctor consultation", "Monitor vitals closely"]
    elif risk_level == "medium":
        recommendations = ["Schedule check-up in 24-48 hours", "Rest and monitor symptoms"]
    else:
        recommendations = ["Continue regular monitoring", "Maintain healthy lifestyle"]
    if not factors:
        factors.append("All vitals within normal range")

    return {"score": round(score, 2), "risk_level": risk_level, "factors": factors, "recommendations": recommendations}

# --- Auth Routes ---
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    logging.info(f"Register called for {user_data.email}")
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "role": user_data.role,
        "age": user_data.age,
        "specialization": user_data.specialization,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_access_token({"user_id": user_id, "role": user_data.role})
    user_out = {k: v for k, v in user_doc.items() if k != "password"}
    return TokenResponse(access_token=token, token_type="bearer", user=User(**user_out))

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    logging.info(f"Login called for {credentials.email}")
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"user_id": user["id"], "role": user["role"]})
    user_out = {k: v for k, v in user.items() if k != "password"}
    return TokenResponse(access_token=token, token_type="bearer", user=User(**user_out))

# --- Vitals ---
@api_router.post("/vitals", response_model=Vital)
async def create_vital(vital_data: VitalCreate, current_user: dict = Depends(get_current_user)):
    logging.info(f"Log Vitals for user {current_user['id']}")
    vital_id = str(uuid.uuid4())
    vital_doc = {
        "id": vital_id,
        "user_id": current_user["id"],
        **vital_data.model_dump(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.vitals.insert_one(vital_doc)
    risk_data = await calculate_risk_score(current_user["id"])
    risk_doc = {"id": str(uuid.uuid4()), "user_id": current_user["id"], **risk_data, "timestamp": datetime.now(timezone.utc).isoformat()}
    await db.risk_scores.insert_one(risk_doc)
    return Vital(**vital_doc)

@api_router.get("/vitals", response_model=List[Vital])
async def get_vitals(current_user: dict = Depends(get_current_user)):
    vitals = await db.vitals.find({"user_id": current_user["id"]}, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)
    return [Vital(**v) for v in vitals]

# --- Risk Score ---
@api_router.get("/risk-score/latest", response_model=RiskScore)
async def get_latest_risk(current_user: dict = Depends(get_current_user)):
    risk = await db.risk_scores.find_one({"user_id": current_user["id"]}, {"_id": 0}, sort=[("timestamp", -1)])
    if not risk:
        risk_data = await calculate_risk_score(current_user["id"])
        risk = {"id": str(uuid.uuid4()), "user_id": current_user["id"], **risk_data, "timestamp": datetime.now(timezone.utc).isoformat()}
        await db.risk_scores.insert_one(risk)
    return RiskScore(**risk)

# --- Doctor endpoints ---
@api_router.get("/doctor/patients", response_model=List[User])
async def get_patients_for_doctor(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")
    patients_cursor = db.users.find({"role": "patient"}, {"_id": 0})
    patients = await patients_cursor.to_list(100)
    return [User(**p) for p in patients]

@api_router.get("/doctor/patients/{patient_id}/vitals", response_model=List[Vital])
async def get_patient_vitals(patient_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")
    vitals = await db.vitals.find({"user_id": patient_id}, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)
    return [Vital(**v) for v in vitals]

# --- Appointments ---
@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appt_data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    patient = await db.users.find_one({"id": appt_data.patient_id})
    doctor = await db.users.find_one({"id": appt_data.doctor_id})
    if not patient or not doctor:
        raise HTTPException(status_code=404, detail="Patient or doctor not found")
    appt_doc = {
        "id": str(uuid.uuid4()),
        "patient_id": appt_data.patient_id,
        "patient_name": patient["full_name"],
        "doctor_id": appt_data.doctor_id,
        "doctor_name": doctor["full_name"],
        "scheduled_time": appt_data.scheduled_time,
        "reason": appt_data.reason,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.appointments.insert_one(appt_doc)
    return Appointment(**appt_doc)

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "patient":
        query = {"patient_id": current_user["id"]}
    elif current_user.get("role") == "doctor":
        query = {"doctor_id": current_user["id"]}
    else:
        query = {}
    appts = await db.appointments.find(query, {"_id": 0}).sort("scheduled_time", -1).to_list(50)
    return [Appointment(**a) for a in appts]

# --- Chat with Gemini Robust ---
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(chat_msg: ChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        logging.info(f"POST /api/chat by {current_user['id']}")
        session_id = f"{current_user['id']}_chat"
        system_prompt = """
You are CareCompanion — an empathetic AI for discharged patients.
- Give medical guidance, diet tips, mental support.
- Explain simply, like a caring nurse.
- If emergency signs exist, clearly advise immediate medical attention.
"""
        final_prompt = system_prompt + "\nUser: " + chat_msg.message
        response = gemini_model.generate_content(final_prompt)

        reply_text = getattr(response, "text", None)
        if reply_text is None:
            if hasattr(response, "candidates") and response.candidates:
                reply_text = response.candidates[0].text
            elif hasattr(response, "content"):
                reply_text = response.content
            else:
                reply_text = str(response)
        reply_text = reply_text.strip() if reply_text else "Sorry, no response generated."
        chat_doc = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "message": chat_msg.message,
            "response": reply_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chats.insert_one(chat_doc)
        return ChatResponse(response=reply_text, session_id=session_id)
    except Exception as e:
        logging.error(f"Chat Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {e}")

# --- Root and Middleware Registration ---
@api_router.get("/")
async def root():
    return {"message": "CareCompanion API live ✅ (Gemini Enabled)"}

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client_db.close()
