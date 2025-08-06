import { ObjectId } from 'mongoose';

export interface IBuyerDocument {
  _id?: string | ObjectId;
  name?: string;
  username?: string;
  email?: string;
  profilePicture?: string;
  country: string;
  roles: number[];
  purchasedGigs: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IReduxBuyer {
  type?: string;
  payload: IBuyerDocument;
}
