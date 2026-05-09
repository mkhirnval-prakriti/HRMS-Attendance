# API Documentation — Prakriti CRM

Base URL: `/api`

All endpoints require authentication (Supabase session cookie).
Responses follow: `{ success: boolean, data?: any, error?: string }`

---

## Authentication

### POST `/api/auth/signout`
Sign out the current user.

---

## Orders

### GET `/api/orders`
Get paginated orders with filters.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Per page: 10/20/50/100 |
| search | string | Search by name/mobile/orderId |
| status | string | Filter by status |
| sourceId | number | Filter by source |
| stateId | number | Filter by state |
| districtId | number | Filter by district |
| ownerId | number | Filter by agent |
| dealerId | number | Filter by dealer |
| dateFrom | date | From date (YYYY-MM-DD) |
| dateTo | date | To date |
| followUp | boolean | Only follow-up orders |

**Response:**
```json
{
  "success": true,
  "data": { "orders": [...], "total": 1000, "page": 1, "totalPages": 50 }
}
```

**Roles:** All (users/field see own orders only; ZM sees team)

---

### POST `/api/orders`
Create a new order.

**Body:**
```json
{
  "patientName": "Ram Kumar",
  "mobile": "9876543210",
  "stateId": 20,
  "districtId": 5,
  "city": "Ludhiana",
  "address": "123 Main St",
  "amount": 1500,
  "status": "New",
  "sourceId": 1,
  "notes": "Callback tomorrow"
}
```

---

### GET `/api/orders/:id`
Get a single order by database ID.

---

### PUT `/api/orders/:id`
Update an order. Creates a history entry on status change.

**Body:** Any order fields (partial update).

---

### DELETE `/api/orders/:id`
Soft-delete an order (sets `is_deleted = true`).

**Roles:** Admin only

---

### GET `/api/orders/:id/history`
Get the change history for an order.

---

### POST `/api/orders/bulk-upload`
Upload orders from Excel/CSV file.

**Body:** `multipart/form-data` with `file` field (xlsx/csv, max 50k rows)

**Response:**
```json
{
  "success": true,
  "data": { "created": 490, "duplicates": 8, "errors": 2, "errorRows": [...] }
}
```

---

### POST `/api/orders/bulk-actions`
Perform bulk operations on multiple orders.

**Body:**
```json
{
  "action": "changeStatus",
  "ids": [1, 2, 3],
  "status": "Confirmed",
  "reason": "Customer agreed"
}
```

**Actions:** `changeStatus`, `changeOwner`, `changeDealer`, `delete`

---

### GET `/api/orders/export`
Export filtered orders as Excel file.

**Query params:** Same as GET `/api/orders` (no pagination, max 50k rows)

**Response:** `.xlsx` file download

---

## Dashboard

### GET `/api/dashboard/stats`
Get KPI statistics.

**Query params:**
- `from`: Start date
- `to`: End date

**Response:**
```json
{
  "success": true,
  "data": {
    "statusCounts": [{ "status": "New", "count": 120 }],
    "total": 5000,
    "todayOrders": 45,
    "followUps": 12
  }
}
```

---

## Follow-ups

### GET `/api/follow-ups`
Get orders with follow-up dates.

**Query params:**
- `range`: `today` | `overdue` | `week` (default: `today`)

---

## Users

### GET `/api/users`
Get all users. **Admin only.**

### POST `/api/users`
Create a user. **Admin only.**

**Body:**
```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "9876543210",
  "role": "User",
  "zmId": 3,
  "password": "secret123"
}
```

### PUT `/api/users/:id`
Update a user. **Admin only.**

---

## Dealers

### GET `/api/dealers`
Get all dealers.

### POST `/api/dealers`
Create a dealer. **Admin / ZM.**

### PUT `/api/dealers/:id`
Update a dealer. **Admin / ZM.**

---

## Invoices

### GET `/api/invoices`
Get all invoices with dealer info.

### POST `/api/invoices`
Create an invoice. **Admin / ZM.**

**Body:**
```json
{
  "dealerId": 1,
  "invoiceDate": "2025-01-15",
  "grandTotal": 25000,
  "notes": "Q1 supply"
}
```

### GET `/api/invoices/:id`
Get invoice with items and payments.

### PUT `/api/invoices/:id`
Update invoice notes/date. **Admin / ZM.**

### DELETE `/api/invoices/:id`
Delete invoice (also deletes items and payments). **Admin only.**

### POST `/api/invoices/:id/items`
Set invoice line items (replaces existing). **Admin / ZM.**

**Body:**
```json
{
  "items": [
    { "itemName": "Prakriti Oil", "skuCode": "PO001", "qty": 10, "rate": 500, "discount": 0 }
  ]
}
```

---

## Payments

### GET `/api/payments`
Get all payments. Optional filter: `?dealerId=1`

### POST `/api/payments`
Record a payment. **Admin / ZM.**

**Body:**
```json
{
  "dealerId": 1,
  "invoiceId": 5,
  "amount": 10000,
  "paymentDate": "2025-01-20",
  "paymentMode": "NEFT",
  "reference": "TXN123456",
  "notes": "Partial payment"
}
```

---

## Reports

### GET `/api/reports/agent`
Agent performance report. **Admin / ZM.**

**Query params:** `from`, `to` (date range)

**Response:**
```json
{
  "data": [{
    "agentId": 5,
    "agentName": "Priya",
    "total": 200,
    "delivered": 120,
    "cancelled": 15,
    "revenue": 180000,
    "conversionRate": "60.0"
  }]
}
```

### GET `/api/reports/dealer`
Dealer cumulative report. **Admin / ZM.**

---

## Sources

### GET `/api/sources`
Get all active sources.

### POST `/api/sources`
Create a source. **Admin only.**

---

## Locations

### GET `/api/locations?type=states`
Get all states.

### GET `/api/locations?type=districts&stateId=20`
Get districts for a state.

---

## Items (Products)

### GET `/api/items`
Get all active products.

### POST `/api/items`
Create a product. **Admin only.**

### PUT `/api/items/:id`
Update a product. **Admin only.**

---

## Audit Logs

### GET `/api/audit-logs`
Get audit logs. **Admin only.**

**Query params:** `page`, `limit`, `from`, `to`

---

## Error Responses

All endpoints return structured errors:

```json
{ "success": false, "error": "Forbidden" }
```

**Status codes:**
- `200` — Success
- `201` — Created
- `400` — Bad request / validation error
- `401` — Not authenticated
- `403` — Forbidden (insufficient role)
- `404` — Not found
- `500` — Server error
