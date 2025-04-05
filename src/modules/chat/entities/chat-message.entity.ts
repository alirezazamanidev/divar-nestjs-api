import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { EntityNameEnum } from 'src/common/enums';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { ChatRoomEntity } from './chat-room.entity';

@Entity(EntityNameEnum.ChatMessage)
export class ChatMessageEntity extends BaseEntity {
  @Column()
  chatRoomId: string;

  @Column()
  senderId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => ChatRoomEntity, (chatRoom) => chatRoom.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatRoomId' })
  chatRoom: ChatRoomEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: UserEntity;
} 