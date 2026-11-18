## Deploy with Coolify

Use `docker-compose.coolify.yml` as the Compose file.

Required Coolify environment variables:

```text
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
```

Optional variables:

```text
MAX_UPLOAD_MB=20
MAX_PDF_PAGES=50
```

Coolify settings:

- Expose only the `api` service on container port `3000`.
- Do not expose `postgres`, `redis`, or `ocr-engine` publicly.
- Deploy on a host with NVIDIA driver >= 550.54.14 and NVIDIA Container Toolkit.
- Confirm Docker Compose GPU support with `docker run --gpus all ...` before deployment.
- Keep persistent volumes `postgres_data` and `redis_data`.
- Use a domain/HTTPS proxy for the `api` service.

The `ocr-engine` service uses the real PaddleOCR GPU container and `OCR_DEVICE=gpu:0`. The local `docker-compose.yml` uses an OCR stub for API E2E tests; do not use that file for production OCR deployment.

After deployment, verify:

```bash
curl https://YOUR_DOMAIN/api/v1/health
curl https://YOUR_DOMAIN/api/v1/health/gpu
```
