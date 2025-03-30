import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { EntityNameEnum, StatusEnum } from 'src/common/enums';
import { CategoryEntity } from 'src/modules/category/entities/category.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { FileEntity } from 'src/common/entities/file.entity';

@Entity(EntityNameEnum.Post)
export class PostEntity extends BaseEntity {
  @Column()
  categoryId: string;
  @Column()
  userId: string;
  @Index('IDX_post_title_fulltext', { fulltext: true })
  @Column({ unique: true })
  title: string;
  @Index('IDX_post_slug_fulltext', { fulltext: true })
  @Column({ unique: true })
  slug: string;
  @Column({ type: 'text' })
  description: string;
  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.Confrim })
  status: string;

  @Column('json')
  options: Record<string, any>;

  @Column({ default: false })
  isActive: boolean;

  // برای ذخیره فایل‌های مرتبط با پست (عکس یا ویدیو)
  @Column('simple-array', { nullable: true })
  mediaFiles: FileEntity[];

  @Column({ default: false })
  isExpired: boolean;
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;
  @Column()
  city: string;
  @Column()
  pronice: string;
  @Column({type:'json'})
  location: {
    lat: number;
    lng: number;
  };
  @Column({default:true})
  allowChatMessages:boolean
  @CreateDateColumn()
  cteated_at: Date;
  @UpdateDateColumn()
  updated_at: Date;

  // relastions
  @ManyToOne(() => UserEntity, (user) => user.posts, { onDelete: 'CASCADE' })
  user: UserEntity;
  @ManyToOne(() => CategoryEntity, (category) => category.posts)
  category: CategoryEntity;

}
