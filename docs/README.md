# Documentation

Project reference material for the Tutoring Management System.

| File | Description |
| --- | --- |
| `tutoring_management_system.xlsx` | Requirements / backlog spreadsheet (user stories, features, and planning). |
| `ERD-diagram.png` | Entity relationship diagram: `Grade`, `Group`, `User`, `Teacher`, `Student`, `Session`, `FreeTime`, `Notifications`, and the `medium` lookup table, with their relationships and cardinalities. |
| `diag_class_node.jpg` | Class diagram of the backend data model. |
| `maquettes/` | UI mockups, one per user story (`US-01` … `US-16`). |

## Data model at a glance

- A **Grade** has many **Groups**.
- A **Group** belongs to one Grade and has many **Sessions** and **FreeTime** slots.
- A **User** is either a **Teacher** or a **Student**.
- A **Session** belongs to one or more Groups, has a date, start/end minute, status, conflict flags, and an optional medium.
- **Notifications** are attached to a Session.
- **FreeTime** records a weekday plus start/end minutes per Group.

## Backend endpoints

- API (students, JSON): `http://40.66.48.122:3000/api`
- API docs: `http://40.66.48.122:3000/docs/`
- Teacher workspace (server-rendered): `http://40.66.48.122:3000/login`
