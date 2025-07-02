export class QuoteResponseDto {
  id: string;
  text: string;
  author: string;
  avatarUrl?: string;
  tags: string[];
  votes: number;
  isVoted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}