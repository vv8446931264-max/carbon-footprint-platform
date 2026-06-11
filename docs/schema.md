# Data Schema Reference

**Product**: Carbon Coach  
**Version**: 1.1.0  
**Last updated**: June 2025

---

## 1. Activity Type System

The core domain is a discriminated union of five activity categories. The discriminant field is `category`.

### 1.1. `TransportActivity`

```typescript
type TransportActivity = {
  category: "transport";
  mode:
    | "car_petrol"
    | "car_diesel"
    | "car_electric"
    | "motorcycle"
    | "bus"
    | "train"
    | "metro"
    | "auto_rickshaw"
    | "flight_domestic"
    | "flight_short_haul"
    | "flight_long_haul";
  distanceKm: number;        // positive, finite
  passengers?: number;       // default 1, carpooling divisor
};
```

### 1.2. `EnergyActivity`

```typescript
type EnergyActivity = {
  category: "energy";
  type:
    | "electricity"
    | "natural_gas"
    | "lpg"
    | "coal"
    | "solar";
  amount: number;            // kWh for electricity; kg for solids; litres for LPG
  unit: "kwh" | "kg" | "litres";
};
```

### 1.3. `FoodActivity`

```typescript
type FoodActivity = {
  category: "food";
  item:
    | "chicken"
    | "mutton"
    | "fish"
    | "eggs"
    | "dairy"
    | "vegetables"
    | "rice"
    | "wheat"
    | "processed_food"
    | "restaurant_meal";
  servings: number;          // default 1
  weightKg?: number;         // optional; used when weight is known
};
```

### 1.4. `ShoppingActivity`

```typescript
type ShoppingActivity = {
  category: "shopping";
  item:
    | "clothing"
    | "electronics"
    | "furniture"
    | "appliances"
    | "books"
    | "personal_care"
    | "general";
  spendUsd: number;          // converted from INR at point of entry
};
```

### 1.5. `WasteActivity`

```typescript
type WasteActivity = {
  category: "waste";
  type:
    | "general_waste"
    | "recycling"
    | "composting"
    | "e_waste";
  weightKg: number;
};
```

### 1.6. Combined Union

```typescript
type Activity =
  | TransportActivity
  | EnergyActivity
  | FoodActivity
  | ShoppingActivity
  | WasteActivity;
```

---

## 2. Persisted Log Entry

Each entry stored in `localStorage` under the key `"carbon_log"`:

```typescript
interface LogEntry {
  id: string;               // nanoid — e.g. "V1StGXR8_Z5jdHi6B-myT"
  timestamp: string;        // ISO 8601, local timezone
  dayKey: string;           // "YYYY-MM-DD" via localDayKey() — timezone-correct
  activity: Activity;       // discriminated union above
  description: string;      // human-readable label (AI-generated or edited)
  emissionsKgCo2e: number;  // computed server-side, stored for display
  costUsd?: number;         // optional; estimated at receipt scan time
  source: "text" | "receipt" | "manual";
  confidence: "high" | "medium" | "low";
}
```

**Storage constraints**:
- Max 500 entries (FIFO — oldest dropped first).
- Zod-validated on load; individual malformed entries are silently dropped.
- On `QuotaExceededError`, the log is truncated to 100 entries and retried once.

---

## 3. API Request / Response Schemas

### 3.1. `POST /api/parse-activity`

**Request** (Zod schema):
```typescript
z.object({
  text: z.string().min(1).max(500),
})
```

**Response** (200):
```typescript
interface ParseActivityResponse {
  activity: Activity;
  description: string;
  confidence: "high" | "medium" | "low";
  emissionsKgCo2e: number;
}
```

---

### 3.2. `POST /api/parse-receipt`

**Request** (Zod schema):
```typescript
z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
})
```

> The `mimeType` field is accepted for schema completeness but **ignored** at runtime — the server detects the actual format from magic bytes.

**Response** (200):
```typescript
interface ParseReceiptResponse {
  sourceLabel: string | null;          // merchant / bill header
  items: Array<{
    description: string;
    confidence: "high" | "medium" | "low";
    activity: Activity;
    emissionsKgCo2e: number;
    costUsd?: number;
  }>;
}
```

---

### 3.3. `POST /api/coach`

**Request** (Zod schema):
```typescript
z.object({
  totalKgCo2e: z.number().nonnegative(),
  periodDays: z.number().int().positive(),
  topCategories: z.array(
    z.object({
      category: z.enum(["transport", "energy", "food", "shopping", "waste"]),
      kgCo2e: z.number().nonnegative(),
    })
  ).max(5),
})
```

**Response** (200):
```typescript
interface CoachResponse {
  summary: string;
  encouragement: string;
  tips: string[];          // 2–4 items, actionable, India-specific
}
```

---

## 4. Baseline Estimator Schema

Stored in `localStorage` under `"carbon_baseline"`:

```typescript
interface BaselineEstimate {
  transportKgPerYear: number;
  energyKgPerYear: number;
  foodKgPerYear: number;
  shoppingKgPerYear: number;
  flightsKgPerYear: number;
  totalKgPerYear: number;
  completedAt: string;         // ISO 8601
}
```

Computed from 5 survey questions by `src/lib/baseline/estimate.ts`. Passed to `FootprintSummary` and `ReductionSimulator` when no logged data exists yet.

---

## 5. Goal / Budget Schema

Stored in `localStorage` under `"daily_budget_kg"`:

```typescript
type DailyBudgetKg = number;    // float, kg CO₂e per day
                                 // default: 5.479 (= 2 t / 365)
```

---

## 6. Emission Factor Structure

`src/lib/emissions/factors.ts` exports typed factor maps:

```typescript
// kg CO₂e per km
const TRANSPORT_FACTORS: Record<TransportActivity["mode"], number> = {
  car_petrol:        0.192,
  car_diesel:        0.171,
  car_electric:      0.053,
  motorcycle:        0.114,
  bus:               0.089,
  train:             0.041,
  metro:             0.027,
  auto_rickshaw:     0.097,
  flight_domestic:   0.255,
  flight_short_haul: 0.195,
  flight_long_haul:  0.150,
};

// kg CO₂e per kWh / kg / litre depending on unit
const ENERGY_FACTORS: Record<EnergyActivity["type"], number> = {
  electricity: 0.82,   // India grid average (CEA 2023)
  natural_gas: 2.04,   // per kg
  lpg:         2.98,   // per litre
  coal:        2.42,   // per kg
  solar:       0.0,
};

// kg CO₂e per serving (or per kg when weightKg provided)
const FOOD_FACTORS: Record<FoodActivity["item"], number> = { ... };
```

All factors are sourced from IPCC AR6, India CEA 2023, and FAOSTAT. Sources are documented inline in `factors.ts`.

---

## 7. Key Computed Constants

`src/lib/emissions/calculate.ts`:

```typescript
export const PARIS_ALIGNED_ANNUAL_TONNES = 2.0;
export const PARIS_ALIGNED_DAILY_KG = (PARIS_ALIGNED_ANNUAL_TONNES * 1000) / 365; // ≈ 5.479
export const INDIA_NATIONAL_AVERAGE_ANNUAL_TONNES = 2.0;
export const INDIA_URBAN_AVERAGE_ANNUAL_TONNES = 4.5;
```
