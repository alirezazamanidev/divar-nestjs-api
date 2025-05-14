import { ExceptionModule } from 'src/common/filters/exception.module';
import { AdminModule } from 'src/modules/admin/admin.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CategoryModule } from 'src/modules/category/category.module';
import { ChatModule } from 'src/modules/chat/chat.module';
import { PostModule } from 'src/modules/post/post.module';

import { UserModule } from 'src/modules/user/user.module';

export const appInternalImports = [
  
  AuthModule,
  UserModule,
  PostModule,
  CategoryModule,
  ExceptionModule,
  AdminModule,
  ChatModule
  
];
