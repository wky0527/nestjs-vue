# Nest.js Demo 项目

这是一个基于 Nest.js 框架构建的后端项目，采用模块化架构设计，包含认证授权系统和用户管理功能。

## 项目结构

```
src/
├── modules/
│   ├── auth/           # 认证授权模块
│   │   ├── auth.controller.ts      # 认证控制器
│   │   ├── auth.controller.spec.ts # 认证控制器测试
│   │   ├── auth.module.ts          # 认证模块定义
│   │   ├── auth.service.ts         # 认证服务
│   │   ├── jwt-auth.guard.ts       # JWT认证守卫
│   │   ├── jwt.strategy.ts         # JWT策略
│   │   ├── permission.entity.ts    # 权限实体
│   │   ├── permission.service.ts   # 权限服务
│   │   ├── permissions.decorator.ts # 权限装饰器
│   │   ├── permissions.guard.ts    # 权限守卫
│   │   ├── role-permission.entity.ts # 角色权限实体
│   │   ├── role.entity.ts          # 角色实体
│   │   ├── role.enum.ts            # 角色枚举
│   │   ├── roles.decorator.ts      # 角色装饰器
│   │   └── roles.guard.ts          # 角色守卫
│   └── user/           # 用户模块
│       ├── user.controller.ts      # 用户控制器
│       ├── user.controller.spec.ts # 用户控制器测试
│       ├── user.dto.ts             # 用户数据传输对象
│       ├── user.entity.ts          # 用户实体
│       ├── user.module.ts          # 用户模块定义
│       ├── user.service.spec.ts    # 用户服务测试
│       └── user.service.ts         # 用户服务
├── types/
│   └── express.d.ts    # Express类型扩展
├── app.controller.ts   # 应用主控制器
├── app.controller.spec.ts # 应用主控制器测试
├── app.module.ts       # 应用主模块
├── app.service.ts      # 应用主服务
└── main.ts             # 应用入口文件
```

## 核心功能

### 1. 认证授权系统 (Auth Module)

认证模块提供了完整的用户认证和权限控制系统：

- **JWT 认证**: 使用 JWT 令牌进行用户身份验证
- **角色管理**: 支持多种角色类型，通过 [role.enum.ts](file:///Users/coco/workspace/nest-demo/src/modules/auth/role.enum.ts) 定义
- **权限控制**: 通过权限实体和守卫实现细粒度权限控制
- **守卫机制**: 包含 JWT 守卫、角色守卫和权限守卫

### 2. 用户管理 (User Module)

用户模块提供了基本的用户管理功能：

- **用户实体**: 定义用户数据结构
- **用户服务**: 处理用户业务逻辑
- **数据传输对象**: 定义用户相关 API 的输入输出格式

## 技术栈

- **Nest.js**: Node.js 框架，提供模块化、依赖注入等企业级功能
- **TypeScript**: 类型安全的 JavaScript 超集
- **JWT**: 用于用户身份验证的令牌机制
- **装饰器**: 用于权限控制和角色管理

## 模块关系

- [AuthModule](file:///Users/coco/workspace/nest-demo/src/modules/auth/auth.module.ts) 和 [UserModule](file:///Users/coco/workspace/nest-demo/src/modules/user/user.module.ts) 是两个主要的功能模块
- 认证模块为用户模块和其他可能的模块提供身份验证和权限控制服务
- 通过守卫和装饰器实现声明式的安全控制

## 启动项目

1. 安装依赖：
   ```bash
   pnpm install
   ```

2. 启动开发服务器：
   ```bash
   pnpm run start:dev
   ```

## 测试

运行单元测试：
```bash
pnpm run test
```

运行端到端测试：
```bash
pnpm run test:e2e
```

## API 接口列表

### 认证模块 (Auth Module)

#### 1. 用户登录
- **接口**: `POST /auth/login`
- **描述**: 用户登录验证并获取JWT令牌
- **请求参数**:
  - `username`: 用户名
  - `password`: 密码
- **返回**: 登录成功时返回JWT令牌，失败时返回错误信息

### 用户模块 (User Module)

#### 1. 创建用户
- **接口**: `POST /user/create`
- **描述**: 创建新用户
- **请求参数**: 用户信息对象（具体字段由业务逻辑决定）
- **返回**: 创建的用户信息

#### 2. 获取用户列表
- **接口**: `GET /user/list`
- **描述**: 获取所有用户列表
- **请求参数**: 无
- **返回**: 用户列表，使用UserDto格式化

#### 3. 获取用户信息
- **接口**: `GET /user/profile`
- **描述**: 获取当前登录用户信息（需管理员权限）
- **请求参数**: 无
- **返回**: 当前登录的用户信息
- **认证**: 需要JWT令牌和管理员角色


## 项目特点

1. **模块化设计**: 功能按模块划分，便于维护和扩展
2. **安全控制**: 完整的认证授权机制
3. **类型安全**: 使用 TypeScript 提供类型检查
4. **测试覆盖**: 包含单元测试和端到端测试
5. **可扩展性**: 遵循 Nest.js 最佳实践，便于功能扩展
