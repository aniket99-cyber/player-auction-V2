import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Auction, BidIncrementRule, PaginatedResult } from '../../../core/models';

export interface CreateAuctionRequest {
  name: string;
  playerQueue: string[];
  participatingTeams: string[];
  bidIncrementRules: BidIncrementRule[];
  selectionMode?: string;
  settings?: {
    autoAdvance?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class AuctionService {
  private readonly api = inject(ApiService);

  list(page = 1, limit = 20, status?: string): Observable<PaginatedResult<Auction>> {
    return this.api.get<PaginatedResult<Auction>>('/auctions', { page, limit, status });
  }

  getById(id: string): Observable<Auction> {
    return this.api.get<Auction>(`/auctions/${id}`);
  }

  create(payload: CreateAuctionRequest): Observable<Auction> {
    return this.api.post<Auction>('/auctions', payload);
  }
}
