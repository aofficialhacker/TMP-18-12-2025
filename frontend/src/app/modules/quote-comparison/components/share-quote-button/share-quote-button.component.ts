import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-share-quote-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="share-btn" (click)="share()">
      Share Quote
    </button>
  `,
  styles: [`
    .share-btn {
      margin-top: 16px;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background-color: #1976d2;
      color: white;
      cursor: pointer;
    }
  `]
})
export class ShareQuoteButtonComponent {
  @Input() data: any;

  share() {
    alert('Quote shared (mock)');
  }
}
