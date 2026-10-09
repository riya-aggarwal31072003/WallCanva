import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PaintColor {
  _id: string;
  name: string;
  hex: string;
  brand?: string;
  finishes?: string[];
  tags?: string[];
}

@Injectable({ providedIn: 'root' })
export class ColorService {
  private http = inject(HttpClient);
  list() {
    return this.http.get<PaintColor[]>(`${environment.apiUrl}/colors`);
  }
}