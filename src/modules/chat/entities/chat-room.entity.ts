import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { EntityNameEnum } from 'src/common/enums';
import { PostEntity } from 'src/modules/post/entities/post.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { ChatMessageEntity } from './chat-message.entity';

@Entity(EntityNameEnum.ChatRoom)
export class ChatRoomEntity extends BaseEntity {
  @Column()
  postId: string;

  @Column()
  buyerId: string;

  @Column()
  sellerId: string;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: UserEntity;

  @OneToMany(() => ChatMessageEntity, (message) => message.chatRoom)
  messages: ChatMessageEntity[];
} 