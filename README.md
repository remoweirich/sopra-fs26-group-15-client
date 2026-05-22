# GuesSBB

## Introduction

For many Swiss commuters, long train rides are part of their daily routine. This can feel repetitive and tedious, so we wanted to create a fun way to engage with that experience.
It brings together Switzerland’s train enthusiasts and geography enthusiasts alike, allowing them to explore Switzerland together.
Finally, the project should also show our genuine appreciation for the Swiss transport network.

## Technologies used

- **Next.js 16** and **React 19** for the frontend
- **TypeScript** for type-safe UI and state handling
- **Ant Design** for UI primitives and notifications
- **MapLibre** for the interactive map in the game view
- **STOMP over SockJS** for real-time lobby/game updates

## High-level components

The application is structured around a small number of shared building blocks that are wired together in [`app/layout.tsx`](app/layout.tsx).

1. **App shell and navigation** [`app/layout.tsx`](app/layout.tsx) and [`app/navbar.tsx`](app/navbar.tsx)
   - `app/layout.tsx` wraps the whole app in the global providers and renders the shared navigation.
   - `app/navbar.tsx` handles the lobby join bar, authentication-aware links, notifications, and the mobile drawer.

2. **Real-time communication layer** [`app/context/WebSocketContext.tsx`](app/context/WebSocketContext.tsx)
   - Manages the STOMP/SockJS connection to the backend.
   - Provides `connect`, `subscribe`, and `publish` so lobby and game screens can react instantly to backend events.

3. **Lobby discovery and waiting room** [`app/lobbies/page.tsx`](app/lobbies/page.tsx) and [`app/lobbies/[id]/page.tsx`](app/lobbies/[id]/page.tsx)
   - `app/lobbies/page.tsx` shows open lobbies and lets users create or join one.
   - `app/lobbies/[id]/page.tsx` is the lobby waiting room where players gather, copy invite codes, and start the match.

4. **Game round experience** [`app/game/[id]/page.tsx`](app/game/[id]/page.tsx)
   - Displays the current train clues, the map, round timer, guess marker, and the transition between rounds.
   - Uses the websocket layer and resync endpoint to keep the game state consistent.

5. **Leaderboard and social features** [`app/leaderboard/page.tsx`](app/leaderboard/page.tsx)
   - Lets players search others, compare scores, and send friend requests.
   - This page reuses the auth and API helpers to fetch scoreboard and friend data.

These components are correlated through shared contexts and API helpers: `AuthContext` provides identity, `WebSocketContext` powers live updates, and the pages use `useApi` to read and write backend state.

## Launch & deployment

### Prerequisites

- Node.js 20 or newer
- npm
- A running backend API and websocket server

The frontend expects the backend to be available at:

- `http://localhost:8080` in local development
- `https://sopra-fs26-group-15-server.oa.r.appspot.com` in production, unless you override it with `NEXT_PUBLIC_PROD_API_URL`

### Local setup

1. Clone the repository and enter the project folder.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app in your browser at `http://localhost:3000`.

### Production build

To create a production build and run it locally:

```bash
npm run build
npm run start
```

### Tests and validation

The recommended checks for contributors are:

```bash
npm run lint
npm run build
```

These commands validate the code style and ensure the app compiles successfully.

### External dependencies

- The frontend depends on the separate GuesSBB backend for user, lobby, game, friend, and leaderboard data.
- Real-time gameplay and lobby updates require the backend websocket endpoint to be reachable.
- No local database is required for the frontend itself.

### Releases

Releases are handled with semantic-release:

```bash
npm run release
```

In the usual workflow, this is run from the main branch in CI after merging conventional commits. Semantic-release can automatically generate release notes, update the changelog, create a git tag, and publish a GitHub release when the required environment variables are configured.

## Illustrations

The main user flow is:

1. Visit the landing page and click **Jetzt spielen** or **Konto erstellen**.
   ![Landing page image](docs/screenshots/01-home.png)
2. Browse available lobbies, create a new one, or join an existing lobby.

    ![Lobby overview image](docs/screenshots/02-lobbies.png)
3. Wait in the lobby until the host starts the match.

    ![Lobby waiting room image](docs/screenshots/03-lobby-room.png)
4. During the game, inspect the train clues and place your guess on the Swiss map.

    ![In-game view image](docs/screenshots/04-game.png)
5. Review the round overview and compare your score with the other players.

   ![Round overview image](docs/screenshots/05-overview.png)
6. Check the leaderboard to see the top players and send friend requests.

   ![Leaderboard image](docs/screenshots/06-leaderboard.png)


## Roadmap

Good next contributions for new developers could be:

1. **Add game history:** show per-user game history with statistics, average distance, and per-round overviews.
2. **Improve matchmaking and lobby discovery:** add friend invites, filters for public/private lobbies, player count, and game state.
3. **Train retrieval:** tell players about how the trains are fetched and when.

## Authors and acknowledgment

This project was created by:
- **Claude Stark** [@ClaudeStark](https://github.com/ClaudeStark)
- **Remo Weirich** [@remoweirich](https://www.github.com/remoweirich)
- **Michael Jankovic** [@T-N-T-O](https://github.com/T-N-T-O)
- **Dorian Rother** [@dorianrother](https://github.com/dorianrother)
- **Shadi Vandeventer** [@snowjademusic](https://www.github.com/snowjademusic)

Special thanks geOps for providing unlimited credits for train fetching during our development phase and to the fly on the wall for listening to our ramblings.

## License
- This project is licensed under GNU AGPLv3. See [`LICENSE`](LICENSE) for the full text.
- Commercial licensing information is available in [`COMMERCIAL.md`](COMMERCIAL.md).
- Contribution terms are described in [`CLA.md`](CLA.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md).