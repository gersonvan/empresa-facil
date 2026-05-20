---
title: Backend Technology Comparison - Scalability Analysis
created: May 20, 2026
---

# Backend Technology Comparison for EmpresaFacil

## Workload Characteristics

- **~100 concurrent users**
- **~500 companies total** (100 users × 5 companies avg)
- **~500k events/month** (500 companies × 1000 events)
- **Sync pattern**: Frequent short bursts (push + pull on mobile, periodic on desktop)
- **Read-heavy**: Mostly queries for sync deltas, audit trails, projections
- **Write pattern**: Append-only events (no updates to individual records)

---

## Option 1: Node.js + Express/Fastify

### Architecture
```
Fastify + PostgreSQL (or Neon for serverless)
├── POST /sync/push
├── GET /sync/pull
├── GET /export
└── Projections (read replicas or cache)
```

### Advantages
✅ **Non-blocking I/O**: Handles high concurrency with single thread (event loop)  
✅ **JavaScript full-stack**: Reuse code between frontend (React) and backend  
✅ **Fast JSON serialization**: Native support for event payloads  
✅ **Lightweight**: Low memory overhead per connection (~2-5 MB)  
✅ **Excellent for I/O-bound workloads**: Sync operations are mostly DB reads/writes  
✅ **Horizontal scaling**: Stateless; easy to load balance  
✅ **Ecosystem**: Express, Fastify, TypeORM, Prisma, Bull (job queue)  

### Performance Profile (Estimated)
| Metric | Value |
|--------|-------|
| **Throughput** | 5k-10k req/s per instance (sync operations) |
| **Latency (p50)** | 50-100ms (push + DB write + ACK) |
| **Latency (p99)** | 200-500ms |
| **Memory per connection** | ~2-3 MB |
| **Max concurrent** | 10k+ on 2GB RAM |
| **Startup time** | < 1s |

### Scalability
```
Single instance: 100-500 concurrent users ✓
Cluster (3x): 300-1500 concurrent users ✓✓
Serverless (Functions): Excellent for event spikes
```

### Cost (AWS/similar)
- **Compute**: t3.small ($20/mo) handles 100-200 users
- **Database**: PostgreSQL t3.micro ($30/mo) or managed (Aurora Serverless)
- **Total**: ~$50-150/mo for 100 users

### Deployment
- Docker, Kubernetes, Railway, Render, Fly.io, Vercel (with serverless)
- Cold start: ~1-2s (acceptable for sync operations)

---

## Option 2: Python + FastAPI

### Architecture
```
FastAPI + PostgreSQL (async drivers)
├── POST /sync/push
├── GET /sync/pull
└── SQLAlchemy (async)
```

### Advantages
✅ **async/await native**: Excellent for I/O-bound operations  
✅ **Type safety**: Pydantic for automatic validation  
✅ **Rich data science ecosystem**: If future analytics needed  
✅ **Readable code**: Strong emphasis on clarity  
✅ **Good ORM**: SQLAlchemy with async support  

### Performance Profile (Estimated)
| Metric | Value |
|--------|-------|
| **Throughput** | 3k-7k req/s per instance |
| **Latency (p50)** | 80-150ms |
| **Latency (p99)** | 300-700ms |
| **Memory per connection** | ~5-10 MB (higher than Node) |
| **Max concurrent** | 5k-8k on 2GB RAM |
| **Startup time** | 2-5s |

### Scalability
```
Single instance: 50-200 concurrent users (with optimization) ~
Cluster (3x): 150-600 concurrent users ~
Serverless: Slower cold starts hurt mobile users
```

### Cost (AWS/similar)
- **Compute**: t3.small ($20/mo) handles 50-100 users
- **Database**: PostgreSQL t3.micro ($30/mo)
- **Total**: ~$50-150/mo (similar to Node, but needs larger instances)

### Deployment
- Docker, Kubernetes, Railway, Render
- Cold start: ~3-5s (noticeable for mobile users)

---

## Option 3: Go + Gin/Echo

### Architecture
```
Gin/Echo + PostgreSQL
├── Compiled binary
├── Single thread per request (goroutines)
└── Connection pooling
```

### Advantages
✅ **Ultra-fast compilation**: Binary starts instantly  
✅ **Goroutines**: Millions of concurrent connections easily  
✅ **Lowest memory footprint**: ~1-2 MB per connection  
✅ **Highest throughput**: Can handle 10k-50k req/s  
✅ **Deploy anywhere**: Single static binary  

### Performance Profile (Estimated)
| Metric | Value |
|--------|-------|
| **Throughput** | 10k-50k req/s per instance |
| **Latency (p50)** | 20-50ms |
| **Latency (p99)** | 100-200ms |
| **Memory per connection** | ~1 MB |
| **Max concurrent** | 50k+ on 2GB RAM |
| **Startup time** | < 100ms |

### Scalability
```
Single instance: 500-2000+ concurrent users ✓✓✓
Cluster (2x): 1k-4k concurrent users
Serverless: Excellent (instant cold start)
```

### Cost (AWS/similar)
- **Compute**: t3.micro ($10/mo) handles 100-200 users
- **Database**: PostgreSQL t3.micro ($30/mo)
- **Total**: ~$40-100/mo (cheapest)

### Deployment
- Docker, Kubernetes, Lambda, Cloud Run
- Static binary: Deploy anywhere

---

## Comparison Table

| Criteria | Node.js | Python | Go |
|----------|---------|--------|-----|
| **Throughput (req/s)** | 5k-10k | 3k-7k | 10k-50k |
| **Memory/conn** | 2-3 MB | 5-10 MB | 1 MB |
| **Latency (p99)** | 200-500ms | 300-700ms | 100-200ms |
| **Max concurrent** | 10k+ | 5k-8k | 50k+ |
| **Startup time** | 1s | 3-5s | <100ms |
| **Learning curve** | Low (JS) | Medium (async) | Medium (Go) |
| **Ecosystem** | Excellent | Good | Good |
| **DevOps ease** | Easy | Medium | Easy |
| **Cost/instance** | Low | Low | Very low |
| **Frontend sync** | Native (JS) | REST | REST |

---

## Recommendation for EmpresaFacil

### **FOR MVP (First 100 users): Node.js + FastAPI**

**Why Node.js wins here:**
1. **Perfect for sync operations**: All reads/writes are I/O-bound
2. **Full-stack JavaScript**: Share validation, types, models with frontend
3. **Dev speed**: Rapid iteration, great DX
4. **Scalable without pain**: Add more instances behind load balancer
5. **Cost-effective**: t3.small ($20/mo) handles your 100 users

**Architecture:**
```
Frontend (React + IndexedDB)
    ↓ HTTPS
FastAPI server (1-2 instances)
    ↓
PostgreSQL (managed: RDS or Neon)
    ↓
Redis (optional, for caching projections)
```

**Estimated capacity:**
- Single instance: 100-200 users
- 2 instances (load balanced): 200-400 users
- 3+ instances: Scales linearly

### **FOR FUTURE SCALE (500+ users): Consider Go or Rust**

If you hit scaling limits with Node (unlikely before 500+ concurrent users):
- **Go**: Lowest operational cost, instant deploy, easiest horizontal scaling
- **Rust**: Absolute peak performance, but steeper learning curve

---

## Implementation Strategy

### Phase 1: MVP (Weeks 1-2)
- **Backend**: Node.js + Fastify + PostgreSQL
- **Why**: Fastest to iterate, reuse JS knowledge, sync operations are I/O-heavy
- **Deployment**: Railway or Render (both free tier suitable for MVP)

### Phase 2: Optimize (Weeks 3-4)
- Add Redis for caching event projections (dramatically faster pulls)
- Implement batch sync (reduce request count)
- Monitor performance with New Relic or Datadog

### Phase 3: Scale (Months 2-3)
- If needed, consider Go rewrite for specific high-throughput components
- But honestly, Node.js will be fine for 100-300 users with Redis caching

---

## Database Choice (PostgreSQL)

**Events table:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  aggregate_id VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  timestamp BIGINT NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_version INT DEFAULT 1,
  payload JSONB NOT NULL,
  reason VARCHAR(255),
  synced_at BIGINT,
  
  INDEX (aggregate_id, timestamp),
  INDEX (timestamp),
  INDEX (aggregate_type),
  INDEX (device_id)
);
```

**Why PostgreSQL:**
- JSONB for flexible event payloads
- Full-text search (future)
- JSON aggregation (build projections via SQL)
- ACID transactions
- Scales to millions of events easily
- Managed options (Neon, Supabase, RDS) for serverless

---

## Bottom Line

| Scenario | Recommendation |
|----------|---|
| **Want fastest MVP** | Node.js + Fastify |
| **Want lowest cost** | Go + Gin |
| **Want best all-rounder** | Node.js |
| **Want proven at scale** | Go |
| **Need Python team** | FastAPI |

**For you (100 users, MVP now):** 
→ **Node.js + PostgreSQL**

- Fast iteration
- Reuse JS from frontend
- Scales to 500+ users without rearchitecting
- Deploy on Railway/Render for free tier MVP
- Transition to Go only if you hit actual performance limits
