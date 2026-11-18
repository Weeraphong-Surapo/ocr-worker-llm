# Thai OCR Service API

REST API สำหรับอ่านข้อความภาษาไทยจาก PDF และ Image โดยใช้ Node.js เป็น API layer และ Python PaddleOCR เป็น OCR engine

## Architecture

```text
Client -> Node.js API -> Redis/BullMQ -> Python OCR Engine -> GPU
                              |
                         PostgreSQL
```

## Components

- Node.js 22 + TypeScript + Express
- Zod + Multer
- Redis + BullMQ
- PostgreSQL
- Python + FastAPI + PaddleOCR
- PP-OCRv5 Thai: `th_PP-OCRv5_mobile_rec`
- PyMuPDF สำหรับ PDF
- Docker Compose / Coolify Compose

## API

```text
POST /api/v1/documents
GET  /api/v1/documents/:id
GET  /api/v1/documents/:id/status
GET  /api/v1/documents/:id/result
POST /api/v1/documents/:id/reprocess
GET  /api/v1/health
GET  /api/v1/health/gpu
GET  /api/docs
```

## Local

```bash
npm install
npm run typecheck
npm run build
npm test
docker compose up -d --build
./e2e/run.sh
```

Swagger UI:

```text
http://localhost:3300/api/docs
```

## Coolify

ใช้ไฟล์ `docker-compose.coolify.yml` และตั้งค่าอย่างน้อย:

```text
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
```

Coolify production ต้องรันบน Ubuntu Server ที่ติดตั้ง NVIDIA driver, NVIDIA Container Toolkit และมี GPU ที่ Docker มองเห็นได้
