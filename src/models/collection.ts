import type { User } from "./user";
import type { UserAnswer } from "./userAnswer";
import type { Assignment } from "./assignment";
import type { Store } from "./store";

export interface Collection {
  id: number;
  title: string;
  isActive: boolean;
  formUrl: string;
  users?: Array<{
    userId: number;
    collectionId: number;
    user: User;
    userAnswers?: UserAnswer[];
  }>;
  zones?: Array<{
    collectionId: number;
    zoneId: number;
    zone: {
      id: number;
      title: string;
      stores?: Store[];
    };
  }>;
  slots?: Array<{
    id: number;
    startAt: string;
    endAt: string;
    collectionId: number;
    assignments?: Assignment[];
  }>;
}

export interface CreateCollectionDto {
  id: number;
  title: string;
  isActive?: boolean;
  formUrl: string;
  userIds?: number[];
}
