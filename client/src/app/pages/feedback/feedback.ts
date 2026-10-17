import { Component, inject, signal } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.html',
  styleUrl: './feedback.scss',
})
export class Feedback {
  private api = inject(AnalyticsService);

  stars = [1, 2, 3, 4, 5];
  rating = signal(0);
  comment = signal('');
  done = signal(false);
  error = signal('');

  submit() {
    if (!this.rating()) { this.error.set('Please choose a rating.'); return; }
    this.error.set('');
    this.api.feedback(this.rating(), this.comment()).subscribe({
      next: () => this.done.set(true),
      error: (e) => this.error.set(e.error?.message || 'Could not send feedback.'),
    });
  }
}