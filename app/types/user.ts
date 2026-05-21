export interface RegisterPostDTO{
  username: string;
  email: string;
  password: string;
  userBio: string | null;
  isGuest: boolean;
}

export interface UserAuthDTO{
  userId: number;
  token: string;
}

export interface LoginPostDTO{
  username: string;
  password: string;
}

export interface UserScoreboard {
  totalPoints?: number;
  leaderboardPoints?: number;
  playedGames?: number;
  playedRounds?: number;
  bestRoundPoints?: number;
  guessingPrecision?: number;
  gamesWon?: number;
}

export interface MyUserDTO {
  userId: number;       
  username: string;
  email: string;
  userBio: string;
  creationDate: Date;
  isGuest: boolean;     
  isOnline: boolean;    
  userScoreboard: UserScoreboard;
  userAchievementDTOList?: UserAchievementDTO[]
  friends: UserDTO[];
}

export interface UserDTO{
  userId: number;
  userScoreboard: UserScoreboard;
  username: string,
  userBio: string,
  creationDate: Date,
  friends: UserDTO[]
  isOnline: boolean;
}

export interface UserResult {
  userId: number;
  totalPoints: number;
  roundPoints: number;
  xCoordinate: number;
  yCoordinate: number;
  distance: number;
}

export interface UserAchievementDTO {
  achievement: Achievement;
  unlockedAt: string;
  userId: number;
}

export interface Achievement {
  achievementId: number;
  name: string;
  description: string;
  iconUrl: string;
}

