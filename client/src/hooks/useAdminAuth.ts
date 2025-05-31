import { useQuery } from "@tanstack/react-query";

export function useAdminAuth() {
  const { data: adminData, isLoading, error } = useQuery({
    queryKey: ["/api/admin/check"],
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/admin/check", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Not authenticated as admin");
      }
      
      return response.json();
    },
  });

  return {
    isAdmin: !!adminData?.isAdmin,
    isLoading,
    error,
  };
}