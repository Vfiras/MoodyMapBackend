import { IsString, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Action } from '../enums/action.enum';
import { Resource } from '../enums/resource.enum';

export class Permission {
  @IsEnum(Resource)
  resource: Resource;

  @IsArray()
  @IsEnum(Action, { each: true })
  actions: Action[];
}

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Permission)
  permissions: Permission[];
}