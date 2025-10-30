export interface VoteData {
  fid: number;
  date: string;
  choice: 'like' | 'dislike';
  wishIndex: number;
}

export interface VoteStats {
  likes: number;
  dislikes: number;
  totalVotes: number;
  likesPct: number;
  dislikesPct: number;
}

export interface FrameRequest {
  untrustedData: {
    fid: number;
    buttonIndex?: number;
    inputText?: string;
    state?: string;
    url?: string;
    timestamp?: number;
    network?: number;
  };
  trustedData?: {
    messageBytes?: string;
  };
}

export interface FrameResponse {
  image: string;
  buttons?: Array<{
    text: string;
    action?: 'post' | 'link' | 'mint';
    target?: string;
  }>;
  postUrl?: string;
  state?: string;
}