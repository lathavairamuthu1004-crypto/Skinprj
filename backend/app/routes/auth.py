from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from ..models import UserCreate, User, Token
from ..database import db
from ..auth import get_password_hash, verify_password, create_access_token
from bson import ObjectId

router = APIRouter()

@router.post("/signup", response_model=User)
async def signup(user: UserCreate):
    print(f"DEBUG: Received signup request for {user.email}")
    try:
        existing_user = await db.users.find_one({"email": user.email})
        print(f"DEBUG: Existing user check done: {existing_user is not None}")
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_dict = user.dict()
        user_dict["password"] = get_password_hash(user_dict["password"])
        
        print(f"DEBUG: Inserting user into MongoDB...")
        result = await db.users.insert_one(user_dict)
        print(f"DEBUG: User inserted with ID {result.inserted_id}")
        
        user_dict["_id"] = str(result.inserted_id)
        return user_dict
    except Exception as e:
        print(f"DEBUG: Signup ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}
