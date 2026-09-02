import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { MemberLevel } from './member-level.entity';
import { Blacklist } from './blacklist.entity';
import { LoginLog } from './login-log.entity';
import { Role } from '../auth/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, MemberLevel, Blacklist, LoginLog])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
