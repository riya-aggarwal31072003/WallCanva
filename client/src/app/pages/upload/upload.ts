import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../core/services/project';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
})
export class Upload {
  private projects = inject(ProjectService);
  private router = inject(Router);

  file = signal<File | null>(null);
  preview = signal('');
  title = signal('');
  loading = signal(false);
  error = signal('');

  onFile(event: Event) {
    const f = (event.target as HTMLInputElement).files?.[0];
    this.error.set('');
    if (!f) return;

    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      this.error.set('Only JPG and PNG images are allowed.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      this.error.set('Image must be 5 MB or smaller.');
      return;
    }
    this.file.set(f);
    this.preview.set(URL.createObjectURL(f));
  }

  submit() {
    const f = this.file();
    if (!f) return;
    this.loading.set(true);
    this.error.set('');

    this.projects.upload(f, this.title() || 'Untitled design').subscribe({
      next: (p) => this.router.navigate(['/editor', p._id]),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Upload failed.');
      },
    });
  }
}
