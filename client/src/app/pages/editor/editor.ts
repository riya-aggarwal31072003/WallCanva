import {
  AfterViewInit, Component, ElementRef, HostListener, ViewChild, inject, signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Point, Project, ProjectService, Selection } from '../../core/services/project';

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

  // tool state
  drawing = signal(false);
  selections = signal<Selection[]>([]);
  private current: Point[] = [];   // points of the shape being drawn
  private cursor: Point | null = null;

  private img = new Image();
  private readonly CLOSE_DIST = 12; // pixels: click this close to the first point to close

  ngAfterViewInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.projects.get(id).subscribe({
      next: (p) => {
        this.project.set(p);
        this.selections.set(p.selections ?? []);
        this.loadImage(p.originalImageUrl);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load this design.');
      },
    });
  }

  private loadImage(url: string) {
    this.img.crossOrigin = 'anonymous';
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
    const maxH = window.innerHeight - 220;
    const scale = Math.min(maxW / this.img.naturalWidth, maxH / this.img.naturalHeight, 1);
    const w = Math.round(this.img.naturalWidth * scale);
    const h = Math.round(this.img.naturalHeight * scale);

    for (const ref of [this.baseRef, this.overlayRef]) {
      ref.nativeElement.width = w;
      ref.nativeElement.height = h;
    }
    this.baseRef.nativeElement.getContext('2d')!.drawImage(this.img, 0, 0, w, h);
    this.redraw();
  }

  // ---------- tool controls ----------

  startPolygon() {
    this.current = [];
    this.cursor = null;
    this.drawing.set(true);
    this.redraw();
  }

  cancelPolygon() {
    this.current = [];
    this.cursor = null;
    this.drawing.set(false);
    this.redraw();
  }

  undoPoint() {
    this.current.pop();
    this.redraw();
  }

  deleteSelection(index: number) {
    this.selections.update((list) => list.filter((_, i) => i !== index));
    this.redraw();
  }

  // ---------- mouse handling ----------

  private toCanvasPoint(e: MouseEvent): { x: number; y: number } {
    const c = this.overlayRef.nativeElement;
    const rect = c.getBoundingClientRect();
    // account for any CSS scaling between displayed size and canvas pixels
    return {
      x: (e.clientX - rect.left) * (c.width / rect.width),
      y: (e.clientY - rect.top) * (c.height / rect.height),
    };
  }

  onCanvasClick(e: MouseEvent) {
    if (!this.drawing()) return;
    const c = this.overlayRef.nativeElement;
    const p = this.toCanvasPoint(e);

    // close the shape if clicking near the first point (needs 3+ points)
    if (this.current.length >= 3) {
      const first = this.current[0];
      const dx = p.x - first.x * c.width;
      const dy = p.y - first.y * c.height;
      if (Math.hypot(dx, dy) <= this.CLOSE_DIST) {
        this.finishPolygon();
        return;
      }
    }

    // store as 0-1 fractions so it works at any size
    this.current.push({ x: p.x / c.width, y: p.y / c.height });
    this.redraw();
  }

  onCanvasMove(e: MouseEvent) {
    if (!this.drawing() || this.current.length === 0) return;
    const c = this.overlayRef.nativeElement;
    const p = this.toCanvasPoint(e);
    this.cursor = { x: p.x / c.width, y: p.y / c.height };
    this.redraw();
  }

  private finishPolygon() {
    const selection: Selection = {
      points: [...this.current],
      hex: '#4A90B8',   // placeholder colour; real colours come on Day 9
      opacity: 0.7,
    };
    this.selections.update((list) => [...list, selection]);
    this.current = [];
    this.cursor = null;
    this.drawing.set(false);
    this.redraw();
  }

  // ---------- drawing ----------

  private redraw() {
    const c = this.overlayRef.nativeElement;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);

    // finished selections
    for (const sel of this.selections()) {
      this.tracePath(ctx, sel.points, c.width, c.height, true);
      ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // shape being drawn
    if (this.current.length > 0) {
      const pts = this.cursor ? [...this.current, this.cursor] : this.current;
      this.tracePath(ctx, pts, c.width, c.height, false);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      this.current.forEach((pt, i) => {
        ctx.beginPath();
        ctx.arc(pt.x * c.width, pt.y * c.height, i === 0 ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#ef4444' : '#f59e0b';
        ctx.fill();
      });
    }
  }

  private tracePath(
    ctx: CanvasRenderingContext2D, pts: Point[], w: number, h: number, close: boolean,
  ) {
    ctx.beginPath();
    pts.forEach((p, i) =>
      i === 0 ? ctx.moveTo(p.x * w, p.y * h) : ctx.lineTo(p.x * w, p.y * h));
    if (close) ctx.closePath();
  }
}