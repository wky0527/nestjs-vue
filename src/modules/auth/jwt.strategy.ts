import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';
import { PermissionService } from './permission.service';

/**
 * JWT策略类
 * 负责验证JWT令牌并解析用户权限信息
 * 这是认证流程的关键环节
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * 构造函数 - 注入依赖服务
   * @param userService - 用户服务，用于获取用户详细信息
   * @param permissionService - 权限服务，用于获取用户权限信息
   */
  constructor(
    private userService: UserService,
    private permissionService: PermissionService,
  ) {
    // 调用父类构造函数，配置JWT验证参数
    super({
      // 从HTTP请求头中提取JWT令牌
      // 格式: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // 是否忽略令牌过期检查
      // 设为false表示严格验证过期时间
      ignoreExpiration: false,
      
      // 令牌签名密钥
      // 用于验证令牌的完整性
      secretOrKey: 'jwt_secret',
    });
  }

  /**
   * 验证JWT载荷的方法
   * 当JWT令牌验证通过后，此方法会被调用
   * @param payload - JWT令牌中的载荷数据
   * @returns 包含用户完整信息的对象
   */
  async validate(payload: any) {
    // 1. 根据令牌中的用户ID获取完整的用户信息（包含角色信息）
    const user = await this.userService.findOne({
      where: { id: payload.sub },      // payload.sub 存储的是用户ID
      relations: ['roleRef'],          // 关联查询用户角色信息
    });

    // 2. 获取用户的菜单权限
    // 根据用户ID查询其有权限访问的菜单列表
    const userMenus = await this.permissionService.getUserMenus(payload.sub);
    
    // 3. 获取用户的按钮权限
    // 根据用户ID查询其有权限操作的按钮列表
    const userButtons = await this.permissionService.getUserButtons(payload.sub);

    // 4. 返回包含完整权限信息的用户对象
    // 这个对象会被挂载到请求对象的user属性上
    // 在后续的控制器中可以通过req.user访问
    return { 
      // 基础用户信息
      userId: payload.sub,              // 用户ID（来自JWT载荷）
      username: payload.username,       // 用户名（来自JWT载荷）
      companyId: payload.companyId,     // 公司ID（来自JWT载荷）
      roleId: payload.roleId,           // 角色ID（来自JWT载荷）
      roleName: payload.roleName || 'user', // 角色名称（来自JWT载荷，默认为'user'）
      
      // 角色对象（从数据库获取的完整角色信息）
      role: user?.roleRef || null,      // 用户角色对象
      
      // 权限相关信息
      permissions: await this.permissionService.getUserPermissions(payload.sub), // 用户权限列表
      menus: userMenus,                 // 用户可访问的菜单
      buttons: userButtons,             // 用户可操作的按钮
    }; 
  }
}