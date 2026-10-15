import {
  AfterViewInit, Component, ElementRef, HostListener, ViewChild, computed, inject, signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Point, Project, ProjectService, Selection } from '../../core/services/project';
import { ColorService, PaintColor } from '../../core/services/color';
import { DecimalPipe } from '@angular/common';
import { PaintPattern, PatternService } from '../../core/services/pattern';

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
    compare = signal(100); // 100 = fully painted, 0 = fully original

      saving = signal(false);
  saveMessage = signal('');
    favIds = signal<string[]>([]);
  onlyFavs = signal(false);
  visibleColors = computed(() =>
    this.onlyFavs() ? this.colors().filter((c) => this.favIds().includes(c._id)) : this.colors());
  private patternApi = inject(PatternService);
  patterns = signal<PaintPattern[]>([]);
  private patternImgs = new Map<string, HTMLImageElement>();
      
  private undoStack: Selection[][] = [];
  private redoStack: Selection[][] = [];
  canUndo = signal(false);
  canRedo = signal(false);

  private dragIndex: number | null = null;
  private readonly HIT_DIST = 10;

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
    this.colorsApi.favourites().subscribe((f) => this.favIds.set(f));
    this.patternApi.list().subscribe((p) => this.patterns.set(p));
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
    this.selectedIndex.set(null);
    this.snapshot();
    this.selections.update((list) => list.filter((_, i) => i !== index));
    this.redraw();
  }
  
    pickColor(c: PaintColor) {
    this.snapshot();
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
    this.snapshot();
    this.blend.set(value);
    this.applyToSelected({ blend: value });
  }

  duplicateColorToAll() {
    this.snapshot();
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
    const c = this.overlayRef.nativeElement;
    const p = this.toCanvasPoint(e);

    if (this.dragIndex !== null) {
      const i = this.selectedIndex()!;
      const x = Math.min(Math.max(p.x / c.width, 0), 1);
      const y = Math.min(Math.max(p.y / c.height, 0), 1);
      this.selections.update((list) =>
        list.map((s, idx) =>
          idx === i
            ? { ...s, points: s.points.map((pt, n) => (n === this.dragIndex ? { x, y } : pt)) }
            : s));
      this.redraw();
      return;
    }

    if (!this.drawing() || this.current.length === 0) return;
    this.cursor = { x: p.x / c.width, y: p.y / c.height };
    this.redraw();
  }

    private finishPolygon() {
      this.snapshot();
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
            const pImg = sel.patternUrl ? this.getPatternImg(sel.patternUrl) : null;
            ctx.fillStyle = pImg ? (ctx.createPattern(pImg, 'repeat') ?? sel.hex) : sel.hex;
            ctx.fillRect(0, 0, c.width, c.height);
      ctx.restore();

      if (i === this.selectedIndex()) {
        this.tracePath(ctx, sel.points, c.width, c.height, true);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        sel.points.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x * c.width, pt.y * c.height, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.stroke();
        });
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
  // ---------- history ----------

  private snapshot() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.selections())));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
    this.updateHistoryFlags();
  }

  private updateHistoryFlags() {
    this.canUndo.set(this.undoStack.length > 0);
    this.canRedo.set(this.redoStack.length > 0);
  }

  undo() {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(JSON.parse(JSON.stringify(this.selections())));
    this.selections.set(prev);
    this.selectedIndex.set(null);
    this.updateHistoryFlags();
    this.redraw();
  }

  redo() {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(JSON.parse(JSON.stringify(this.selections())));
    this.selections.set(next);
    this.selectedIndex.set(null);
    this.updateHistoryFlags();
    this.redraw();
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
    if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); this.redo(); }
  }

  startOpacityChange() {
    this.snapshot();
  }

    private hitPoint(p: { x: number; y: number }): number | null {
    const i = this.selectedIndex();
    if (i === null) return null;
    const c = this.overlayRef.nativeElement;
    const pts = this.selections()[i].points;
    for (let n = 0; n < pts.length; n++) {
      const d = Math.hypot(p.x - pts[n].x * c.width, p.y - pts[n].y * c.height);
      if (d <= this.HIT_DIST) return n;
    }
    return null;
  }

  onCanvasDown(e: MouseEvent) {
    if (this.drawing()) return;
    const hit = this.hitPoint(this.toCanvasPoint(e));
    if (hit !== null) {
      this.snapshot();
      this.dragIndex = hit;
    }
  }

  onCanvasUp() {
    this.dragIndex = null;
  }

  setCompare(value: number) {
    this.compare.set(value);
  }

    download() {
    const c = this.overlayRef.nativeElement;
    const prev = this.selectedIndex();
    this.selectedIndex.set(null);
    this.redraw();

    const link = document.createElement('a');
    link.download = `${this.project()?.title || 'wallcanva-design'}.png`;
    link.href = c.toDataURL('image/png');
    link.click();

    this.selectedIndex.set(prev);
    this.redraw();
  }
    save() {
    const p = this.project();
    if (!p) return;
    this.saving.set(true);
    this.saveMessage.set('');

    this.projects.update(p._id, { selections: this.selections() }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveMessage.set('Saved');
        setTimeout(() => this.saveMessage.set(''), 2000);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveMessage.set(err.error?.message || 'Save failed');
      },
    });
  }
  toggleFav(c: PaintColor) {
    this.colorsApi.toggleFavourite(c._id).subscribe((f) => this.favIds.set(f));
  }
    pickPattern(p: PaintPattern) {
    this.snapshot();
    this.applyToSelected({ patternId: p._id, patternUrl: p.imageUrl });
  }

  clearPattern() {
    this.snapshot();
    this.applyToSelected({ patternId: undefined, patternUrl: '' });
  }

  private getPatternImg(url: string): HTMLImageElement | null {
    let img = this.patternImgs.get(url);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => this.redraw();
      img.src = url;
      this.patternImgs.set(url, img);
    }
    return img.complete && img.naturalWidth ? img : null;
  }
}
