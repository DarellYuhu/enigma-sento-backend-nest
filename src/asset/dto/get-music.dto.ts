import { Types } from 'mongoose';

export class Music {
  path: string;
  title: string;
  type: string;
  size: number;
  duration: number;
  album?: string;
  artist?: string;
  year?: string;
  _id: Types.ObjectId;
  __v: number;
}

export class GetAllMusicResponseDto {
  message: string;
  data: Music[];
}
