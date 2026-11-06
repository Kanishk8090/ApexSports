# Multi-Sport Tournament Management System
## 6-Week Full-Stack Development Specification

## 1. Project Overview

Build a production-quality, full-stack **Multi-Sport Tournament Management System**.

The system must allow administrators and tournament organizers to manage:

- Sports
- Players
- Teams
- Tournaments
- Tournament registrations
- Venues
- Matches
- Match schedules
- Scores
- Results
- Standings
- Player statistics
- Team statistics
- Users and roles
- Reports

The application must support multiple sports using a **generic and extensible architecture**, rather than creating a separate application for each sport.

Initial sports should include:

- Football
- Cricket
- Basketball
- Tennis
- Badminton
- Volleyball

The system must be designed so additional sports can be added later without major database or application rewrites.

---

# 2. Main Objective

Build the application incrementally over 6 weeks.

Development must start immediately in Week 1.

Every week should result in a working part of the application.

Do NOT spend an entire week only designing documentation. Design and implementation should happen together.

The development pattern should be:

```text
Database
   ↓
Backend API
   ↓
Frontend
   ↓
Integration
   ↓
Testing
   ↓
Working Feature
```

---

# 3. Recommended Technology Stack

Use the following stack unless there is a strong technical reason to change it.

### Frontend

- React
- TypeScript
- React Router
- Tailwind CSS
- Axios or Fetch
- Reusable component architecture

### Backend

- Node.js
- Express.js
- TypeScript
- REST APIs
- JWT authentication
- bcrypt/argon2 for password hashing

### Database

- PostgreSQL

### ORM

- Prisma

### Development Tools

- Git
- GitHub
- ESLint
- Prettier
- Environment variables
- API testing with Postman/Thunder Client

---

# 4. High-Level Architecture

Use a clean layered architecture:

```text
                 React Frontend
                       |
                       | REST API
                       ↓
              Express Backend
                       |
          ┌────────────┴────────────┐
          ↓                         ↓
     Business Logic             Auth Layer
          |
          ↓
       Prisma ORM
          |
          ↓
      PostgreSQL
```

Backend structure should roughly follow:

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   ├── types/
│   └── app.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── package.json
```

Frontend structure should roughly follow:

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── context/
│   └── App.tsx
└── package.json
```

Keep frontend, backend, and database code modular.

---

# 5. Core Entities

The database should contain, at minimum, the following entities.

```text
User
Sport
Player
Team
TeamPlayer
Tournament
TournamentTeam
Venue
Match
MatchTeam
Score
Result
Standing
PlayerStatistic
TeamStatistic
```

Additional supporting entities may be introduced where necessary.

---

# 6. Core Relationships

The system should follow relationships similar to:

```text
SPORT
  |
  ├────────────── TEAM
  |                |
  |                └──── TEAM_PLAYER ─── PLAYER
  |
  └────────────── TOURNAMENT
                    |
                    ├──── TOURNAMENT_TEAM ─── TEAM
                    |
                    ├──── MATCH
                    |      |
                    |      ├──── VENUE
                    |      ├──── MATCH_TEAM ─── TEAM
                    |      ├──── SCORE
                    |      └──── RESULT
                    |
                    └──── STANDING
```

Avoid storing lists of IDs inside a single database column.

Use normalized relational tables and foreign keys.

---

# 7. Database Requirements

The database must demonstrate proper DBMS concepts.

Implement:

- Primary keys
- Foreign keys
- Unique constraints
- NOT NULL constraints
- CHECK constraints where appropriate
- Composite unique constraints
- Indexes
- Normalized relationships
- Transactions
- Views
- Stored procedures/functions where appropriate
- Triggers only where they provide clear value

Do not add database features only for decoration. Every advanced DBMS feature should solve a real problem.

---

# 8. Suggested Database Models

## User

Fields should include:

```text
id
name
email
passwordHash
role
createdAt
updatedAt
```

Roles:

```text
ADMIN
ORGANIZER
USER
```

---

## Sport

```text
id
name
code
description
createdAt
updatedAt
```

Example:

```text
Football
Cricket
Basketball
Tennis
Badminton
Volleyball
```

Sport names/codes must be unique.

---

## Player

```text
id
name
dateOfBirth
gender
nationality
sportId
createdAt
updatedAt
```

A player belongs to a sport.

---

## Team

```text
id
name
sportId
description
createdAt
updatedAt
```

Team names should be unique within the relevant sport.

---

## TeamPlayer

Many-to-many relationship between Teams and Players.

```text
teamId
playerId
joinedAt
jerseyNumber
```

Use a composite uniqueness constraint on:

```text
teamId + playerId
```

---

## Tournament

```text
id
name
sportId
description
startDate
endDate
format
status
createdBy
createdAt
updatedAt
```

Formats:

```text
LEAGUE
KNOCKOUT
GROUP_KNOCKOUT
```

Statuses:

```text
DRAFT
UPCOMING
ONGOING
COMPLETED
CANCELLED
```

---

## TournamentTeam

Connects teams with tournaments.

```text
tournamentId
teamId
registeredAt
seed
group
```

Prevent duplicate registration.

---

## Venue

```text
id
name
location
capacity
description
createdAt
updatedAt
```

A venue can host multiple matches, but overlapping matches must not be allowed.

---

## Match

```text
id
tournamentId
venueId
round
matchNumber
scheduledAt
status
createdAt
updatedAt
```

Statuses:

```text
SCHEDULED
LIVE
COMPLETED
POSTPONED
CANCELLED
```

---

## MatchTeam

Connects teams to matches.

```text
matchId
teamId
side
```

For normal two-team matches:

```text
HOME
AWAY
```

The architecture should remain extensible for sports with different match structures.

---

## Score

Do not hard-code football-only scoring.

Use a flexible scoring structure that can support different sports.

At minimum, support a match score representation that can store:

```text
matchId
teamId
period/set/innings identifier where needed
score value
metadata/details where appropriate
```

For complex sport-specific scoring, use structured JSON only where relational columns would become impractical. Keep core entities relational.

---

## Result

```text
id
matchId
winnerTeamId
resultType
completedAt
```

Result types may include:

```text
WIN
DRAW
TIE
NO_RESULT
ABANDONED
```

---

## Standing

```text
id
tournamentId
teamId
played
wins
draws
losses
points
goalsFor
goalsAgainst
scoreDifference
rank
```

For sports where some fields are not applicable, the architecture should allow sport-specific ranking logic.

---

## PlayerStatistic

Create a flexible statistics model that can support sport-specific statistics.

Possible fields:

```text
id
playerId
matchId
statType
statValue
```

Examples:

```text
goals = 2
assists = 1
runs = 72
wickets = 3
points = 25
aces = 8
```

---

## TeamStatistic

Use this for aggregated or match-specific team statistics.

---

# 9. Authentication and Authorization

Implement JWT-based authentication.

Required functionality:

```text
Register
Login
Logout
Get Current User
```

Passwords must never be stored in plain text.

Use secure password hashing.

### Permissions

ADMIN:

- Manage users
- Manage sports
- Manage teams
- Manage players
- Manage tournaments
- Manage venues
- Manage matches
- Manage scores
- View reports

ORGANIZER:

- Create/manage tournaments
- Register teams
- Schedule matches
- Manage venues
- Enter/update scores
- View standings

USER:

- View sports
- View teams
- View players
- View tournaments
- View matches
- View scores
- View standings
- View statistics

Enforce authorization on the backend, not only in the frontend.

---

# 10. REST API

Implement clean REST APIs.

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

## Sports

```text
GET    /api/sports
POST   /api/sports
GET    /api/sports/:id
PUT    /api/sports/:id
DELETE /api/sports/:id
```

## Players

```text
GET    /api/players
POST   /api/players
GET    /api/players/:id
PUT    /api/players/:id
DELETE /api/players/:id
```

## Teams

```text
GET    /api/teams
POST   /api/teams
GET    /api/teams/:id
PUT    /api/teams/:id
DELETE /api/teams/:id

POST   /api/teams/:id/players
DELETE /api/teams/:id/players/:playerId
```

## Tournaments

```text
GET    /api/tournaments
POST   /api/tournaments
GET    /api/tournaments/:id
PUT    /api/tournaments/:id
DELETE /api/tournaments/:id

POST   /api/tournaments/:id/teams
DELETE /api/tournaments/:id/teams/:teamId
GET    /api/tournaments/:id/teams
```

## Venues

```text
GET    /api/venues
POST   /api/venues
GET    /api/venues/:id
PUT    /api/venues/:id
DELETE /api/venues/:id
```

## Matches

```text
GET    /api/matches
POST   /api/matches
GET    /api/matches/:id
PUT    /api/matches/:id
DELETE /api/matches/:id

POST   /api/tournaments/:id/generate-fixtures
```

## Scores

```text
GET    /api/matches/:id/score
POST   /api/matches/:id/score
PUT    /api/matches/:id/score
```

## Results

```text
GET    /api/matches/:id/result
POST   /api/matches/:id/result
```

## Standings

```text
GET /api/tournaments/:id/standings
```

## Statistics

```text
GET /api/players/:id/statistics
GET /api/teams/:id/statistics
GET /api/tournaments/:id/statistics
```

---

# 11. Frontend Pages

Create a professional responsive dashboard.

Required pages:

```text
/login
/register
/dashboard

/sports
/players
/players/:id

/teams
/teams/:id

/tournaments
/tournaments/:id

/venues
/matches
/matches/:id

/standings
/statistics
/reports
```

---

# 12. Dashboard

Display:

```text
Total Sports
Total Players
Total Teams
Active Tournaments
Upcoming Matches
Completed Matches
```

Also show:

- Upcoming matches
- Recent results
- Active tournaments
- Recent registrations
- Quick actions

---

# 13. Player Management UI

Provide:

- Player list
- Search
- Filters
- Add player
- Edit player
- Delete player
- Player details
- Team association
- Player statistics

---

# 14. Team Management UI

Provide:

- Team list
- Search
- Filter by sport
- Add/edit/delete team
- Team details
- Team roster
- Add/remove players
- Team statistics
- Match history

---

# 15. Tournament Management UI

Tournament details should contain tabs/sections:

```text
Overview
Teams
Matches
Standings
Statistics
```

Allow organizers to:

- Create tournament
- Select sport
- Select format
- Register teams
- Generate fixtures
- Manage tournament status

---

# 16. Match Management UI

Show:

```text
Tournament
Round
Teams
Venue
Date
Time
Status
Score
Result
```

Provide actions:

```text
Schedule
Reschedule
Cancel
Start
Enter Score
Complete
```

---

# 17. Standings

For league-style tournaments, display:

```text
Rank
Team
Played
Wins
Draws
Losses
Points
For
Against
Difference
```

Ranking must be calculated according to the sport/tournament rules.

---

# 18. Multi-Sport Architecture

This is a major requirement.

Do not create separate applications such as:

```text
FootballApp
CricketApp
BasketballApp
```

Instead use:

```text
Sport
   ↓
Sport Rules
   ↓
Tournament
   ↓
Match
   ↓
Sport-specific scoring/statistics
```

The core entities remain generic.

Sport-specific logic should be isolated in services/modules.

For example:

```text
services/
├── tournamentService
├── matchService
├── standingsService
└── sports/
    ├── footballService
    ├── cricketService
    ├── basketballService
    ├── tennisService
    └── genericSportService
```

Adding a new sport should require minimal changes.

---

# 19. Tournament Formats

## League

Automatically generate round-robin fixtures.

Example:

```text
A vs B
A vs C
A vs D
B vs C
B vs D
C vs D
```

Update standings after each completed match.

---

## Knockout

Support:

```text
Quarter Final
       ↓
Semi Final
       ↓
Final
```

A winner should advance automatically to the next round.

---

## Group + Knockout

Support:

```text
Group Stage
     ↓
Top Teams
     ↓
Quarter Final
     ↓
Semi Final
     ↓
Final
```

---

# 20. Score and Standings Logic

When a match is completed:

```text
Enter Score
    ↓
Validate Score
    ↓
Determine Result
    ↓
Store Result
    ↓
Update Team Statistics
    ↓
Update Player Statistics
    ↓
Update Standings
```

Use a database transaction so that the operation does not leave the database partially updated.

Example:

```text
BEGIN TRANSACTION

Update score
Update result
Update standings
Update statistics

COMMIT
```

If any operation fails:

```text
ROLLBACK
```

---

# 21. Database Views / Advanced DBMS Features

Create useful views such as:

```text
TournamentStandingsView
UpcomingMatchesView
TeamPerformanceView
PlayerPerformanceView
```

Useful stored procedures/functions may include:

```text
generateLeagueFixtures()
calculateStandings()
completeMatch()
registerTeamToTournament()
```

Use triggers only where appropriate, for example:

- Audit timestamps
- Maintaining derived data where justified

Do not use triggers for all business logic.

---

# 22. Search and Filtering

Implement search/filter functionality for:

### Players

```text
Name
Sport
Team
```

### Teams

```text
Name
Sport
Tournament
```

### Tournaments

```text
Name
Sport
Status
Date
Format
```

### Matches

```text
Tournament
Sport
Team
Venue
Date
Status
```

Use backend pagination for large datasets.

---

# 23. Reports

Create reports for:

### Tournament

```text
Tournament name
Sport
Teams
Matches
Completed matches
Winner
Standings
```

### Team

```text
Matches played
Wins
Losses
Draws
Points
Performance
```

### Player

```text
Matches
Statistics
Performance
Team
Sport
```

Reports should use efficient SQL queries/views where appropriate.

---

# 24. Validation Rules

Examples:

- A player can only join a team of the same sport.
- A team cannot be registered twice in a tournament.
- A team cannot participate in a tournament for another sport.
- A match must belong to its tournament.
- Match teams must be registered in the tournament.
- A team cannot play itself.
- A venue cannot host overlapping matches.
- A tournament end date cannot be before its start date.
- A completed match cannot be rescheduled without an explicit correction workflow.
- Scores cannot be submitted for cancelled matches.
- Standings should only count valid completed results.
- Unauthorized users cannot modify protected resources.

---

# 25. Seed Data

Create realistic seed data so the application is immediately demonstrable.

Seed at least:

```text
6 Sports
10+ Teams
50+ Players
3+ Tournaments
10+ Venues
20+ Matches
Multiple completed matches
Multiple upcoming matches
Sample standings
Sample statistics
```

Include at least:

- One football tournament
- One cricket tournament
- One basketball tournament

Make the demo data visually useful.

---

# 26. Six-Week Implementation Roadmap

## WEEK 1 — Core Setup + Players + Teams + Sports

Implement:

- Repository setup
- Frontend setup
- Backend setup
- PostgreSQL setup
- Prisma setup
- Authentication foundation
- Sports CRUD
- Players CRUD
- Teams CRUD
- Team-player relationships
- Basic dashboard
- Validation
- Database constraints

### Week 1 Acceptance Criteria

The user can:

```text
Login
 ↓
View sports
 ↓
Create a sport
 ↓
Create players
 ↓
Create teams
 ↓
Add players to teams
 ↓
View team roster
```

---

## WEEK 2 — Tournament Management

Implement:

- Tournament database
- Tournament CRUD
- Tournament-team registration
- Tournament formats
- Tournament status
- Tournament dashboard
- Validation
- Tournament APIs
- Tournament frontend

### Week 2 Acceptance Criteria

The user can:

```text
Create tournament
 ↓
Select sport
 ↓
Select format
 ↓
Register teams
 ↓
View tournament
```

---

## WEEK 3 — Venues + Matches + Scheduling

Implement:

- Venue CRUD
- Match CRUD
- Match-team relationships
- Match scheduling
- Rescheduling
- Match status
- League fixture generation
- Knockout fixture generation
- Match UI

### Week 3 Acceptance Criteria

The user can:

```text
Tournament
 ↓
Register teams
 ↓
Generate fixtures
 ↓
Assign venues
 ↓
Schedule matches
 ↓
View fixtures
```

---

## WEEK 4 — Scores + Results + Standings

Implement:

- Score management
- Result management
- Match completion
- Automatic standings
- Team statistics
- Basic player statistics
- Transactions
- Views
- Stored procedures/functions where appropriate

### Week 4 Acceptance Criteria

The user can:

```text
Open match
 ↓
Enter score
 ↓
Complete match
 ↓
Generate result
 ↓
Update standings
 ↓
View tournament table
```

---

## WEEK 5 — Multi-Sport + Authentication + Statistics

Implement:

- Complete JWT authentication
- Role-based access control
- Sport-specific scoring
- Football support
- Cricket support
- Basketball support
- Tennis/badminton/volleyball support using generic/extensible scoring
- Player statistics
- Team statistics
- Search
- Filtering
- Reports

### Week 5 Acceptance Criteria

The user can run multiple tournaments for different sports using the same application.

---

## WEEK 6 — Integration + Testing + Deployment

Implement:

- Full integration
- Database indexes
- Query optimization
- Error handling
- Security improvements
- API testing
- Frontend testing
- Responsive UI
- Loading/error/empty states
- Production configuration
- Deployment
- Documentation
- Final seed data
- Final demo flow

### Week 6 Acceptance Criteria

The entire system works from:

```text
Login
 ↓
Sport
 ↓
Teams
 ↓
Players
 ↓
Tournament
 ↓
Registration
 ↓
Venue
 ↓
Scheduling
 ↓
Match
 ↓
Score
 ↓
Result
 ↓
Standings
 ↓
Statistics
 ↓
Reports
```

---

# 27. UI/UX Requirements

The application should look like a modern sports management dashboard.

Use:

- Responsive layout
- Sidebar navigation
- Top navigation
- Cards
- Tables
- Modals/dialogs
- Forms
- Tabs
- Badges for statuses
- Charts where useful
- Consistent spacing
- Accessible buttons and forms

Avoid making the interface look like a basic CRUD college project.

The dashboard should feel like a real sports administration platform.

---

# 28. Error Handling

Backend should return consistent API responses.

Example:

```json
{
  "success": false,
  "message": "Team is already registered in this tournament"
}
```

Frontend should display user-friendly errors.

Never expose database stack traces or sensitive server information to users.

---

# 29. Security Requirements

Implement:

- Password hashing
- JWT authentication
- Authorization middleware
- Input validation
- SQL injection protection through Prisma
- CORS configuration
- Environment variables
- Secure error handling
- No passwords in API responses

Never commit secrets to Git.

---

# 30. Testing Requirements

Test:

### Authentication

- Valid login
- Invalid login
- Unauthorized requests
- Role restrictions

### Players

- CRUD
- Invalid data
- Duplicate relationships

### Teams

- CRUD
- Add/remove players
- Sport validation

### Tournaments

- CRUD
- Team registration
- Duplicate registration
- Invalid dates

### Matches

- Scheduling
- Venue conflicts
- Team validation
- Status changes

### Scores

- Valid score
- Invalid score
- Completed match
- Cancelled match

### Standings

- Win
- Loss
- Draw
- Ranking
- Multiple matches

---

# 31. Definition of Done

A feature is considered complete only when:

```text
Database implemented
       ↓
Backend API implemented
       ↓
Validation implemented
       ↓
Frontend implemented
       ↓
Frontend connected to API
       ↓
Success state tested
       ↓
Failure state tested
       ↓
Database constraints tested
```

Do not mark a feature complete if only the UI exists.

---

# 32. Important Development Rules for the Coding Agent

1. Build the application incrementally.
2. Do not generate the entire project as one giant implementation.
3. After each major module, verify that it runs.
4. Keep database schema normalized.
5. Do not use mock data as a substitute for the real database once the database module exists.
6. Keep business logic in backend services rather than React components.
7. Do not put authorization logic only in the frontend.
8. Use reusable React components.
9. Use TypeScript types consistently.
10. Use database transactions for multi-step operations.
11. Keep sport-specific logic modular.
12. Do not hard-code teams, players, tournaments, or sports.
13. Do not create separate databases for each sport.
14. Use migrations for schema changes.
15. Create seed data for development.
16. Keep API responses consistent.
17. Handle loading, error, and empty states.
18. Write clean, maintainable code.
19. Do not remove working functionality when adding new features.
20. Before finishing each week, run the application and verify the week's acceptance criteria.

---

# 33. Development Priority

If time becomes limited, prioritize in this order:

```text
1. Database
2. Players
3. Teams
4. Tournaments
5. Matches
6. Scores
7. Standings
8. Authentication
9. Multi-sport logic
10. Statistics
11. Reports
12. UI polish
```

The core tournament flow is more important than decorative features.

---

# 34. Final Expected Product

The completed application should allow an organizer to manage a tournament from beginning to end.

Example:

```text
ADMIN LOGIN
    ↓
CREATE FOOTBALL SPORT
    ↓
CREATE 8 TEAMS
    ↓
ADD PLAYERS
    ↓
CREATE FOOTBALL TOURNAMENT
    ↓
REGISTER 8 TEAMS
    ↓
ADD VENUES
    ↓
GENERATE FIXTURES
    ↓
SCHEDULE MATCHES
    ↓
PLAY MATCH
    ↓
ENTER SCORE
    ↓
CALCULATE RESULT
    ↓
UPDATE STANDINGS
    ↓
UPDATE STATISTICS
    ↓
VIEW REPORT
```

The same application should then be able to create:

```text
CRICKET TOURNAMENT
BASKETBALL TOURNAMENT
TENNIS TOURNAMENT
BADMINTON TOURNAMENT
VOLLEYBALL TOURNAMENT
```

without changing the fundamental application architecture.

---

# 35. First Task for the Coding Agent

Start implementation immediately.

Do not only provide a plan.

First:

1. Inspect the existing repository.
2. Create the project structure if it does not exist.
3. Set up frontend, backend, and PostgreSQL.
4. Configure Prisma.
5. Create the initial database schema.
6. Run the first migration.
7. Create seed data.
8. Implement Sports CRUD.
9. Implement Players CRUD.
10. Implement Teams CRUD.
11. Implement Team-Player relationships.
12. Build the initial dashboard.
13. Connect frontend to the backend.
14. Run the application.
15. Fix errors before proceeding.
16. Update the README with setup and run instructions.

After Week 1 is complete, continue to Week 2 without replacing or breaking the existing functionality.

The final result must be a fully integrated, database-backed, multi-sport tournament management application rather than a static frontend prototype.
