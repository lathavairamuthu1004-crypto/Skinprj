# SkinMorph - AI Dermatological Diagnostic System

SkinMorph is a high-standard, deep-learning powered skin disease detection platform designed to bridge the gap between AI diagnostics and expert clinical review.

## 🚀 Features

- **Deep Learning Detection**: Identifies 25+ skin conditions with high-precision simulation.
- **Dual Portal System**:
  - **Patients**: Captures images, receives instant AI reports, and tracks history.
  - **Dermatologists**: Reviews patient cases, submits clinical assessments, and manages patient lists.
- **Clinical Feedback Loop**: Seamless interaction where doctors provide reviews on AI reports.
- **Premium UI**: Glassmorphic design, smooth animations (Framer Motion), and responsive layout.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: FastAPI (Python), MongoDB (Motor), JWT Authentication.
- **Database**: MongoDB.

## 📋 25+ Diseases Detected (Included)
1. Melanoma
2. Basal Cell Carcinoma
3. Squamous Cell Carcinoma
4. Actinic Keratosis
5. Acne Vulgaris
6. Eczema
7. Psoriasis
8. Rosacea
... and 18 more.

## 🏃 Getting Started

### 1. Prerequisites
- Python 3.9+
- Node.js & npm
- MongoDB (Running on `localhost:27017`)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 🧠 Training the Skin Disease Model (with your dataset)

SkinMorph can use a real CNN classifier (ResNet18 transfer learning). Your dataset must be in **ImageFolder** format:

- `dataset_root/<CLASS_NAME>/*.jpg|png|jpeg`
- Example:
  - `dataset_root/Acne Vulgaris/img001.jpg`
  - `dataset_root/Eczema (Atopic Dermatitis)/img010.jpg`

To train:

```bash
cd backend
python train_model.py --data "C:\path\to\dataset_root" --epochs 12 --batch 32 --lr 0.0003 --val 0.15
```

This produces:
- `backend/app/skin_classifier.pt`
- `backend/app/skin_classifier_classes.json`

The backend endpoint `POST /patient/analyze` will automatically use these files **if present** (otherwise it falls back to the prototype-based matcher).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔒 Default Login (Example)
1. **Signup** as a Patient.
2. **Signup** as a Dermatologist.
3. Patient uploads a skin photo.
4. Dermatologist logs in and provides clinical feedback.
