import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { PermissionService } from './permission.service';
import { UserModule } from '../user/user.module';
import { Menu } from './menu.entity';
import { Button } from './button.entity';
import { MenuService } from './menu.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, RolePermission, Menu, Button]),
    PassportModule,
    JwtModule.register({
      secret: 'jwt_secret',
      signOptions: { expiresIn: '1d' },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionService, MenuService],
  exports: [AuthService, PermissionService, MenuService],
})
export class AuthModule {}
