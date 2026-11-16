export interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  groupId?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  gradeId: string;
  groupId: string;
}

export interface Grade { _id: string; level: string; }
export interface Group { _id: string; name: string; number: number; gradeId: string | { _id: string }; studentCount: number; }
