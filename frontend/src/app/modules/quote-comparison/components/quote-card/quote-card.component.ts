import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparisonResult } from '../../models/comparison.model';
import { ComparisonTableComponent } from '../comparison-table/comparison-table.component';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-quote-card',
  standalone: true,
  imports: [CommonModule, ComparisonTableComponent],
  template: `
    <div class="quote-wrapper" id="quotePdf" *ngIf="comparison">

      <div class="quote-header">Health Insurance Policy Quote</div>

      <div class="quote-intro">
        <p><strong>Greetings from Finqy Insure!</strong></p>
        <p>
          We thank you for choosing Finqy Insure for your insurance needs.
          As per your request, kindly find the quote for your Health Insurance.
        </p>
      </div>

      <!-- CLIENT DETAILS -->
      <div class="section">
        <div class="client-box">
          <div class="client-header">Client Details</div>
          <table class="client-table">
            <tr><th>Name</th><td>{{ comparison.clientDetails?.name || '-' }}</td></tr>
            <tr><th>Date of Birth</th><td>{{ comparison.clientDetails?.dob || '-' }}</td></tr>
            <tr><th>Age</th><td>{{ comparison.clientDetails?.age || '-' }}</td></tr>
            <tr><th>Pre-existing Details</th><td>{{ comparison.clientDetails?.preExistingDisease || '-' }}</td></tr>
            <tr><th>Plan Type</th><td>{{ comparison.clientDetails?.planType || '-' }}</td></tr>
            <tr><th>Policy Type</th><td>{{ comparison.clientDetails?.policyType || '-' }}</td></tr>
          </table>
        </div>
      </div>

      <!-- SELECTED PLANS -->
      <div class="section">
        <div class="section-title">Selected Plans</div>

        <table class="plans-table equal-plans">
          <colgroup>
            <col style="width:25%">
            <col style="width:25%">
            <col style="width:25%">
            <col style="width:25%">
          </colgroup>

          <tr>
            <th>Company Name</th>
            <td *ngFor="let plan of comparison.plans">
              <div class="company-cell">
                <div class="logo-box">
                  <img *ngIf="plan.companyLogo" [src]="plan.companyLogo" crossorigin="anonymous" />
                </div>
                <div class="company-name">{{ plan.companyName }}</div>
              </div>
            </td>
          </tr>

          <tr>
            <th>Plan Name</th>
            <td *ngFor="let plan of comparison.plans">{{ plan.planName }}</td>
          </tr>

          <tr>
            <th>Sum Insured</th>
            <td *ngFor="let plan of comparison.plans">
              ₹ {{ plan.sumInsured | number }}
            </td>
          </tr>

          <tr>
            <th>Premium</th>
            <td *ngFor="let plan of comparison.plans" class="premium">
              ₹ {{ plan.premium | number }}
            </td>
          </tr>
        </table>
      </div>

      <!-- PLAN BENEFITS -->
      <div class="section">
        <div class="section-title">Plan Benefits</div>
        <div class="benefits-wrapper">
          <app-comparison-table [comparison]="comparison"></app-comparison-table>
        </div>
      </div>

      <!-- TERMS -->
      <div class="terms">
        <p>Quote valid for 24 hours.</p>
        <p>Subject to final approval and documentation.</p>
        <p>Actual terms may vary based on eligibility.</p>
        <p class="muted">
          IRDAI Broker Code: {{ comparison.terms?.irDAI }} |
          Validity: {{ comparison.terms?.validity }} |
          IBAI Membership No: {{ comparison.terms?.ibaiMembershipNo }}
        </p>
      </div>

      <div class="action-bar">
        <button class="btn primary" (click)="downloadPdf()">Download PDF</button>
      </div>

    </div>
  `,
  styles: [`
    * { font-weight: 600; box-sizing: border-box; }

    .quote-wrapper {
      max-width: 1100px;
      margin: 24px auto;
      background: #fff;
      border: 2px solid #2f5fa7;
      font-size: 13px;
    }

    .quote-header {
      background: #2f5fa7;
      color: #fff;
      text-align: center;
      padding: 14px;
      font-size: 18px;
      border-bottom: 2px solid #2f5fa7;
    }

    .quote-intro {
      padding: 14px 18px;
      border-bottom: 2px solid #2f5fa7;
      text-align: left;
    }

    .section {
      padding: 14px 18px;
      border-bottom: 2px solid #2f5fa7;
    }

    .section-title {
      background: #2f5fa7;
      color: #fff;
      padding: 6px;
      margin-bottom: 10px;
      text-align: center;
    }

    .client-box { width: 70%; margin: 0 auto; }

    .client-header {
      background: #2f5fa7;
      color: #fff;
      text-align: center;
      font-weight: 700;
      padding: 6px 10px;
      border: 2px solid #2f5fa7;
      border-bottom: none;
    }

    .client-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #2f5fa7;
    }

    .client-table th,
    .client-table td {
      border: 1px solid #2f5fa7;
      padding: 6px 10px;
      font-size: 12.5px;
      line-height: 1.3;
      text-align: left;
    }

    .client-table th { background: #f2f6ff; width: 45%; }

    .plans-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #2f5fa7;
    }

    .plans-table th,
    .plans-table td {
      border: 1px solid #2f5fa7;
      padding: 12px;
      text-align: center;
      vertical-align: middle;
    }

    .equal-plans th,
    .equal-plans td {
      width: 25%;
    }

    .company-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .logo-box {
      width: 120px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .company-name {
      max-width: 150px;
      min-height: 34px;
      text-align: center;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .premium { color: #2f5fa7; }

    .benefits-wrapper { border: none; padding: 0; }

    .terms {
      padding: 14px 18px;
      border-bottom: 2px solid #2f5fa7;
      font-size: 12px;
    }

    .muted { margin-top: 6px; color: #444; }

    .action-bar {
      display: flex;
      justify-content: flex-end;
      padding: 14px 18px;
    }

    .no-print { display: none !important; }

    .btn.primary {
      background: #2f5fa7;
      color: #fff;
      padding: 10px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
  `]
})
export class QuoteCardComponent {
  @Input() comparison!: ComparisonResult;

  downloadPdf(): void {
    const element = document.getElementById('quotePdf');
    if (!element) return;

    const actionBar = element.querySelector('.action-bar') as HTMLElement;
    if (actionBar) actionBar.classList.add('no-print');

    html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('Health-Insurance-Quote.pdf');
      if (actionBar) actionBar.classList.remove('no-print');
    });
  }
}
