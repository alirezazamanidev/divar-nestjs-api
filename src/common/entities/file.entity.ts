import { Column } from "typeorm"


export class FileEntity {
   @Column()
    size:number
    @Column()
    mimetype:string
    @Column()
    url:string
    @Column()
    key:string
}