export interface AuthContextType {
  user: { userId: number; username: string } | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userId: number) => void;
  logout: () => void;
}