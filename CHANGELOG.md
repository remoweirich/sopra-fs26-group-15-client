# [1.3.0](https://github.com/remoweirich/sopra-fs26-group-15-client/compare/v1.2.0...v1.3.0) (2026-05-13)


### Bug Fixes

* **navbar:** update button labels from "Züge" to "Lobbies" ([d53f78a](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/d53f78a0ba98ccb89af0b760e3cdbdad28bcee09))
* **user:** allowed to look at profile without being logged in ([f135877](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/f1358774edfb8ed0ae1b44526a2135a7e44acae6))


### Features

* **client:** complete SBB design redesign across all pages ([b8e8bd6](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/b8e8bd6ba47589fb3a8cdd9c2bb9e88eabc9169e)), closes [#EB0000](https://github.com/remoweirich/sopra-fs26-group-15-client/issues/EB0000)
* displaying snarky comments based on player guess distance [#37](https://github.com/remoweirich/sopra-fs26-group-15-client/issues/37) ([e0f591e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/e0f591e8d664e99379a96bfb5c379c189011124b))
* implement shared colors for player pins based on hash function; fix sorting of userscores [#36](https://github.com/remoweirich/sopra-fs26-group-15-client/issues/36) ([80b00be](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/80b00bef401090a4466e7d09a85d1f471d872ded))
* **userPage:** Reintegrated into new frontend. Also pending request are now shown in own profile. Accept button works [#40](https://github.com/remoweirich/sopra-fs26-group-15-client/issues/40) ([b922207](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/b9222078634c9c5e17ec5b0fa690a4895cfc794a))
* **userPage:** WebSocketConnection/PersonalTopicSubscription for notifications [#40](https://github.com/remoweirich/sopra-fs26-group-15-client/issues/40) ([f653398](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/f653398f5076a79f4131da8ec8a91e67b2138aa5))

# [1.2.0](https://github.com/remoweirich/sopra-fs26-group-15-client/compare/v1.1.1...v1.2.0) (2026-05-11)


### Bug Fixes

* resolve merge conflicts ([453e26b](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/453e26b27271fa058d88482c660946e047af7e1a))


### Features

* added error message for wrong login credentials, registration name conflicts, wrong lobby code and lobby join conflicts ([9f7a77f](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/9f7a77f3952b0a8fd7810d20e1875b91bc5893f3))
* created a react component for the iconic SBB clock, created and implemented a loadingscreen between the lobby and game page when starting the game ([2be7ede](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/2be7ede5970fa52774e4b8c2b8c9347c0fb37f56))
* included sbbclock again ([31794a4](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/31794a4cd0dea6c9c704467446b46bed1fdde63e))
* RoundOvervview displays usernames with the scores ([96a56c8](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/96a56c8570f27e527ee41f19ff73e88b5fc93eb8))

## [1.1.1](https://github.com/remoweirich/sopra-fs26-group-15-client/compare/v1.1.0...v1.1.1) (2026-05-05)


### Bug Fixes

* change url ([4ff798e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/4ff798ecfdef5c6cdd97f3faf49b304c66827c3f))

# [1.1.0](https://github.com/remoweirich/sopra-fs26-group-15-client/compare/v1.0.0...v1.1.0) (2026-05-05)


### Bug Fixes

* attempt to fix hydration race condition in game page ([e1e1e3f](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/e1e1e3faf806bd41ff779e5a0c6937c7d6b3e5bb))
* **CSS:** changed card margin to 0 auto, from 5 auto ([d696a4e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/d696a4ee0b5fcb9c155120d70b48aafa674960e4))
* **homepage:** Play button sends to lobbies always ([a43324e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/a43324ebf0643b23ca59413ecc6e711d3d9ddcf2))
* **lobbies:** fix rounds info on lobbies page ([85aea7b](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/85aea7bed0d87a593554673997da3f765c6dc5ff))
* **navbar:** visual lobby code in navbar ([850be84](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/850be84d8fe03ab32b5c2b60a1989197d3a22de6))
* potential fix for hydration race condition in lobbies page ([fcf80ba](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/fcf80baeccb62e8c772d79c5b93b7b52a8ff0298))
* remove trailing ([03ee7ca](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/03ee7cafe4a0af5a52ee4c55fc19757997aff690))
* **URL:** missing // ([6bd5589](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/6bd5589c94fadc6dea8fe3a36a9c7b5826fdd70c))


### Features

* change semantic release npm version ([b24f9ba](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/b24f9ba681fc960f90643c185679d5c45301d1d6))
* migrate app with new implementation ([47bc822](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/47bc822c519acb3160388ab2501a4bb06d7fae95))
* migrate app with new implementation ([ae239fb](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/ae239fb0612d3d09d1ca8b38be0490a9f62681c9))
* migrate app with new implementation npm install ([94cda16](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/94cda16e6159a20e18117089f2846b6d438b55bc))

## [1.0.1](https://github.com/remoweirich/sopra-fs26-group-15-client/compare/v1.0.0...v1.0.1) (2026-05-05)


### Bug Fixes

* attempt to fix hydration race condition in game page ([e1e1e3f](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/e1e1e3faf806bd41ff779e5a0c6937c7d6b3e5bb))
* **CSS:** changed card margin to 0 auto, from 5 auto ([d696a4e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/d696a4ee0b5fcb9c155120d70b48aafa674960e4))
* **homepage:** Play button sends to lobbies always ([a43324e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/a43324ebf0643b23ca59413ecc6e711d3d9ddcf2))
* **lobbies:** fix rounds info on lobbies page ([85aea7b](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/85aea7bed0d87a593554673997da3f765c6dc5ff))
* **navbar:** visual lobby code in navbar ([850be84](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/850be84d8fe03ab32b5c2b60a1989197d3a22de6))
* potential fix for hydration race condition in lobbies page ([fcf80ba](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/fcf80baeccb62e8c772d79c5b93b7b52a8ff0298))
* remove trailing ([03ee7ca](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/03ee7cafe4a0af5a52ee4c55fc19757997aff690))
* **URL:** missing // ([6bd5589](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/6bd5589c94fadc6dea8fe3a36a9c7b5826fdd70c))

## [1.0.1](https://github.com/remoweirich/sopra-fs26-group-15-client/compare/v1.0.0...v1.0.1) (2026-05-05)


### Bug Fixes

* attempt to fix hydration race condition in game page ([e1e1e3f](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/e1e1e3faf806bd41ff779e5a0c6937c7d6b3e5bb))
* **CSS:** changed card margin to 0 auto, from 5 auto ([d696a4e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/d696a4ee0b5fcb9c155120d70b48aafa674960e4))
* **homepage:** Play button sends to lobbies always ([a43324e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/a43324ebf0643b23ca59413ecc6e711d3d9ddcf2))
* **lobbies:** fix rounds info on lobbies page ([85aea7b](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/85aea7bed0d87a593554673997da3f765c6dc5ff))
* **navbar:** visual lobby code in navbar ([850be84](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/850be84d8fe03ab32b5c2b60a1989197d3a22de6))
* potential fix for hydration race condition in lobbies page ([fcf80ba](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/fcf80baeccb62e8c772d79c5b93b7b52a8ff0298))
* remove trailing ([03ee7ca](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/03ee7cafe4a0af5a52ee4c55fc19757997aff690))
* **URL:** missing // ([6bd5589](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/6bd5589c94fadc6dea8fe3a36a9c7b5826fdd70c))

## [1.0.1](https://github.com/remoweirich/sopra-fs26-group-15-client/compare/v1.0.0...v1.0.1) (2026-04-24)


### Bug Fixes

* attempt to fix hydration race condition in game page ([e1e1e3f](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/e1e1e3faf806bd41ff779e5a0c6937c7d6b3e5bb))
* **CSS:** changed card margin to 0 auto, from 5 auto ([d696a4e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/d696a4ee0b5fcb9c155120d70b48aafa674960e4))
* **homepage:** Play button sends to lobbies always ([a43324e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/a43324ebf0643b23ca59413ecc6e711d3d9ddcf2))
* **lobbies:** fix rounds info on lobbies page ([85aea7b](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/85aea7bed0d87a593554673997da3f765c6dc5ff))
* **navbar:** visual lobby code in navbar ([850be84](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/850be84d8fe03ab32b5c2b60a1989197d3a22de6))
* potential fix for hydration race condition in lobbies page ([fcf80ba](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/fcf80baeccb62e8c772d79c5b93b7b52a8ff0298))
* remove trailing ([03ee7ca](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/03ee7cafe4a0af5a52ee4c55fc19757997aff690))
* **URL:** missing // ([6bd5589](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/6bd5589c94fadc6dea8fe3a36a9c7b5826fdd70c))

## [1.0.1](https://github.com/remoweirich/sopra-fs26-group-15-client/compare/v1.0.0...v1.0.1) (2026-04-24)


### Bug Fixes

* attempt to fix hydration race condition in game page ([e1e1e3f](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/e1e1e3faf806bd41ff779e5a0c6937c7d6b3e5bb))
* **CSS:** changed card margin to 0 auto, from 5 auto ([d696a4e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/d696a4ee0b5fcb9c155120d70b48aafa674960e4))
* **homepage:** Play button sends to lobbies always ([a43324e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/a43324ebf0643b23ca59413ecc6e711d3d9ddcf2))
* **lobbies:** fix rounds info on lobbies page ([85aea7b](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/85aea7bed0d87a593554673997da3f765c6dc5ff))
* **navbar:** visual lobby code in navbar ([850be84](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/850be84d8fe03ab32b5c2b60a1989197d3a22de6))
* potential fix for hydration race condition in lobbies page ([fcf80ba](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/fcf80baeccb62e8c772d79c5b93b7b52a8ff0298))
* remove trailing ([03ee7ca](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/03ee7cafe4a0af5a52ee4c55fc19757997aff690))
* **URL:** missing // ([6bd5589](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/6bd5589c94fadc6dea8fe3a36a9c7b5826fdd70c))

## [1.0.1](https://github.com/remoweirich/sopra-fs26-group-15-client/compare/v1.0.0...v1.0.1) (2026-04-24)


### Bug Fixes

* **URL:** missing // ([6bd5589](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/6bd5589c94fadc6dea8fe3a36a9c7b5826fdd70c))

# 1.0.0 (2026-04-22)


### Bug Fixes

* Change production API URL to new server address ([2a00406](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/2a0040604c5eb34ba82d109fb9a82da1f77bcd81))
* cleanup Readme ([84a6a9c](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/84a6a9c1299bd74af66e79c5eb6239749e0be84e))
* correctly parse station names ([4dc3849](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/4dc384978b6ede858c2c73e70caad046be434aa3))
* **icon:** have same icon in navbar and in tab head ([83ddeca](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/83ddecaa76fa67bf22713000cb6d5dbf365d2197))
* **icon:** remove favicon.ico so firefox too sees the new icon ([8dc9b1e](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/8dc9b1eb87e2399114c5bcf4f8e4d3b7a5f7de27))
* integrated new websockets hook, restored functionality to before integration ([5607064](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/5607064089d20f620fff51788b97d85185fc8fcb))
* **lobbies:** fix lobby ([a7726e5](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/a7726e5f140aa9f9765a4b075b842179e95841b8))
* **lobbies:** refactor joining lobby ([db23186](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/db231864327547248eaf6ba8f8622c02959f0cf7))
* **Lobby:** fix maxRounds not showing ([b81af91](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/b81af91edb6d9e466a381ae7a2c2ddede722fa24))
* **Lobby:** fix StartGame not sending Auth on publish websocket connection ([f38a456](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/f38a456f415a19f729f651a1d84892b12b97a8f0))
* **login:** login page error fix ([955c71a](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/955c71afba3ae61641116299b5027129a73a3758))
* production URL formatting in getApiDomain ([b013bee](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/b013bee5968e8f52eabe5ee59e6fd1cb64912bd2))
* Swap organization and project key values ([453c3c4](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/453c3c430f3879f3b34e4c8d0725778aa48b8265))
* **useLobbyAction:** removed early return ([1cac20b](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/1cac20b1b6fa3ad0c87282e27cb1132b9b6b5320))
* **useLobbyActions:** conform to merged change ([4049775](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/4049775b4624462c8edbe75e17bbdf556c501d0a))
* UTC Timestamps are now converted to Local Time ([fe6962c](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/fe6962c6225798ad633060a79580d77a18e3ce92))
* **WebSockets:** disentangle WebSocket messages ([cb2bb25](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/cb2bb25171ca07ca41a009a1daaaac96d48de019))
* **WebSockets:** header inclusion in publish and subscribe ([eb5372f](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/eb5372f4542d613975df5f5cd962db2fcbea7ad6))


### Features

* **/game/id:** Fixed all errors on gamePage by adding gameMessage.ts with GameMessage types ([8f45213](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/8f45213998d570ec444434452297e124d95cd9e5))
* **/lobbies/{lobbyId}:** LeaveLobby implemented & WebSocketProvider connect now async and awaits deactivation. Refresh-problem sorted out? ([7b40740](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/7b40740403fdd94f0982851bf7fec611fe686db8))
* **/lobbies/id:** initial fetch and routerPush after join ([1e0236b](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/1e0236bddc4641735c3f985ec38b791bfac85b27))
* **/lobbies/id:** publish START_GAME message, and receive GAME_START message + reroute to /topic/game/gameid ([51aa6e0](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/51aa6e04dea1ba4af253d04a8585e4720da60bc1))
* **/lobbies/id:** subscribe when on lobbypage ([95616d9](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/95616d92b2fa3109923c06670ef4876088514702))
* added converter to convert epsg and lat/long coordinates, adjusted GuessMessage type attribute names ([20f978c](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/20f978c5a94a7b661eb0390b212b440df6344034))
* added route to endgame screen, parsed and displayed departure & arrival times, added mapmarkers for origin and destination stations ([203ea95](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/203ea9593b69aa161d7adc2f56183e7aff00e07c))
* apiService REST with options headers ([c6d3d38](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/c6d3d38f5d5f3968ce87cb3e917efbbf6f2609e5))
* Basic setup and styling for front-end ([87fa687](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/87fa687d3bd5e662342f49da5b9d29586ce7c7bc))
* **design:** redesign Navbar with centered search and mobile burger menu ([b680c10](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/b680c10b476abfd0fc5b174200d2125d00c25122))
* **design:** style HomePage with hero illustration, step cards, and stats bar ([45cbb7f](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/45cbb7ffc78cfb9c9e7387d2e1dc85ea1c9d2e78))
* **design:** style LeaderboardPage with search, guest banner, and ranked list layout ([96fa06d](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/96fa06d1e916439747f95e69af90cd2d7f1d2e99))
* **design:** style LoginPage with Welcome back title, pill button, sign up link ([9fc3a53](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/9fc3a53ac02d1e7892f8da4ecbbd0ab3485c0997))
* **design:** style ProfilePage with avatar, stat cards, tabs, edit form ([e3cc54b](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/e3cc54bbc8a54e9364553f11886a407563126ea5))
* **design:** style RegisterPage with subtitle, email validation, bio field ([35fd448](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/35fd448dba722bf8010ca6286e391fdd4c17f773))
* **frontend:** redesign home, lobby list, new-lobby and lobby-room pages ([ecc53bb](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/ecc53bb2f91ca2d3dbec4ddf981d1458318ac01b))
* **Game Leaderboard:** display per game Leaderboard ([7f05f0d](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/7f05f0de8c329bf86ef1822f9d8a915445c511aa))
* **icon:** change icon to fit our theme ([68c8f4d](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/68c8f4dae6d6c7265108271edb71fe8309272b5a))
* Implemented RoundOverview Component that shows results of the round, overall results and actual train position, handle sending READY_FOR_NEXT_ROUND messages; tested against mock server ([67adb2a](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/67adb2a3a443fe8e16b5c602c0d5f5dc3cc5df0b))
* integrate websocket infrastructure and lobby join logic ([a97e4e7](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/a97e4e779e03da443d80000d7211c4f21a54aa74))
* Integrated and visualized Map Component, implemented game logic, tested integration with mock websocket server for sending GUESS_MESSAGEs and recieving ROUND_START messages ([7c3ebf1](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/7c3ebf13ad3f5b539945f8491958ab91dd941b1d))
* lobbies update ([6f8dc52](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/6f8dc5247a304dd8ff5302ca058a836dc67f32aa))
* **lobbies:** add tooltip to button hover ([54ecf46](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/54ecf46b847a45a1db1a7bea45fa5a1b02ad795d))
* **lobbies:** handle joining and creating lobbies as guest with pop-up ([45ccbb9](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/45ccbb9235ac4167abe6fbf26b2a7725c42e97bf))
* **lobbies:** unfinished join ([cb98402](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/cb9840260d40cd38da670f6862545fdc2d186d84))
* **login:** implement login with token storage ([4199708](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/4199708b316361e0cb8526cadb5f59c23793e116))
* **register:** implement registration and auto-login with token storage ([6da6c20](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/6da6c20a54adac5a65b2a3b592c7dee509b7d721))
* still unfinished ([4364d28](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/4364d28e1e1656d2e7cfe4992fb66591ef6aa10b))
* title and description in layout.tsx changed ([a3aa59a](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/a3aa59a4e4061146e554e52a7df0474d1b024ba2))
* **user,api:** implement authorized user fetching ([a3c51ec](https://github.com/remoweirich/sopra-fs26-group-15-client/commit/a3c51ec5df020a774f34c2341636cda00f31367d))

# Changelog

All notable changes to this project will be documented in this file.
