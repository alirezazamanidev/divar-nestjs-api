import { BaseEntity } from 'src/common/abstracts/baseEntity.abstract';
import { FileEntity } from 'src/common/entities/file.entity';
import { EntityNameEnum } from 'src/common/enums';
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, Tree, TreeChildren, TreeParent, UpdateDateColumn } from 'typeorm';
import { FormField } from '../types/FormFileds.type';

@Entity(EntityNameEnum.Category)
@Tree("materialized-path")
export class Category extends BaseEntity {

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  description: string;
  @Column('json', { nullable: true })
  icon: FileEntity;

  @TreeParent()
  parent: Category;

  @TreeChildren()
  children: Category[];

  @Column({ nullable: true })
  parentId: string;

  @Column({type:'json',nullable:true})
  formFields:FormField[]
  
  @CreateDateColumn()
  created_at:Date
  @UpdateDateColumn()
  updated_at:Date

}