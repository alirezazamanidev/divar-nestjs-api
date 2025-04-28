import { BaseEntity } from "src/common/abstracts/baseEntity.abstract";
import { EntityNameEnum } from "src/common/enums";
import { Column, Entity, Index, ManyToOne, OneToMany } from "typeorm";
import { UserEntity } from "../../user/entities/user.entity";
import { PostEntity } from "../../post/entities/post.entity";
import { MessageEntity } from "./message.entity";

@Entity(EntityNameEnum.ChatRoom)
@Index(['postId', 'senderId', 'receiverId'], { unique: true })
export class ChatEntity extends BaseEntity{
    @Column()
    postId: string;
  
    @Column()
    senderId: string;
    @Column()
    receiverId: string;
  
    @ManyToOne(() => PostEntity,{ onDelete: 'CASCADE' })
    post: PostEntity;
  
    @ManyToOne(() => UserEntity, {onDelete:'CASCADE'})
    sender: UserEntity; // خریدار
  
    @ManyToOne(() => UserEntity,{onDelete:'CASCADE'})
    receiver: UserEntity; // فروشنده
  
    @OneToMany(() => MessageEntity, (message) => message.room)
    messages: MessageEntity[];
  
    @Column({ default: true })
    isActive: boolean;
  
    @Column({ type: 'timestamp', nullable: true })
    lastMessageAt: Date;
}