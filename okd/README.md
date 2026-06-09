# DCCheck — OKD Deployment Guide

## Prerequisites

- `oc` CLI logged in to the OKD cluster
- Access to `registry.intranet` container registry
- Target namespace/project created: `oc new-project dccheck`

---

## 1. Build and Push Images

```bash
# Backend
docker build -t registry.intranet/dccheck/backend:latest ./backend
docker push registry.intranet/dccheck/backend:latest

# Frontend
docker build -t registry.intranet/dccheck/frontend:latest ./frontend
docker push registry.intranet/dccheck/frontend:latest
```

---

## 2. Configure Secrets

Edit `okd/secret.yaml` and replace all `CHANGE_ME` placeholder values with real credentials before applying:

- `DATABASE_URL` — full connection string including password
- `SECRET_KEY` — at least 32 random characters (e.g. `openssl rand -hex 32`)
- `SMTP_PASSWORD` — SMTP account password
- `SMTP_USER`, `SMTP_FROM`, `GESTOR_EMAIL` — adjust to your environment

> **Never commit a secret.yaml with real credentials to version control.**

---

## 3. Apply All Resources

### Using Kustomize (recommended)

```bash
oc apply -k okd/
```

### Or apply individually

```bash
oc apply -f okd/configmap.yaml
oc apply -f okd/secret.yaml
oc apply -f okd/pvc-fotos.yaml
oc apply -f okd/deployment-backend.yaml
oc apply -f okd/deployment-frontend.yaml
oc apply -f okd/service-backend.yaml
oc apply -f okd/service-frontend.yaml
oc apply -f okd/route.yaml
```

---

## 4. Run Database Migrations

Wait for the backend pod to be running, then execute Alembic migrations inside the container:

```bash
# Get the backend pod name
POD=$(oc get pod -l app=dccheck-backend -o jsonpath='{.items[0].metadata.name}')

# Run migrations
oc exec $POD -- alembic upgrade head
```

---

## 5. Verify Deployment

```bash
# Check pod status
oc get pods

# Check the route
oc get route dccheck

# Tail backend logs
oc logs -l app=dccheck-backend -f
```

The application will be available at: `http://dccheck.smart.intranet` (redirected to HTTPS if TLS is configured).

---

## 6. Updating Images

After pushing a new image to the registry, trigger a rollout:

```bash
oc rollout restart deployment/dccheck-backend
oc rollout restart deployment/dccheck-frontend
```
