import {
  AfterViewInit, Component, ElementRef, HostListener, ViewChild, inject, signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project, ProjectService } from '../../core/services/project';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private projects = inject(ProjectService);

  @ViewChild('stage', { static: true }) stageRef!: ElementRef<HTMLDivElement>;
  @ViewChild('base', { static: true }) baseRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('overlay', { static: true }) overlayRef!: ElementRef<HTMLCanvasElement>;

  project = signal<Project | null>(null);
  loading = signal(true);
  error = signal('');

  private img = new Image();

  ngAfterViewInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.projects.get(id).subscribe({
      next: (p) => {
        this.project.set(p);
        this.loadImage(p.originalImageUrl);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load this design.');
      },
    });
  }

  private loadImage(url: string) {
    this.img.crossOrigin = 'anonymous'; // needed so download (toDataURL) works later
    this.img.onload = () => {
      this.loading.set(false);
      this.fitCanvas();
    };
    this.img.onerror = () => {
      this.loading.set(false);
      this.error.set('Could not load the image.');
    };
    this.img.src = url;
  }

  @HostListener('window:resize')
  fitCanvas() {
    if (!this.img.complete || !this.img.naturalWidth) return;

    const maxW = this.stageRef.nativeElement.clientWidth;
    const maxH = window.innerHeight - 180;
    const scale = Math.min(maxW / this.img.naturalWidth, maxH / this.img.naturalHeight, 1);
    const w = Math.round(this.img.naturalWidth * scale);
    const h = Math.round(this.img.naturalHeight * scale);

    for (const ref of [this.baseRef, this.overlayRef]) {
      ref.nativeElement.width = w;
      ref.nativeElement.height = h;
    }

    const ctx = this.baseRef.nativeElement.getContext('2d')!;
    ctx.drawImage(this.img, 0, 0, w, h);
  }
}
