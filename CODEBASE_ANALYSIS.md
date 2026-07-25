# Codebase Analysis Report

## 1. CAPTAIN MODULE - COMPLETE FILE LISTING

### 1.1 Backend Files

#### Models
- **[player-auction-backend/src/models/Captain.model.ts](player-auction-backend/src/models/Captain.model.ts)**
  - Lines 1-21: Mongoose schema definition for Captain collection
  - Interface: `ICaptain` (lines 4-9)
  - Schema definition with team (unique) and player references (lines 12-17)
  - Export: `CaptainModel` (line 20)

#### Controllers
- **[player-auction-backend/src/controllers/captain.controller.ts](player-auction-backend/src/controllers/captain.controller.ts)**
  - Lines 1-50: CaptainController class
  - Constructor injection of `ICaptainRepository` (line 7)
  - Methods:
    - `list()` - lines 9-16: Paginated list of captains
    - `getById()` - lines 18-21: Get captain by ID
    - `getByTeam()` - lines 23-26: Get captain by team
    - `create()` - lines 28-35: Create/assign captain with conflict check
    - `update()` - lines 37-41: Update captain assignment
    - `delete()` - lines 43-46: Remove captain

#### Routes
- **[player-auction-backend/src/routes/captain.routes.ts](player-auction-backend/src/routes/captain.routes.ts)**
  - Lines 1-34: Express router setup
  - Imports: CaptainController, CaptainRepository (lines 2-3)
  - Imports: Validators, middleware (lines 4-7)
  - Public GET endpoints: list, getByTeam, getById (lines 14-16)
  - Protected POST/PATCH/DELETE endpoints with admin authorization (lines 18-33)

#### Validators
- **[player-auction-backend/src/validators/captain.validator.ts](player-auction-backend/src/validators/captain.validator.ts)**
  - Lines 1-13: Joi validation schemas
  - `createCaptainSchema`: Validates team and player (required, 24-char hex strings)
  - `updateCaptainSchema`: Validates player field only

#### Repository - Interface
- **[player-auction-backend/src/repositories/interfaces/ICaptainRepository.ts](player-auction-backend/src/repositories/interfaces/ICaptainRepository.ts)**
  - Lines 1-6: Interface definition
  - Extends `IRepository<ICaptain>`
  - Method: `findByTeam(teamId: string): Promise<ICaptain | null>` (line 5)

#### Repository - Implementation
- **[player-auction-backend/src/repositories/implementations/CaptainRepository.ts](player-auction-backend/src/repositories/implementations/CaptainRepository.ts)**
  - Lines 1-13: CaptainRepository class implementation
  - Constructor: Passes CaptainModel to BaseRepository (lines 6-8)
  - Implementation: `findByTeam()` - queries single captain by team (lines 10-12)

#### Scripts
- **[player-auction-backend/src/scripts/seed.ts](player-auction-backend/src/scripts/seed.ts)**
  - Line 18: Import `CaptainModel`
  - Lines 154-161: Seed data - creates captains for each team from retained players

- **[player-auction-backend/src/scripts/reset-players.ts](player-auction-backend/src/scripts/reset-players.ts)**
  - Line 15: Import `CaptainModel`
  - Line 41: Clears currentCaptain reference from Team documents
  - Lines 50-52: Deletes all captains associated with deleted players

#### Services
- **[player-auction-backend/src/services/session-reset.service.ts](player-auction-backend/src/services/session-reset.service.ts)**
  - Lines 1-50+: SessionResetService class
  - Line 7: Import `ICaptainRepository`
  - Line 35: Constructor injection of `captainRepository`
  - Deletes captains during session reset (as part of full data wipe)

#### Routes - Index
- **[player-auction-backend/src/routes/index.ts](player-auction-backend/src/routes/index.ts)**
  - Line 7: Import `captainRoutes` from captain.routes
  - Line 15: Register routes at `/captains` path

#### Routes - Admin
- **[player-auction-backend/src/routes/admin.routes.ts](player-auction-backend/src/routes/admin.routes.ts)**
  - Line 9: Import `CaptainRepository`
  - Line 26: Inject CaptainRepository into SessionResetService

---

### 1.2 Frontend Files

#### Models
- **[player-auction-frontend/src/app/core/models/captain.model.ts](player-auction-frontend/src/app/core/models/captain.model.ts)**
  - Lines 1-16: TypeScript interfaces for Captain
  - `Captain` interface (lines 1-6): id, team, player, timestamps
  - `CreateCaptainRequest` interface (lines 8-10): team, player
  - `UpdateCaptainRequest` interface (lines 12-14): player only

#### Models - Index/Barrel Export
- **[player-auction-frontend/src/app/core/models/index.ts](player-auction-frontend/src/app/core/models/index.ts)**
  - Line 7: Export statement for captain.model

#### Services
- **[player-auction-frontend/src/app/features/captains/services/captain.service.ts](player-auction-frontend/src/app/features/captains/services/captain.service.ts)**
  - Lines 1-32: CaptainService class (injectable)
  - Constructor injection: `ApiService` (line 8)
  - Methods:
    - `list()` - lines 10-12: Paginated list
    - `getById()` - lines 14-16: Get by ID
    - `getByTeam()` - lines 18-20: Get by team ID
    - `create()` - lines 22-24: Create captain
    - `update()` - lines 26-28: Update captain
    - `delete()` - lines 30-32: Delete captain

#### Components - Captain List
- **[player-auction-frontend/src/app/features/captains/captain-list/captain-list.ts](player-auction-frontend/src/app/features/captains/captain-list/captain-list.ts)**
  - Lines 1-100+: CaptainList component
  - Injected dependencies: CaptainService, TeamService, PlayerService, Router, Dialog, SnackBar
  - Signals: captains, teams, players, isLoading
  - Computed: captainsWithDetails (joins captain with team and player data)
  - Methods: fetch(), create(), edit(), delete()

- **[player-auction-frontend/src/app/features/captains/captain-list/captain-list.html](player-auction-frontend/src/app/features/captains/captain-list/captain-list.html)**
  - Template for captain list display

- **[player-auction-frontend/src/app/features/captains/captain-list/captain-list.scss](player-auction-frontend/src/app/features/captains/captain-list/captain-list.scss)**
  - Styling for captain list component

#### Components - Captain Form
- **[player-auction-frontend/src/app/features/captains/captain-form/captain-form.ts](player-auction-frontend/src/app/features/captains/captain-form/captain-form.ts)**
  - Lines 1-100+: CaptainForm component
  - Reactive form with team and player selection
  - Supports both create and edit modes
  - Dynamic roster loading based on selected team
  - Edit mode: disables team selection, loads existing captain data

- **[player-auction-frontend/src/app/features/captains/captain-form/captain-form.html](player-auction-frontend/src/app/features/captains/captain-form/captain-form.html)**
  - Template for captain form

- **[player-auction-frontend/src/app/features/captains/captain-form/captain-form.scss](player-auction-frontend/src/app/features/captains/captain-form/captain-form.scss)**
  - Styling for captain form component

#### Components - Captain Assignment Dialog
- **[player-auction-frontend/src/app/features/players/captain-assignment-dialog/captain-assignment-dialog.ts](player-auction-frontend/src/app/features/players/captain-assignment-dialog/captain-assignment-dialog.ts)**
  - Lines 1-130+: Dialog component for quick captain assignment
  - Accepts dialog data: team, allTeams, selectedPlayer, allPlayers
  - Features: Player search with name/role/country filtering (line 126), team selection
  - Used by player-list component for inline captain assignment

- **[player-auction-frontend/src/app/features/players/captain-assignment-dialog/captain-assignment-dialog.html](player-auction-frontend/src/app/features/players/captain-assignment-dialog/captain-assignment-dialog.html)**
  - Template with player search and display metadata (role • country)

- **[player-auction-frontend/src/app/features/players/captain-assignment-dialog/captain-assignment-dialog.scss](player-auction-frontend/src/app/features/players/captain-assignment-dialog/captain-assignment-dialog.scss)**
  - Styling for assignment dialog

#### Routing
- **[player-auction-frontend/src/app/app.routes.ts](player-auction-frontend/src/app/app.routes.ts)**
  - Lines 138-151: Captain routing configuration
  - Route 1: `/captains` -> CaptainList component (line 138)
  - Route 2: `/captains/new` -> CaptainForm component (line 143)
  - Route 3: `/captains/:id/edit` -> CaptainForm component (line 148)

---

## 2. COUNTRY FIELD - COMPREHENSIVE USAGE LISTING

### 2.1 Backend Country Field Usage

#### Model Definition
- **[player-auction-backend/src/models/Player.model.ts](player-auction-backend/src/models/Player.model.ts)**
  - Line 9: Interface property `country: string` (required)
  - Line 36: Schema field definition with trim, required
  - Line 65: Single field index on country
  - Line 69: Full-text search index including country

#### Validators
- **[player-auction-backend/src/validators/player.validator.ts](player-auction-backend/src/validators/player.validator.ts)**
  - Line 17: `country: Joi.string().trim().min(2).max(60).required()` (in create schema)
  - Line 31: `country: Joi.string().trim().min(2).max(60).optional()` (in update schema)

#### Controllers
- **[player-auction-backend/src/controllers/player.controller.ts](player-auction-backend/src/controllers/player.controller.ts)**
  - Line 25: `country` query parameter destructuring
  - Lines 44-45: Filter logic - `if (country) { filter.country = country; }`

#### Services
- **[player-auction-backend/src/services/player.service.ts](player-auction-backend/src/services/player.service.ts)**
  - Line 12: `country: string` in CreatePlayerInput interface
  - Line 28: `country?: string` in UpdatePlayerInput interface

- **[player-auction-backend/src/services/player-import.service.ts](player-auction-backend/src/services/player-import.service.ts)**
  - Line 13: `country: string` in interface
  - Line 28: `'country'` in REQUIRED_COLUMNS array
  - Line 90: `country: row.country` when mapping import data
  - Line 187: `country: record.country.trim()` in CSV parsing

#### Scripts - Seed Data
- **[player-auction-backend/src/scripts/seed.ts](player-auction-backend/src/scripts/seed.ts)**
  - Line 36: `country: string` in INITIAL_PLAYERS interface
  - Lines 43-62: Country values - All 'India' for initial seeding
    - Examples: Line 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62

- **[player-auction-backend/src/scripts/seed-fresh-players.ts](player-auction-backend/src/scripts/seed-fresh-players.ts)**
  - Multiple country values: 'Brazil', 'Argentina', 'Spain', 'Italy', 'France', 'Chile', 'Egypt', 'Portugal'
  - Lines 21-68: Country values in player definitions

---

### 2.2 Frontend Country Field Usage

#### Models
- **[player-auction-frontend/src/app/core/models/player.model.ts](player-auction-frontend/src/app/core/models/player.model.ts)**
  - Line 13: `country: string` in Player interface
  - Line 33: `country: string` in CreatePlayerRequest interface
  - Line 45: `country?: string` in UpdatePlayerRequest interface
  - Line 59: `country?: string` in PlayerListQuery interface

#### Services
- **[player-auction-frontend/src/app/features/players/services/player.service.ts](player-auction-frontend/src/app/features/players/services/player.service.ts)**
  - Query building with country parameter

#### Components - Player List
- **[player-auction-frontend/src/app/features/players/player-list/player-list.ts](player-auction-frontend/src/app/features/players/player-list/player-list.ts)**
  - Line 67: 'country' in columnsToDisplay array
  - Line 80: `readonly countryFilter = signal<string | null>(null)` - reactive state
  - Line 118-119: `onCountryFilterChange()` method - updates filter signal
  - Line 133: Reset filter to null in clearFilters()
  - Line 186: Upload hint mentions country column requirement
  - Line 326: Export header includes country
  - Line 328: Export data includes `p.country`
  - Line 341: Query parameter `country: this.countryFilter() ?? undefined`

- **[player-auction-frontend/src/app/features/players/player-list/player-list.html](player-auction-frontend/src/app/features/players/player-list/player-list.html)**
  - Lines 38-39: Filter input for country (matInput with change handler)
  - Lines 101-103: Table column definition with country header and cell display

#### Components - Player Form
- **[player-auction-frontend/src/app/features/players/player-form/player-form.ts](player-auction-frontend/src/app/features/players/player-form/player-form.ts)**
  - Line 44: `country: ['', [Validators.required, Validators.minLength(2)]]` in form control
  - Line 86: `country: value.country` when preparing request
  - Line 136: `country: player.country` when patching form in edit mode

- **[player-auction-frontend/src/app/features/players/player-form/player-form.html](player-auction-frontend/src/app/features/players/player-form/player-form.html)**
  - Lines 44-47: Form field with country label, input, and error validation

#### Components - Captain Assignment Dialog
- **[player-auction-frontend/src/app/features/players/captain-assignment-dialog/captain-assignment-dialog.ts](player-auction-frontend/src/app/features/players/captain-assignment-dialog/captain-assignment-dialog.ts)**
  - Line 126: Search filter includes country: `p.country.toLowerCase().includes(term)`

- **[player-auction-frontend/src/app/features/players/captain-assignment-dialog/captain-assignment-dialog.html](player-auction-frontend/src/app/features/players/captain-assignment-dialog/captain-assignment-dialog.html)**
  - Line 30: Display metadata - `{{ player.role }} • {{ player.country }}`
  - Line 44: Search placeholder mentions country
  - Line 84: Display metadata in search results - `{{ player.role }} • {{ player.country }}`

#### Components - Player Detail
- **[player-auction-frontend/src/app/features/players/player-detail/player-detail.html](player-auction-frontend/src/app/features/players/player-detail/player-detail.html)**
  - Line 17: Display player info - `{{ p.role }} · {{ p.country }}`

#### Components - Auction Room
- **[player-auction-frontend/src/app/features/auction-room/player-stage/player-card.html](player-auction-frontend/src/app/features/auction-room/player-stage/player-card.html)**
  - Line 11: Display metadata - `{{ player().role }} · {{ player().country }}`

---

## 3. SUMMARY STATISTICS

### Captain Module Files
- **Total Backend Files**: 11
  - Models: 1
  - Controllers: 1
  - Routes: 2 (captain.routes, routes/index reference)
  - Validators: 1
  - Repositories: 2 (interface + implementation)
  - Services: 1 (session-reset uses captain repo)
  - Scripts: 2 (seed, reset-players)
  - Admin routes: 1 (registers captain repo)

- **Total Frontend Files**: 11
  - Models: 2 (captain.model + index/barrel export)
  - Services: 1
  - Components: 3 (captain-list, captain-form, captain-assignment-dialog)
  - Templates: 3 (.html files)
  - Styles: 3 (.scss files)
  - Routes: 1 (app.routes.ts)

### Country Field Usage
- **Backend Files with Country**: 9
  - Models: 1
  - Controllers: 1
  - Validators: 1
  - Services: 2
  - Scripts: 2
  - Total references: 100+ (mostly seed data)

- **Frontend Files with Country**: 9
  - Models: 1
  - Services: 1
  - Components: 5 (player-list, player-form, captain-assignment-dialog, player-detail, player-card)
  - Templates: 4
  - Total references: 14+

---

## 4. KEY RELATIONSHIPS & DEPENDENCIES

### Captain Module Dependencies
```
CaptainController → ICaptainRepository → CaptainModel (Mongoose)
                 → CaptainService (used by external routes)

CaptainRoutes → CaptainController → CaptainRepository
             → Validators → Middleware

AdminRoutes → SessionResetService → ICaptainRepository

FrontendCaptainList/Form → CaptainService → ApiService
FrontendCaptainAssignmentDialog → PlayerService
```

### Country Field Flow
```
Backend Flow:
  Player.model.ts (definition)
    ↓
  player.validator.ts (validation)
    ↓
  player.controller.ts (query filtering)
    ↓
  player.service.ts (business logic)
    ↓
  player-import.service.ts (CSV import)
    ↓
  Scripts (seed.ts, seed-fresh-players.ts)

Frontend Flow:
  player.model.ts (interfaces)
    ↓
  player-list.ts (filtering & export)
    ↓
  player-form.ts (form control)
    ↓
  Templates (display & input)
    ↓
  captain-assignment-dialog.ts (search)
    ↓
  auction-room (display)
```

---

## 5. IMPORTANT NOTES

### Captain Module
- **One captain per team** enforced by unique index on `team` field
- **Conflict detection** in create endpoint prevents duplicate captains
- **Soft-delete support**: Captains linked to deleted players are removed
- **Session reset**: Captains are completely wiped during `resetSession`
- **Dialog pattern**: Captain assignment integrated into player list for UX

### Country Field
- **Required in creation**, optional in updates
- **Indexed** for efficient filtering queries
- **Full-text search** included in compound text index
- **CSV import**: Country is mandatory column
- **Display**: Shown alongside role in all player-facing UI
- **Searchable**: Included in captain assignment dialog search
- **Filter capability**: Dedicated UI filter in player list

---

Generated: 24 July 2026
