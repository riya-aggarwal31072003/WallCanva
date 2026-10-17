import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService, FeedbackItem, Stats } from '../../core/services/analytics';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit, AfterViewInit {
  private api = inject(AnalyticsService);

  @ViewChild('usersChart', { static: true }) usersRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('kpiChart', { static: true }) kpiRef!: ElementRef<HTMLCanvasElement>;

  stats = signal<Stats | null>(null);
  feedback = signal<FeedbackItem[]>([]);
  error = signal('');
  private charts: Chart[] = [];

  ngOnInit() {
    this.api.recentFeedback().subscribe((f) => this.feedback.set(f));
  }

  ngAfterViewInit() {
    this.api.stats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.draw(s);
      },
      error: () => this.error.set('Could not load analytics.'),
    });
  }

  private draw(s: Stats) {
    this.charts.forEach((c) => c.destroy());
    this.charts = [
      new Chart(this.usersRef.nativeElement, {
        type: 'bar',
        data: {
          labels: s.usersByWeek.map((w) => w.week),
          datasets: [{ label: 'New users', data: s.usersByWeek.map((w) => w.count), backgroundColor: '#2563eb' }],
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
      }),
      new Chart(this.kpiRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Images uploaded', 'Designs saved'],
          datasets: [{ data: [s.imagesUploaded, s.designsSaved], backgroundColor: ['#f59e0b', '#10b981'] }],
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
      }),
    ];
  }
}
