
import { ExceptionModule } from 'src/common/filters/exception.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CategoryModule } from 'src/modules/category/category.module';

import { UserModule } from 'src/modules/user/user.module';

export const appInternalImports = [
  
  AuthModule,
  UserModule,
  CategoryModule,
  ExceptionModule
  
];
