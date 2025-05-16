import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundMessages, PublicMessage, StatusEnum } from 'src/common/enums';
import { PostEntity } from 'src/modules/post/entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  async changeStatus(id: string, status: string) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException(NotFoundMessages.Post);
    if (status === StatusEnum.Published) {
      post.status = status;
    } else if (status === StatusEnum.Rejected) {
      post.status = status;
    }
    await this.postRepository.save(post);

    return {
      status,
      message:PublicMessage.Updated
    }
  }
}
