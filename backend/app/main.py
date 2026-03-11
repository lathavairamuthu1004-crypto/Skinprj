from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, patient, doctor
from .database import db

app = FastAPI(title="SkinMorph API", description="AI Skin Disease Detection System")

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patient.router, prefix="/api/patient", tags=["Patient"])
app.include_router(doctor.router, prefix="/api/doctor", tags=["Dermatologist"])

@app.get("/")
async def root():
    return {"message": "Welcome to SkinMorph API - The Future of Dermatology AI"}
