import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { EntityNameEnum, StatusEnum } from 'src/common/enums';
import { CategoryEntity } from 'src/modules/category/entities/category.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, UpdateDateColumn } from 'typeorm';

@Entity(EntityNameEnum.Post)
export class PostEntity extends BaseEntity {
  @Column()
  categoryId: string;
  @Column()
  userId: string;
  @Index({ fulltext: true })
  @Column({ unique: true })
  title: string;
  @Index({ fulltext: true })
  @Column({ unique: true })
  slug: string;
  @Column({ type: 'text' })
  description: string;
  @Column({ type: 'enum', default: StatusEnum.Confrim })
  status: StatusEnum;
  @Index({ fulltext: true })
  @Column('json')
  formData: Record<string, any>;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  isExpired: boolean;
  @Column({ type: 'timestamp',nullable:true })
  expiresAt: Date;

  @CreateDateColumn()
  cteated_at:Date
  @UpdateDateColumn()
  updated_at:Date

  // relastions
  @ManyToOne(() => UserEntity, (user) => user.posts, { onDelete: 'CASCADE' })
  user: UserEntity;
  @ManyToOne(() => CategoryEntity, (category) => category.posts)
  category: CategoryEntity;
}
