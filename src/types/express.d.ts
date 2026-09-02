import { User } from '../modules/user/user.entity';

// 定义JWT策略返回的用户对象结构
interface JwtUser {
  userId: string;
  username: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User | JwtUser;
    }
  }
}