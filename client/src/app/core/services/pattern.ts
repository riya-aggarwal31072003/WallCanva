import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PaintPattern {
  _id: string;
  name: string;
  category: string;
  imageUrl: string;
  scale: number;
}

@Injectable({ providedIn: 'root' })
export class PatternService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/patterns`;

  list() { return this.http.get<PaintPattern[]>(this.base); }

  create(name: string, category: string, file: File) {
    const f = new FormData();
    f.append('name', name);
    f.append('category', category);
    f.append('image', file);
    return this.http.post<PaintPattern>(this.base, f);
  }

  remove(id: string) { return this.http.delete(`${this.base}/${id}`); }
}
