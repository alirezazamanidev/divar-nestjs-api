import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { EntityNameEnum } from 'src/common/enums';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { ChatEntity } from './chat.entity';

@Entity(EntityNameEnum.ChatMessage)

export class MessageEntity extends BaseEntity {
  @Column()
  text: string;
  @Column()
  senderId: string;
  @Column()
  roomId:string
  @Column()
  sentAt: Date
  @Column({default:false})
  isRead:boolean
  @Column({nullable:true})
  readAt:Date
  // relations
  @ManyToOne(() => UserEntity,{onDelete:'CASCADE'})
  sender: UserEntity;
  @ManyToOne(()=>ChatEntity,chat=>chat.messages,{onDelete:'CASCADE'})
  room:ChatEntity;
}
