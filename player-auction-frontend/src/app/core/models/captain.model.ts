export interface Captain {
  id: string;
  team: string;
  player: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaptainRequest {
  team: string;
  player: string;
}

export interface UpdateCaptainRequest {
  player: string;
}
