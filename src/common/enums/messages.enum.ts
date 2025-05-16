export enum AuthMessages {
  OtpNotExpired = 'کد تایید هنوز منقضی نشده است!',
  OtpExpired = 'کد تایید منقضی شده است!',
  OtpINCorrect = 'کد تایید نادرست است',
  LoginAgain = 'لطفا وارد حساب کاربری خود شوید!',
}
export enum ConflictMessages{
  category='چنین دسته بندی قبلا با این عنوان ایجاد شده است!',
  post='چنین پست قبلا با این عنوان ایجاد شده است!',
}
export enum ForbiddenMessages{
  access_denied='شما اجازه دسترسی به این روت را ندارید!'
}
export enum NotFoundMessages{
  Category='دسته بندی یافت نشد',
  Post='آگهی یافت نشد',
  User='کاربر یافت نشد',


}
export enum ForbiddenMessage {
  UserBlocked = 'اکانت شما مسدود شده است!',
  Commenet='کامنت بسته شده است'
}
export enum PublicMessage {
  AWnswer_comment='کامنت باموفقیت پاسخ داده شد!',
  Comment='نظر شما با موفقیت ثبت شد و پس از تایید در سایت قرار میگیرد',
  SendOtp = 'کد تایید با موفقیت ایجاد شد!',
  LoggedIn = 'ورود با موفقیت انجام شد!',
  Created='با موفقیت ایجاد شد!',
  Created_Post='آگهی شما با موفقیت ساخته شد و در صف انتشار قرار گرفت',
  Updated='تغییرات اعمال شد!',
  Removed='حذف شد!',
  UploadAvatar='پروفایل شما ثبت شد',
  LoggedOut='خروج با موفقیت انجام شد',
  UpdateProfile='تغییرات بر روی پروفایل شما اعمال شد!',
 
}
