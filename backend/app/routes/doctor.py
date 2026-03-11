from fastapi import APIRouter, Depends, HTTPException
from ..models import Review
from ..database import db
from ..auth import get_current_user
from typing import List
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.get("/patients")
async def list_all_patients_reports(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "dermatologist":
        raise HTTPException(status_code=403, detail="Only dermatologists can view all patients")
    
    # In a real app, you might group these or filter. 
    # For now, show all reports from all patients.
    cursor = db.reports.find().sort("timestamp", -1)
    reports = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        reports.append(doc)
    return reports

@router.post("/review/{report_id}")
async def add_review(report_id: str, review_content: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "dermatologist":
        raise HTTPException(status_code=403, detail="Only dermatologists can provide reviews")
    
    content = review_content.get("content")
    if not content:
        raise HTTPException(status_code=400, detail="Review content is required")
    
    review = {
        "doctor_id": str(current_user["_id"]),
        "doctor_name": current_user["name"],
        "content": content,
        "timestamp": datetime.utcnow()
    }
    
    result = await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$push": {"reviews": review}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"message": "Review added successfully", "review": review}
