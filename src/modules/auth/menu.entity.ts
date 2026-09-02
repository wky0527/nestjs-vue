import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Role } from './role.entity';

/**
 * 菜单实体类
 * 定义系统菜单的数据结构
 * 支持父子层级关系和角色权限控制
 */
@Entity()
export class Menu {
  /**
   * 主键ID - 自动生成的唯一标识符
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 菜单标识符 - 唯一名称
   * 用于程序中识别菜单项
   */
  @Column({ unique: true })
  name: string;

  /**
   * 菜单显示标题
   * 在界面上显示的中文名称
   */
  @Column()
  title: string;

  /**
   * 路由路径
   * 前端路由对应的URL路径
   */
  @Column({ nullable: true })
  path: string;

  /**
   * 组件名称
   * 对应前端组件的名称
   */
  @Column({ nullable: true })
  component: string;

  /**
   * 图标名称
   * 菜单项前面显示的图标
   */
  @Column({ nullable: true })
  icon: string;

  /**
   * 父级菜单ID
   * 用于构建菜单层级关系
   * 顶级菜单的parentId为0
   */
  @Column({ default: 0 })
  parentId: number;

  /**
   * 排序权重
   * 数值越小排序越靠前
   */
  @Column({ default: 1 })
  order: number;

  /**
   * 是否可见
   * 控制菜单项是否在界面上显示
   */
  @Column({ default: true })
  visible: boolean;

  /**
   * 可访问角色数组
   * 指定哪些角色可以访问此菜单
   * 例如: ['admin', 'user']
   */
  @Column({ type: 'simple-array', nullable: true })
  roles: string[];

  /**
   * 是否启用
   * 控制菜单项是否可用
   */
  @Column({ default: true })
  enabled: boolean;

  /**
   * 创建时间
   * 自动记录菜单创建时间
   */
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  /**
   * 更新时间
   * 自动记录菜单最后更新时间
   */
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  /**
   * 子菜单集合
   * 当前菜单的所有子菜单项
   */
  @OneToMany(() => Menu, menu => menu.parent)
  children: Menu[];

  /**
   * 父菜单对象
   * 指向当前菜单的父级菜单
   */
  @ManyToOne(() => Menu, menu => menu.children)
  @JoinColumn({ name: 'parentId' })
  parent: Menu;
}