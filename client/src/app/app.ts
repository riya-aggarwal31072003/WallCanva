import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { Toast } from './shared/toast/toast';
import { LoadingService } from './core/services/loading';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  loading = inject(LoadingService);
}
