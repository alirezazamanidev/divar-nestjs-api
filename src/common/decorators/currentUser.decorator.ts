import { createParamDecorator } from "@nestjs/common";
import { ExecutionContext } from '@nestjs/common';
import { Request } from "express";
import { IUser } from "../interfaces";

export const CurrentUser = createParamDecorator(
  (key: keyof IUser, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if(key) return request.user[key];
    return request.user;
  }
);