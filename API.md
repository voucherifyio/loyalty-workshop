# API Reference

Comprehensive reference for Voucherify Loyalty V2 API endpoints.

## Overview

**Base URLs:**
- Local: `http://localhost:8000`
- Voucherify: `https://api.voucherify.io`
- Custom: Configure in settings

All calls logged in API Inspector (top-right icon).

## Authentication

**Headers:**
```http
X-App-Id: your-app-id
X-App-Token: your-app-token
X-Voucherify-API-Version: v2018-08-01
```

Configure in Settings modal. Stored in `localStorage`. See [SECURITY.md](SECURITY.md) for security considerations.

## Response Format

**Single object:**
```json
{
  "object": "program",
  "id": "prog_abc123",
  "name": "Gold Program",
  "status": "active"
}
```

**List:**
```json
{
  "object": "list",
  "data": [...],
  "has_more": true,
  "cursor": "eyJpZCI6..."
}
```

**Pagination:** Cursor-based. Use `?limit=20&cursor=eyJpZCI6...`

## Error Handling

**Format:**
```json
{
  "code": 400,
  "message": "Validation error",
  "details": "Field 'name' is required"
}
```

**Status codes:** 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict, 500 Server Error

Errors displayed via toast + API Inspector.

## Endpoints

### Programs

Programs are the top-level containers for loyalty configurations.

#### List Programs

```http
GET /v2/loyalties/programs
```

**Query Parameters**:
- `limit` (optional, default: 20)
- `cursor` (optional)

**Response**:
```json
{
  "object": "list",
  "data": [
    {
      "object": "program",
      "id": "prog_abc123",
      "name": "Gold Loyalty Program",
      "status": "active",
      "start_date": "2026-01-01T00:00:00.000Z",
      "end_date": null,
      "created_at": "2026-05-29T10:00:00.000Z"
    }
  ],
  "has_more": false
}
```

#### Get Program

```http
GET /v2/loyalties/programs/{programId}
```

**Response**: Single program object

#### Create Program

```http
POST /v2/loyalties/programs
```

**Request Body**:
```json
{
  "name": "Silver Loyalty Program",
  "status": "draft",
  "start_date": "2026-06-01T00:00:00.000Z",
  "end_date": "2027-06-01T00:00:00.000Z",
  "metadata": {
    "tier": "silver"
  }
}
```

**Response**: Created program object with ID

#### Update Program

```http
PUT /v2/loyalties/programs/{programId}
```

**Request Body**: Partial program object (only fields to update)

**Response**: Updated program object

#### Delete Program

```http
DELETE /v2/loyalties/programs/{programId}
```

**Response**: 204 No Content

#### Activate Program

```http
POST /v2/loyalties/programs/{programId}/activate
```

**Response**: Program object with `status: "active"`

#### Deactivate Program

```http
POST /v2/loyalties/programs/{programId}/deactivate
```

**Response**: Program object with `status: "inactive"`

#### Get Program Activities

```http
GET /v2/loyalties/programs/{programId}/activities
```

**Response**: Activity log for the program

#### List Program Assignments

```http
GET /v2/loyalties/programs/{programId}/assignments
```

**Response**: List of entities assigned to this program

### Card Definitions

Card definitions define the structure of loyalty cards.

#### List Card Definitions

```http
GET /v2/loyalties/card-definitions
```

#### Get Card Definition

```http
GET /v2/loyalties/card-definitions/{cardDefinitionId}
```

#### Create Card Definition

```http
POST /v2/loyalties/card-definitions
```

**Request Body**:
```json
{
  "name": "Premium Card",
  "code": "PREMIUM_CARD",
  "status": "draft",
  "balance": {
    "type": "points",
    "starting_balance": 0
  }
}
```

#### Update Card Definition

```http
PUT /v2/loyalties/card-definitions/{cardDefinitionId}
```

#### Delete Card Definition

```http
DELETE /v2/loyalties/card-definitions/{cardDefinitionId}
```

#### Activate/Deactivate Card Definition

```http
POST /v2/loyalties/card-definitions/{cardDefinitionId}/activate
POST /v2/loyalties/card-definitions/{cardDefinitionId}/deactivate
```

#### Get Card Definition Activities

```http
GET /v2/loyalties/card-definitions/{cardDefinitionId}/activities
```

#### Assign Card Definition to Program

```http
POST /v2/loyalties/programs/{programId}/card-definitions/{cardDefinitionId}
```

#### Unassign Card Definition from Program

```http
DELETE /v2/loyalties/programs/{programId}/card-definitions/{cardDefinitionId}
```

### Tier Structures

Tier structures define hierarchical loyalty tiers.

#### List Tier Structures

```http
GET /v2/loyalties/tier-structures
```

#### Get Tier Structure

```http
GET /v2/loyalties/tier-structures/{tierStructureId}
```

#### Create Tier Structure

```http
POST /v2/loyalties/tier-structures
```

**Request Body**:
```json
{
  "name": "Customer Tiers",
  "status": "draft",
  "tiers": [
    {
      "name": "Bronze",
      "threshold": 0,
      "color": "#CD7F32"
    },
    {
      "name": "Silver",
      "threshold": 1000,
      "color": "#C0C0C0"
    },
    {
      "name": "Gold",
      "threshold": 5000,
      "color": "#FFD700"
    }
  ]
}
```

#### Update Tier Structure

```http
PUT /v2/loyalties/tier-structures/{tierStructureId}
```

#### Delete Tier Structure

```http
DELETE /v2/loyalties/tier-structures/{tierStructureId}
```

#### Get Tier Structure Tiers

```http
GET /v2/loyalties/tier-structures/{tierStructureId}/tiers
```

#### Assign Tier Structure to Program

```http
POST /v2/loyalties/programs/{programId}/tier-structures/{tierStructureId}
```

#### Unassign Tier Structure from Program

```http
DELETE /v2/loyalties/programs/{programId}/tier-structures/{tierStructureId}
```

### Earning Rules

Earning rules define how members earn points.

#### List Earning Rules

```http
GET /v2/loyalties/earning-rules
```

#### Get Earning Rule

```http
GET /v2/loyalties/earning-rules/{earningRuleId}
```

#### Create Earning Rule

```http
POST /v2/loyalties/earning-rules
```

**Request Body**:
```json
{
  "name": "Purchase Points",
  "status": "draft",
  "trigger": {
    "type": "customer.order.paid"
  },
  "effect": {
    "type": "add_points",
    "points": {
      "type": "proportional",
      "multiplier": 1,
      "property": "order.amount"
    }
  }
}
```

**Trigger Types**:
- `customer.order.paid` - When an order is paid
- `customer.custom_event` - Custom event
- `customer.segment.entered` - When customer enters a segment

#### Update Earning Rule

```http
PUT /v2/loyalties/earning-rules/{earningRuleId}
```

#### Delete Earning Rule

```http
DELETE /v2/loyalties/earning-rules/{earningRuleId}
```

#### Activate/Deactivate Earning Rule

```http
POST /v2/loyalties/earning-rules/{earningRuleId}/activate
POST /v2/loyalties/earning-rules/{earningRuleId}/deactivate
```

#### Assign Earning Rule to Program

```http
POST /v2/loyalties/programs/{programId}/earning-rules/{earningRuleId}
```

### Rewards

Rewards define what members can redeem with points.

#### List Rewards

```http
GET /v2/loyalties/rewards
```

#### Get Reward

```http
GET /v2/loyalties/rewards/{rewardId}
```

#### Create Reward

```http
POST /v2/loyalties/rewards
```

**Request Body**:
```json
{
  "name": "Free Coffee",
  "type": "material",
  "status": "draft",
  "stock": 100,
  "metadata": {
    "sku": "COFFEE-001"
  }
}
```

#### Update Reward

```http
PUT /v2/loyalties/rewards/{rewardId}
```

#### Delete Reward

```http
DELETE /v2/loyalties/rewards/{rewardId}
```

#### Assign Reward to Program

```http
POST /v2/loyalties/programs/{programId}/rewards/{rewardId}
```

**Request Body** (set reward cost):
```json
{
  "card_definition_id": "card_abc123",
  "points": 500,
  "stock": 50
}
```

### Benefits

Benefits provide automatic point bonuses or rewards.

#### List Benefits

```http
GET /v2/loyalties/benefits
```

#### Get Benefit

```http
GET /v2/loyalties/benefits/{benefitId}
```

#### Create Benefit

```http
POST /v2/loyalties/benefits
```

**Request Body**:
```json
{
  "name": "Birthday Bonus",
  "status": "draft",
  "trigger": {
    "type": "custom_event",
    "event_name": "birthday"
  },
  "effect": {
    "type": "add_points",
    "points": 100
  }
}
```

#### Update Benefit

```http
PUT /v2/loyalties/benefits/{benefitId}
```

#### Delete Benefit

```http
DELETE /v2/loyalties/benefits/{benefitId}
```

### Members

Members are customers enrolled in loyalty programs.

#### List Members

```http
GET /v2/loyalties/members
```

#### Get Member

```http
GET /v2/loyalties/programs/{programId}/memberships/by-member-id/{memberId}
```

**Response**:
```json
{
  "member": {
    "id": "lmbr_12472ef129bb8960e7",
    "customer_id": "cust_O3J07vYvPLx1Yo4ts9pUNDJj",
    "program_id": "lprg_1247277e5f7bc4600c",
    "status": "ACTIVE",
    "metadata": {},
    "created_at": "2026-04-16T10:18:00.230Z",
    "updated_at": "2026-04-27T11:55:16.054Z",
    "object": "member"
  },
  "program": {
    "id": "lprg_1247277e5f7bc4600c",
    "name": "Let's collect & spend some points",
    "status": "ACTIVE",
    "metadata": {
      "sandbox": true
    },
    "object": "program"
  },
  "cards": [
    {
      "member_role": "OWNER",
      "created_at": "2026-04-16T10:18:00.259Z",
      "tier_progress": null,
      "card": {
        "id": "lcrd_12472ef12e7b8960ea",
        "card_definition_id": "lcdef_1246fad06006bfd506",
        "card_type": "INDIVIDUAL",
        "code": "CARD-DcHriDb",
        "lifetime_bucket": {
          "points": {
            "total": 3230,
            "earned": 730,
            "added": 2500,
            "subtracted": 60,
            "expired": 2300,
            "spent": 700,
            "refunded": 0,
            "returned": 0,
            "locked": 700,
            "unlocked": 700
          },
          "pending_points": {
            "total": 0,
            "activated": 0,
            "canceled": 0
          }
        },
        "balance": {
          "points": 170,
          "pending_points": 0
        },
        "next_expiration": {
          "points": 120,
          "date": "2026-06-09"
        },
        "next_activation": null,
        "object": "card"
      },
      "object": "member_card"
    }
  ],
  "object": "membership"
}
```

#### Create Member

```http
POST /v2/loyalties/members
```

**Request Body**:
```json
{
  "source_id": "customer_123",
  "name": "John Doe",
  "email": "john@example.com",
  "metadata": {
    "tier": "gold"
  }
}
```

#### Update Member

```http
PUT /v2/loyalties/members/{memberId}
```

#### Delete Member

```http
DELETE /v2/loyalties/members/{memberId}
```

#### Activate/Deactivate Member

```http
POST /v2/loyalties/members/{memberId}/activate
POST /v2/loyalties/members/{memberId}/deactivate
```

#### Get Member Activities

```http
GET /v2/loyalties/members/{memberId}/activities
```

#### Get Member Cards

```http
GET /v2/loyalties/members/{memberId}/cards
```

### Member Cards

Member cards track points and transactions per program.

#### Get Card

```http
GET /v2/loyalties/members/{memberId}/cards/{cardId}
```

#### Adjust Points

```http
POST /v2/loyalties/members/{memberId}/cards/{cardId}/adjust-points
```

**Request Body**:
```json
{
  "points": 100,
  "reason": "Customer service compensation"
}
```

Use negative values to deduct points.

#### Get Card Transactions

```http
GET /v2/loyalties/members/{memberId}/cards/{cardId}/transactions
```

#### Get Pending Points

```http
GET /v2/loyalties/members/{memberId}/cards/{cardId}/pending-points
```

#### Get Expiring Points

```http
GET /v2/loyalties/members/{memberId}/cards/{cardId}/expiring-points
```

#### Get Card Activities

```http
GET /v2/loyalties/members/{memberId}/cards/{cardId}/activities
```

#### Get Card Report

```http
GET /v2/loyalties/members/{memberId}/cards/{cardId}/report
```

**Query Parameters**:
- `start_date` (required) - ISO 8601 date
- `end_date` (required) - ISO 8601 date
- `resolution` (optional) - `day`, `week`, `month`

### Transactions

#### List Reward Purchases

```http
GET /v2/loyalties/members/{memberId}/reward-purchases
```

#### Purchase Reward

```http
POST /v2/loyalties/members/{memberId}/reward-purchases
```

**Request Body**:
```json
{
  "card_id": "card_abc123",
  "reward_assignment_id": "rewa_xyz789",
  "quantity": 1
}
```

#### Refund Reward Purchase

```http
POST /v2/loyalties/members/{memberId}/reward-purchases/{purchaseId}/refund
```

#### List Order Payments

```http
GET /v2/loyalties/members/{memberId}/order-payments
```

#### Pay with Points

```http
POST /v2/loyalties/members/{memberId}/order-payments
```

**Request Body**:
```json
{
  "card_id": "card_abc123",
  "points": 500,
  "order": {
    "amount": 5000,
    "items": [
      {
        "product_id": "prod_123",
        "quantity": 1,
        "amount": 5000
      }
    ]
  }
}
```

#### List Benefit Transactions

```http
GET /v2/loyalties/members/{memberId}/benefits/transactions
```

### Orders

Orders trigger earning rules (v1 endpoint).

#### Create Order

```http
POST /v1/orders
```

**Request Body**:
```json
{
  "source_id": "order_789",
  "customer": {
    "source_id": "customer_123"
  },
  "amount": 10000,
  "status": "PAID",
  "items": [
    {
      "source_id": "item_1",
      "product_id": "prod_456",
      "quantity": 2,
      "amount": 10000
    }
  ]
}
```

**Note**: This is a v1 endpoint used to trigger `customer.order.paid` earning rules.

### Events

Custom events can trigger earning rules (v1 endpoint).

#### Create Custom Event

```http
POST /v1/events
```

**Request Body**:
```json
{
  "event": "user_registered",
  "customer": {
    "source_id": "customer_123"
  },
  "metadata": {
    "referral_code": "ABC123"
  }
}
```

### Examine

Simulate point earnings without actually awarding points.

#### Examine Earning Rules

```http
POST /v2/loyalties/examine/earning-rules
```

**Request Body**:
```json
{
  "member_id": "mem_abc123",
  "card_id": "card_xyz789",
  "order": {
    "amount": 10000,
    "items": [
      {
        "product_id": "prod_456",
        "quantity": 2,
        "amount": 10000
      }
    ]
  }
}
```

**Response**:
```json
{
  "total_points": 100,
  "applied_rules": [
    {
      "rule_id": "rule_123",
      "rule_name": "Purchase Points",
      "points": 100
    }
  ]
}
```

## Rate Limiting

Rate limiting depends on the backend implementation. Voucherify Sandbox typically allows:
- 100 requests per minute per IP
- 1000 requests per hour per API key

Exceeding limits returns `429 Too Many Requests`.

## CORS Configuration

For local development, ensure your backend allows:

```http
Access-Control-Allow-Origin: http://localhost:3010
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, X-App-Id, X-App-Token, X-Voucherify-API-Version
```

## Testing API Calls

### Using API Inspector

1. Open Loyalty Workshop
2. Perform actions in the UI
3. Click API icon (top-right) to open inspector
4. Review request/response details
5. Copy as cURL to reproduce in terminal

### Using cURL

Example cURL command (copied from API Inspector):

```bash
curl -X GET 'http://localhost:8000/v2/loyalties/programs' \
  -H 'Content-Type: application/json' \
  -H 'X-Voucherify-API-Version: v2018-08-01' \
  -H 'X-App-Id: your-app-id' \
  -H 'X-App-Token: your-app-token'
```

## Further Reading

- [Voucherify API Documentation](https://docs.voucherify.io)
- [ARCHITECTURE.md](ARCHITECTURE.md) - API client implementation details
- [DEVELOPMENT.md](DEVELOPMENT.md) - Local development setup
- [SECURITY.md](SECURITY.md) - API credential security
