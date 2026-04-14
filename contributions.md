# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - [Begin Date] to [End Date]

| **Student**        | **Date**                                                                                                  | **Link to Commit** | **Description**                                                                                                                                                     | **Relevance**                                                                                                                                 |
| ------------------ |-----------------------------------------------------------------------------------------------------------| ------------------ |---------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| **@remoweirich**   | 23.03                                                                                                    | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/36336f2297fac82722b2d7cc2150ede319c200e4 | Copied all of the class files defined in the class diagram to the server repository in order to have the base framework ready, such that everyone can start coding without always getting errors due to missing files or missing getters and setters.                                                                                                                                    | Relevant for all, such that we can code without having to worry about first always having to create e.g. a DTO file and implement all attributes and getters/setters, since we have a lot of them.                                                                                                          |
|                    | 31.03                                                                                                    | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/7d2dc6496d8d55e02cdb8c55f8fa4c6ae3b50be1 | A lot of issues after merge of game logic branch and api-fetch branch. Resolved them and changed the GameController, such that it now can actually send the correct datatype to the service, such that the service can read the information we defined in the DTO                                                                                                                                    | We defined that the payload of a message would be some DTO. And until now we could not use the getters from said DTO, because we were only looking at it as if it were of type Object. Now this is not the case anymore, altough it still reaches the controller as Object.                                                                                                           |
| **@snowjademusic** | 27.03                                                                                                     | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/36506b9a279788bd19e28ac2f44ee9bd7b40ca24| Implementation of automatic Versioning as Discussed in internal Team meeting                                                                                        | We wanted a standardized way of commits, and semantic/ conventional commits was agreed upon                                                   |
|                    | 31.03                                                                                                     | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/a63a3d6dfc2792ac9836e95e2a44bf33acfebd39 | Add Game Controller Logic                                                                                                                                           | Game WebSocket Controller is crucial for our Product Usability.                                                                               |
| **@claudestark**   | 29.03                                                                                                     | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/5cc821132bdce4117a9ed34a44ab68711e99d20d | Implementation of POST /register to register a new user to the database as well as updateing the database with a many to many table for storing friends information | Next to being able to play the game as a Guest user, we wanted to provide the possibility to register as a user to keeping track of game stats |
|                    | 30.03                                                                                                     | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/4f507261cbc2eb022904a3dc5aac1c53025658dd | Implementation of the option to change user Data after the registration process is finished.                                                                        | A user should be able to change fields as email, bio etc. fields that are not used in the database or backend to identify the user            |
| **@T-N-T-O**       | 29.03                                                                                                     | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/6e21223f1de4a63fe6d8905217a08350d0e9c430 | Implementation of AuthService with authUser() and isAuthenticated() methods, AuthHeader object, and GET /users/{userId} endpoint                                    | Core authentication layer for all protected endpoints and user profile viewing                                                                |
|                    | 29.03                                                                                                     | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/f21bfd2ff65f2dd8c509fe4b662adca1672f8eec | Implementation of GET /users/{userId} with 3 access levels: own profile (MyUserDTO), other user profile (UserDTO), guest view (UserDTO)                             | Users can view profiles with role-based data filtering depending on authentication status                                                     |
|                    | 29.03                                                                                                     | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/22c2c234b660a0d8dbae967bc8784349a2a2dc58 | Implementation of POST /users/{userId}/logout with auth validation, token invalidation and status set to OFFLINE                                                    | Users can securely log out, ending their session and preventing further authenticated requests                                                |
| **@dorianrother**  | 25.03                                                                                                     | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/722b5a22b0c225506954c804cc9d436302777586 | Implementation of User Story 3                                                                                                                                      | Users can now join a lobby and request a list of all active lobbies                                                                           |
| 31.03   | https://github.com/remoweirich/sopra-fs26-group-15-server/commit/cf248622066c41e248283d5f1d932aa3f3c636ea | Tested multiple approaches for fetching data and calculating the current positions of trains from external apis. Final version implements the websockets api from geops | Realizes the core functionality of the webapp - Interpreting real-life transportation data                                                                          |


---

## Contributions Week 2 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **@remoweirich**   | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **@snowjademusic** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **@claudestark**   | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **@T-N-T-O**       | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **@dorianrother**  | 6.4   | https://github.com/remoweirich/sopra-fs26-group-15-server/pull/65/changes/f01f7cb2abd34118a6a280eedb3791b402dd35b6 | Added a REST endpoint to leave a lobby | This allows users already in a lobby to leave it before starting the game |
|                    | 6.4.   | https://github.com/remoweirich/sopra-fs26-group-15-client/commit/87fa687d3bd5e662342f49da5b9d29586ce7c7bc | Basic setup, route structure and styling for front-end | This creates a shared framework, so that the group can start the work on the front-end independently. In the globals.css, the formatting is centrally defined via class names, which allows for a uniform appearence of the application. |


---

## Contributions Week 3 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._
