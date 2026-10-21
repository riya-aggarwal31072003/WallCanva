import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Project } from './project';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  projectCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  users() {
    return this.http.get<AdminUser[]>(`${this.base}/users`);
  }

  userProjects(id: string) {
    return this.http.get<Project[]>(`${this.base}/users/${id}/projects`);
  }
}
