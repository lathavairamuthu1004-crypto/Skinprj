from fastapi import APIRouter, Depends, HTTPException
from ..models import Report, AnalysisResult
from ..database import db
from ..auth import get_current_user
from ..detection import detection_engine
from typing import List
from datetime import datetime

router = APIRouter()

@router.post("/analyze")
async def analyze_skin(image_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can perform analysis")
    
    base64_image = image_data.get("image")
    if not base64_image:
        raise HTTPException(status_code=400, detail="Image data is required")
    
    # AI Detection
    analysis = await detection_engine.analyze_image(base64_image)
    
    # Save Report
    report = {
        "patient_id": str(current_user["_id"]),
        "patient_name": current_user["name"],
        "image_data": base64_image,
        "analysis": analysis,
        "timestamp": datetime.utcnow(),
        "reviews": []
    }
    
    result = await db.reports.insert_one(report)
    return {"report_id": str(result.inserted_id), "analysis": analysis}

@router.get("/reports")
async def get_patient_reports(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can view their reports")
    
    cursor = db.reports.find({"patient_id": str(current_user["_id"])}).sort("timestamp", -1)
    reports = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        reports.append(doc)
    return reports
