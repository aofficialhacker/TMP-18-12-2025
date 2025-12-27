import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparisonResult } from '../../models/comparison.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-comparison-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <table class="comparison-master" *ngIf="comparison">
      <tbody>

        <!-- HEADER ROW WITH LOGOS -->
        <tr>
          <td class="feature-cell"></td>

          <td class="value-cell" *ngFor="let plan of comparison.plans">
            <div class="plan-logo-wrapper">
              <img
                *ngIf="plan.companyLogo"
                [src]="plan.companyLogo"
                crossorigin="anonymous"
                class="plan-logo"
              />
              <div class="plan-name">{{ plan.companyName }}</div>
            </div>
          </td>
        </tr>

        <!-- FEATURE ROWS -->
        <tr *ngFor="let feature of comparison.features">

          <!-- LEFT FEATURE COLUMN -->
          <td class="feature-cell">
            {{ feature.name }}
            <span *ngIf="feature.description" class="info-wrapper">
              <span class="info-icon">i</span>
              <span class="tooltip">{{ feature.description }}</span>
            </span>
          </td>

          <!-- RIGHT VALUE COLUMNS -->
          <td class="value-cell" *ngFor="let plan of comparison.plans">
            {{ comparison.featureValues[feature.id]?.[plan.planId] || 'Not Available' }}
          </td>

        </tr>
      </tbody>
    </table>
  `,
  styles: [`
    table.comparison-master {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 13px;
    }

    .feature-cell {
      width: 260px;
      background: #f8fbff;
      border: 1px solid #2f5fa7;
      padding: 12px 14px;
      vertical-align: middle;
      font-weight: 600;
      word-break: break-word;
      line-height: 1.35;
    }

    .value-cell {
      width: calc((100% - 260px) / 3);
      border: 1px solid #2f5fa7;
      padding: 12px 14px;
      text-align: center;
      vertical-align: middle;
      font-weight: 600;
      word-break: break-word;
      line-height: 1.35;
    }

    .plan-logo-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .plan-logo {
      max-width: 120px;
      max-height: 50px;
      object-fit: contain;
    }

    .plan-name {
      font-size: 12px;
      text-align: center;
      line-height: 1.2;
    }

    .info-wrapper { margin-left: 6px; position: relative; }
    .info-icon {
      width: 16px; height: 16px; border-radius: 50%;
      border: 1px solid #2563eb; color: #2563eb;
      font-size: 11px; background: #fff; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .tooltip {
      visibility: hidden; opacity: 0;
      position: absolute; bottom: calc(100% + 8px); left: 0;
      background: #111827; color: #fff;
      padding: 8px 10px; border-radius: 6px;
      font-size: 12px; width: 240px; z-index: 20;
      transition: .2s;
    }
    .info-wrapper:hover .tooltip { visibility: visible; opacity: 1; }
  `]
})
export class ComparisonTableComponent {
  @Input() comparison!: ComparisonResult;
}
