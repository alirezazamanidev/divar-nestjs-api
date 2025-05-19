import { BaseEntity } from "src/common/abstracts/baseEntity.abstract";
import { EntityNameEnum } from "src/common/enums";
import { UserEntity } from "src/modules/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne } from "typeorm";
import { ChatRoomEntity } from "./room.entity";

@Entity(EntityNameEnum.ChatMessage)
export class MessageEntity extends BaseEntity {

    @Column()
    roomId:string
    @Column()
    senderId:string
    @Column()
    text:string
    @Column({default:false})
    seen:boolean
    @CreateDateColumn({
        type: "timestamp",
        transformer: {
          from: (value: Date) => value,
          to: () => new Date().toUTCString(),
        },
      })
    sentAt:Date
    // reletions
    @ManyToOne(()=>UserEntity,{onDelete:'CASCADE'})
    sender:UserEntity
    @ManyToOne(() => ChatRoomEntity, (r) => r.messages, { onDelete: 'CASCADE' })
    room: ChatRoomEntity;

}