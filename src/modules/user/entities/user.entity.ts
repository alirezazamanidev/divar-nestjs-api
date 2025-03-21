import {
  Column,
  CreateDateColumn,
  Entity,
  
  OneToMany,
  
  UpdateDateColumn,
} from 'typeorm';
import { EntityNameEnum, Roles } from 'src/common/enums';
import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { PostEntity } from 'src/modules/post/entities/post.entity';

@Entity(EntityNameEnum.User)
export class UserEntity extends BaseEntity {
  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ unique: true })
  phone: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ default: false })
  email_verify: boolean;

  @Column({ nullable: true })
  fullname: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ default: false })
  phone_verify: boolean;

  @Column({
    type: 'simple-array',
  })
  roles: string[] = [Roles.User];

  @Column({ default: false })
  isBlocked: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // realations
  @OneToMany(()=>PostEntity,post=>post.user)
  posts:PostEntity[]
}
