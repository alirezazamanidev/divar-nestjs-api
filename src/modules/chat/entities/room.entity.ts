import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { EntityNameEnum } from 'src/common/enums';
import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, Unique } from 'typeorm';
import { MessageEntity } from './message.entity';

@Entity(EntityNameEnum.ChatRoom)
@Unique(['postId', 'buyerId', 'sellerId'])
export class ChatRoomEntity extends BaseEntity {
  @Column()
  postId: string;
  @Column()
  buyerId: string;
  @Column()
  sellerId: string;
  @OneToMany(()=>MessageEntity,msg=>msg.room)
  messages:MessageEntity[]
  @OneToOne(()=>MessageEntity,{onDelete:'CASCADE'})
  lastMessage:MessageEntity
  @CreateDateColumn()
  created_at:Date
}
