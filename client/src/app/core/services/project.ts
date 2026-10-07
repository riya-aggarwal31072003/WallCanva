import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Point {
  x: number; // 0-1 fraction of image width
  y: number; // 0-1 fraction of image height
}

export interface Selection {
  _id?: string;
  points: Point[];
  colorId?: string;
  patternId?: string;
  hex: string;
  opacity: number;
  finish?: 'matte' | 'satin' | 'glossy';
}

export interface Project {
  _id: string;
  title: string;
  originalImageUrl: string;
  selections: Selection[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/projects`;

  upload(file: File, title: string) {
    const form = new FormData();
    form.append('image', file);
    form.append('title', title);
    return this.http.post<Project>(`${this.base}/upload`, form);
  }

  list() {
    return this.http.get<Project[]>(this.base);
  }

  get(id: string) {
    return this.http.get<Project>(`${this.base}/${id}`);
  }

  update(id: string, data: Partial<Pick<Project, 'title' | 'selections'>>) {
    return this.http.put<Project>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
