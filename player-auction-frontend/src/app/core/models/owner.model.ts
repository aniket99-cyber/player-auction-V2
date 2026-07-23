export interface Owner {
  id: string;
  team: string;
  name: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOwnerRequest {
  team: string;
  name: string;
  imageUrl?: string;
}

export interface UpdateOwnerRequest {
  name?: string;
  imageUrl?: string;
}
