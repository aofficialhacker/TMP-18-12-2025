import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparisonResult } from '../../models/comparison.model';

@Component({
  selector: 'app-comparison-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <table class="comparison-table" *ngIf="comparison">

      <tbody>
        <tr *ngFor="let feature of comparison.features">

          <!-- FEATURE NAME -->
          <td class="feature-col">
            <span class="feature-text">
              {{ feature.name }}
            </span>

            <span *ngIf="feature.description" class="info-wrapper">
              <span class="info-icon">i</span>
              <span class="tooltip">
                {{ feature.description }}
              </span>
            </span>
          </td>

          <!-- VALUES -->
          <td
            class="plan-col"
            *ngFor="let plan of comparison.plans">
            {{
              comparison.featureValues[feature.id]?.[plan.planId]
              || 'Not Available'
            }}
          </td>

        </tr>
      </tbody>

    </table>
  `,
  styles: [`
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 13px;
      text-align: center;
    }

    td {
      border: 1px solid #cfd6e3;
      padding: 12px;
      vertical-align: top;
      word-break: break-word;
    }

    /* FEATURE COLUMN */
    .feature-col {
      width: 220px;
      background: #f4f6fb;
      text-align: center;
    }

    .feature-text {
      color: #1f2937;          /* DARKER */
      font-weight: 700;
    }

    /* PLAN VALUE COLUMNS */
    .plan-col {
      width: calc((100% - 220px) / 3);
      color: #4b5563;          /* LIGHTER */
      font-weight: 600;
      line-height: 1.4;
    }

    /* INFO ICON */
    .info-wrapper {
      position: relative;
      display: inline-block;
      margin-left: 6px;
    }

    .info-icon {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1.5px solid #2f5fa7;
      color: #2f5fa7;
      font-size: 11px;
      line-height: 14px;
      text-align: center;
      cursor: pointer;
      background: #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      transition: all 0.2s ease;
    }

    .info-icon:hover {
      background: #2f5fa7;
      color: #fff;
      transform: scale(1.05);
    }

    /* TOOLTIP */
    .tooltip {
      visibility: hidden;
      opacity: 0;
      position: absolute;
      left: 24px;
      top: 50%;
      transform: translateY(-50%);
      background: #111827;
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      width: 260px;
      z-index: 1000;
      transition: all 0.2s ease;
    }

    .tooltip::before {
      content: '';
      position: absolute;
      left: -6px;
      top: 50%;
      transform: translateY(-50%);
      border-width: 6px;
      border-style: solid;
      border-color: transparent #111827 transparent transparent;
    }

    .info-wrapper:hover .tooltip {
      visibility: visible;
      opacity: 1;
    }

    tbody tr:hover td {
      background: #f8fafc;
    }
  `]
})
export class ComparisonTableComponent {
  @Input() comparison!: ComparisonResult;
}
