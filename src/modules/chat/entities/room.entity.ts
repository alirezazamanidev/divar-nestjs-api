import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { EntityNameEnum } from 'src/common/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';
import { MessageEntity } from './message.entity';
import { PostEntity } from 'src/modules/post/entities/post.entity';

@Entity(EntityNameEnum.ChatRoom)
@Unique(['postId', 'buyerId', 'sellerId'])
export class ChatRoomEntity extends BaseEntity {
  @Column()
  postId: string;
  @Column()
  buyerId: string;
  @Column()
  sellerId: string;
  @OneToMany(() => MessageEntity, (msg) => msg.room)
  messages: MessageEntity[];
  @OneToOne(() => MessageEntity, { onDelete: 'CASCADE' })
  lastMessage: MessageEntity;
  @ManyToOne(() => PostEntity)
  post: PostEntity;
  @CreateDateColumn()
  created_at: Date;
}
