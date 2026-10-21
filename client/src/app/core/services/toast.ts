import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private next = 1;

  show(text: string, type: 'success' | 'error' = 'success') {
    const id = this.next++;
    this.toasts.update((l) => [...l, { id, text, type }]);
    setTimeout(() => this.dismiss(id), 3000);
  }
  success(text: string) { this.show(text, 'success'); }
  error(text: string) { this.show(text, 'error'); }
  dismiss(id: number) { this.toasts.update((l) => l.filter((t) => t.id !== id)); }
}