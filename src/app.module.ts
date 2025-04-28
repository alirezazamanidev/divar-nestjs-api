import { Module } from '@nestjs/common';
import { appExternalImports, appInternalImports } from './app/imports';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ...appExternalImports,
   ...appInternalImports,
   AdminModule,

  
  ],
 
})
export class AppModule {}
