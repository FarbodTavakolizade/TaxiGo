# Use Cases

## 1. Use case diagram

```mermaid
graph LR
    P((Passenger))
    D((Driver))
    A((Admin))

    subgraph System[Taxi Request System]
        UC1[Register]
        UC2[Login / Logout]
        UC3[Create ride request]
        UC4[View own rides]
        UC5[Cancel own ride]
        UC6[View available requests]
        UC7[Accept ride]
        UC8[Start ride]
        UC9[Complete ride]
        UC10[View own ride history]
        UC11[View statistics]
        UC12[Manage users]
        UC13[View all rides]
    end

    P --> UC1
    P --> UC2
    P --> UC3
    P --> UC4
    P --> UC5

    D --> UC1
    D --> UC2
    D --> UC6
    D --> UC7
    D --> UC8
    D --> UC9
    D --> UC10

    A --> UC2
    A --> UC11
    A --> UC12
    A --> UC13

    UC7 -.->|include| UC6
    UC8 -.->|include| UC7
    UC9 -.->|include| UC8
    UC5 -.->|include| UC4
```

## 2. Use case descriptions

### UC-1 Register

- **Actor:** Visitor (future Passenger or Driver)
- **Precondition:** Not logged in
- **Main flow:**
  1. Visitor opens `/register`.
  2. Enters name, email, password and chooses a role (Passenger or Driver).
  3. System validates the input and checks that the email is not used yet.
  4. System hashes the password and stores the user.
  5. System redirects to `/login` with a success message.
- **Alternative flow:** Validation fails or email exists → the form is shown
  again with the entered values and an error message.

### UC-2 Login / Logout

- **Actor:** All roles
- **Main flow:**
  1. User opens `/login`, enters email and password.
  2. System verifies the credentials and that the account is active.
  3. System stores the user in the session and redirects to the dashboard of
     the user's role.
- **Alternative flow:** Wrong credentials or deactivated account → login page
  is shown with a friendly error message.
- **Logout:** `/logout` destroys the session and redirects to `/login`.

### UC-3 Create ride request

- **Actor:** Passenger
- **Precondition:** Logged in as an active passenger
- **Main flow:**
  1. Passenger opens `/passenger/rides/new`.
  2. Enters origin and destination.
  3. System validates both fields, creates a ride with status REQUESTED.
  4. System redirects to `/passenger/rides` showing the new request.
- **Alternative flow:** Empty field → form is shown again with an error.

### UC-5 Cancel own ride

- **Actor:** Passenger
- **Precondition:** The ride belongs to the passenger and is REQUESTED or ACCEPTED.
- **Main flow:**
  1. Passenger clicks Cancel next to the ride.
  2. System confirms the action (JavaScript confirm dialog).
  3. System changes the status to CANCELLED and stores `cancelled_at`.
- **Alternative flow:** Ride is STARTED/COMPLETED → error message, no change.

### UC-7 Accept ride

- **Actor:** Driver
- **Precondition:** Logged in as an active driver; ride is REQUESTED.
- **Main flow:**
  1. Driver sees available requests on `/driver/dashboard`.
  2. Clicks Accept on a request.
  3. System assigns the ride to the driver and sets status ACCEPTED
     (atomically, only if still REQUESTED).
- **Alternative flow:** Another driver accepted first → friendly error.

### UC-8/9 Start and complete ride

- **Actor:** Driver
- **Precondition:** Ride is assigned to this driver and in the required status.
- **Main flow:** Driver clicks Start Ride (ACCEPTED → STARTED) and later
  Complete Ride (STARTED → COMPLETED).
- **Alternative flow:** Wrong status → error message; the GUI only shows the
  button that is valid for the current status.

### UC-12 Manage users

- **Actor:** Admin
- **Main flow:**
  1. Admin opens `/admin/users`.
  2. Deactivates (or reactivates) a user.
  3. A deactivated user can no longer log in; existing sessions are rejected
     on their next request because the user row is reloaded from the database.
- **Alternative flow:** Admin tries to deactivate their own account → error.

## 3. Activity diagram – ride request lifecycle

```mermaid
flowchart TD
    Start([Passenger creates request]) --> Req[Status: REQUESTED]
    Req --> DriverSees{Driver sees it<br/>on dashboard}

    DriverSees -->|Accept| Acc[Status: ACCEPTED<br/>driver assigned, accepted_at set]
    DriverSees -->|No driver yet| Req
    Req -->|Passenger cancels| Can[Status: CANCELLED<br/>cancelled_at set]

    Acc -->|Driver starts| Str[Status: STARTED<br/>started_at set]
    Acc -->|Driver or passenger cancels| Can

    Str -->|Driver completes| Comp[Status: COMPLETED<br/>completed_at set]

    Can --> End([Final state])
    Comp --> End
```

## 4. Access matrix

| Page / action                  | Passenger | Driver | Admin |
|--------------------------------|-----------|--------|-------|
| /login, /register              | guest     | guest  | guest |
| /passenger/dashboard           | ✔         | ✘      | ✘     |
| /passenger/rides (own)         | ✔         | ✘      | ✘     |
| /passenger/rides/new           | ✔         | ✘      | ✘     |
| /passenger/rides/:id/cancel    | ✔ (own)   | ✘      | ✘     |
| /driver/dashboard              | ✘         | ✔      | ✘     |
| /driver/rides (assigned)       | ✘         | ✔      | ✘     |
| /driver/rides/:id/accept       | ✘         | ✔      | ✘     |
| /driver/rides/:id/start        | ✘         | ✔(own) | ✘     |
| /driver/rides/:id/complete     | ✘         | ✔(own) | ✘     |
| /driver/rides/:id/cancel       | ✘         | ✔(own) | ✘     |
| /admin/dashboard               | ✘         | ✘      | ✔     |
| /admin/users                   | ✘         | ✘      | ✔     |
| /admin/users/:id/active        | ✘         | ✘      | ✔     |
| /admin/rides                   | ✘         | ✘      | ✔     |
