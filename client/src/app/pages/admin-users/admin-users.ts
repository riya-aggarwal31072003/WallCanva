import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService, AdminUser } from '../../core/services/admin';
import { Project } from '../../core/services/project';

@Component({
  selector: 'app-admin-users',
  imports: [DatePipe],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers implements OnInit {
  private api = inject(AdminService);

  users = signal<AdminUser[]>([]);
  selected = signal<AdminUser | null>(null);
  projects = signal<Project[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.api.users().subscribe({
      next: (u) => {
        this.users.set(u);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load users.');
      },
    });
  }

  view(u: AdminUser) {
    this.selected.set(u);
    this.projects.set([]);
    this.api.userProjects(u._id).subscribe({
      next: (p) => this.projects.set(p),
      error: () => this.error.set("Could not load this user's designs."),
    });
  }

  close() {
    this.selected.set(null);
  }
}
