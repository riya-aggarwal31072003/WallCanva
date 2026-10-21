import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  toast = inject(ToastService);
}
