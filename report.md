
# Production-Ready Observability for Custom Web App

## 1. System Architecture and Containerization

The web application is structured for reliability and maintainability using Docker Compose. The architecture consists of:
- **Backend:** Node.js application (see Dockerfile.backend)
- **Frontend:** Static site served by Nginx (see Dockerfile.frontend)
- **Database:** MongoDB official image
- **Observability:** Prometheus (metrics), Grafana (visualization), Node Exporter (system metrics)

All services are defined in `docker-compose.yml` for modular deployment. Prometheus scrapes metrics from the backend, Node Exporter, and itself. Grafana visualizes these metrics for real-time monitoring.

### Automated Grafana Provisioning
Grafana is configured to automatically provision:
- The Prometheus datasource (via provisioning/datasources/prometheus.yaml)
- A prebuilt SRE dashboard with SLI/SLO and golden signals panels (via provisioning/dashboards/sre_dashboard.json)

This ensures that after running `docker compose up`, all dashboards and visualizations are immediately available—no manual setup required.

## 2. Reliability Engineering: SLI, SLO, and Error Budget

### 2.1 Service Level Indicators (SLIs)
- **API Request Success Rate:** Percentage of backend API requests (`/api/*`) that are not server failures (5xx). Expected business responses like 401/403 are not treated as reliability failures.
- **Request Latency SLI (<2s):** Percentage of all application requests (except `/metrics`) completed under 2 seconds, based on `http_request_duration_seconds` histogram buckets.

### 2.2 Service Level Objectives (SLOs)
- At least 99.5% of backend API requests must succeed each month.
- At least 97% of frontend page loads must complete in under 2 seconds each month.

### 2.3 Error Budget
- For SLO 1: 0.5% of requests may fail per month (e.g., 500 out of 100,000 requests).
- For SLO 2: 3% of page loads may exceed 2 seconds per month (e.g., 1,500 out of 50,000 loads).

Monthly compliance formulas used:

- API success (%):
	- `success = (1 - (5xx_requests / total_api_requests)) * 100`
- Web latency under 2s (%):
	- `fast = (requests_in_histogram_bucket_le_2_0s / total_requests_except_metrics) * 100`

SLO compliance condition:

- API SLO is met when `success >= 99.5`.
- Latency SLO is met when `fast >= 97`.

Error budget consumption:

- API budget consumed (%) = `(5xx_requests / (0.005 * total_api_requests)) * 100`
- Latency budget consumed (%) = `(slow_requests / (0.03 * total_web_requests)) * 100`

| SLI                        | SLO Target | Error Budget (per month)         |
|----------------------------|------------|----------------------------------|
| API Request Success Rate   | 99.5%      | 0.5% failed requests             |
| Page Load Latency < 2 sec  | 97%        | 3% slow page loads               |

These targets are based on user expectations and industry standards, balancing reliability and development speed.

## 3. Monitoring, Dashboards, and SLO Tracking

Prometheus collects application and system metrics. Grafana dashboards visualize:
- **Latency:** API and page load times
- **Traffic:** Request rates
- **Errors:** Non-2xx response rates
- **Saturation:** CPU and memory usage (Node Exporter)

The backend exports metrics at `/metrics` using Prometheus client instrumentation (`http_requests_total` and `http_request_duration_seconds`).

Dashboards include panels for SLI/SLO compliance, with thresholds for error budgets. Historical data supports monthly reliability analysis.

## 4. Alerting and Incident Response

Prometheus alerting rules (see `alert_rules.yml`) provide:
- **Warning:** High error rate (>5% failed requests for 2 minutes)
- **Critical:** Backend down for 10 seconds

Alerts were validated by simulating backend failure and observing FIRING state in Prometheus. This ensures rapid detection and response to reliability threats.

Manual validation steps used for Step 4 deliverable:

1. **Trigger Critical alert (`BackendDown`)**
	- Run: `docker compose stop backend`
	- Wait > 10 seconds (rule `for: 10s`)
	- Open Prometheus Alerts page and capture screenshot with `BackendDown` in FIRING state.
	- Recover: `docker compose start backend`

2. **Trigger Warning alert (`HighErrorRate`)**
	- Generate failing API traffic (5xx) continuously for > 2 minutes while sending at least 20 API requests in 5 minutes.
	- Use test endpoint: `GET /api/sre/fail` (enabled in compose for validation).
	- Example PowerShell loop:
	  - `1..120 | ForEach-Object { try { Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/sre/fail | Out-Null } catch {}; Start-Sleep -Milliseconds 1500 }`
	- Capture screenshot when `HighErrorRate` is FIRING.

## 5. Results and Impact

The observability stack enables continuous monitoring, rapid incident detection, and enforcement of SLOs. All configuration files are included in the repository. Screenshots of the running system, dashboards, and alert states demonstrate compliance and readiness for production.

## References
- Google SRE Book: https://sre.google/sre-book/service-level-objectives/
- Prometheus Documentation: https://prometheus.io/docs/
- Grafana Documentation: https://grafana.com/docs/
