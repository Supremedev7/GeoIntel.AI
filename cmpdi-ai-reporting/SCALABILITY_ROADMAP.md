# GeoIntel Core — Enterprise Scalability Roadmap

**Project:** GeoIntel Core | **Team:** Data Miners | **SIH 2026 — PS SIH26023**

---

## Vision

Build an efficient, scalable foundation for future digital transformation initiatives within each CIL subsidiary and the Ministry of Coal — as specified in SIH26023 Objective 3.

---

## Phase 1: Current State (Hackathon MVP) ✅

| Component | Technology | Capacity |
|:---|:---|:---|
| Vector Store | ChromaDB (single-node, persistent) | ~5,000 chunks |
| Backend | FastAPI (single instance) | ~50 concurrent users |
| Frontend | React 18 + Vite SPA | Client-side rendering |
| Document Formats | PDF, XLSX, CSV, Images (OCR) | 100+ documents |
| LLM Inference | Groq Cloud API | Rate-limited by API tier |
| Deployment | Docker + Docker Compose | Single server |

**Sufficient for:** CMPDI Ranchi HQ + SIH demonstration

---

## Phase 2: Distributed Vector Store (Post-Hackathon, 3 months)

### Objective
Scale document capacity from 5K to 500K+ chunks.

### Changes
- **Migrate ChromaDB → Qdrant** (or Milvus) for distributed vector search
  - Qdrant supports horizontal sharding, replication, and filtering
  - Migration script: export ChromaDB → Qdrant bulk import
- **Add Redis** for analytics caching (replace `analytics_cache.json`)
- **Implement connection pooling** for Groq API clients

### Architecture
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  FastAPI      │────▶│  Qdrant Cluster │
│  (Nginx served) │     │  (Gunicorn)   │     │  (3-node)       │
└─────────────────┘     │              │     └─────────────────┘
                        │              │────▶│  Redis Cache    │
                        └──────────────┘     └─────────────────┘
```

**Target capacity:** 10,000+ documents, 500K+ chunks, ~200 concurrent users

---

## Phase 3: Multi-Tenant RBAC (6 months)

### Objective
Isolate data and access per CIL subsidiary.

### Changes
- **Add PostgreSQL** for user management, session tracking, and audit logs
- **Implement JWT authentication** with role-based access control (RBAC)
- **Tenant isolation:** Separate ChromaDB/Qdrant collections per subsidiary
- **API key management:** Server-side encrypted key vault (no more localStorage)

### User Roles
| Role | Access |
|:---|:---|
| `viewer` | Query, view reports, browse repository |
| `analyst` | All viewer + generate reports + upload documents |
| `admin` | All analyst + manage users + configure system |
| `super_admin` | Cross-subsidiary access + system configuration |

### Subsidiary Tenants
- CMPDI HQ, ECL, BCCL, CCL, WCL, SECL, MCL, NCL, NEC
- Each tenant gets isolated vector namespace + document storage

**Target:** 9 CIL subsidiaries operating independently with shared infrastructure

---

## Phase 4: CI/CD Pipeline (9 months)

### Objective
Automated testing, building, and deployment.

### Pipeline
```
GitHub Push → GitHub Actions → Lint + Test → Docker Build → 
  → Push to Registry → Deploy to Staging → Smoke Test → 
    → Promote to Production (manual gate)
```

### Components
- **GitHub Actions** workflow for CI (lint, pytest, build)
- **Container Registry** (Docker Hub or GCR)
- **Kubernetes** deployment manifests (or Docker Swarm for simplicity)
- **Blue-green deployment** for zero-downtime updates
- **Automated backup** for vector store and document storage

---

## Phase 5: Observability & Monitoring (12 months)

### Objective
Production-grade monitoring and alerting.

### Stack
- **Prometheus** — Metrics collection (API latency, query throughput, error rates)
- **Grafana** — Dashboard visualization
- **Loki** — Log aggregation
- **Alertmanager** — Critical alerts (API down, disk full, high error rate)

### Key Metrics
| Metric | SLO |
|:---|:---|
| API p99 latency | < 5 seconds |
| Uptime | 99.5% |
| Query accuracy (benchmark) | > 90% |
| Document ingestion success rate | > 99% |
| Report generation success rate | > 95% |

---

## Summary Timeline

| Phase | Timeline | Key Deliverable |
|:---|:---|:---|
| Phase 1 | ✅ Complete | Working MVP with Docker deployment |
| Phase 2 | Month 1–3 | Distributed vector store, Redis caching |
| Phase 3 | Month 4–6 | Multi-tenant auth, subsidiary isolation |
| Phase 4 | Month 7–9 | CI/CD pipeline, automated deployment |
| Phase 5 | Month 10–12 | Monitoring, alerting, SLO tracking |

This roadmap ensures GeoIntel Core can scale from a hackathon prototype to a production-grade enterprise platform serving all CIL subsidiaries and the Ministry of Coal.
