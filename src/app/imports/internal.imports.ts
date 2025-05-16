import { RouterModule } from '@nestjs/core';
import { ExceptionModule } from 'src/common/filters/exception.module';
import { AdminModule } from 'src/modules/admin/admin.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CategoryModule } from 'src/modules/category/category.module';
import { PostModule } from 'src/modules/post/post.module';

import { UserModule } from 'src/modules/user/user.module';

export const appInternalImports = [
  AuthModule,
  AdminModule,
  UserModule,
  PostModule,
  CategoryModule,
  RouterModule.register([
    {
      path: 'admin',
      module: AdminModule,
    },
    {
      path: 'auth',
      module: AuthModule,
    },
    {
      path: 'user',
      module: UserModule,
    },
    {
      path: 'post',
      module: PostModule,
    },
    {
      path: 'category',
      module: CategoryModule,
    },
  ]),
  // ExceptionModule
];
