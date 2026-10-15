import { Component, OnInit, inject, signal } from '@angular/core';
import { ColorService, PaintColor } from '../../core/services/color';
import { PaintPattern, PatternService } from '../../core/services/pattern';

@Component({
  selector: 'app-admin-colors',
  templateUrl: './admin-colors.html',
  styleUrl: './admin-colors.scss',
})
export class AdminColors implements OnInit {
  private colorApi = inject(ColorService);
  private patternApi = inject(PatternService);

  colors = signal<PaintColor[]>([]);
  patterns = signal<PaintPattern[]>([]);
  error = signal('');

  // colour form
  editingId = signal<string | null>(null);
  name = signal('');
  hex = signal('#4A90B8');
  brand = signal('');

  // pattern form
  pName = signal('');
  pCategory = signal('General');
  pFile = signal<File | null>(null);

  ngOnInit() { this.load(); }

  load() {
    this.colorApi.list().subscribe((c) => this.colors.set(c));
    this.patternApi.list().subscribe((p) => this.patterns.set(p));
  }

  editColor(c: PaintColor) {
    this.editingId.set(c._id);
    this.name.set(c.name);
    this.hex.set(c.hex);
    this.brand.set(c.brand ?? '');
  }

  resetColorForm() {
    this.editingId.set(null);
    this.name.set('');
    this.hex.set('#4A90B8');
    this.brand.set('');
  }

  saveColor() {
    this.error.set('');
    const data = { name: this.name().trim(), hex: this.hex().toUpperCase(), brand: this.brand().trim() };
    if (!data.name) { this.error.set('Colour name is required.'); return; }

    const id = this.editingId();
    const req = id ? this.colorApi.update(id, data) : this.colorApi.create(data);
    req.subscribe({
      next: () => { this.resetColorForm(); this.load(); },
      error: (e) => this.error.set(e.error?.message || 'Could not save colour.'),
    });
  }

  deleteColor(c: PaintColor) {
    if (!confirm(`Delete colour "${c.name}"?`)) return;
    this.colorApi.remove(c._id).subscribe(() => this.load());
  }

  onPatternFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.pFile.set(f);
  }

  savePattern() {
    this.error.set('');
    const f = this.pFile();
    if (!this.pName().trim() || !f) { this.error.set('Pattern name and image are required.'); return; }
    this.patternApi.create(this.pName().trim(), this.pCategory().trim(), f).subscribe({
      next: () => { this.pName.set(''); this.pFile.set(null); this.load(); },
      error: (e) => this.error.set(e.error?.message || 'Could not upload pattern.'),
    });
  }

  deletePattern(p: PaintPattern) {
    if (!confirm(`Delete pattern "${p.name}"?`)) return;
    this.patternApi.remove(p._id).subscribe(() => this.load());
  }
}