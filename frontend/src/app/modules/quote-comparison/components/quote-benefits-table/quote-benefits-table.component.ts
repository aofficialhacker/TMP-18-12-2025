import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quote-benefits-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="data">
      <h4>Benefits</h4>
      <pre>{{ data | json }}</pre>
    </div>
  `
})
export class QuoteBenefitsTableComponent {
  @Input() data: any;
}
