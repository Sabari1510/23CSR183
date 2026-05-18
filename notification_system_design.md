# Notification System Design

## Goal
Design the backend notification flow for the campus notification platform.

## Scope
- Backend service structure
- Notification processing logic
- Logging integration
- API endpoints and data flow

## Stage 1

### Core actions
The notification platform should support these user-facing actions:
- Fetch the current notification feed for the logged-in student
- Fetch only unread notifications
- Fetch the unread notification count
- Mark a single notification as read
- Mark all notifications as read

### Resource model
Use a predictable notification object across requests and responses.

```json
{
	"id": "notif_01HV8M0M8Q3J8A8Q6Q",
	"studentId": "23CSR183",
	"type": "Placement",
	"title": "Placement drive scheduled",
	"message": "The company visit is scheduled for Friday at 10:00 AM.",
	"isRead": false,
	"createdAt": "2026-05-18T10:00:00.000Z",
	"readAt": null
}
```

Allowed `type` values:
- `Placement`
- `Event`
- `Result`

### Headers
All protected endpoints should use the following headers:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
```

### Endpoints

#### Get notification feed
```http
GET /api/v1/notifications?studentId=23CSR183&limit=20&offset=0&unreadOnly=false
```

Response:

```json
{
	"data": [
		{
			"id": "notif_01HV8M0M8Q3J8A8Q6Q",
			"studentId": "23CSR183",
			"type": "Placement",
			"title": "Placement drive scheduled",
			"message": "The company visit is scheduled for Friday at 10:00 AM.",
			"isRead": false,
			"createdAt": "2026-05-18T10:00:00.000Z",
			"readAt": null
		}
	],
	"meta": {
		"studentId": "23CSR183",
		"limit": 20,
		"offset": 0,
		"total": 1,
		"unreadCount": 1
	}
}
```

#### Get unread count
```http
GET /api/v1/notifications/unread-count?studentId=23CSR183
```

Response:

```json
{
	"studentId": "23CSR183",
	"unreadCount": 4
}
```

#### Mark one notification as read
```http
PATCH /api/v1/notifications/notif_01HV8M0M8Q3J8A8Q6Q/read
```

Response:

```json
{
	"message": "Notification marked as read",
	"notification": {
		"id": "notif_01HV8M0M8Q3J8A8Q6Q",
		"isRead": true,
		"readAt": "2026-05-18T10:05:00.000Z"
	}
}
```

#### Mark all notifications as read
```http
PATCH /api/v1/notifications/read-all?studentId=23CSR183
```

Response:

```json
{
	"message": "All notifications marked as read",
	"updatedCount": 4
}
```

### Request/response rules
- Use consistent camelCase field names in JSON responses.
- Sort notifications by `createdAt` descending.
- Return `404` when a notification ID does not exist.
- Return `400` for missing required parameters such as `studentId`.
- Return `401` when the authorization header is missing for protected routes.

### Implementation note
This stage defines the contract only. Later stages can plug in a database, indexing, caching, and background delivery without changing the API shape.

## Stage 6

### Notification API
Use the provided protected GET endpoint to fetch notifications for the priority inbox.

```http
GET http://4.224.186.213/evaluation-service/notifications
```

### Constraint
- API is a protected route

### Response (Status Code: 200)

```json
{
	"notifications": [
		{
			"ID": "d146095a-0d86-4a34-9e69-3900a14576bc",
			"Type": "Result",
			"Message": "mid-sem",
			"Timestamp": "2026-04-22 17:51:30"
		},
		{
			"ID": "b283218f-ea5a-4b7c-939a-1f2f240d64b0",
			"Type": "Placement",
			"Message": "CSX Corporation hiring",
			"Timestamp": "2026-04-22 17:51:18"
		},
		{
			"ID": "81589ada-0ad3-4f77-9554-f52fb558e09d",
			"Type": "Event",
			"Message": "farewell",
			"Timestamp": "2026-04-22 17:51:06"
		}
	]
}
```

### Response shape notes
- The API wraps the list inside a top-level `notifications` array.
- The payload uses capitalized field names: `ID`, `Type`, `Message`, and `Timestamp`.
- Convert the upstream payload into a normalized internal shape only after fetching, if the UI or persistence layer needs lowercase fields.
- Preserve the original ordering unless the feature explicitly requires sorting by recency or priority.

### Implementation note
The priority inbox should consume the response exactly as provided above, then map it to the app’s internal model if needed.
