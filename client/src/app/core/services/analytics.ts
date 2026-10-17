import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Stats {
  totalUsers: number;
  imagesUploaded: number;
  designsSaved: number;
  avgSessionMinutes: number;
  sessionCount: number;
  avgRating: number;
  feedbackCount: number;
  usersByWeek: { week: string; count: number }[];
}

export interface FeedbackItem {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { name: string };
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/analytics`;

  startSession() { return this.http.post<{ sessionId: string }>(`${this.base}/session`, {}); }
  ping(id: string) { return this.http.post(`${this.base}/session/${id}/ping`, {}); }
  feedback(rating: number, comment: string) {
    return this.http.post(`${this.base}/feedback`, { rating, comment });
  }
  stats() { return this.http.get<Stats>(`${this.base}/stats`); }
  recentFeedback() { return this.http.get<FeedbackItem[]>(`${this.base}/feedback`); }
}