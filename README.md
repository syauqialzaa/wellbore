# Wellbore Diagram API Documentation

## Overview
The Wellbore Diagram API provides endpoints to retrieve wellbore component data and icons for visualization. The API supports filtering by depth, well identifier, and component types.

## Endpoints

### 1. Get Wellbore Data
**Endpoint:** `GET /api/wellbore-data`

Retrieves wellbore component data with optional filtering.

#### URL Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `uwi` | string | `PEB000026D1` | Well identifier |
| `top_md` | integer | - | Top measured depth filter |
| `bot_md` | integer | - | Bottom measured depth filter |
| `icon_name` | string | - | Filter by icon name (partial match) |

#### Example URLs
```
# Get all data for default well
/api/wellbore-data

# Filter by depth range
/api/wellbore-data?top_md=1000&bot_md=5000

# Filter by specific well
/api/wellbore-data?uwi=DURI01141V1

# Filter by icon name
/api/wellbore-data?icon_name=Tubing

# Combined filters
/api/wellbore-data?uwi=PEB000026D1&top_md=1000&bot_md=5000&icon_name=ESP
```

#### Response Format
```json
[
  {
    "ICON_NAME": "SurfCsg",
    "TOP_MD": 19,
    "BOT_MD": 624,
    "OD_INCH": 13.37,
    "REMARKS": "13.37 in, 48 lb/ft, K55LTC @ 624 ft"
  },
  {
    "ICON_NAME": "Tubing",
    "TOP_MD": 19,
    "BOT_MD": 4795,
    "OD_INCH": 3.5,
    "REMARKS": "3.5 in, 9.3 lb/ft, J-55 @ 4795 ft"
  }
]
```

### 2. Get Icons
**Endpoint:** `GET /api/icons`

Retrieves available icon files for the diagram.

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Filter icons by filename (partial match) |

#### Example URLs
```
# Get all icons
/api/icons

# Search for specific icons
/api/icons?search=surf
```

#### Response Format
```json
[
  "SurfCsg.png",
  "IntermCsg.png",
  "ProdCsg.png",
  "Tubing.png",
  "ESPump.png",
  "PKR.png"
]
```

### 3. Get Icon Image
**Endpoint:** `GET /img/{filename}`

Serves icon image files.

#### Example URLs
```
/img/SurfCsg.png
/img/Tubing.png
```

### 4. Health Check
**Endpoint:** `GET /health`

Check API status.

#### Response Format
```json
{
  "status": "healthy",
  "message": "Wellbore API is running"
}
```

## Available Wells
The API contains data for two wells:
- `PEB000026D1` (default)
- `DURI01141V1`

## Available Icon Types
- `SurfCsg` - Surface Casing
- `IntermCsg` - Intermediate Casing
- `ProdCsg` - Production Casing
- `Tubing` - Tubing
- `ESPump` - ESP Pump
- `PKR` - Packer
- `PerfoOpen` - Open Perforation
- `PerfoCls` - Closed Perforation
- `PerfoSqz` - Squeezed Perforation
- `TbgPump` - Tubing Pump
- `Motor` - Motor
- `Seal` - Seal
- `PIntake` - Pump Intake

## Frontend URL Parameters
When using the web interface, URL parameters automatically sync with form inputs:

```
https://yoursite.com/?uwi=PEB000026D1&top_md=1000&bot_md=5000&icon_name=Tubing
```

This allows users to:
- Bookmark specific filtered views
- Share URLs with specific parameters
- Navigate with browser back/forward buttons

## Error Responses
```json
{
  "error": "Internal Server Error",
  "message": "Error description"
}
```

## Notes
- Depth filtering uses overlapping logic: components are included if they overlap with the specified range
- Icon name filtering uses case-insensitive partial matching
- Empty results return an empty array `[]`, not an error