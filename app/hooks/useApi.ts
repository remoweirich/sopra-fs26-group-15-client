import { ApiService } from "@/api/apiService";
import { useMemo } from "react"; 

export const useApi = () => {
  return useMemo(() => new ApiService(), []); // only if ApiService changes, the memo gets updated and useEffect in app/users/page.tsx gets triggered
};
