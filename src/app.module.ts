import { Module } from '@nestjs/common';
import { appExternalImports, appInternalImports } from './app/imports';

@Module({
  imports: [
    ...appExternalImports,
   ...appInternalImports,
   
  ],
 
})
export class AppModule {}
