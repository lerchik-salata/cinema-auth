export interface CoreUser {
  _id: string; 
  email: string;
  username: string;
  passwordHash: string;
  role: string;
}

export interface CoreCreateUserDto {
  email: string;
  username: string;
}

export interface CoreAuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}