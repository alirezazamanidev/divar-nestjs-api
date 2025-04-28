import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { SmartModerationService } from "./aiContentChecker.service";
import { StatusEnum } from "src/common/enums";
import { DataSource } from "typeorm";
import { PostEntity } from "./entities/post.entity";
import { PostService } from "./post.service";


@Processor('moderation')
export class ModerationProcessor{


  private readonly logger=new Logger(ModerationProcessor.name)

  constructor(
  private postService:PostService,
    private readonly dataSource:DataSource,
    private readonly smartModerationService:SmartModerationService
  ){}

    @Process('moderate-post')
    async handleModeration(job: Job<{ postId: string }>) {
      const { postId } = job.data;
     
      
      const post = await this.postService.getOne(postId)
  
      if (!post) {
        this.logger.warn(`Post ${postId} not found.`);
        return;
      }
  
      try {
        const isSafe = await this.smartModerationService.moderateText(`${post.title}\n${post.description}`);

       console.log(isSafe);
       
        if(isSafe){
            post.isActive=true
            post.status=StatusEnum.Published;
            // send sms for user
        }else{
            post.isActive=false
            post.status=StatusEnum.Rejected;
        }
        await this.dataSource.manager.save(PostEntity,post);
  
        this.logger.log(`Post ${postId} moderation completed with status: ${post.status}`);
      } catch (error) {
        this.logger.error(`Error moderating post ${postId}: ${error.message}`);
        throw error; // تا Bull بتونه job رو Retry کنه
      }
    }
}