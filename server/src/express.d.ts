declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      role: "admin" | "dispatcher";
      email: string;
    };
  }
}

export {};
