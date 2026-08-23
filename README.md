# RiceDiseaseWebApp

A local full-stack application that validates a paddy leaf with YOLOv10, classifies the detected crop with ResNet18, and provides location-aware field weather through WeatherAPI.com.

Signed-in farmers can also save detections to MongoDB Atlas, store prediction images in Cloudinary, and maintain private notes for every scan.

## Inference pipeline

1. YOLOv10 must detect the checkpoint's `leaf`, `paddy leaf`, or `rice leaf` class at 70% confidence or higher.
2. The detected crop must contain a coherent green/yellow/brown plant region. This protects against the supplied detector's high-confidence predictions on random texture.
3. If either validation fails, the API returns HTTP 422 and **does not run disease classification**.
4. ResNet18 classifies only the validated leaf crop.

A generic COCO YOLOv10 checkpoint cannot replace the leaf detector because COCO has no paddy-leaf class. For research-quality out-of-distribution rejection, retrain/fine-tune the leaf detector with representative non-leaf images as negative/background training examples.

## Model locations

Copy the trained weights into these paths before starting the backend:

- `backend/trained_models/detection/best.pt`
- `backend/trained_models/classification/best_resnet18.pth`

The class order is stored in `backend/trained_models/classification/classes.json`.

The detector checkpoint must expose a `leaf`, `paddy leaf`, or `rice leaf` class. The current `best.pt` exposes `leaf`; the backend verifies this when loading and rejects an incompatible generic checkpoint.

## Backend with the existing Conda environment (Windows PowerShell)

The models were trained in the `rice` environment, which already contains the
compatible PyTorch, TorchVision, Pillow, and Ultralytics versions. Reuse that
environment and install only the missing web API packages plus version checks:

```powershell
conda activate rice
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

The weather dashboard uses a backend proxy so the WeatherAPI credential is never included in frontend JavaScript. Before starting the API, copy the example environment file and add your key:

```powershell
Copy-Item .env.example .env
```

Then edit `backend/.env`:

```text
WEATHERAPI_KEY=your_key_here
MONGODB_URI=your_atlas_connection_string
MONGODB_DATABASE=rice_disease
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET_KEY=at_least_32_random_characters
```

In MongoDB Atlas, create a database user and add your current public IP under **Network Access → IP Access List**. Do not put Cloudinary secrets or the MongoDB URI in frontend environment variables.

Weather responses are cached for 10 minutes per approximate location, and place-search responses are cached for 24 hours to conserve the free API allowance.

Do not create or activate a separate `.venv` while using Conda. The requirements
pin the known-good ML packages from `rice` and add only FastAPI, Uvicorn, and
multipart upload support. NumPy is supplied transitively by the ML stack and is
not duplicated as a direct application requirement.

API documentation is available at `http://127.0.0.1:8000/docs`.

## Frontend (Windows PowerShell)

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

During local development, Vite proxies `/api` to `http://127.0.0.1:8000` so
login cookies remain same-origin whether the frontend is opened with
`localhost` or `127.0.0.1`. A deployed frontend should proxy `/api` to the
FastAPI service as well, or set `VITE_API_BASE_URL` to its public API URL.

## Accounts and field journal

- Guest users can analyze a leaf, but the result is not saved.
- Signed-in users automatically save successful predictions and original images.
- `/history` is protected and only returns records belonging to the current user.
- Deleting a detection also removes its associated Cloudinary images.
- Access tokens are short-lived; rotated refresh tokens are stored in an HTTP-only cookie.
- Signed-in users can change their password from `/account`; all older refresh sessions are revoked.
- Forgot-password requests generate a single-use token stored only as a SHA-256 hash and expiring after 20 minutes.

Password resets use Gmail SMTP from `paddyscan.lk@gmail.com` when `SMTP_PASSWORD` contains a Google App Password. Delivery happens after the generic API response so account existence is not exposed through the response. If SMTP is not configured, local development can fall back to terminal delivery when `PASSWORD_RESET_CONSOLE=true`.

To enable Gmail delivery, turn on 2-Step Verification for the Gmail account, create a 16-character App Password, and add it to `backend/.env`:

```text
SMTP_PASSWORD=your_google_app_password
PASSWORD_RESET_CONSOLE=false
```

Never use the normal Gmail password and never commit the App Password.

For an HTTPS deployment, set `COOKIE_SECURE=true` and replace `CORS_ORIGINS` with the deployed frontend URL.

## Optional validation settings

The defaults can be adjusted with environment variables before starting Uvicorn:

```powershell
$env:LEAF_DETECTION_CONFIDENCE = "0.70"
$env:MIN_LEAF_AREA_RATIO = "0.03"
$env:MIN_LEAF_COLOUR_RATIO = "0.08"
$env:MIN_COHERENT_LEAF_RATIO = "0.03"
```
