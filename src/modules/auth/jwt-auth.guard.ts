import {Injectable} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
@Injectable()
//这个 Guard 会自动调用 JwtStrategy 守卫专门检查JWT 令牌。
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}
