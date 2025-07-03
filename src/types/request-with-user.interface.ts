import { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    [key: string]: any; // if your user has more properties
  };
}
