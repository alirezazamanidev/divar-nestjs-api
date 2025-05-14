import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { EntityNameEnum } from 'src/common/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { PostEntity } from '../../post/entities/post.entity';
import { MessageEntity } from './message.entity';

@Entity(EntityNameEnum.ChatRoom)
@Index(['postId', 'buyerId', 'sellerId'], { unique: true }) // جلوگیری از چت تکراری برای یک آگهی
export class RoomEntity extends BaseEntity {
  /** ID آگهی مرتبط با این چت */
  @Column()
  postId: string;

  @Column()
  buyerId: string;

  @Column()
  sellerId: string;

  /** خریدار */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer: UserEntity;

  /** فروشنده */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: UserEntity;

  /** آگهی مرتبط */
  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  /** لیست پیام‌های داخل این چت */
  @OneToMany(() => MessageEntity, (message) => message.room)
  messages: MessageEntity[];

  /** چت فعال است یا نه (می‌تواند برای بستن یا آرشیو کردن استفاده شود) */
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  created_at:Date

}
