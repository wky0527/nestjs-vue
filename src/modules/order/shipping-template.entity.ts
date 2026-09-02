import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ShippingTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 'byPiece' })
  chargeType: string; // byPiece/byWeight

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  defaultFee: number;

  @Column('text', { nullable: true })
  areaPricing: string; // JSON

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
