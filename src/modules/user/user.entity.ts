import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../../modules/auth/role.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  gender: string; // male/female/unknown

  @Column({ nullable: true })
  birthday: Date;

  @Column({ default: 'active' })
  status: string; // active/disabled

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @Column({ nullable: true })
  lastLoginDevice: string;

  @Column({ default: 0 })
  growthValue: number;

  @Column({ nullable: true })
  companyId: number;

  @Column({ nullable: true })
  roleId: number;

  @Column({ default: 'normal' })
  level: string; // normal, silver, gold, diamond

  @Column({ default: false })
  isBlacklisted: boolean;

  @Column({ nullable: true })
  blacklistReason: string;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn({ name: 'roleId' })
  roleRef: Role;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
