import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Project, ProjectService } from '../../core/services/project';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private api = inject(ProjectService);
  private router = inject(Router);
  private toast = inject(ToastService);

  projects = signal<Project[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.api.list().subscribe({
      next: (p) => {
        this.projects.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load your designs.');
      },
    });
  }

  duplicate(p: Project) {
    this.api.duplicate(p._id).subscribe({
      next: (copy) => this.router.navigate(['/editor', copy._id]),
      error: () => this.error.set('Could not duplicate this design.'),
    });
  }

  rename(p: Project) {
    const title = prompt('Design name', p.title)?.trim();
    if (!title) return;
    this.api.update(p._id, { title }).subscribe((u) =>
      this.projects.update((list) => list.map((x) => (x._id === u._id ? u : x))));
    this.toast.success('Design renamed');
  }

    remove(p: Project) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    this.api.remove(p._id).subscribe({
      next: () => {
        this.projects.update((list) => list.filter((x) => x._id !== p._id));
        this.toast.success('Design deleted');
      },
      error: () => this.error.set('Could not delete this design.'),
    });
  }
}