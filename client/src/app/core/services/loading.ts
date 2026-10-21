import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = signal(0);
  active = computed(() => this.count() > 0);
  start() { this.count.update((n) => n + 1); }
  stop() { this.count.update((n) => Math.max(0, n - 1)); }
}