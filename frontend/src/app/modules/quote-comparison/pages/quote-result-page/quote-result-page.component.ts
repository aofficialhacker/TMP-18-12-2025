import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

import { ComparisonResult } from '../../models/comparison.model';
import { QuoteCardComponent } from '../../components/quote-card/quote-card.component';

@Component({
  selector: 'app-quote-result-page',
  standalone: true,
  imports: [CommonModule, QuoteCardComponent],
  template: `
    <div class="quote-result-page" *ngIf="comparisonResult">

      <div class="top-bar">
        <button class="back-btn" (click)="goBack()">
          <span class="arrow">←</span>
          Back to Comparison
        </button>
      </div>

      <app-quote-card [comparison]="comparisonResult"></app-quote-card>
    </div>
  `,
  styles: [`
    .top-bar {
      max-width: 1100px;
      margin: 20px auto 12px;
      padding: 0 6px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f5f7fb;
      border: 1px solid #d6deeb;
      color: #2f5fa7;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .back-btn .arrow {
      font-size: 16px;
      line-height: 1;
    }

    .back-btn:hover {
      background: #eef3fb;
      border-color: #2f5fa7;
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }
  `]
})
export class QuoteResultPageComponent {

  comparisonResult: ComparisonResult | null = null;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    const nav = this.router.getCurrentNavigation();
    const data = nav?.extras.state?.['comparisonResult'];

    if (!data) {
      this.router.navigate(['/quote-comparison']);
      return;
    }

    // 🔥 SANITIZE LOGOS HERE (router-safe + Angular-safe)
    data.plans = data.plans.map((p: any) => ({
      ...p,
      companyLogo: p.companyLogo
        ? this.sanitizer.bypassSecurityTrustUrl(p.companyLogo)
        : ''
    }));

    this.comparisonResult = data;
  }

  goBack(): void {
    this.router.navigate(['/quote-comparison']);
  }
}
