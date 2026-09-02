# NestJS 权限系统设计文档

## 🎯 系统概述

本系统实现了基于角色的访问控制(RBAC)权限管理系统，支持菜单权限、按钮权限和数据权限控制。

## 🏗️ 整体架构设计

### 核心组件
```
用户(User) ←→ 角色(Role) ←→ 权限(Permission/Menu/Button)
```

### 技术栈
- **框架**: NestJS
- **ORM**: TypeORM
- **数据库**: SQLite (开发环境)
- **认证**: JWT
- **验证**: class-validator

## 🔧 实现流程

### 第一步：环境准备
```bash
# 安装必要依赖
npm install class-validator class-transformer @nestjs/typeorm typeorm
```

### 第二步：实体设计

#### 1. 角色实体 (Role)
```typescript
// src/modules/auth/role.entity.ts
@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ unique: true })
  name: string;           // 角色名称 (admin, user, guest)
  
  @Column({ nullable: true })
  description: string;    // 角色描述
}
```

#### 2. 菜单实体 (Menu)
```typescript
// src/modules/auth/menu.entity.ts
@Entity()
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ unique: true })
  name: string;           // 菜单标识
  
  @Column()
  title: string;          // 菜单标题
  
  @Column({ nullable: true })
  path: string;           // 路由路径
  
  @Column({ nullable: true })
  component: string;      // 组件名称
  
  @Column({ type: 'simple-array', nullable: true })
  roles: string[];        // 可访问的角色列表
  
  @Column({ default: true })
  enabled: boolean;       // 是否启用
}
```

#### 3. 按钮实体 (Button)
```typescript
// src/modules/auth/button.entity.ts
@Entity()
export class Button {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ unique: true })
  name: string;           // 按钮标识
  
  @Column()
  action: string;         // 操作类型 (create, edit, delete, view)
  
  @Column({ type: 'simple-array', nullable: true })
  roles: string[];        // 可操作的角色列表
  
  @Column()
  menuId: number;         // 所属菜单ID
}
```

### 第三步：服务层实现

#### 1. 权限服务 (PermissionService)
```typescript
// src/modules/auth/permission.service.ts
@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Menu) private menuRepo: Repository<Menu>,
    @InjectRepository(Button) private buttonRepo: Repository<Button>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  // 获取用户菜单权限
  async getUserMenus(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roleRef'],
    });
    
    const menus = await this.menuRepo.find({
      where: { enabled: true, visible: true },
    });
    
    // 根据用户角色过滤菜单
    const userRole = user.roleRef.name;
    return menus.filter(menu => 
      !menu.roles || menu.roles.includes(userRole)
    );
  }

  // 获取用户按钮权限
  async getUserButtons(userId: number, menuId?: number) {
    // 类似菜单权限的实现
  }
}
```

#### 2. 菜单服务 (MenuService)
```typescript
// src/modules/auth/menu.service.ts
@Injectable()
export class MenuService {
  // 初始化默认数据
  async initializeDefaultRoles() { }
  async initializeDefaultMenus() { }
  async initializeDefaultButtons() { }
}
```

### 第四步：认证集成

#### 1. 扩展JWT策略
```typescript
// src/modules/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: any) {
    // 获取用户权限信息
    const userMenus = await this.permissionService.getUserMenus(payload.sub);
    const userButtons = await this.permissionService.getUserButtons(payload.sub);
    
    return {
      userId: payload.sub,
      username: payload.username,
      menus: userMenus,
      buttons: userButtons,
    };
  }
}
```

#### 2. 扩展登录服务
```typescript
// src/modules/auth/auth.service.ts
async login(username: string, password: string) {
  // 验证用户后返回权限信息
  return {
    data: {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        menus: userMenus,
        buttons: userButtons,
      }
    }
  };
}
```

### 第五步：API接口开发

```typescript
// src/modules/auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  // 获取用户菜单权限
  @Get('menus')
  @UseGuards(JwtAuthGuard)
  async getUserMenus(@Req() req) {
    return await this.permissionService.getUserMenus(req.user.userId);
  }
  
  // 获取用户按钮权限
  @Get('buttons')
  @UseGuards(JwtAuthGuard)
  async getUserButtons(@Req() req) {
    return await this.permissionService.getUserButtons(req.user.userId);
  }
}
```

### 第六步：系统初始化

```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 数据库同步
  const dataSource = app.get(DataSource);
  await dataSource.synchronize(true);
  
  // 初始化默认数据
  const menuService = app.get(MenuService);
  await menuService.initializeDefaultRoles();
  await menuService.initializeDefaultMenus();
  await menuService.initializeDefaultButtons();
  
  await app.listen(3000);
}
```

## 📊 数据库表结构

### roles 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| name | varchar | 角色名称 |
| description | varchar | 描述 |

### menus 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| name | varchar | 菜单标识 |
| title | varchar | 菜单标题 |
| path | varchar | 路由路径 |
| roles | text | 可访问角色(JSON数组) |

### buttons 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| name | varchar | 按钮标识 |
| action | varchar | 操作类型 |
| menuId | integer | 所属菜单ID |
| roles | text | 可操作角色(JSON数组) |

## 🔐 权限控制流程

```
1. 用户登录 → 2. JWT Token生成 → 3. 携带权限信息 → 4. 前端渲染控制
```

### 具体流程：
1. 用户提交登录请求
2. 后端验证用户身份
3. 查询用户角色对应的菜单和按钮权限
4. 生成包含权限信息的JWT Token
5. 前端接收Token和权限数据
6. 根据权限数据动态渲染界面

## 🧪 测试验证

### 功能测试点：
- [ ] 不同角色登录验证
- [ ] 菜单显示权限测试
- [ ] 按钮操作权限测试
- [ ] API权限拦截测试

### 测试命令：
```bash
# 登录测试
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 权限获取测试
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/auth/menus
```

## 📈 扩展建议

### 后续可增加功能：
1. **数据权限**：控制用户能访问的数据范围
2. **操作日志**：记录用户操作行为
3. **权限继承**：支持角色间的权限继承
4. **动态配置**：后台管理界面配置权限
5. **缓存优化**：权限数据缓存提升性能

## ⚠️ 注意事项

1. **生产环境**：关闭`synchronize: true`，使用迁移脚本
2. **安全性**：JWT Secret需要保密，定期更换
3. **性能**：大量权限数据时考虑缓存策略
4. **维护性**：权限配置需要统一管理界面

---
*本文档描述了权限系统的核心设计思路和实现流程*