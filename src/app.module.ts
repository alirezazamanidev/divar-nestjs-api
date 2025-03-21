import { Module } from '@nestjs/common';
import { appExternalImports, appInternalImports } from './app/imports';
import { PostModule } from './modules/post/post.module';

@Module({
  imports: [
    ...appExternalImports,
   ...appInternalImports,
   PostModule,
   
  ],
 
})
export class AppModule {}
