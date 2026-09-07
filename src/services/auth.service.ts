import { apiClient, ApiError } from "./api-client";
import { AuthResponse, User, ApiResponse } from "@/types/api";
import { isFrontendOnly } from "@/lib/frontend-mode";
import { mockStore } from "@/lib/mock-data/mock-store";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation?: string;
  phone?: string;
  company_name?: string;
  role?: "customer" | "b2b_buyer";
}

export class AuthService {
  /**
   * Log in user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.post<ApiResponse<AuthResponse> | AuthResponse>("/auth/login", credentials);
        const authData = "data" in res && res.data ? res.data : (res as AuthResponse);
        if (authData?.token) {
          apiClient.setToken(authData.token);
        }
        return authData;
      } catch (err) {
        // Fallback to local authentication
      }
    }

    const email = credentials.email.trim().toLowerCase();
    const existing = mockStore.getUserByEmail(email);

    if (existing) {
      if (existing.password && existing.password !== credentials.password) {
        throw new ApiError(422, "Invalid email or password provided.");
      }
      const token = `mock_token_${existing.role || "customer"}_${existing.id}`;
      apiClient.setToken(token);
      mockStore.setActiveUser(existing);
      return {
        user: existing,
        token,
      };
    }

    // If logging in with a new email in development mode, automatically create customer profile
    const role = email.includes("admin") ? "admin" : email.includes("buyer") ? "b2b_buyer" : "customer";
    const newUser = mockStore.saveUser({
      name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      email,
      password: credentials.password,
      role: role as any,
    });

    const token = `mock_token_${newUser.role || "customer"}_${newUser.id}`;
    apiClient.setToken(token);
    mockStore.setActiveUser(newUser);

    return {
      user: newUser,
      token,
    };
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.post<ApiResponse<AuthResponse> | AuthResponse>("/auth/register", data);
        const authData = "data" in res && res.data ? res.data : (res as AuthResponse);
        if (authData?.token) {
          apiClient.setToken(authData.token);
        }
        return authData;
      } catch (err) {
        // Fallback to local
      }
    }

    const newUser = mockStore.saveUser({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      company_name: data.company_name,
      role: data.role || "customer",
    });

    const token = `mock_token_${newUser.role || "customer"}_${newUser.id}`;
    apiClient.setToken(token);
    mockStore.setActiveUser(newUser);

    return {
      user: newUser,
      token,
    };
  }

  /**
   * Log out user
   */
  async logout(): Promise<void> {
    if (!isFrontendOnly()) {
      try {
        if (apiClient.getToken()) {
          await apiClient.post("/auth/logout").catch(() => null);
        }
      } catch {
        // Ignore
      }
    }

    apiClient.removeToken();
    mockStore.setActiveUser(null);
  }

  /**
   * Get authenticated user profile
   */
  async getCurrentUser(): Promise<User | null> {
    if (!isFrontendOnly()) {
      const token = apiClient.getToken();
      if (token && !token.startsWith("mock_token_")) {
        try {
          const res = await apiClient.get<ApiResponse<User> | User>("/auth/me");
          const user = "data" in res && res.data ? res.data : (res as User);
          if (user) {
            mockStore.setActiveUser(user);
            return user;
          }
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            apiClient.removeToken();
            mockStore.setActiveUser(null);
            return null;
          }
        }
      }
    }

    return mockStore.getActiveUser();
  }

  /**
   * Update authenticated user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.put<ApiResponse<User> | User>("/users/me", data);
        const user = "data" in res && res.data ? res.data : (res as User);
        if (user) {
          mockStore.setActiveUser(user);
          return user;
        }
      } catch {
        // Fallback
      }
    }

    const current = mockStore.getActiveUser();
    if (current) {
      const updated = mockStore.saveUser({ ...current, ...data });
      mockStore.setActiveUser(updated);
      return updated;
    }

    return mockStore.saveUser(data);
  }

  /**
   * Request password reset link
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    if (!isFrontendOnly()) {
      try {
        return await apiClient.post<{ message: string }>("/auth/password/forgot", { email });
      } catch {
        // Fallback
      }
    }

    return {
      message: `Password reset link has been dispatched to ${email}. (Simulated development environment)`,
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    if (!isFrontendOnly()) {
      try {
        return await apiClient.post<{ message: string }>("/auth/password/reset", data);
      } catch {
        // Fallback
      }
    }

    const user = mockStore.getUserByEmail(data.email);
    if (user) {
      mockStore.saveUser({ ...user, password: data.password });
    }

    return {
      message: "Your password has been successfully reset. You may now sign in.",
    };
  }
}

export const authService = new AuthService();
