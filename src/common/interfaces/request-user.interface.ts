

export interface IUser{
    id: string
    username: string,
    fullname: string
    role:string
    email: string,
    phone: string,
    phone_verify: boolean,
    email_verify: boolean,
    isBlocked:boolean
    created_at: Date,
    updated_at: Date,
}