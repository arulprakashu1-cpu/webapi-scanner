# Stage 1: build React frontend
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG VITE_PRO_URL=https://webapi-scanner-production.up.railway.app
ENV VITE_PRO_URL=$VITE_PRO_URL
RUN npm run build

# Stage 2: Python backend + frontend assets
FROM python:3.12-slim
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend /app/frontend/dist /app/frontend_dist

ENV PORT=8000
CMD uvicorn src.main:app --host 0.0.0.0 --port $PORT
