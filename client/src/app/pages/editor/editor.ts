import {
  AfterViewInit, Component, ElementRef, HostListener, ViewChild, inject, signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Point, Project, ProjectService, Selection } from '../../core/services/project';
import { ColorService, PaintColor } from '../../core/services/color';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-editor',
  imports: [DecimalPipe],
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

  private colorsApi = inject(ColorService);
  colors = signal<PaintColor[]>([]);
  activeHex = signal('#4A90B8');
  activeColorId = signal<string | undefined>(undefined);
  opacity = signal(0.7);
  selectedIndex = signal<number | null>(null);
    blend = signal<'multiply' | 'overlay' | 'soft-light'>('multiply');

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
    this.colorsApi.list().subscribe((c) => this.colors.set(c));
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
  
    pickColor(c: PaintColor) {
    this.activeHex.set(c.hex);
    this.activeColorId.set(c._id);
    this.applyToSelected({ hex: c.hex, colorId: c._id });
  }

  setOpacity(value: number) {
    this.opacity.set(value);
    this.applyToSelected({ opacity: value });
  }

  selectArea(i: number) {
    this.selectedIndex.set(i);
    const s = this.selections()[i];
    this.activeHex.set(s.hex);
    this.activeColorId.set(s.colorId);
    this.opacity.set(s.opacity);
    this.blend.set(s.blend ?? 'multiply');
    this.redraw();
  }

    setBlend(value: 'multiply' | 'overlay' | 'soft-light') {
    this.blend.set(value);
    this.applyToSelected({ blend: value });
  }

  duplicateColorToAll() {
    const hex = this.activeHex();
    const colorId = this.activeColorId();
    this.selections.update((list) => list.map((s) => ({ ...s, hex, colorId })));
    this.redraw();
  }

  private applyToSelected(patch: Partial<Selection>) {
    const i = this.selectedIndex();
    if (i === null) return;
    this.selections.update((list) =>
      list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
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
      hex: this.activeHex(),
      colorId: this.activeColorId(),
      opacity: this.opacity(),
      blend: this.blend(),
    };
    this.selections.update((list) => [...list, selection]);
    this.selectedIndex.set(this.selections().length - 1);
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

    // photo first, so multiply has something to blend with
    ctx.drawImage(this.img, 0, 0, c.width, c.height);

    // paint each area: clip to the polygon, then multiply the colour
    this.selections().forEach((sel, i) => {
      ctx.save();
      this.tracePath(ctx, sel.points, c.width, c.height, true);
      ctx.clip();
      ctx.globalAlpha = sel.opacity;
            ctx.globalCompositeOperation = sel.blend ?? 'multiply';
      ctx.fillStyle = sel.hex;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.restore();

      if (i === this.selectedIndex()) {
        this.tracePath(ctx, sel.points, c.width, c.height, true);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // shape currently being drawn
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