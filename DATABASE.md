# Database Schema — Prakriti CRM

Database: **PostgreSQL** (hosted on Supabase)
ORM: **Drizzle ORM**

---

## Enums

### `role`
User roles in the system:
- `Admin` — Full access
- `ZM` — Zone Manager
- `User` — Regular agent
- `Field` — Field agent (limited access)

### `order_status`
18 possible order statuses:
```
New, Confirmed, In Transit, Delivered, Pending, Callback,
GPO, GPO Done, GPO Delivered, GPO Pending, Cancelled,
Future Delivery, Confirm Pending, Final Cancel,
Confirm Cancel, Cancel Pending, UNA, Dealer Cancel
```

### `payment_status`
- `Pending`
- `Completed`

---

## Tables

### `users`
Stores CRM users (agents, admins, ZMs).

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Auto-increment ID |
| supabase_id | varchar(255) | Supabase Auth UID (unique) |
| name | varchar(255) | Full name |
| email | varchar(255) | Login email (unique) |
| phone | varchar(20) | Contact number |
| role | enum | Admin / ZM / User / Field |
| zm_id | integer | FK → users.id (Zone Manager) |
| is_active | boolean | Account active status |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

---

### `orders`
Core table — every customer order/lead.

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| order_id | varchar(20) | Formatted ID e.g. PHCRM000001 |
| patient_name | varchar(255) | Customer name |
| mobile | varchar(20) | Primary mobile |
| alt_mobile | varchar(20) | Alternate mobile |
| address | text | Delivery address |
| city | varchar(100) | City |
| pincode | varchar(10) | PIN code |
| state_id | integer | FK → states.id |
| district_id | integer | FK → districts.id |
| source_id | integer | FK → sources.id |
| amount | decimal(10,2) | Order value |
| quantity | integer | Quantity |
| status | enum | Current status |
| reason | varchar(255) | Status reason |
| follow_up_date | date | Scheduled follow-up |
| notes | text | Agent notes |
| date_time | timestamp | Order created at |
| lead_owner_id | integer | FK → users.id |
| zm_id | integer | FK → users.id |
| dealer_id | integer | FK → dealers.id |
| is_deleted | boolean | Soft delete flag |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** mobile, status, state_id, source_id, lead_owner_id, zm_id, dealer_id, follow_up_date, is_deleted, date_time

---

### `order_history`
Every change to an order is recorded here.

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| order_id | integer | FK → orders.id |
| changed_by_id | integer | FK → users.id |
| old_status | varchar | Previous status |
| new_status | varchar | New status |
| reason | varchar | Change reason |
| notes | text | Change notes |
| created_at | timestamp | When change happened |

---

### `dealers`
B2B dealer/distributor accounts.

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| dealer_code | varchar(20) | Unique code e.g. 12301 |
| name | varchar(255) | Business name |
| contact_person | varchar(255) | Contact name |
| mobile | varchar(20) | Phone |
| email | varchar(255) | Email |
| address | text | Address |
| city | varchar(100) | City |
| state_id | integer | FK → states.id |
| district_id | integer | FK → districts.id |
| pincode | varchar(10) | PIN |
| is_active | boolean | Active status |
| balance | decimal(12,2) | Current balance |
| created_at | timestamp | |

---

### `invoices`
B2B invoices raised against dealers.

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| invoice_no | varchar(20) | e.g. PHB2B0001 |
| dealer_id | integer | FK → dealers.id |
| invoice_date | date | Invoice date |
| grand_total | decimal(12,2) | Total amount |
| paid | decimal(12,2) | Amount received |
| balance | decimal(12,2) | Outstanding |
| notes | text | Notes |
| created_at | timestamp | |

---

### `invoice_items`
Line items within an invoice.

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| invoice_id | integer | FK → invoices.id |
| item_id | integer | FK → items.id (optional) |
| item_name | varchar(255) | Product name |
| sku_code | varchar(50) | SKU |
| qty | integer | Quantity |
| rate | decimal(10,2) | Unit price |
| amount | decimal(10,2) | qty × rate |
| discount | decimal(10,2) | Discount amount |

---

### `payments`
Payments received from dealers.

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| dealer_id | integer | FK → dealers.id |
| invoice_id | integer | FK → invoices.id (optional) |
| amount | decimal(12,2) | Payment amount |
| payment_date | date | Date of payment |
| payment_mode | varchar(50) | Cash / NEFT / UPI / etc |
| reference | varchar(255) | Transaction reference |
| notes | text | Notes |
| created_at | timestamp | |

---

### `items` (Products)
Product/SKU catalog.

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| sku_code | varchar(50) | Unique SKU |
| name | varchar(255) | Product name |
| uom | varchar(50) | Unit of measure (Pcs, Box, etc.) |
| stock | integer | Current stock |
| price | decimal(10,2) | MRP |
| is_active | boolean | Active status |
| created_at | timestamp | |

---

### `sources`
Lead sources (Facebook, Google TV, etc.)

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| name | varchar(100) | Source name (unique) |
| is_active | boolean | Active |

---

### `states`
Indian states (seeded with all 36).

| Column | Type |
|--------|------|
| id | serial PK |
| name | varchar(100) unique |

---

### `districts`
Districts linked to states.

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| name | varchar(100) | District name |
| state_id | integer | FK → states.id |

---

### `audit_logs`
Full change audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| user_id | integer | FK → users.id |
| table_name | varchar(100) | Which table was changed |
| record_id | integer | Which record |
| action | varchar(20) | CREATE / UPDATE / DELETE |
| old_values | text | JSON of previous values |
| new_values | text | JSON of new values |
| created_at | timestamp | |

---

## Relationships

```
users ──< orders (lead_owner_id)
users ──< orders (zm_id)
orders ──< order_history
dealers ──< orders
dealers ──< invoices
dealers ──< payments
invoices ──< invoice_items
invoices ──< payments
items ──< invoice_items
states ──< districts
states ──< orders
states ──< dealers
districts ──< orders
districts ──< dealers
sources ──< orders
```

---

## Running Migrations

```bash
# Push schema (create/update tables)
npm run db:push

# Open Drizzle Studio (visual DB browser)
npm run db:studio

# Seed initial data
npm run db:seed
```
