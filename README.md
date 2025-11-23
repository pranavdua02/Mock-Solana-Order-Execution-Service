## Order Execution Engine

Mocked Solana order execution service that focuses on deterministic routing, queue-backed processing, and WebSocket lifecycle streaming—without depending on real devnet liquidity. Market orders were chosen because they model "execute now" flows that stress routing + concurrency. The same primitives can extend to limit/sniper orders by swapping the queue worker logic (price triggers or token launch watchers) while leaving the API/streaming contracts intact.

### Design Decisions

#### Order Type Selection: Market Orders
**Why Market Orders?** Market orders represent the most straightforward execution flow—immediate execution at current market price. This choice allows us to focus on core architectural concerns:
- **Routing logic**: Demonstrates real-time price comparison between DEXs
- **Concurrency handling**: Market orders arrive continuously, stressing the queue system
- **Status streaming**: Full lifecycle from submission to confirmation in seconds
- **Error handling**: Immediate failures surface quickly, testing retry mechanisms

**Extensibility**: The same engine can support limit and sniper orders by:
- **Limit orders**: Adding a price watcher that monitors DEX prices and only executes when target price is reached
- **Sniper orders**: Adding a token launch detector that triggers execution when a new mint becomes available

#### HTTP → WebSocket Upgrade Pattern
**Why this approach?** The requirement specifies a single endpoint that handles both HTTP POST and WebSocket upgrades. This design:
- **Simplifies client integration**: One URL for both submission and streaming
- **Maintains connection context**: The same HTTP connection upgrades to WebSocket, preserving any session state
- **Reduces latency**: No need for separate connection establishment after order submission
- **Follows RESTful principles**: POST for resource creation, GET/WebSocket for resource observation

#### Queue Architecture: BullMQ + Redis
**Why BullMQ?** BullMQ provides production-grade job queue management:
- **Concurrency control**: Built-in support for limiting concurrent workers (10 in our case)
- **Rate limiting**: Native support for limiting jobs per time window (100/minute)
- **Retry logic**: Exponential backoff with configurable attempts (3 attempts)
- **Job persistence**: Redis-backed storage ensures jobs survive restarts
- **Priority queues**: Foundation for future priority-based routing

**Why Redis?** Redis serves dual purpose:
- **Queue backend**: BullMQ requires Redis for job storage and coordination
- **Active order tracking**: Fast in-memory lookups for WebSocket subscriptions

#### Mock DEX Implementation
**Why mock instead of real devnet?** The requirements allow either approach. We chose mock for:
- **Deterministic testing**: Predictable price variations enable reliable test scenarios
- **Faster development**: No dependency on external DEX APIs or network conditions
- **Cost efficiency**: No devnet SOL required for testing
- **Focus on architecture**: Emphasizes system design over blockchain integration complexity

**Realistic simulation**:
- 2-3 second delays mimic real DEX API response times
- 2-5% price variation between venues reflects real market conditions
- Liquidity scores influence routing decisions (higher liquidity preferred when prices are similar)

#### Database Strategy: PostgreSQL + Redis
**PostgreSQL for persistence**:
- **Order history**: Complete audit trail of all orders, statuses, and failures
- **Post-mortem analysis**: Failure reasons stored for debugging and optimization
- **Relational integrity**: Foreign keys and constraints ensure data consistency
- **Query flexibility**: SQL enables complex analytics queries

**Redis for ephemeral data**:
- **Active subscriptions**: Fast WebSocket connection tracking
- **Queue state**: BullMQ job metadata and coordination
- **Performance**: Sub-millisecond lookups for real-time operations

#### Separation of Concerns
**Service layer architecture**:
- **OrderService**: Handles validation and initial order creation
- **DexRouter**: Isolated routing logic, easily swappable for real DEX integrations
- **OrderProcessor**: Pure business logic for order lifecycle, testable without infrastructure
- **OrderStream**: WebSocket management decoupled from order processing

**Benefits**:
- **Testability**: Each component can be tested in isolation
- **Maintainability**: Clear boundaries make code changes safer
- **Extensibility**: New order types or DEXs can be added without touching core logic

### Architecture
- Fastify + `@fastify/websocket` expose `POST /api/orders/execute` (HTTP submit) and an upgraded WebSocket on the same path for live status streaming.
- BullMQ + Redis enforce concurrency 10, rate limit 100 orders/minute, and exponential backoff (`attempts=3`) while a dedicated worker emits lifecycle events.
- Dex router mocks Raydium + Meteora quotes with realistic delays and spread, logs routing decisions, and returns settlement metadata.
- Postgres stores order history and failure reasons for post-mortems; Redis tracks active jobs.
- Order stream manager fans out status updates (`pending → routing → building → submitted → confirmed/failed`) to any WebSocket listeners; heartbeats keep long connections alive.

### Running Locally
```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run dev
# API: http://localhost:4000/api/orders/execute
# WS:  ws://localhost:4000/api/orders/execute?orderId=<uuid from POST>
```

### Tests & Tooling
- `npm test` (15 unit tests covering router, order service, processor, and WebSocket lifecycle)
- `npm run lint`
- Postman collection: `postman/OrderExecution.postman_collection.json`

### Extending Order Types
- **Limit orders**: enqueue the request but pause execution until the router reports price ≤ user target, then reuse the same transaction builder.
- **Sniper orders**: plug a launch-detection listener ahead of the queue to auto-release jobs when a mint becomes live, streaming the identical statuses back to clients.

### Deploying
The provided Dockerfile builds the TypeScript project; combine with the `docker-compose.yml` or any hosting provider (Fly.io, Render, Railway) pointing to the same Postgres/Redis services. Document the resulting public URL + screencast link in this README once deployed.*** End Patch


