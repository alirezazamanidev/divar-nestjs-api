import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { EntityNameEnum } from 'src/common/enums';
import { PostEntity } from './post.entity';
import { Column, Entity, OneToOne } from 'typeorm';

@Entity(EntityNameEnum.Address)
export class AddressEntity extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column()
  address: string;

  @Column({ nullable: true })
  description: string;

  @OneToOne(() => PostEntity, post => post.address)
  post: PostEntity;
}